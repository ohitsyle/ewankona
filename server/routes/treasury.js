// server/routes/treasury.js
// Treasury admin routes for managing transactions, cash-ins, and user registrations

import express from 'express';
const router = express.Router();
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import Merchant from '../models/Merchant.js';
import { logAdminAction } from '../utils/logger.js';
import { sendTemporaryPIN } from '../services/emailService.js';

// ============================================================
// DASHBOARD ENDPOINT
// ============================================================

/**
 * GET /api/admin/treasury/dashboard
 * Get dashboard statistics for treasury admin
 */
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Today's cash-in transactions (credits)
    const todayCashIns = await Transaction.aggregate([
      {
        $match: {
          transactionType: 'credit',
          createdAt: { $gte: today },
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

    // Today's payments/withdrawals (debits)
    const todayCashOuts = await Transaction.aggregate([
      {
        $match: {
          transactionType: 'debit',
          createdAt: { $gte: today },
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

    // Today's total transactions
    const todayTransactions = await Transaction.countDocuments({
      createdAt: { $gte: today }
    });

    // Total users
    const totalUsers = await User.countDocuments();

    // Active users
    const activeUsers = await User.countDocuments({ isActive: true });

    // Total merchants
    const totalMerchants = await Merchant.countDocuments();

    const cashInData = todayCashIns.length > 0 ? todayCashIns[0] : { total: 0, count: 0 };
    const cashOutData = todayCashOuts.length > 0 ? todayCashOuts[0] : { total: 0, count: 0 };

    res.json({
      todayCashIn: cashInData.total,
      todayCashOut: cashOutData.total,
      todayTransactions: todayTransactions,
      totalUsers: totalUsers,
      activeUsers: activeUsers,
      totalMerchants: totalMerchants
    });
  } catch (error) {
    console.error('❌ Treasury dashboard error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================
// ANALYTICS ENDPOINTS
// ============================================================

/**
 * GET /api/admin/treasury/analytics/today
 * Get today's analytics for treasury dashboard
 */
router.get('/analytics/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Today's cash-in transactions (credits)
    const todayCashIns = await Transaction.aggregate([
      {
        $match: {
          transactionType: 'credit',
          createdAt: { $gte: today },
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

    // Today's user payments (debits - shuttle and merchant)
    const todayPayments = await Transaction.aggregate([
      {
        $match: {
          transactionType: 'debit',
          createdAt: { $gte: today },
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

    // Today's new user registrations
    const todayNewUsers = await User.countDocuments({
      createdAt: { $gte: today }
    });

    // Total active users
    const totalActiveUsers = await User.countDocuments({
      isActive: true
    });

    // Total active merchants
    const totalMerchants = await Merchant.countDocuments({
      isActive: true
    });

    const cashInData = todayCashIns.length > 0 ? todayCashIns[0] : { total: 0, count: 0 };
    const paymentData = todayPayments.length > 0 ? todayPayments[0] : { total: 0, count: 0 };

    res.json({
      success: true,
      analytics: {
        todayCashIn: {
          amount: cashInData.total,
          count: cashInData.count
        },
        todayPayments: {
          amount: paymentData.total,
          count: paymentData.count
        },
        todayNewUsers: todayNewUsers,
        totalActiveUsers: totalActiveUsers,
        totalMerchants: totalMerchants
      }
    });
  } catch (error) {
    console.error('❌ Treasury analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================
// TRANSACTIONS ENDPOINTS
// ============================================================

/**
 * GET /api/admin/treasury/transactions
 * Get paginated list of transactions for treasury
 */
router.get('/transactions', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      startDate,
      endDate,
      search,
      transactionType
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = {};

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    // Transaction type filter
    if (transactionType) {
      filter.transactionType = transactionType;
    }

    // Search filter (by transactionId, email, or schoolUId)
    if (search) {
      filter.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { schoolUId: { $regex: search, $options: 'i' } }
      ];
    }

    // Get transactions
    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'firstName lastName schoolUId email')
      .populate('adminId', 'firstName lastName email');

    // Get total count
    const total = await Transaction.countDocuments(filter);

    // Format transactions for frontend
    const formattedTransactions = transactions.map(tx => ({
      _id: tx._id,
      transactionId: tx.transactionId,
      transactionType: tx.transactionType,
      amount: tx.amount,
      status: tx.status,
      balance: tx.balance,
      shuttleId: tx.shuttleId,
      merchantId: tx.merchantId,
      schoolUId: tx.schoolUId,
      email: tx.email,
      userName: tx.userId ? `${tx.userId.firstName} ${tx.userId.lastName}` : 'Unknown',
      idNumber: tx.userId ? tx.userId.schoolUId : tx.schoolUId,
      admin: tx.adminId ? `${tx.adminId.firstName} ${tx.adminId.lastName}` : null,
      createdAt: tx.createdAt,
      updatedAt: tx.updatedAt
    }));

    res.json({
      success: true,
      transactions: formattedTransactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/admin/treasury/transactions/:transactionId
 * Get single transaction details
 */
router.get('/transactions/:transactionId', async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      transactionId: req.params.transactionId
    })
      .populate('userId', 'firstName lastName schoolUId email rfidUId')
      .populate('adminId', 'firstName lastName email');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      transaction
    });
  } catch (error) {
    console.error('❌ Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================
// CASH-IN ENDPOINTS
// ============================================================

/**
 * GET /api/treasury/search-user/:rfid
 * Search for user by RFID (client-facing endpoint)
 */
router.get('/search-user/:rfid', async (req, res) => {
  try {
    const { rfid } = req.params;

    if (!rfid) {
      return res.status(400).json({
        success: false,
        message: 'RFID is required'
      });
    }

    // Find user by RFID - don't filter by isActive, let client handle that
    const user = await User.findOne({ rfidUId: rfid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        userId: user.userId,
        schoolUId: user.schoolUId,
        rfidUId: user.rfidUId,
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName,
        email: user.email,
        balance: user.balance,
        role: user.role,
        isActive: user.isActive,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('❌ Search user by RFID error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/admin/treasury/users/search-rfid
 * Search for user by RFID
 */
router.get('/users/search-rfid', async (req, res) => {
  try {
    const { rfidUId } = req.query;

    if (!rfidUId) {
      return res.status(400).json({
        success: false,
        message: 'RFID UID is required'
      });
    }

    const user = await User.findOne({ rfidUId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        userId: user.userId,
        schoolUId: user.schoolUId,
        rfidUId: user.rfidUId,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName || `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        balance: user.balance,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('❌ Search RFID error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/treasury/cash-in
 * Process cash-in transaction (accepts rfid or userId)
 */
router.post('/cash-in', async (req, res) => {
  try {
    const { userId, rfid, amount, adminId } = req.body;

    if ((!userId && !rfid) || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cash-in data. Provide userId or rfid and amount.'
      });
    }

    // Find user by userId or rfidUId
    let user;
    if (userId) {
      user = await User.findOne({ userId });
    } else if (rfid) {
      user = await User.findOne({ rfidUId: rfid });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'User account is inactive. User must activate their account first.'
      });
    }

    // Create transaction ID
    const transactionId = await Transaction.generateTransactionId();

    // Create transaction
    const transaction = new Transaction({
      transactionId,
      transactionType: 'credit',
      amount: parseFloat(amount),
      status: 'Completed',
      userId: user._id,
      schoolUId: user.schoolUId,
      email: user.email,
      balance: user.balance + parseFloat(amount),
      adminId: adminId || null,
      viewFor: 'treasury'
    });

    await transaction.save();

    // Update user balance
    user.balance += parseFloat(amount);
    await user.save();

    // Log admin action
    await logAdminAction({
      action: 'Cash-In Processed',
      description: `processed cash-in of ₱${amount} for user ${user.schoolUId}`,
      adminId: adminId || 'treasury',
      targetEntity: 'transaction',
      targetId: transactionId,
      changes: { amount, newBalance: user.balance }
    });

    // TODO: Send receipt email to user
    let receiptSent = false;
    try {
      // Email sending logic would go here
      receiptSent = false;
    } catch (emailError) {
      console.error('Receipt email failed:', emailError);
    }

    res.json({
      success: true,
      message: 'Cash-in processed successfully',
      receiptSent,
      transaction: {
        transactionId: transaction.transactionId,
        transaction_id: transaction.transactionId, // alias for client compatibility
        amount: transaction.amount,
        newBalance: user.balance,
        status: transaction.status,
        createdAt: transaction.createdAt
      },
      user: {
        userId: user.userId,
        schoolUId: user.schoolUId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        balance: user.balance
      }
    });
  } catch (error) {
    console.error('❌ Cash-in error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================
// USER REGISTRATION ENDPOINTS
// ============================================================

/**
 * POST /api/treasury/register
 * Register new user (client-facing endpoint)
 */
router.post('/register', async (req, res) => {
  try {
    const {
      schoolUId,
      rfidUId,
      firstName,
      lastName,
      middleName,
      email,
      pin,
      role
    } = req.body;

    // Validate required fields
    if (!schoolUId || !rfidUId || !firstName || !lastName || !email || !pin) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: schoolUId, rfidUId, firstName, lastName, email, and pin are required'
      });
    }

    // Check if RFID already exists
    const existingRFID = await User.findOne({ rfidUId });
    if (existingRFID) {
      return res.status(400).json({
        success: false,
        message: 'RFID already registered to another user'
      });
    }

    // Check if School ID already exists
    const existingSchoolId = await User.findOne({ schoolUId });
    if (existingSchoolId) {
      return res.status(400).json({
        success: false,
        message: 'School ID already registered'
      });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Generate userId (auto-increment)
    const lastUser = await User.findOne().sort({ userId: -1 });
    const userId = lastUser && lastUser.userId ? lastUser.userId + 1 : 100000;

    // Create user - isActive: false means they need to change PIN first
    const user = new User({
      userId,
      schoolUId,
      rfidUId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      middleName: middleName ? middleName.trim() : '',
      fullName: `${firstName.trim()} ${middleName ? middleName.trim() + ' ' : ''}${lastName.trim()}`,
      email: email.trim().toLowerCase(),
      pin,
      role: role || 'student',
      balance: 0,
      isActive: false, // User needs to change PIN to activate
      isVerified: false
    });

    await user.save();

    // Log admin action
    await logAdminAction({
      action: 'User Registered',
      description: `Registered new user: ${firstName} ${lastName} (${schoolUId})`,
      adminId: 'treasury',
      targetEntity: 'user',
      targetId: user._id.toString(),
      changes: { schoolUId, rfidUId, firstName, lastName, email, role }
    });

    // Send email with temporary PIN
    let emailSent = false;
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      emailSent = await sendTemporaryPIN(email.trim().toLowerCase(), pin, fullName, schoolUId);
      console.log(`📧 Temporary PIN email ${emailSent ? 'sent' : 'failed'} for ${email}`);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      emailSent = false;
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      emailSent,
      user: {
        _id: user._id,
        userId: user.userId,
        schoolUId: user.schoolUId,
        rfidUId: user.rfidUId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        balance: user.balance,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('❌ User registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration'
    });
  }
});

/**
 * GET /api/admin/treasury/users/check-rfid
 * Check if RFID is available
 */
router.get('/users/check-rfid', async (req, res) => {
  try {
    const { rfidUId } = req.query;

    if (!rfidUId) {
      return res.status(400).json({
        success: false,
        message: 'RFID UID is required'
      });
    }

    const existing = await User.findOne({ rfidUId });

    res.json({
      success: true,
      available: !existing,
      message: existing ? 'RFID already in use' : 'RFID available'
    });
  } catch (error) {
    console.error('❌ Check RFID error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/admin/treasury/users/check-schoolid
 * Check if School ID is available
 */
router.get('/users/check-schoolid', async (req, res) => {
  try {
    const { schoolUId } = req.query;

    if (!schoolUId) {
      return res.status(400).json({
        success: false,
        message: 'School ID is required'
      });
    }

    const existing = await User.findOne({ schoolUId });

    res.json({
      success: true,
      available: !existing,
      message: existing ? 'School ID already in use' : 'School ID available'
    });
  } catch (error) {
    console.error('❌ Check School ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/admin/treasury/users/register
 * Register new user
 */
router.post('/users/register', async (req, res) => {
  try {
    const {
      schoolUId,
      rfidUId,
      firstName,
      lastName,
      middleName,
      email,
      pin,
      role,
      initialBalance,
      adminId
    } = req.body;

    // Validate required fields
    if (!schoolUId || !rfidUId || !firstName || !lastName || !email || !pin) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if RFID or School ID already exists
    const existingRFID = await User.findOne({ rfidUId });
    if (existingRFID) {
      return res.status(400).json({
        success: false,
        message: 'RFID already registered'
      });
    }

    const existingSchoolId = await User.findOne({ schoolUId });
    if (existingSchoolId) {
      return res.status(400).json({
        success: false,
        message: 'School ID already registered'
      });
    }

    // Generate userId (auto-increment)
    const lastUser = await User.findOne().sort({ userId: -1 });
    const userId = lastUser ? lastUser.userId + 1 : 100000;

    // Create user
    const user = new User({
      userId,
      schoolUId,
      rfidUId,
      firstName,
      lastName,
      middleName: middleName || '',
      email,
      pin,
      role: role || 'student',
      balance: parseFloat(initialBalance) || 0,
      isActive: true
    });

    await user.save();

    // If initial balance, create a transaction
    if (initialBalance && parseFloat(initialBalance) > 0) {
      const transactionId = await Transaction.generateTransactionId();

      const transaction = new Transaction({
        transactionId,
        transactionType: 'credit',
        amount: parseFloat(initialBalance),
        status: 'Completed',
        userId: user._id,
        schoolUId: user.schoolUId,
        email: user.email,
        balance: parseFloat(initialBalance),
        adminId: adminId || null,
        viewFor: 'treasury'
      });

      await transaction.save();
    }

    // Log admin action
    await logAdminAction({
      action: 'User Registered',
      description: `registered new user ${user.schoolUId} (${firstName} ${lastName})`,
      adminId: adminId || 'treasury',
      targetEntity: 'user',
      targetId: user.userId.toString(),
      changes: req.body
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        userId: user.userId,
        schoolUId: user.schoolUId,
        rfidUId: user.rfidUId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        balance: user.balance,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ User registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================
// MERCHANTS ENDPOINTS
// ============================================================

/**
 * GET /api/admin/treasury/merchants
 * Get paginated list of merchants
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

    // Get total count
    const total = await Merchant.countDocuments(filter);

    res.json({
      success: true,
      merchants,
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
 * GET /api/admin/treasury/merchants/:merchantId
 * Get single merchant details
 */
router.get('/merchants/:merchantId', async (req, res) => {
  try {
    const merchant = await Merchant.findOne({
      merchantId: req.params.merchantId
    });

    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found'
      });
    }

    res.json({
      success: true,
      merchant
    });
  } catch (error) {
    console.error('❌ Get merchant error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * PATCH /api/admin/treasury/merchants/:merchantId/status
 * Update merchant active status
 */
router.patch('/merchants/:merchantId/status', async (req, res) => {
  try {
    const { isActive } = req.body;

    const merchant = await Merchant.findOneAndUpdate(
      { merchantId: req.params.merchantId },
      { isActive, updatedAt: new Date() },
      { new: true }
    );

    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found'
      });
    }

    // Log admin action
    await logAdminAction({
      action: 'Merchant Status Updated',
      description: `updated merchant ${merchant.merchantId} status to ${isActive ? 'active' : 'inactive'}`,
      adminId: req.adminId || 'treasury',
      targetEntity: 'merchant',
      targetId: merchant.merchantId,
      changes: { isActive }
    });

    res.json({
      success: true,
      message: 'Merchant status updated',
      merchant
    });
  } catch (error) {
    console.error('❌ Update merchant status error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================
// EXPORT ENDPOINTS
// ============================================================

/**
 * GET /api/admin/treasury/export/transactions
 * Export transactions as CSV
 */
router.get('/export/transactions', async (req, res) => {
  try {
    const { startDate, endDate, transactionType } = req.query;

    // Build filter
    const filter = {};

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    if (transactionType) {
      filter.transactionType = transactionType;
    }

    // Get transactions
    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .populate('userId', 'firstName lastName schoolUId email');

    // Generate CSV
    const csvHeader = 'Transaction ID,Date,Type,Amount,Status,School ID,User Name,Email,Balance\n';
    const csvRows = transactions.map(tx => {
      const userName = tx.userId ? `${tx.userId.firstName} ${tx.userId.lastName}` : 'Unknown';
      const date = new Date(tx.createdAt).toLocaleString();
      return `${tx.transactionId},${date},${tx.transactionType},${tx.amount},${tx.status},${tx.schoolUId},${userName},${tx.email},${tx.balance}`;
    }).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=transactions-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('❌ Export transactions error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
