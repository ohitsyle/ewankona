// nucash-server/routes/merchantauth.js
// Merchant authentication routes

import express from 'express';
const router = express.Router();

// POST /merchant/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, pin } = req.body;

    if (!email || !pin) {
      return res.status(400).json({ error: 'Email and PIN are required' });
    }

    // Import Merchant model
    const { default: Merchant } = await import('../models/Merchant.js');

    // Find merchant by email
    const merchant = await Merchant.findOne({ email: email.toLowerCase().trim() });

    if (!merchant) {
      return res.status(401).json({ error: 'Invalid email or PIN' });
    }

    // Verify PIN
    const isMatch = await merchant.comparePassword(pin);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or PIN' });
    }

    // Generate JWT token
    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign(
      { merchantId: merchant._id, email: merchant.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      merchant: {
        _id: merchant._id,
        businessName: merchant.businessName,
        contactPerson: merchant.contactPerson,
        email: merchant.email,
        phone: merchant.phone,
        address: merchant.address
      }
    });
  } catch (error) {
    console.error('Merchant login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /merchant/auth/change-password
router.post('/change-password', async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify token
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Import Merchant model
    const { default: Merchant } = await import('../models/Merchant.js');

    const merchant = await Merchant.findById(decoded.merchantId);

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    // Verify old password
    const isMatch = await merchant.comparePassword(oldPassword);

    if (!isMatch) {
      return res.status(401).json({ error: 'Old PIN is incorrect' });
    }

    // Update password
    merchant.password = newPassword;
    await merchant.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;
