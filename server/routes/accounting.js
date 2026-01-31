// server/routes/accounting.js
// Accounting admin routes - reuses some treasury functionality with accounting-specific endpoints

import express from 'express';
const router = express.Router();
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import Merchant from '../models/Merchant.js';

// ============================================================
// DASHBOARD / ANALYTICS ENDPOINT
// ============================================================

/**
 * GET /api/admin/accounting/analytics
 * Get analytics for accounting dashboard
 */
router.get('/analytics', async (req, res) => {
  try {
    const { range = 'today' } = req.query;

    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (range === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (range === 'month') {
      startDate.setDate(1);
    }

    // Get cash-in (credits)
    const cashInResult = await Transaction.aggregate([
      {
        $match: {
          transactionType: 'credit',
          createdAt: { $gte: startDate },
          status: { $nin: ['Failed', 'Refunded'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get cash-out (debits)
    const cashOutResult = await Transaction.aggregate([
      {
        $match: {
          transactionType: 'debit',
          createdAt: { $gte: startDate },
          status: { $nin: ['Failed', 'Refunded'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Total transactions count
    const totalTransactions = await Transaction.countDocuments({
      createdAt: { $gte: startDate },
      status: { $nin: ['Failed', 'Refunded'] }
    });

    // Total users
    const totalUsers = await User.countDocuments();

    // Total merchants
    const totalMerchants = await Merchant.countDocuments({ isActive: true });

    // Total balance in circulation
    const balanceResult = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$balance' } } }
    ]);

    res.json({
      success: true,
      todayCashIn: cashInResult[0]?.total || 0,
      todayCashOut: cashOutResult[0]?.total || 0,
      todayTransactions: totalTransactions,
      totalUsers,
      totalMerchants,
      totalBalance: balanceResult[0]?.total || 0
    });
  } catch (error) {
    console.error('❌ Accounting analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================
// MERCHANTS ENDPOINTS (same as treasury for read-only access)
// ============================================================

/**
 * GET /api/admin/accounting/merchants
 * Get paginated list of merchants (includes Motorpool)
 */
router.get('/merchants', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search,
      isActive
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = {};

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    if (search) {
      filter.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { merchantId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Get merchants
    const merchants = await Merchant.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get models for stats
    const { default: MerchantTransaction } = await import('../models/MerchantTransaction.js');
    const { default: ShuttleTransaction } = await import('../models/ShuttleTransaction.js');

    // Calculate metrics for each merchant
    const merchantsWithMetrics = await Promise.all(merchants.map(async (merchant) => {
      const merchantObj = merchant.toObject();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [totalStats, todayStats] = await Promise.all([
        MerchantTransaction.aggregate([
          { $match: { merchantId: merchant.merchantId, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]),
        MerchantTransaction.aggregate([
          { $match: { merchantId: merchant.merchantId, status: 'completed', timestamp: { $gte: today } } },
          { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ])
      ]);

      merchantObj.totalCollections = totalStats[0]?.total || 0;
      merchantObj.totalTransactions = totalStats[0]?.count || 0;
      merchantObj.todayCollections = todayStats[0]?.total || 0;
      merchantObj.todayTransactions = todayStats[0]?.count || 0;
      merchantObj.type = 'merchant';

      return merchantObj;
    }));

    // Create Motorpool as a special merchant entry
    const motorpoolSearchMatch = !search ||
      'motorpool'.includes(search.toLowerCase()) ||
      'shuttle'.includes(search.toLowerCase()) ||
      'transport'.includes(search.toLowerCase()) ||
      'nu shuttle'.includes(search.toLowerCase());

    const motorpoolActiveMatch = isActive === undefined || isActive === 'true';

    let allMerchants = [...merchantsWithMetrics];

    // Add Motorpool if it matches search/filter
    if (motorpoolSearchMatch && motorpoolActiveMatch) {
      const [motorpoolTotal, motorpoolToday] = await Promise.all([
        ShuttleTransaction.aggregate([
          { $match: { status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$fareCharged' }, count: { $sum: 1 } } }
        ]),
        ShuttleTransaction.aggregate([
          { $match: { status: 'completed', timestamp: { $gte: new Date(new Date().setHours(0,0,0,0)) } } },
          { $group: { _id: null, total: { $sum: '$fareCharged' }, count: { $sum: 1 } } }
        ])
      ]);

      const motorpoolMerchant = {
        _id: 'motorpool',
        merchantId: 'MOTORPOOL',
        businessName: 'NU Shuttle Motorpool',
        firstName: 'NU',
        lastName: 'Motorpool',
        email: 'motorpool@nu-laguna.edu.ph',
        isActive: true,
        type: 'motorpool',
        totalCollections: motorpoolTotal[0]?.total || 0,
        totalTransactions: motorpoolTotal[0]?.count || 0,
        todayCollections: motorpoolToday[0]?.total || 0,
        todayTransactions: motorpoolToday[0]?.count || 0,
        createdAt: new Date('2024-01-01')
      };

      allMerchants.unshift(motorpoolMerchant);
    }

    const total = await Merchant.countDocuments(filter) + (motorpoolSearchMatch && motorpoolActiveMatch ? 1 : 0);

    res.json({
      success: true,
      merchants: allMerchants,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Get merchants error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/admin/accounting/merchants/:merchantId/details
 * Get merchant details with metrics and recent transactions
 */
router.get('/merchants/:merchantId/details', async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    // Handle Motorpool
    if (merchantId === 'MOTORPOOL') {
      const { default: ShuttleTransaction } = await import('../models/ShuttleTransaction.js');

      const transactions = await ShuttleTransaction.find({ status: 'completed' })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const totalTransactionsCount = await ShuttleTransaction.countDocuments({ status: 'completed' });

      const [totalStats, todayStats, weekStats, monthStats] = await Promise.all([
        ShuttleTransaction.aggregate([
          { $match: { status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$fareCharged' }, count: { $sum: 1 } } }
        ]),
        ShuttleTransaction.aggregate([
          { $match: { status: 'completed', timestamp: { $gte: today } } },
          { $group: { _id: null, total: { $sum: '$fareCharged' }, count: { $sum: 1 } } }
        ]),
        ShuttleTransaction.aggregate([
          { $match: { status: 'completed', timestamp: { $gte: thisWeek } } },
          { $group: { _id: null, total: { $sum: '$fareCharged' }, count: { $sum: 1 } } }
        ]),
        ShuttleTransaction.aggregate([
          { $match: { status: 'completed', timestamp: { $gte: thisMonth } } },
          { $group: { _id: null, total: { $sum: '$fareCharged' }, count: { $sum: 1 } } }
        ])
      ]);

      const formattedTransactions = transactions.map(tx => ({
        _id: tx._id,
        merchantId: 'MOTORPOOL',
        merchantName: 'NU Shuttle',
        businessName: 'NU Shuttle Motorpool',
        userName: tx.userName || 'User',
        userEmail: tx.userEmail || '',
        amount: tx.fareCharged,
        itemDescription: `Shuttle Ride - Route ${tx.routeId || 'N/A'}`,
        status: tx.status,
        paymentMethod: tx.paymentMethod || 'nfc',
        timestamp: tx.timestamp,
        createdAt: tx.createdAt
      }));

      return res.json({
        success: true,
        merchant: {
          _id: 'motorpool',
          merchantId: 'MOTORPOOL',
          businessName: 'NU Shuttle Motorpool',
          firstName: 'NU',
          lastName: 'Motorpool',
          email: 'motorpool@nu-laguna.edu.ph',
          isActive: true,
          type: 'motorpool',
          createdAt: new Date('2024-01-01')
        },
        metrics: {
          totalCollections: totalStats[0]?.total || 0,
          totalTransactions: totalStats[0]?.count || 0,
          todayCollections: todayStats[0]?.total || 0,
          todayTransactions: todayStats[0]?.count || 0,
          weekCollections: weekStats[0]?.total || 0,
          weekTransactions: weekStats[0]?.count || 0,
          monthCollections: monthStats[0]?.total || 0,
          monthTransactions: monthStats[0]?.count || 0
        },
        transactions: formattedTransactions,
        pagination: {
          total: totalTransactionsCount,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalTransactionsCount / parseInt(limit))
        }
      });
    }

    // Regular merchant
    const merchant = await Merchant.findOne({ merchantId });

    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found'
      });
    }

    const { default: MerchantTransaction } = await import('../models/MerchantTransaction.js');

    const transactions = await MerchantTransaction.find({
      merchantId: merchant.merchantId,
      status: 'completed'
    })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalTransactionsCount = await MerchantTransaction.countDocuments({
      merchantId: merchant.merchantId,
      status: 'completed'
    });

    const [totalStats, todayStats, weekStats, monthStats] = await Promise.all([
      MerchantTransaction.aggregate([
        { $match: { merchantId: merchant.merchantId, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      MerchantTransaction.aggregate([
        { $match: { merchantId: merchant.merchantId, status: 'completed', timestamp: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      MerchantTransaction.aggregate([
        { $match: { merchantId: merchant.merchantId, status: 'completed', timestamp: { $gte: thisWeek } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      MerchantTransaction.aggregate([
        { $match: { merchantId: merchant.merchantId, status: 'completed', timestamp: { $gte: thisMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      success: true,
      merchant: merchant.toObject(),
      metrics: {
        totalCollections: totalStats[0]?.total || 0,
        totalTransactions: totalStats[0]?.count || 0,
        todayCollections: todayStats[0]?.total || 0,
        todayTransactions: todayStats[0]?.count || 0,
        weekCollections: weekStats[0]?.total || 0,
        weekTransactions: weekStats[0]?.count || 0,
        monthCollections: monthStats[0]?.total || 0,
        monthTransactions: monthStats[0]?.count || 0
      },
      transactions,
      pagination: {
        total: totalTransactionsCount,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalTransactionsCount / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Get merchant details error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
