// nucash-server/routes/userdashboard.js
// API routes for user dashboard (students/employees)

import express from 'express';
const router = express.Router();
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import UserConcern from '../models/UserConcern.js';

import bcrypt from 'bcrypt';

// JWT verification middleware
const getJWTSecret = () => process.env.JWT_SECRET || 'nucash_secret_2025';

/**
 * POST /api/user/auth/login
 * User login (students/employees)
 */
router.post('/auth/login', async (req, res) => {
  try {
    const { email, pin } = req.body;

    console.log('🔐 User login attempt:', email);

    if (!email || !pin) {
      return res.status(400).json({
        error: 'Email and PIN are required'
      });
    }

    // Find user by email
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${email.trim().toLowerCase()}$`, 'i') }
    });

    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({
        error: 'Invalid email or PIN'
      });
    }

    // Verify PIN
    let isValidPin = false;
    if (user.pin.startsWith('$2b$') || user.pin.startsWith('$2a$')) {
      // Hashed PIN
      isValidPin = await bcrypt.compare(pin, user.pin);
    } else {
      // Plain text PIN (temporary PIN from registration)
      isValidPin = user.pin === pin;
    }

    if (!isValidPin) {
      console.log('❌ Invalid PIN for user:', email);
      return res.status(401).json({
        error: 'Invalid email or PIN'
      });
    }

    // Check if user needs activation (first login with temporary PIN)
    if (!user.isActive) {
      console.log('⚠️  User account needs activation:', email);
      return res.status(403).json({
        requiresActivation: true,
        accountId: user._id.toString(),
        accountType: 'user',
        email: user.email,
        fullName: user.fullName || `${user.firstName} ${user.lastName}`,
        message: 'Account activation required. Please change your temporary PIN.'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        userId: user.userId,
        email: user.email,
        role: user.role
      },
      getJWTSecret(),
      { expiresIn: '24h' }
    );

    console.log('✅ User login successful:', user.fullName || `${user.firstName} ${user.lastName}`);

    res.json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        userId: user.userId,
        schoolUId: user.schoolUId,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName || `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        balance: user.balance,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('❌ User login error:', error);
    res.status(500).json({
      error: 'Server error during login'
    });
  }
});

const verifyUserToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, getJWTSecret());

    // Find the user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * GET /api/user/balance
 * Get current user's balance (JWT authenticated)
 */
router.get('/balance', verifyUserToken, async (req, res) => {
  try {
    const user = req.user;
    return res.json({
      success: true,
      balance: user.balance,
      name: user.fullName || `${user.firstName} ${user.lastName}`.trim(),
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive
    });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/user/transactions
 * Get current user's transactions (JWT authenticated)
 */
router.get('/transactions', verifyUserToken, async (req, res) => {
  try {
    const user = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Build query - search by user's _id or schoolUId
    const query = {
      $or: [
        { userId: user._id },
        { schoolUId: user.schoolUId }
      ]
    };

    // Add date filters if provided
    if (req.query.startDate || req.query.endDate) {
      query.createdAt = {};
      if (req.query.startDate) {
        query.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    // Add transaction type filter
    if (req.query.transactionType) {
      query.transactionType = req.query.transactionType;
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(query)
    ]);

    // Format transactions for frontend
    const formattedTransactions = transactions.map(tx => ({
      id: tx.transactionId || tx._id.toString(),
      date: new Date(tx.createdAt).toLocaleDateString('en-PH'),
      time: new Date(tx.createdAt).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
      details: tx.transactionType === 'credit' ? 'Cash In' : (tx.merchantId ? 'Purchase' : 'Payment'),
      amount: tx.transactionType === 'credit' ? tx.amount : -tx.amount,
      type: tx.transactionType,
      status: tx.status,
      balance: tx.balance
    }));

    return res.json({
      success: true,
      transactions: formattedTransactions,
      page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/user/concerns/my-concerns
 * Get current user's submitted concerns (JWT authenticated)
 */
router.get('/concerns/my-concerns', verifyUserToken, async (req, res) => {
  try {
    const user = req.user;

    const concerns = await UserConcern.find({
      $or: [
        { userId: user._id },
        { userEmail: user.email }
      ]
    })
      .sort({ submittedAt: -1, createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      concerns: concerns
    });
  } catch (error) {
    console.error('Error fetching concerns:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/user/profile
 * Get current user's profile (JWT authenticated)
 */
router.get('/profile', verifyUserToken, async (req, res) => {
  try {
    const user = req.user;
    return res.json({
      success: true,
      _id: user._id,
      userId: user.userId,
      schoolUId: user.schoolUId,
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: user.middleName,
      fullName: user.fullName || `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      role: user.role,
      balance: user.balance,
      isActive: user.isActive
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/user/:userId
 * Get user info and balance (by userId param - for admin use)
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      _id: user._id,
      userId: user.userId,
      schoolUId: user.schoolUId,
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: user.middleName,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      balance: user.balance,
      isActive: user.isActive,
      isVerified: user.isVerified
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/user/:userId/transactions?limit=10
 * Get user's recent transactions (by userId param - for admin use)
 */
router.get('/:userId/transactions', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/user/:userId/concerns
 * Get user's submitted concerns (by userId param - for admin use)
 */
router.get('/:userId/concerns', async (req, res) => {
  try {
    const { userId } = req.params;

    const concerns = await UserConcern.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json(concerns);
  } catch (error) {
    console.error('Error fetching concerns:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/user/concerns
 * Submit a new concern or feedback
 */
router.post('/concerns', async (req, res) => {
  try {
    const { userId, email, message, type } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ error: 'User ID and message are required' });
    }

    const concern = await UserConcern.create({
      userId,
      email: email || '',
      message,
      type: type || 'assistance',
      status: 'pending'
    });

    return res.json(concern);
  } catch (error) {
    console.error('Error creating concern:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
