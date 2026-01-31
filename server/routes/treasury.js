// server/routes/treasury.js
// Treasury admin routes for managing transactions, cash-ins, and user registrations

import express from 'express';
const router = express.Router();
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import Merchant from '../models/Merchant.js';
import UserConcern from '../models/UserConcern.js';
import { logAdminAction } from '../utils/logger.js';
import { sendTemporaryPIN, sendConcernInProgressEmail, sendConcernResolvedEmail } from '../services/emailService.js';

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
    const formattedTransactions = transactions.map(tx => {
      const adminName = tx.adminId ? `${tx.adminId.firstName} ${tx.adminId.lastName}` : null;
      return {
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
        admin: adminName,
        adminName: adminName,
        processedBy: adminName || (tx.transactionType === 'credit' ? 'Treasury' : null),
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt
      };
    });

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
        isActive: user.isActive,
        isDeactivated: user.isDeactivated || false
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
      // Format school ID for display (####-######)
      const formattedSchoolId = schoolUId.length === 10
        ? `${schoolUId.slice(0, 4)}-${schoolUId.slice(4)}`
        : schoolUId;
      console.log(`📧 Sending temporary PIN email to ${email}...`);
      emailSent = await sendTemporaryPIN(email.trim().toLowerCase(), pin, fullName, formattedSchoolId);
      console.log(`📧 Temporary PIN email ${emailSent ? 'sent successfully' : 'failed'} for ${email}`);
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError.message || emailError);
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

    // Check if email already exists
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create user - isActive: false until they change PIN
    const user = new User({
      userId,
      schoolUId,
      rfidUId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      middleName: middleName ? middleName.trim() : '',
      email: email.trim().toLowerCase(),
      pin,
      role: role || 'student',
      balance: 0,
      isActive: false, // User must change PIN to activate
      isDeactivated: false
    });

    await user.save();

    // Log admin action
    await logAdminAction({
      action: 'User Registered',
      description: `registered new user ${user.schoolUId} (${firstName} ${lastName})`,
      adminId: adminId || 'treasury',
      targetEntity: 'user',
      targetId: user.userId.toString(),
      changes: { schoolUId, rfidUId, firstName, lastName, email, role }
    });

    // Send email with temporary PIN
    let emailSent = false;
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      // Format school ID for display (####-######)
      const formattedSchoolId = schoolUId.length === 10
        ? `${schoolUId.slice(0, 4)}-${schoolUId.slice(4)}`
        : schoolUId;
      console.log(`📧 Sending temporary PIN email to ${email}...`);
      emailSent = await sendTemporaryPIN(email.trim().toLowerCase(), pin, fullName, formattedSchoolId);
      console.log(`📧 Temporary PIN email ${emailSent ? 'sent successfully' : 'failed'} for ${email}`);
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError.message || emailError);
      emailSent = false;
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      emailSent,
      user: {
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
      message: error.message
    });
  }
});

// ============================================================
// MERCHANTS ENDPOINTS
// ============================================================

/**
 * GET /api/admin/treasury/merchants
 * Get paginated list of merchants (includes Motorpool as a merchant)
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

    // Get MerchantTransaction model for merchant stats
    const { default: MerchantTransaction } = await import('../models/MerchantTransaction.js');
    const { default: ShuttleTransaction } = await import('../models/ShuttleTransaction.js');

    // Calculate metrics for each merchant
    const merchantsWithMetrics = await Promise.all(merchants.map(async (merchant) => {
      const merchantObj = merchant.toObject();

      // Get transaction stats
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

      // Add motorpool at the beginning of the list
      allMerchants.unshift(motorpoolMerchant);
    }

    // Get total count (including motorpool)
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

/**
 * GET /api/admin/treasury/merchants/:merchantId/details
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

    // Handle Motorpool separately
    if (merchantId === 'MOTORPOOL') {
      const { default: ShuttleTransaction } = await import('../models/ShuttleTransaction.js');

      // Get transactions
      const transactions = await ShuttleTransaction.find({ status: 'completed' })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const totalTransactionsCount = await ShuttleTransaction.countDocuments({ status: 'completed' });

      // Get metrics
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

      // Format transactions to match merchant transaction structure
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

    // Get transactions
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

    // Get metrics
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

// ============================================================
// CONCERNS ENDPOINTS
// ============================================================

/**
 * GET /api/admin/treasury/concerns
 * Get concerns/feedback submitted to Treasury Office
 */
