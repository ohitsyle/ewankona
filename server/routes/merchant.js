// nucash-server/routes/merchant.js
import express from 'express';
const router = express.Router();
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import Merchant from '../models/Merchant.js';
import Transaction from '../models/Transaction.js';
import { sendReceipt } from '../services/emailService.js';

router.post('/pay', async (req, res) => {
  try {
    const { rfidUId, amount, deviceId, merchantId, pin } = req.body;

    console.log('======================');
    console.log('Merchant Payment Request');
    console.log('Card UID:', rfidUId);
    console.log('Amount:', amount);
    console.log('PIN provided:', pin ? 'YES' : 'NO');
    console.log('PIN value:', pin);

    // Find user
    const user = await User.findOne({ rfidUId });
    if (!user) {
      console.log('❌ User not found for RFID:', rfidUId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ User found:', user.fullName);
    console.log('   User email:', user.email);
    console.log('   Stored PIN hash:', user.pin);
    console.log('   Incoming PIN:', pin);

    // Verify PIN
    if (!pin) {
      return res.status(400).json({ error: 'PIN is required for merchant payments' });
    }

    // Compare hashed PIN with bcrypt
    console.log('🔐 Comparing PIN...');
    const isPinValid = await bcrypt.compare(pin, user.pin);
    console.log('   Comparison result:', isPinValid);

    if (!isPinValid) {
      console.log('❌ Incorrect PIN');
      console.log('   Expected hash:', user.pin);
      console.log('   Provided PIN:', pin);
      return res.status(401).json({ error: 'Incorrect PIN. Please try again.' });
    }

    console.log('✅ PIN verified successfully');

    // Validate amount
    const fareAmount = parseFloat(amount);
    if (isNaN(fareAmount) || fareAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const newBalance = Math.round((user.balance - fareAmount) * 100) / 100;

    // MERCHANTS: NO negative balance allowed - must have enough funds
    if (newBalance < 0) {
      return res.status(409).json({ 
        error: 'Insufficient balance - Merchant payments require positive balance' 
      });
    }

    const previous = user.balance;
    user.balance = newBalance;
    await user.save();

    const tx = await Transaction.create({
      transactionId: Transaction.generateTransactionId(),
      transactionType: 'debit',
      amount: fareAmount,
      balance: user.balance,
      status: 'Completed',
      userId: user._id,
      schoolUId: user.schoolUId,
      email: user.email,
      merchantId: merchantId || null
      // Note: merchantId is used for merchant payments, shuttleId is NOT included
    });

    // Get merchant info if merchantId provided
    let merchantName = 'Campus Merchant';
    if (merchantId) {
      const merchant = await Merchant.findOne({ merchantId });
      if (merchant) {
        merchantName = merchant.businessName;
      }
    }

    // Send email receipt
    sendReceipt({
      userEmail: user.email,
      userName: user.fullName,
      fareAmount: fareAmount,
      previousBalance: previous,
      newBalance: user.balance,
      timestamp: tx.createdAt,
      merchantName: merchantName,
      transactionId: tx.transactionId
    }).catch(err => console.error('Email error:', err));

    console.log(`✅ Payment successful: ${user.fullName} - ₱${fareAmount}`);

    return res.json({
      transactionId: tx._id,
      studentName: user.fullName,
      previousBalance: previous,
      fareAmount: fareAmount,
      newBalance: user.balance,
      timestamp: tx.createdAt
    });
  } catch (e) {
    console.error('Merchant payment error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;