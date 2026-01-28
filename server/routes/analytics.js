// nucash-server/routes/analytics.js
// Analytics endpoint for motorpool admin dashboard

import express from 'express';
const router = express.Router();
import Transaction from '../models/Transaction.js';
import ShuttleTransaction from '../models/ShuttleTransaction.js';
import Trip from '../models/Trip.js';
import User from '../models/User.js';
import Driver from '../models/Driver.js';
import Shuttle from '../models/Shuttle.js';

// GET /api/analytics/dashboard - Get dashboard analytics
router.get('/dashboard', async (req, res) => {
  try {
    // Get total passengers (shuttle transactions - debit type, excluding refunded)
    // Each transaction = one passenger payment
    const totalPassengers = await Transaction.countDocuments({
      transactionType: 'debit',
      shuttleId: { $ne: null },
      status: { $nin: ['Refunded', 'Failed'] }
    });

    // Count refunded passengers (to subtract from total)
    const refundedPassengers = await Transaction.countDocuments({
      transactionType: 'debit',
      shuttleId: { $ne: null },
      status: 'Refunded'
    });

    // Get total TRIPS COMPLETED (from Trip model, not transactions)
    const totalTripsCompleted = await Trip.countDocuments({
      status: 'completed'
    });

    // Get total collections (sum of debits minus refunds)
    const debits = await Transaction.aggregate([
      {
        $match: {
          transactionType: 'debit',
          shuttleId: { $ne: null },
          status: { $nin: ['Refunded', 'Failed'] }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalDebits = debits.length > 0 ? debits[0].total : 0;

    // Get total refunds
    const refunds = await Transaction.aggregate([
      {
        $match: {
          transactionType: 'credit',
          shuttleId: { $ne: null },
          transactionId: { $regex: /^RFD/ } // Refund transactions start with RFD
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRefunds = refunds.length > 0 ? refunds[0].total : 0;

    // Net collections = debits - refunds
    const totalCollections = totalDebits - totalRefunds;

    // Get active shuttles
    const activeShuttles = await Shuttle.countDocuments({ isActive: true });

    // Get today's statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayRides = await Transaction.countDocuments({
      transactionType: 'debit',
      shuttleId: { $ne: null },
      status: { $nin: ['Refunded', 'Failed'] },
      createdAt: { $gte: today }
    });

    const todayDebits = await Transaction.aggregate([
      {
        $match: {
          transactionType: 'debit',
          shuttleId: { $ne: null },
          status: { $nin: ['Refunded', 'Failed'] },
          createdAt: { $gte: today }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const todayDebitTotal = todayDebits.length > 0 ? todayDebits[0].total : 0;

    const todayRefunds = await Transaction.aggregate([
      {
        $match: {
          transactionType: 'credit',
          shuttleId: { $ne: null },
          transactionId: { $regex: /^RFD/ },
          createdAt: { $gte: today }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const todayRefundTotal = todayRefunds.length > 0 ? todayRefunds[0].total : 0;

    // Net today revenue = debits - refunds
    const todayRevenue = todayDebitTotal - todayRefundTotal;
    
    // Get active drivers count
    const activeDrivers = await Driver.countDocuments({ isActive: true });
    
    // Get total users
    const totalUsers = await User.countDocuments({ isActive: true });
    
    res.json({
      totalPassengers,              // Total passengers who paid (transaction count)
      totalTripsCompleted,          // Total trips completed (from Trip model)
      totalRides: totalTripsCompleted, // Alias for backward compatibility
      totalCollections,             // Net revenue (debits - refunds)
      totalInsights: activeShuttles,
      activeShuttles,
      activeDrivers,
      totalUsers,
      refunds: {
        total: totalRefunds,
        count: refundedPassengers,  // Number of refunded passengers
        today: todayRefundTotal
      },
      today: {
        rides: todayRides,          // Passengers today
        revenue: todayRevenue,
        debits: todayDebitTotal,
        refunds: todayRefundTotal
      }
    });
  } catch (error) {
    console.error('❌ Error getting analytics:', error);
    res.status(500).json({ 
      error: 'Failed to get analytics',
      message: error.message 
    });
  }
});

// GET /api/analytics/revenue - Get revenue over time
router.get('/revenue', async (req, res) => {
  try {
    const { period = 'week' } = req.query; // week, month, year
    
    const groupBy = period === 'week' ? 
      { $dayOfWeek: '$timestamp' } :
      period === 'month' ?
      { $dayOfMonth: '$timestamp' } :
      { $month: '$timestamp' };
    
    const revenue = await ShuttleTransaction.aggregate([
      { 
        $match: { 
          status: 'completed',
          timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        } 
      },
      {
        $group: {
          _id: groupBy,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json(revenue);
  } catch (error) {
    console.error('❌ Error getting revenue data:', error);
    res.status(500).json({ 
      error: 'Failed to get revenue data',
      message: error.message 
    });
  }
});

// GET /api/analytics/routes - Get route performance
router.get('/routes', async (req, res) => {
  try {
    const routeStats = await ShuttleTransaction.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$routeId',
          totalRides: { $sum: 1 },
          totalRevenue: { $sum: '$amount' }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);
    
    res.json(routeStats);
  } catch (error) {
    console.error('❌ Error getting route analytics:', error);
    res.status(500).json({ 
      error: 'Failed to get route analytics',
      message: error.message 
    });
  }
});

export default router;