router.get('/concerns', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter - get concerns where reportTo is Treasury Office or assistance type
    const filter = {
      $or: [
        { reportTo: { $regex: /treasury/i } },
        { reportTo: { $regex: /cash/i } },
        { submissionType: 'assistance', selectedConcerns: { $elemMatch: { $regex: /balance|cash|payment|transaction/i } } }
      ]
    };

    // Status filter
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Search filter
    if (search) {
      filter.$and = [
        {
          $or: [
            { concernId: { $regex: search, $options: 'i' } },
            { userName: { $regex: search, $options: 'i' } },
            { userEmail: { $regex: search, $options: 'i' } },
            { subject: { $regex: search, $options: 'i' } },
            { feedbackText: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    // Get concerns
    const concerns = await UserConcern.find(filter)
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'firstName lastName email schoolUId');

    // Get total count
    const total = await UserConcern.countDocuments(filter);

    // Format concerns for frontend
    const formattedConcerns = concerns.map(c => ({
      _id: c._id,
      concernId: c.concernId,
      submissionType: c.submissionType,
      subject: c.subject || (c.selectedConcerns && c.selectedConcerns.length > 0 ? c.selectedConcerns.join(', ') : 'No subject'),
      message: c.feedbackText || (c.selectedConcerns && c.selectedConcerns.length > 0 ? `Concerns: ${c.selectedConcerns.join(', ')}` : ''),
      status: c.status || 'pending',
      priority: c.priority,
      user: c.userId ? {
        firstName: c.userId.firstName,
        lastName: c.userId.lastName,
        email: c.userId.email,
        schoolUId: c.userId.schoolUId
      } : {
        firstName: c.userName?.split(' ')[0] || 'Unknown',
        lastName: c.userName?.split(' ').slice(1).join(' ') || '',
        email: c.userEmail
      },
      createdAt: c.submittedAt || c.createdAt,
      resolution: c.resolution,
      adminResponse: c.adminResponse
    }));

    res.json({
      success: true,
      concerns: formattedConcerns,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Get treasury concerns error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/admin/treasury/concerns/:id/reply
 * Reply to a concern
 */
router.post('/concerns/:id/reply', async (req, res) => {
  try {
    const { reply } = req.body;
    const concernId = req.params.id;

    if (!reply || !reply.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Reply text is required'
      });
    }

    const concern = await UserConcern.findById(concernId);

    if (!concern) {
      return res.status(404).json({
        success: false,
        message: 'Concern not found'
      });
    }

    // Update concern with reply
    concern.adminResponse = reply.trim();
    concern.respondedDate = new Date();
    if (concern.status === 'pending') {
      concern.status = 'in_progress';
    }

    await concern.save();

    // Log admin action
    await logAdminAction({
      action: 'Concern Reply Sent',
      description: `replied to concern ${concern.concernId}`,
      adminId: req.adminId || 'treasury',
      targetEntity: 'concern',
      targetId: concern.concernId,
      changes: { reply }
    });

    res.json({
      success: true,
      message: 'Reply sent successfully',
      concern
    });
  } catch (error) {
    console.error('❌ Reply to concern error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * PATCH /api/admin/treasury/concerns/:id/status
 * Update concern status - requires reply when resolving
 */
router.patch('/concerns/:id/status', async (req, res) => {
  try {
    const { status, reply, adminName } = req.body;
    const concernId = req.params.id;

    if (!status || !['pending', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Require reply when resolving
    if (status === 'resolved' && (!reply || !reply.trim())) {
      return res.status(400).json({
        success: false,
        message: 'A reply is required when resolving a concern'
      });
    }

    const concern = await UserConcern.findById(concernId).populate('userId', 'firstName lastName email');

    if (!concern) {
      return res.status(404).json({
        success: false,
        message: 'Concern not found'
      });
    }

    const oldStatus = concern.status;
    concern.status = status;

    // Add reply if provided
    if (reply && reply.trim()) {
      concern.adminResponse = reply.trim();
      concern.respondedDate = new Date();
    }

    if (status === 'resolved' && !concern.resolvedDate) {
      concern.resolvedDate = new Date();
      // resolvedBy in schema is ObjectId ref to Admin; we only have display name, so leave null
    }

    await concern.save();

    // Send email notification based on status change
    const userEmail = concern.userId?.email || concern.userEmail;
    const userName = concern.userId
      ? `${concern.userId.firstName} ${concern.userId.lastName}`
      : concern.userName || 'User';
    const resolvedByName = adminName || 'Treasury Office';

    if (userEmail) {
      try {
        if (status === 'in_progress' && oldStatus !== 'in_progress') {
          await sendConcernInProgressEmail(userEmail, userName, {
            concernId: concern.concernId,
            subject: concern.subject || 'Your Concern',
            reportTo: concern.reportTo || 'Treasury Office'
          });
        } else if (status === 'resolved') {
          await sendConcernResolvedEmail(userEmail, userName, {
            concernId: concern.concernId,
            subject: concern.subject || 'Your Concern',
            reportTo: concern.reportTo || 'Treasury Office',
            adminReply: concern.adminResponse,
            resolvedBy: resolvedByName
          });
        }
      } catch (emailError) {
        console.error('Failed to send concern status email:', emailError);
        // Don't fail the request if email fails
      }
    }

    // Log admin action
    await logAdminAction({
      action: 'Concern Status Updated',
      description: `updated concern ${concern.concernId} status from ${oldStatus} to ${status}`,
      adminId: req.adminId || 'treasury',
      targetEntity: 'concern',
      targetId: concern.concernId,
      changes: { oldStatus, newStatus: status, reply: reply || null }
    });

    res.json({
      success: true,
      message: status === 'resolved'
        ? 'Concern resolved and user notified via email'
        : 'Status updated successfully',
      concern,
      emailSent: !!userEmail
    });
  } catch (error) {
    console.error('❌ Update concern status error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================
// CONFIG ENDPOINTS
// ============================================================

/**
 * GET /api/admin/treasury/config
 * Get treasury configuration settings
 */
router.get('/config', async (req, res) => {
  try {
    // Return default config for now (can be expanded to use a Config model later)
    res.json({
      success: true,
      config: {
        minCashIn: 10,
        maxCashIn: 10000,
        dailyCashInLimit: 50000,
        autoLogoutMinutes: 30
      }
    });
  } catch (error) {
    console.error('❌ Get treasury config error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * PUT /api/admin/treasury/config
 * Update treasury configuration settings
 */
router.put('/config', async (req, res) => {
  try {
    const { minCashIn, maxCashIn, dailyCashInLimit, autoLogoutMinutes } = req.body;

    // For now, just acknowledge the config update
    // In a real implementation, this would save to a Config model

    // Log admin action
    await logAdminAction({
      action: 'Treasury Config Updated',
      description: 'updated treasury configuration settings',
      adminId: req.adminId || 'treasury',
      targetEntity: 'config',
      targetId: 'treasury-config',
      changes: { minCashIn, maxCashIn, dailyCashInLimit, autoLogoutMinutes }
    });

    res.json({
      success: true,
      message: 'Configuration updated successfully',
      config: { minCashIn, maxCashIn, dailyCashInLimit, autoLogoutMinutes }
    });
  } catch (error) {
    console.error('❌ Update treasury config error:', error);
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
