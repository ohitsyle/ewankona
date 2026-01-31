// nucash-server/routes/activation.js
// Account activation flow for users and admins

import express from 'express';
import crypto from 'crypto';

const router = express.Router();

// Helper function to generate 6-digit OTP
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

// POST /api/activation/check-account
// Check if account needs activation
router.post('/check-account', async (req, res) => {
  try {
    const { email, pin, accountType } = req.body; // accountType: 'admin' or 'user'

    if (!email || !pin || !accountType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Import appropriate model
    let Model;
    if (accountType === 'admin') {
      const { default: Admin } = await import('../models/Admin.js');
      Model = Admin;
    } else {
      const { default: User } = await import('../models/User.js');
      Model = User;
    }

    // Find account by email
    const account = await Model.findOne({ email: email.toLowerCase().trim() });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Verify PIN - handle both hashed and plain text PINs
    const bcrypt = await import('bcrypt');
    const storedPin = account.pin || account.password;
    let isPinValid = false;

    // Check if PIN is hashed (starts with bcrypt prefix)
    if (storedPin && (storedPin.startsWith('$2b$') || storedPin.startsWith('$2a$'))) {
      // Hashed PIN - use bcrypt compare
      isPinValid = await bcrypt.default.compare(pin, storedPin);
    } else {
      // Plain text PIN (temporary PIN from registration)
      isPinValid = storedPin === pin;
    }

    if (!isPinValid) {
      return res.status(401).json({ error: 'Invalid PIN' });
    }

    // Check if account is already active
    if (account.isActive) {
      return res.json({
        needsActivation: false,
        message: 'Account is already active'
      });
    }

    // Account needs activation
    res.json({
      needsActivation: true,
      accountId: account._id,
      email: account.email,
      fullName: account.fullName || `${account.firstName} ${account.lastName}`,
      isActive: account.isActive || false
    });

  } catch (error) {
    console.error('Check account error:', error);
    res.status(500).json({ error: 'Failed to check account' });
  }
});

// POST /api/activation/accept-terms
// Accept terms and conditions
// Just acknowledges terms acceptance - no field updates needed
// Actual activation happens after PIN change + OTP verification
router.post('/accept-terms', async (req, res) => {
  try {
    const { accountId, accountType } = req.body;

    console.log('📝 Accept terms request:', { accountId, accountType });

    if (!accountId || !accountType) {
      console.error('❌ Missing required fields:', { accountId, accountType });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Import appropriate model
    let Model;
    if (accountType === 'admin') {
      const { default: Admin } = await import('../models/Admin.js');
      Model = Admin;
    } else {
      const { default: User } = await import('../models/User.js');
      Model = User;
    }

    console.log('🔍 Looking up account with ID:', accountId);

    // Just verify the account exists
    const account = await Model.findById(accountId);

    if (!account) {
      console.error('❌ Account not found with ID:', accountId);
      return res.status(404).json({ error: 'Account not found' });
    }

    console.log(`✅ Terms accepted for ${account.email}`);

    res.json({
      success: true,
      message: 'Terms accepted successfully'
    });

  } catch (error) {
    console.error('❌ Accept terms error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      accountId: req.body.accountId,
      accountType: req.body.accountType
    });

    // Provide more specific error messages
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid account ID format' });
    }

    res.status(500).json({
      error: 'Failed to accept terms',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/activation/set-new-pin
// Set new PIN after terms acceptance (uses findByIdAndUpdate to avoid full-doc save overwrites)
router.post('/set-new-pin', async (req, res) => {
  try {
    const { accountId, accountType, newPin } = req.body;

    if (!accountId || !accountType || !newPin) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate PIN (6 digits)
    if (!/^\d{6}$/.test(newPin)) {
      return res.status(400).json({ error: 'PIN must be exactly 6 digits' });
    }

    // Import appropriate model
    let Model;
    if (accountType === 'admin') {
      const { default: Admin } = await import('../models/Admin.js');
      Model = Admin;
    } else {
      const { default: User } = await import('../models/User.js');
      Model = User;
    }

    if (accountType === 'user') {
      console.log(`[Activation] set-new-pin called for user accountId: ${accountId}`);
      const countBefore = await Model.countDocuments();
      console.log(`[Activation] User count before set-new-pin: ${countBefore}`);
    }

    // Hash new PIN
    const bcrypt = await import('bcrypt');
    const salt = await bcrypt.default.genSalt(10);
    const hashedPin = await bcrypt.default.hash(newPin, salt);

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes (timestamp)

    // Update only these fields (avoids full-doc save that could overwrite other fields)
    const account = await Model.findByIdAndUpdate(
      accountId,
      { $set: { pin: hashedPin, resetOtp: otp, resetOtpExpireAt: new Date(otpExpiry) } },
      { new: true, runValidators: true }
    );

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    if (accountType === 'user') {
      const countAfter = await Model.countDocuments();
      console.log(`[Activation] User count after set-new-pin: ${countAfter}`);
    }

    // Send OTP via email
    const { sendActivationOTP } = await import('../services/emailService.js');
    await sendActivationOTP(account.email, otp, account.fullName || `${account.firstName} ${account.lastName}`);

    res.json({
      success: true,
      message: 'PIN updated successfully. OTP sent to your email.',
      email: account.email
    });

  } catch (error) {
    console.error('Set new PIN error:', error);
    res.status(500).json({ error: 'Failed to set new PIN' });
  }
});

// POST /api/activation/verify-otp
// Verify OTP and activate account (uses findByIdAndUpdate to avoid full-doc save overwrites)
router.post('/verify-otp', async (req, res) => {
  try {
    const { accountId, accountType, otp } = req.body;

    if (!accountId || !accountType || !otp) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Import appropriate model
    let Model;
    if (accountType === 'admin') {
      const { default: Admin } = await import('../models/Admin.js');
      Model = Admin;
    } else {
      const { default: User } = await import('../models/User.js');
      Model = User;
    }

    // Find account (read-only for OTP check)
    const account = await Model.findById(accountId);

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Get stored OTP
    const storedOtp = account.resetOtp;
    const otpExpiry = account.resetOtpExpireAt;

    // Check if OTP exists
    if (!storedOtp) {
      return res.status(400).json({ error: 'No OTP found. Please request a new one.' });
    }

    // Check if OTP expired
    const now = Date.now();
    if (now > otpExpiry) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // Verify OTP
    if (storedOtp !== otp) {
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    // Activate account - update only these fields (avoids full-doc save)
    const updated = await Model.findByIdAndUpdate(
      accountId,
      { $set: { isActive: true, resetOtp: '', resetOtpExpireAt: null } },
      { new: true, runValidators: true }
    );

    console.log(`✅ Account activated for ${updated.email} - isActive: true`);

    // Diagnostic: log user count after activation
    if (accountType === 'user') {
      const userCount = await Model.countDocuments();
      console.log(`📊 [Activation] User collection count after verify-otp: ${userCount}`);
    }

    res.json({
      success: true,
      message: 'Account activated successfully!',
      account: {
        email: updated.email,
        fullName: updated.fullName || `${updated.firstName} ${updated.lastName}`,
        role: updated.role || 'user',
        isActive: updated.isActive
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// POST /api/activation/resend-otp
// Resend OTP (uses findByIdAndUpdate to avoid full-doc save overwrites)
router.post('/resend-otp', async (req, res) => {
  try {
    const { accountId, accountType } = req.body;

    if (!accountId || !accountType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Import appropriate model
    let Model;
    if (accountType === 'admin') {
      const { default: Admin } = await import('../models/Admin.js');
      Model = Admin;
    } else {
      const { default: User } = await import('../models/User.js');
      Model = User;
    }

    if (accountType === 'user') {
      console.log(`[Activation] resend-otp called for user accountId: ${accountId}`);
      const countBefore = await Model.countDocuments();
      console.log(`[Activation] User count before resend-otp: ${countBefore}`);
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes (timestamp)

    // Update only OTP fields (avoids full-doc save that could overwrite other fields)
    const account = await Model.findByIdAndUpdate(
      accountId,
      { $set: { resetOtp: otp, resetOtpExpireAt: new Date(otpExpiry) } },
      { new: true, runValidators: true }
    );

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    if (accountType === 'user') {
      const countAfter = await Model.countDocuments();
      console.log(`[Activation] User count after resend-otp: ${countAfter}`);
    }

    // Send OTP via email
    const { sendActivationOTP } = await import('../services/emailService.js');
    await sendActivationOTP(account.email, otp, account.fullName || `${account.firstName} ${account.lastName}`);

    res.json({
      success: true,
      message: 'OTP resent successfully',
      email: account.email
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
});

export default router;
