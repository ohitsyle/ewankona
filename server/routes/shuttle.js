// nucash-server/routes/shuttle.js
// FIXED: 
// 1. Uses fareAmount from request body, or fetches from Route model
// 2. Proper shuttle release on end-route
// 3. Refund emails working

import express from 'express';
const router = express.Router();
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import ShuttleTransaction from '../models/ShuttleTransaction.js';
import Trip from '../models/Trip.js';
import Setting from '../models/Setting.js';
import Shuttle from '../models/Shuttle.js';
import Driver from '../models/Driver.js';
import Route from '../models/Route.js';

// Import email service
let sendReceipt = null;
let sendRefundReceipt = null;

import('../services/emailService.js')
  .then(emailService => {
    // Access the default export
    const service = emailService.default || emailService;
    sendReceipt = service.sendReceipt;
    sendRefundReceipt = service.sendRefundReceipt;
    console.log('✅ Email service loaded');
    console.log('📧 sendReceipt available:', typeof sendReceipt === 'function');
    console.log('📧 sendRefundReceipt available:', typeof sendRefundReceipt === 'function');
  })
  .catch((e) => {
    console.error('⚠️ Email service not configured:', e.message);
  });

/**
 * POST /shuttle/pay
 * Process shuttle payment
 * FIXED: Now uses fareAmount from request or fetches from Route model
 */
