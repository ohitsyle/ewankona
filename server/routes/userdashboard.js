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
 * Submit a new concern (assistance request)
 */
router.post('/concerns', verifyUserToken, async (req, res) => {
  try {
    const user = req.user;
    const { department, merchant, subject, details } = req.body;

    if (!department) {
      return res.status(400).json({ error: 'Department is required' });
    }

    if (!subject || !details) {
      return res.status(400).json({ error: 'Subject and details are required' });
    }

    // Build the reportTo field based on department
    let reportTo = department;
    if (department === 'merchants' && merchant) {
      reportTo = merchant;
    }

    const concern = await UserConcern.create({
      userId: user._id,
      userName: user.fullName || `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      submissionType: 'assistance',
      reportTo,
      subject,
      feedbackText: details,
      selectedConcerns: [subject],
      status: 'pending',
      priority: 'medium'
    });

    console.log('✅ Concern submitted:', concern.concernId, 'by', user.email);

    return res.json({
      success: true,
      concernId: concern.concernId,
      message: 'Concern submitted successfully'
    });
  } catch (error) {
    console.error('Error creating concern:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/user/feedback
 * Submit feedback with rating
 */
router.post('/feedback', verifyUserToken, async (req, res) => {
  try {
    const user = req.user;
    const { department, merchant, subject, feedback, rating } = req.body;

    if (!department) {
      return res.status(400).json({ error: 'Department is required' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating (1-5) is required' });
    }

    // Build the reportTo field based on department
    let reportTo = department;
    if (department === 'merchants' && merchant) {
      reportTo = merchant;
    }

    const feedbackDoc = await UserConcern.create({
      userId: user._id,
      userName: user.fullName || `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      submissionType: 'feedback',
      reportTo,
      subject: subject || null,
      feedbackText: feedback || null,
      rating,
      status: null,
      priority: null
    });

    console.log('✅ Feedback submitted:', feedbackDoc.concernId, 'by', user.email, 'Rating:', rating);

    return res.json({
      success: true,
      concernId: feedbackDoc.concernId,
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/user/merchants
 * Get list of active merchants for concern dropdown
 */
router.get('/merchants', verifyUserToken, async (req, res) => {
  try {
    const Merchant = (await import('../models/Merchant.js')).default;

    const merchants = await Merchant.find({ isActive: true })
      .select('merchantId businessName')
      .sort({ businessName: 1 })
      .lean();

    return res.json({
      success: true,
      merchants: merchants.map(m => ({
        value: m.businessName,
        label: m.businessName
      }))
    });
  } catch (error) {
    console.error('Error fetching merchants:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
// USER PROFILE & SECURITY ENDPOINTS
// ============================================================

// OTP storage for deactivation (in production, use Redis)
const deactivationOtpStore = new Map();

/**
 * GET /api/user/profile
 * Get user profile data
 */
router.get('/profile', verifyUserToken, async (req, res) => {
  try {
    const user = req.user;
    return res.json({
      success: true,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      schoolUId: user.schoolUId,
      accountType: user.accountType || 'student',
      isActive: user.isActive,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * PUT /api/user/profile
 * Update user profile
 */
router.put('/profile', verifyUserToken, async (req, res) => {
  try {
    const user = req.user;
    const { firstName, lastName, phone } = req.body;

    // Update allowed fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    return res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/user/change-pin
 * Change user PIN
 */
router.post('/change-pin', verifyUserToken, async (req, res) => {
  try {
    const user = req.user;
    const { currentPin, newPin } = req.body;

    if (!currentPin || !newPin) {
      return res.status(400).json({ error: 'Current and new PIN are required' });
    }

    if (!/^\d{6}$/.test(newPin)) {
      return res.status(400).json({ error: 'PIN must be exactly 6 digits' });
    }

    // Verify current PIN
    let isValidPin = false;
    if (user.pin.startsWith('$2b$') || user.pin.startsWith('$2a$')) {
      isValidPin = await bcrypt.compare(currentPin, user.pin);
    } else {
      isValidPin = user.pin === currentPin;
    }

    if (!isValidPin) {
      return res.status(401).json({ error: 'Current PIN is incorrect' });
    }

    // Hash and save new PIN
    const salt = await bcrypt.genSalt(10);
    user.pin = await bcrypt.hash(newPin, salt);
    await user.save();

    return res.json({
      success: true,
      message: 'PIN changed successfully'
    });
  } catch (error) {
    console.error('Error changing PIN:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/user/send-deactivation-otp
 * Send OTP for account deactivation verification
 */
router.post('/send-deactivation-otp', verifyUserToken, async (req, res) => {
  try {
    const user = req.user;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Deactivation reason is required' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with expiry (10 minutes)
    deactivationOtpStore.set(user.email, {
      otp,
      reason: reason.trim(),
      expiresAt: Date.now() + 10 * 60 * 1000
    });

    // Send email with OTP
    const { sendDeactivationOtpEmail } = await import('../services/emailService.js');

    try {
      await sendDeactivationOtpEmail(user.email, user.firstName || 'User', otp);
      console.log(`📧 Deactivation OTP sent to ${user.email}`);
    } catch (emailError) {
      console.error('Failed to send deactivation OTP email:', emailError);
      // In development, log the OTP
      console.log(`📝 Development OTP for ${user.email}: ${otp}`);
    }

    return res.json({
      success: true,
      message: 'Verification code sent to your email'
    });
  } catch (error) {
    console.error('Error sending deactivation OTP:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/user/request-deactivation
 * Submit deactivation request with OTP verification
 */
router.post('/request-deactivation', verifyUserToken, async (req, res) => {
  try {
    const user = req.user;
    const { reason, otp } = req.body;

    if (!reason || !otp) {
      return res.status(400).json({ error: 'Reason and verification code are required' });
    }

    // Verify OTP
    const storedData = deactivationOtpStore.get(user.email);

    if (!storedData) {
      return res.status(400).json({ error: 'No verification code found. Please request a new code.' });
    }

    if (Date.now() > storedData.expiresAt) {
      deactivationOtpStore.delete(user.email);
      return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
    }

    if (storedData.otp !== otp) {
      return res.status(401).json({ error: 'Invalid verification code' });
    }

    // Clear OTP
    deactivationOtpStore.delete(user.email);

    // Create deactivation request as a concern
    await UserConcern.create({
      userId: user._id,
      userName: user.fullName || `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      submissionType: 'assistance',
      reportTo: 'sysad',
      subject: 'Account Deactivation Request',
      feedbackText: `User has requested account deactivation.\n\nReason: ${reason.trim()}\n\nCurrent Balance: ₱${user.balance.toFixed(2)}\nSchool ID: ${user.schoolUId}`,
      selectedConcerns: ['Account Deactivation'],
      status: 'pending',
      priority: 'high'
    });

    // Log the request
    const { logUserAction } = await import('../utils/logger.js');
    await logUserAction({
      userId: user._id,
      userName: user.fullName || `${user.firstName} ${user.lastName}`,
      action: 'Deactivation Request',
      description: 'submitted an account deactivation request',
      details: { reason: reason.trim() }
    });

    console.log(`⚠️ Deactivation request from ${user.email}`);

    return res.json({
      success: true,
      message: 'Deactivation request submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting deactivation request:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
