// nucash-server/routes/merchantadmin.js
// Merchant admin portal routes

import express from 'express';
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'nucash-secret-key';
console.log('🔑 Merchant admin JWT_SECRET:', JWT_SECRET);

// Middleware to verify merchant admin token (accepts both merchant tokens and admin tokens with merchant role)
const verifyMerchantToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(token, JWT_SECRET);

    console.log('🔐 Token decoded:', { role: decoded.role, id: decoded.id, merchantId: decoded.merchantId, adminId: decoded.adminId });

    // Accept either merchant tokens or admin tokens with merchant role
    if (decoded.role === 'merchant' || decoded.merchantId) {
      req.merchantId = decoded.merchantId || decoded.id;
      req.isAdmin = decoded.role === 'merchant' && decoded.adminId; // true if it's a merchant admin
      console.log('✅ Merchant admin authenticated:', { merchantId: req.merchantId, isAdmin: req.isAdmin });
      next();
    } else {
      console.log('❌ Token does not have merchant access');
      return res.status(403).json({ error: 'Forbidden: Merchant access required' });
    }
  } catch (error) {
    console.error('❌ Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// GET /merchant/stats - Merchant management statistics (no transactions)
router.get('/stats', verifyMerchantToken, async (req, res) => {
  try {
    const { default: Merchant } = await import('../models/Merchant.js');

    // Count merchants by status
    const totalMerchants = await Merchant.countDocuments();
    const activeMerchants = await Merchant.countDocuments({ isActive: true });
    const inactiveMerchants = await Merchant.countDocuments({ isActive: false });
    const pendingMerchants = await Merchant.countDocuments({ verified: false });

    // Get recently added merchants (last 10)
    const recentMerchants = await Merchant.find()
      .select('businessName email isActive verified createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({
      totalMerchants,
      activeMerchants,
      inactiveMerchants,
      pendingMerchants,
      recentMerchants
    });
  } catch (error) {
    console.error('Merchant stats error:', error);
    res.status(500).json({ error: 'Failed to load merchant stats' });
  }
});

// GET /merchant/dashboard
router.get('/dashboard', verifyMerchantToken, async (req, res) => {
  try {
    const { default: Merchant } = await import('../models/Merchant.js');
    const { default: MerchantTransaction } = await import('../models/MerchantTransaction.js');

    // Get all merchants count
    const totalMerchants = await Merchant.countDocuments();

    // Get all completed transactions
    const allTransactions = await MerchantTransaction.find({
      status: 'Completed'
    });

    const totalTransactions = allTransactions.length;
    const totalRevenue = allTransactions.reduce((sum, tx) => sum + tx.amount, 0);

    // Get today's transactions
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayTransactions = await MerchantTransaction.find({
      status: 'Completed',
      timestamp: { $gte: today }
    });

    const todayRevenue = todayTransactions.reduce((sum, tx) => sum + tx.amount, 0);

    // Get recent transactions (last 10)
    const recentTransactions = await MerchantTransaction.find({
      status: 'Completed'
    })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    res.json({
      totalMerchants,
      totalTransactions,
      totalRevenue,
      todayTransactions: todayTransactions.length,
      todayRevenue,
      recentTransactions
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// GET /merchant/merchants
router.get('/merchants', verifyMerchantToken, async (req, res) => {
  try {
    const { default: Merchant } = await import('../models/Merchant.js');

    const merchants = await Merchant.find()
      .select('-pin')
      .sort({ businessName: 1 })
      .lean();

    res.json({ merchants });
  } catch (error) {
    console.error('Get merchants error:', error);
    res.status(500).json({ error: 'Failed to get merchants' });
  }
});

// POST /merchant/merchants
router.post('/merchants', verifyMerchantToken, async (req, res) => {
  try {
    console.log('📝 Creating merchant with request body:', req.body);
    const { businessName, firstName, lastName, email, password } = req.body;
    console.log('📝 Destructured fields:', { businessName, firstName, lastName, email, password });

    const { default: Merchant } = await import('../models/Merchant.js');
    const { logAdminAction } = await import('../utils/logger.js');

    // Validate required fields
    if (!businessName || !firstName || !lastName || !email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        missing: {
          businessName: !businessName,
          firstName: !firstName,
          lastName: !lastName,
          email: !email,
          password: !password
        }
      });
    }

    // Validate PIN format (6 digits)
    if (!/^\d{6}$/.test(password)) {
      return res.status(400).json({ error: 'PIN must be exactly 6 numeric digits' });
    }

    // Check if email already exists
    const existing = await Merchant.findOne({ email: email.toLowerCase().trim() });

    if (existing) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    // Generate merchantId - find the highest existing ID and increment
    const lastMerchant = await Merchant.findOne().sort({ merchantId: -1 });
    let nextNum = 1;
    if (lastMerchant && lastMerchant.merchantId) {
      const match = lastMerchant.merchantId.match(/M(\d+)/);
      if (match) {
        nextNum = parseInt(match[1]) + 1;
      }
    }
    const merchantId = `M${String(nextNum).padStart(4, '0')}`;

    console.log('✅ Creating merchant with data:', {
      merchantId,
      businessName,
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      pin: '******',
      role: 'merchant'
    });

    // Create new merchant
    const merchant = new Merchant({
      merchantId,
      businessName,
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      pin: password,
      role: 'merchant',
      isActive: false // Needs activation
    });

    await merchant.save();

    // Log admin action
    await logAdminAction({
      action: 'Merchant Created',
      description: `created new merchant: ${businessName} (${merchantId})`,
      adminId: req.merchantId || 'merchant-admin',
      targetEntity: 'merchant',
      targetId: merchantId,
      changes: { businessName, firstName, lastName, email }
    });

    res.status(201).json({
      message: 'Merchant created successfully',
      merchant: {
        _id: merchant._id,
        merchantId: merchant.merchantId,
        businessName: merchant.businessName,
        firstName: merchant.firstName,
        lastName: merchant.lastName,
        email: merchant.email,
        isActive: merchant.isActive
      }
    });
  } catch (error) {
    console.error('Create merchant error:', error);
    res.status(500).json({ error: error.message || 'Failed to create merchant' });
  }
});

// PUT /merchant/merchants/:id
router.put('/merchants/:id', verifyMerchantToken, async (req, res) => {
  try {
    const { businessName, firstName, lastName, email, password, isActive } = req.body;
    const { default: Merchant } = await import('../models/Merchant.js');

    const updateData = {};

    // Only add fields that are provided
    if (businessName !== undefined) updateData.businessName = businessName;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email.toLowerCase().trim();
    if (isActive !== undefined) updateData.isActive = isActive;

    // Only update pin if provided
    if (password) {
      updateData.pin = password;
    }

    const merchant = await Merchant.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-pin');

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    res.json({ message: 'Merchant updated successfully', merchant });
  } catch (error) {
    console.error('Update merchant error:', error);
    res.status(500).json({ error: 'Failed to update merchant' });
  }
});

// DELETE /merchant/merchants/:id
router.delete('/merchants/:id', verifyMerchantToken, async (req, res) => {
  try {
    const { default: Merchant } = await import('../models/Merchant.js');

    const merchant = await Merchant.findByIdAndDelete(req.params.id);

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    res.json({ message: 'Merchant deleted successfully' });
  } catch (error) {
    console.error('Delete merchant error:', error);
    res.status(500).json({ error: 'Failed to delete merchant' });
  }
});

// GET /merchant/transactions
router.get('/transactions', verifyMerchantToken, async (req, res) => {
  try {
    const { filter = 'all' } = req.query;
    const { default: MerchantTransaction } = await import('../models/MerchantTransaction.js');

    let query = { status: 'Completed' };

    // Apply date filters
    if (filter !== 'all') {
      const now = new Date();
      let startDate = new Date();

      switch (filter) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      query.timestamp = { $gte: startDate };
    }

    const transactions = await MerchantTransaction.find(query)
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    res.json({ transactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

// GET /merchant/reports
router.get('/reports', verifyMerchantToken, async (req, res) => {
  try {
    const { range = 'month' } = req.query;
    const { default: MerchantTransaction } = await import('../models/MerchantTransaction.js');
    const { default: Merchant } = await import('../models/Merchant.js');

    const now = new Date();
    let startDate = new Date();

    switch (range) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const transactions = await MerchantTransaction.find({
      status: 'Completed',
      timestamp: { $gte: startDate }
    });

    const totalRevenue = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const totalTransactions = transactions.length;
    const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Get unique merchants from transactions
    const uniqueMerchants = [...new Set(transactions.map(tx => tx.merchantId))];
    const activeMerchants = uniqueMerchants.length;

    // Get top merchants
    const merchantRevenue = {};
    transactions.forEach(tx => {
      if (!merchantRevenue[tx.merchantId]) {
        merchantRevenue[tx.merchantId] = {
          name: tx.merchantName,
          revenue: 0
        };
      }
      merchantRevenue[tx.merchantId].revenue += tx.amount;
    });

    const topMerchants = Object.values(merchantRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    res.json({
      totalRevenue,
      totalTransactions,
      avgTransaction,
      activeMerchants,
      topMerchants
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Failed to get reports' });
  }
});

// GET /merchant/logs
router.get('/logs', verifyMerchantToken, async (req, res) => {
  try {
    const { default: EventLog } = await import('../models/EventLog.js');

    // Get merchant-related logs (you can filter by merchantId or specific event types)
    const logs = await EventLog.find({})
      .sort({ timestamp: -1 })
      .limit(500)
      .lean();

    res.json({ logs });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Failed to get logs' });
  }
});

// GET /merchant/phones - Get all phones (merchant admin only sees merchant phones)
router.get('/phones', verifyMerchantToken, async (req, res) => {
  try {
    const { default: Phone } = await import('../models/Phone.js');

    // Merchant admin only sees phones that are either:
    // 1. Not assigned to anyone (available)
    // 2. Assigned to merchants (has assignedMerchantId)
    // 3. NOT assigned to drivers
    const phones = await Phone.find({
      $or: [
        { assignedMerchantId: { $ne: null } }, // Assigned to a merchant
        { $and: [ // Available (not assigned to anyone)
          { assignedDriverId: null },
          { assignedMerchantId: null }
        ]}
      ]
    })
      .populate('assignedMerchantId', 'businessName')
      .sort({ phoneId: 1 })
      .lean();

    res.json(phones);
  } catch (error) {
    console.error('Get phones error:', error);
    res.status(500).json({ error: 'Failed to get phones' });
  }
});

// POST /merchant/phones - Create new phone
router.post('/phones', verifyMerchantToken, async (req, res) => {
  try {
    const { default: Phone } = await import('../models/Phone.js');

    const phone = new Phone(req.body);
    await phone.save();

    const populatedPhone = await Phone.findById(phone._id)
      .populate('assignedMerchantId', 'businessName')
      .lean();

    res.status(201).json(populatedPhone);
  } catch (error) {
    console.error('Create phone error:', error);
    res.status(500).json({ error: 'Failed to create phone' });
  }
});

// PUT /merchant/phones/:id - Update phone
router.put('/phones/:id', verifyMerchantToken, async (req, res) => {
  try {
    const { default: Phone } = await import('../models/Phone.js');

    // Merchant admin: If assigning to merchant, clear driver assignment
    const updateData = { ...req.body };
    if (updateData.assignedMerchantId) {
      updateData.assignedDriverId = null;
      updateData.assignedDriverName = null;
      updateData.assignedDate = null;
    }

    const phone = await Phone.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('assignedMerchantId', 'businessName')
      .lean();

    if (!phone) {
      return res.status(404).json({ error: 'Phone not found' });
    }

    res.json(phone);
  } catch (error) {
    console.error('Update phone error:', error);
    res.status(500).json({ error: 'Failed to update phone' });
  }
});

// DELETE /merchant/phones/:id - Delete phone
router.delete('/phones/:id', verifyMerchantToken, async (req, res) => {
  try {
    const { default: Phone } = await import('../models/Phone.js');

    const phone = await Phone.findByIdAndDelete(req.params.id);

    if (!phone) {
      return res.status(404).json({ error: 'Phone not found' });
    }

    res.json({ message: 'Phone deleted successfully' });
  } catch (error) {
    console.error('Delete phone error:', error);
    res.status(500).json({ error: 'Failed to delete phone' });
  }
});

// ============================================================
// CONCERNS ENDPOINTS
// ============================================================

// GET /merchant/concerns - Get concerns/feedback for merchants
router.get('/concerns', verifyMerchantToken, async (req, res) => {
  try {
    const { default: UserConcern } = await import('../models/UserConcern.js');
    const { status, type, search, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter - get concerns where reportTo contains 'merchants' or specific merchant name
    const filter = {
      $or: [
        { reportTo: { $regex: /merchants/i } },
        { reportTo: { $regex: /merchant/i } }
      ]
    };

    // Exclude motorpool-related
    filter.reportTo = { $not: /motorpool|shuttle/i, ...filter.$or[0].reportTo };
    delete filter.$or;
    filter.$or = [
      { reportTo: { $regex: /merchants/i, $not: /motorpool|shuttle/i } },
      { reportTo: { $regex: /^(?!.*(motorpool|shuttle)).*$/i } }
    ];

    // Simpler filter approach
    filter.$or = [
      { reportTo: 'merchants' },
      { reportTo: { $regex: /^(?!.*(motorpool|shuttle|treasury|sysad|nucash)).*$/i, $ne: null } }
    ];

    // Status filter
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Type filter (assistance or feedback)
    if (type && type !== 'all') {
      filter.submissionType = type;
    }

    // Search filter
    if (search) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { concernId: { $regex: search, $options: 'i' } },
          { userName: { $regex: search, $options: 'i' } },
          { userEmail: { $regex: search, $options: 'i' } },
          { subject: { $regex: search, $options: 'i' } },
          { feedbackText: { $regex: search, $options: 'i' } },
          { reportTo: { $regex: search, $options: 'i' } }
        ]
      });
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
      reportTo: c.reportTo,
      subject: c.subject || (c.selectedConcerns?.length > 0 ? c.selectedConcerns.join(', ') : 'No subject'),
      message: c.feedbackText || '',
      status: c.status || 'pending',
      priority: c.priority,
      rating: c.rating,
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
    console.error('❌ Get merchant concerns error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /merchant/concerns/:id/status - Update concern status
router.patch('/concerns/:id/status', verifyMerchantToken, async (req, res) => {
  try {
    const { default: UserConcern } = await import('../models/UserConcern.js');
    const { logAdminAction } = await import('../utils/logger.js');
    const { sendConcernInProgressEmail, sendConcernResolvedEmail } = await import('../services/emailService.js');

    const { status, reply, adminName } = req.body;
    const concernId = req.params.id;

    if (!status || !['pending', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Require reply when resolving
    if (status === 'resolved' && (!reply || !reply.trim())) {
      return res.status(400).json({ error: 'A reply is required when resolving a concern' });
    }

    const concern = await UserConcern.findById(concernId).populate('userId', 'firstName lastName email');

    if (!concern) {
      return res.status(404).json({ error: 'Concern not found' });
    }

    const oldStatus = concern.status;
    concern.status = status;

    if (reply && reply.trim()) {
      concern.adminResponse = reply.trim();
      concern.respondedDate = new Date();
    }

    if (status === 'resolved' && !concern.resolvedDate) {
      concern.resolvedDate = new Date();
    }

    await concern.save();

    // Send email notification
    const userEmail = concern.userId?.email || concern.userEmail;
    const userName = concern.userId
      ? `${concern.userId.firstName} ${concern.userId.lastName}`
      : concern.userName || 'User';
    const resolvedByName = adminName || 'Merchant Admin';

    if (userEmail) {
      try {
        if (status === 'in_progress' && oldStatus !== 'in_progress') {
          await sendConcernInProgressEmail(userEmail, userName, {
            concernId: concern.concernId,
            subject: concern.subject || 'Your Concern',
            reportTo: concern.reportTo || 'Merchant Admin'
          });
        } else if (status === 'resolved') {
          await sendConcernResolvedEmail(userEmail, userName, {
            concernId: concern.concernId,
            subject: concern.subject || 'Your Concern',
            reportTo: concern.reportTo || 'Merchant Admin',
            adminReply: concern.adminResponse,
            resolvedBy: resolvedByName
          });
        }
      } catch (emailError) {
        console.error('Failed to send concern status email:', emailError);
      }
    }

    // Log admin action
    await logAdminAction({
      action: 'Concern Status Updated',
      description: `updated concern ${concern.concernId} status from ${oldStatus} to ${status}`,
      adminId: req.merchantId || 'merchant-admin',
      targetEntity: 'concern',
      targetId: concern.concernId,
      changes: { oldStatus, newStatus: status, reply: reply || null }
    });

    res.json({
      success: true,
      message: status === 'resolved' ? 'Concern resolved and user notified' : 'Status updated successfully',
      concern
    });
  } catch (error) {
    console.error('❌ Update concern status error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