router.post('/pay', async (req, res) => {
  try {
    const { rfidUId, driverId, shuttleId, routeId, tripId, fareAmount } = req.body;

    console.log('💳 Processing payment:', { rfidUId, driverId, shuttleId, routeId, fareAmount });

    // Validate required fields
    if (!rfidUId) {
      return res.status(400).json({ error: 'RFID UID is required' });
    }

    // Find user by rfidUId
    const user = await User.findOne({ rfidUId });
    if (!user) {
      console.log('❌ Card not found:', rfidUId);
      return res.status(404).json({ error: 'Card not recognized' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // FIXED: Determine fare amount
    // Priority: 1) Request body fareAmount, 2) Route's fare, 3) Setting's currentFare, 4) Default 15
    let fare = 15; // Default fallback

    if (fareAmount && fareAmount > 0) {
      // Use fare from request (sent by mobile app)
      fare = fareAmount;
      console.log('💰 Using fare from request:', fare);
    } else if (routeId) {
      // Try to get fare from Route model
      try {
        const routeDoc = await Route.findOne({ routeId: routeId });
        if (routeDoc && routeDoc.fare) {
          fare = routeDoc.fare;
          console.log('💰 Using fare from route:', fare);
        }
      } catch (routeErr) {
        console.warn('⚠️ Could not fetch route fare:', routeErr.message);
      }
    }

    // If still default, check settings
    if (fare === 15) {
      const setting = await Setting.findOne();
      if (setting?.currentFare) {
        fare = setting.currentFare;
        console.log('💰 Using fare from settings:', fare);
      }
    }

    const negativeLimit = (await Setting.findOne())?.negativeLimit || -14;

    // Get balance BEFORE any modification
    const balanceBefore = user.balance;
    const balanceAfter = balanceBefore - fare;
    
    console.log(`💰 Balance calculation: ${balanceBefore} - ${fare} = ${balanceAfter}`);
    
    // Check if balance would go below limit
    if (balanceAfter < negativeLimit) {
      return res.status(400).json({
        error: 'Insufficient balance. Please recharge your card.',
        requiresRecharge: true,
        currentBalance: balanceBefore,
        fare: fare,
        negativeLimit: negativeLimit
      });
    }

    // Update user balance ONCE
    user.balance = balanceAfter;
    await user.save();

    // Generate transaction ID
    const transactionId = Transaction.generateTransactionId();

    // Create transaction record - MATCHING THE SCHEMA EXACTLY
    const transaction = await Transaction.create({
      transactionId: transactionId,
      transactionType: 'debit',
      amount: fare,
      status: 'Completed',
      userId: user._id,
      schoolUId: user.schoolUId,
      email: user.email,
      balance: balanceAfter,
      shuttleId: shuttleId || null,
      driverId: driverId || null,
      routeId: routeId || null
    });

    // Create detailed shuttle transaction if tripId provided
    if (tripId) {
      try {
        await ShuttleTransaction.create({
          tripId: tripId,
          shuttleId: shuttleId,
          driverId: driverId,
          routeId: routeId,
          userId: user._id,
          rfidUId: user.rfidUId,
          userName: user.fullName,
          userEmail: user.email,
          fareCharged: fare,
          balanceBefore: balanceBefore,
          balanceAfter: balanceAfter,
          status: 'completed',
          timestamp: new Date()
        });
      } catch (stErr) {
        console.warn('⚠️ ShuttleTransaction creation failed:', stErr.message);
      }
    }

    console.log(`✅ Payment processed: ${user.fullName} - ₱${fare} (${balanceBefore} → ${balanceAfter})`);

    // Send email receipt
    if (sendReceipt && user.email) {
      sendReceipt({
        userEmail: user.email,
        userName: user.fullName,
        fareAmount: fare,
        previousBalance: balanceBefore,
        newBalance: balanceAfter,
        timestamp: new Date(),
        merchantName: 'NU Shuttle Service',
        transactionId: transactionId
      }).catch(err => console.error('📧 Email error:', err));
    }

    // Return success response
    res.json({
      success: true,
      studentName: user.fullName,
      fareAmount: fare,
      previousBalance: balanceBefore,
      newBalance: balanceAfter,
      rfidUId: user.rfidUId,
      transactionId: transactionId
    });

  } catch (error) {
    console.error('❌ Payment error:', error);
    res.status(500).json({ 
      error: error.message || 'Payment processing failed'
    });
  }
});

/**
 * POST /shuttle/refund
 * Refund shuttle payments
 */
router.post('/refund', async (req, res) => {
  try {
    const { transactionIds, reason } = req.body;

    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return res.status(400).json({ error: 'Transaction IDs required' });
    }

    console.log('💸 Processing refunds for', transactionIds.length, 'transactions');

    const refundResults = [];
    const errors = [];

    for (const txId of transactionIds) {
      try {
        // Find the transaction (support both transactionId string and _id)
        let transaction = await Transaction.findOne({ transactionId: txId });
        if (!transaction) {
          transaction = await Transaction.findById(txId);
        }
        
        if (!transaction) {
          errors.push({ transactionId: txId, error: 'Transaction not found' });
          continue;
        }

        if (transaction.status === 'Refunded') {
          errors.push({ transactionId: txId, error: 'Already refunded' });
          continue;
        }

        // Find the user
        const user = await User.findById(transaction.userId);
        
        if (!user) {
          errors.push({ transactionId: txId, error: 'User not found' });
          continue;
        }

        // Calculate refund
        const refundAmount = transaction.amount;
        const balanceBefore = user.balance;
        const balanceAfter = balanceBefore + refundAmount;

        // Refund the amount
        user.balance = balanceAfter;
        await user.save();

        // Update transaction status
        transaction.status = 'Refunded';
        await transaction.save();

        // Generate refund transaction ID
        const refundTxId = Transaction.generateTransactionId().replace('TXN', 'RFD');

        // Create refund transaction record
        await Transaction.create({
          transactionId: refundTxId,
          transactionType: 'credit',
          amount: refundAmount,
          status: 'Completed',
          userId: user._id,
          schoolUId: user.schoolUId,
          email: user.email,
          balance: balanceAfter,
          shuttleId: transaction.shuttleId,
          driverId: transaction.driverId,
          routeId: transaction.routeId
        });

        console.log(`✅ Refunded: ${user.fullName} +₱${refundAmount} (${balanceBefore} → ${balanceAfter})`);

        // Send refund email
        if (sendRefundReceipt && user.email) {
          sendRefundReceipt({
            userEmail: user.email,
            userName: user.fullName,
            refundAmount: refundAmount,
            previousBalance: balanceBefore,
            newBalance: balanceAfter,
            timestamp: new Date(),
            transactionId: refundTxId,
            originalTransactionId: transaction.transactionId,
            reason: reason || 'Route cancelled by driver'
          }).catch(err => console.error('📧 Refund email error:', err));
        }

        refundResults.push({
          transactionId: transaction.transactionId,
          refundId: refundTxId,
          userName: user.fullName,
          amount: refundAmount,
          newBalance: balanceAfter
        });

      } catch (err) {
        console.error('❌ Refund error for transaction', txId, err);
        errors.push({ transactionId: txId, error: err.message });
      }
    }

    res.json({
      success: true,
      refunded: refundResults.length,
      failed: errors.length,
      results: refundResults,
      errors: errors
    });

  } catch (error) {
    console.error('❌ Refund error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /shuttle/end-route
 * End a route and release the shuttle
 */
router.post('/end-route', async (req, res) => {
  try {
    const { shuttleId, driverId, tripId, summary } = req.body;

    console.log('🏁 Ending route:', { shuttleId, driverId, tripId });

    // Release the shuttle
    if (shuttleId) {
      const shuttle = await Shuttle.findOne({ shuttleId });
      if (shuttle) {
        console.log(`📍 Found shuttle ${shuttleId}, current status: ${shuttle.status}`);
        shuttle.status = 'available';
        shuttle.currentDriver = null;
        shuttle.currentDriverId = null;
        shuttle.updatedAt = new Date();
        await shuttle.save();
        console.log(`✅ Shuttle ${shuttleId} released, new status: available`);
      } else {
        console.warn(`⚠️ Shuttle ${shuttleId} not found`);
      }
    }

    // Clear driver's shuttle assignment
    if (driverId) {
      const driver = await Driver.findOne({ driverId });
      if (driver) {
        driver.shuttleId = null;
        await driver.save();
        console.log(`✅ Driver ${driverId} shuttle assignment cleared`);
      }
    }

    // Update trip record if exists
    if (tripId) {
      try {
        await Trip.findByIdAndUpdate(tripId, {
          status: 'completed',
          endTime: new Date(),
          summary: summary
        });
      } catch (tripErr) {
        console.warn('⚠️ Trip update failed:', tripErr.message);
      }
    }

    res.json({
      success: true,
      message: 'Route ended and shuttle released',
      shuttleId: shuttleId,
      driverId: driverId
    });

  } catch (error) {
    console.error('❌ End route error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /shuttle/sync
 * Sync offline transactions
 */
router.post('/sync', async (req, res) => {
  try {
    const { deviceId, transactions } = req.body;

    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({ error: 'Transactions array required' });
    }

    console.log('🔄 Syncing', transactions.length, 'offline transactions from', deviceId);

    const processed = [];
    const rejected = [];

    for (const tx of transactions) {
      try {
        const user = await User.findOne({ rfidUId: tx.rfidUId });
        
        if (!user) {
          rejected.push({ rfidUId: tx.rfidUId, error: 'User not found' });
          continue;
        }

        // Use fare from transaction, or default
        const fare = tx.fareAmount || 15;

        // Deduct balance
        const balanceBefore = user.balance;
        const balanceAfter = balanceBefore - fare;
        
        user.balance = balanceAfter;
        await user.save();

        // Generate transaction ID
        const transactionId = Transaction.generateTransactionId();

        // Create transaction record
        await Transaction.create({
          transactionId: transactionId,
          transactionType: 'debit',
          amount: fare,
          status: 'Completed',
          userId: user._id,
          schoolUId: user.schoolUId,
          email: user.email,
          balance: balanceAfter,
          shuttleId: tx.shuttleId || null,
          driverId: tx.driverId || null,
          routeId: tx.routeId || null
        });

        processed.push({
          rfidUId: tx.rfidUId,
          userName: user.fullName,
          amount: fare,
          transactionId: transactionId
        });

        console.log(`✅ Synced: ${user.fullName} - ₱${fare}`);

      } catch (err) {
        console.error('❌ Sync error for', tx.rfidUId, err.message);
        rejected.push({ rfidUId: tx.rfidUId, error: err.message });
      }
    }

    res.json({
      success: true,
      processed: processed.length,
      rejected: rejected,
      details: processed
    });

  } catch (error) {
    console.error('❌ Sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /shuttle/updateLocation
 * Update shuttle GPS location
 */
router.post('/updateLocation', async (req, res) => {
  try {
    const { shuttleId, latitude, longitude, timestamp } = req.body;

    console.log(`📍 Location update received: ${shuttleId} @ ${latitude?.toFixed(6)}, ${longitude?.toFixed(6)}`);

    // Update shuttle position in database
    if (shuttleId && latitude && longitude) {
      try {
        // Try to update or create ShuttlePosition
        const ShuttlePosition = (await import('../models/ShuttlePosition.js')).default;
        const result = await ShuttlePosition.findOneAndUpdate(
          { shuttleId },
          {
            shuttleId,
            latitude,
            longitude,
            timestamp: timestamp || new Date(),
            updatedAt: new Date()
          },
          { upsert: true, new: true }
        );
        console.log(`✅ Location saved to DB for ${shuttleId}`);
      } catch (posErr) {
        // Model might not exist, just log
        console.error(`❌ Failed to save location to DB:`, posErr.message);
        console.log(`📍 Location: ${shuttleId} @ ${latitude?.toFixed(6)}, ${longitude?.toFixed(6)}`);
      }
    } else {
      console.warn(`⚠️ Invalid location data: shuttleId=${shuttleId}, lat=${latitude}, lng=${longitude}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Update location error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /shuttle/geofenceEvent
 * Handle geofence entry/exit events
 */
router.post('/geofenceEvent', async (req, res) => {
  try {
    const { shuttleId, geofenceId, timestamp } = req.body;
    
    console.log(`🎯 Geofence event: ${shuttleId} entered ${geofenceId}`);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;