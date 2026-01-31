// nucash-server/routes/adminAuth.js
// Admin authentication and password management routes
// FIXED: Proper endpoint paths and error handling

import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import nodemailer from 'nodemailer';
import { logLogin, logLogout, logAdminAction } from '../utils/logger.js';

const router = express.Router();

// JWT secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'nucash-admin-secret-key-2024';

// OTP storage (in production, use Redis or database)
const otpStore = new Map();

// ============================================================================
// Middleware: Authenticate Admin JWT Token
// ============================================================================
function authenticateAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    console.error('❌ Token verification error:', error);
    return res.status(401).json({
      error: 'Invalid or expired token'
    });
  }
}

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
});

// ============================================================================
// POST /api/admin-auth/login
// Admin login with email and password
// ============================================================================
router.post('/login', async (req, res) => {
  try {
    const { email, pin } = req.body;

    console.log('🔐 Admin login attempt:', email);

    // Validation
    if (!email || !pin) {
      return res.status(400).json({
        error: 'Email and PIN are required'
      });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email: email.toLowerCase() });

    if (!admin) {
      console.log('❌ Admin not found:', email);
      return res.status(401).json({
        error: 'Invalid email or PIN'
      });
    }

    // Check if admin needs activation
    if (!admin.isActive) {
      console.log('⚠️  Admin account needs activation:', email);
      return res.status(403).json({
        requiresActivation: true,
        accountId: admin._id.toString(),
        accountType: 'admin',
        email: admin.email,
        fullName: `${admin.firstName} ${admin.lastName}`,
        message: 'Account activation required'
      });
    }

    // Verify PIN
    const isValidPin = await bcrypt.compare(pin, admin.pin);

    if (!isValidPin) {
      console.log('❌ Invalid PIN for:', email);
      return res.status(401).json({
        error: 'Invalid email or PIN'
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        adminId: admin.adminId,
        email: admin.email,
        role: admin.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log the login event
    await logLogin({
      userId: admin.adminId,
      userName: `${admin.firstName} ${admin.lastName}`,
      userType: `Admin (${admin.role})`,
      ipAddress: req.ip || req.connection?.remoteAddress,
      deviceInfo: req.headers['user-agent']
    });

    // Send response
    res.json({
      message: 'Login successful',
      token,
      admin: {
        adminId: admin.adminId,
        schoolUId: admin.schoolUId,
        rfidUId: admin.rfidUId,
        firstName: admin.firstName,
        lastName: admin.lastName,
        middleName: admin.middleName,
        email: admin.email,
        role: admin.role,
        verified: admin.verified,
        isActive: admin.isActive,
        lastLogin: admin.lastLogin
      }
    });

    console.log(`✅ Admin login: ${admin.email} (${admin.role})`);
  } catch (error) {
    console.error('❌ Admin login error:', error);
    res.status(500).json({
      error: 'Login failed. Please try again.'
    });
  }
});

// ============================================================================
// POST /api/admin-auth/logout
// Admin logout - logs the event
// ============================================================================
router.post('/logout', authenticateAdmin, async (req, res) => {
  try {
    const admin = req.admin;

    // Log the logout event
    await logLogout({
      userId: admin.adminId,
      userName: admin.email,
      userType: `Admin (${admin.role})`,
      sessionDuration: req.body.sessionDuration || null
    });

    console.log(`👋 Admin logout: ${admin.email}`);

    res.json({
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      error: 'Logout failed'
    });
  }
});

// ============================================================================
// POST /api/admin/auth/forgot-password
// Send OTP to admin email for password reset (no auth required)
// ============================================================================
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    console.log('🔑 Password reset OTP request for:', email);

    // Validation
    if (!email) {
      return res.status(400).json({
        error: 'Email is required'
      });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email: email.toLowerCase() });

    // For security, always return success even if email doesn't exist
    if (!admin) {
      console.log('⚠️  Email not found:', email);
      // Still return success to prevent email enumeration
      return res.json({
        message: 'If your email is registered, you will receive a password reset OTP.'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with expiry (10 minutes)
    otpStore.set(email.toLowerCase(), {
      otp,
      purpose: 'password_reset',
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    });

    // Send OTP email
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@nucash.com',
      to: email,
      subject: '🔐 NUCash Admin - Password Reset OTP',
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { text-align: center; border-bottom: 3px solid #4CAF50; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #4CAF50; margin: 0; }
    .header p { color: #666; margin: 10px 0 0 0; }
    .otp-box { background: #f0f9f4; padding: 30px; text-align: center; border-radius: 10px; margin: 20px 0; border: 2px solid #4CAF50; }
    .otp-code { font-size: 48px; font-weight: bold; letter-spacing: 10px; color: #2e7d32; margin: 20px 0; font-family: monospace; }
    .otp-label { color: #666; font-size: 16px; font-weight: 600; margin: 0; }
    .otp-expiry { color: #666; font-size: 14px; margin: 10px 0 0 0; }
    .info-box { background: #e8f5e9; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0; }
    .info-box strong { color: #2e7d32; }
    .warning-box { background: #fff3e0; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0; color: #e65100; }
    .warning-box strong { color: #e65100; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Password Reset Request</h1>
      <p>NUCash Admin Dashboard</p>
    </div>

    <p>Hello <strong>Admin</strong>,</p>

    <p>We received a request to reset your password. Please use the verification code below to proceed with resetting your password.</p>

    <div class="otp-box">
      <p class="otp-label">Your Verification Code</p>
      <div class="otp-code">${otp}</div>
      <p class="otp-expiry">Valid for 10 minutes</p>
    </div>

    <div class="info-box">
      <strong>📝 How to use this code:</strong>
      <ol style="margin: 10px 0 0 0; padding-left: 20px;">
        <li>Return to the password reset page</li>
        <li>Enter the 6-digit code above</li>
        <li>Set your new password</li>
      </ol>
    </div>

    <div class="warning-box">
      <strong>⚠️ Security Notice:</strong>
      <ul style="margin: 10px 0 0 0; padding-left: 20px;">
        <li>This code expires in <strong>10 minutes</strong></li>
        <li>Never share this code with anyone</li>
        <li>NUCash staff will never ask for this code</li>
        <li>If you didn't request this, please ignore this email</li>
      </ul>
    </div>

    <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>

    <p>Need help? Contact us at <a href="mailto:nucashsystem@gmail.com" style="color: #4CAF50; text-decoration: none;">nucashsystem@gmail.com</a></p>

    <div class="footer">
      <p>This is an automated message from NUCash System</p>
      <p>National University - Laguna Campus</p>
      <p>&copy; 2026 NUCash. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`📧 Password reset OTP sent to ${email}: ${otp}`);
    } catch (emailError) {
      console.error('❌ Failed to send email:', emailError);
      // Still return success to prevent email enumeration
    }

    res.json({
      message: 'If your email is registered, you will receive a password reset OTP.'
    });
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({
      error: 'Failed to process request. Please try again.'
    });
  }
});

// ============================================================================
// POST /api/admin/auth/reset-password
// Reset password with OTP (no auth required)
// ============================================================================
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPin } = req.body;

    console.log('🔐 Password reset with OTP for:', email);

    // Validation
    if (!email || !otp || !newPin) {
      return res.status(400).json({
        error: 'Email, OTP, and new PIN are required'
      });
    }

    // Validate PIN format (6 digits)
    if (!/^\d{6}$/.test(newPin)) {
      return res.status(400).json({
        error: 'PIN must be exactly 6 digits'
      });
    }

    // Find admin
    const admin = await Admin.findOne({ email: email.toLowerCase() });

    if (!admin) {
      return res.status(404).json({
        error: 'Invalid email or OTP'
      });
    }

    // Verify OTP
    const storedOtp = otpStore.get(email.toLowerCase());

    if (!storedOtp || storedOtp.purpose !== 'password_reset') {
      console.log('❌ No OTP found for:', email);
      return res.status(400).json({
        error: 'No OTP found. Please request a new OTP.'
      });
    }

    if (Date.now() > storedOtp.expiresAt) {
      otpStore.delete(email.toLowerCase());
      console.log('❌ OTP expired for:', email);
      return res.status(400).json({
        error: 'OTP has expired. Please request a new OTP.'
      });
    }

    if (storedOtp.otp !== otp) {
      console.log('❌ Invalid OTP for:', email);
      return res.status(401).json({
        error: 'Invalid OTP'
      });
    }

    // Hash new PIN
    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(newPin, salt);

    // Update PIN
    admin.pin = hashedPin;
    await admin.save();

    // Clear OTP
    otpStore.delete(email.toLowerCase());

    res.json({
      message: 'Password reset successfully'
    });

    console.log(`🔐 Password reset for admin: ${email}`);
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({
      error: 'Failed to reset password. Please try again.'
    });
  }
});

// ============================================================================
// POST /api/admin-auth/send-otp
// Send OTP to admin email for password change
// ============================================================================
router.post('/send-otp', authenticateAdmin, async (req, res) => {
  try {
    const { email, purpose } = req.body;

    console.log('📧 Sending OTP to:', email);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with expiry (10 minutes)
    otpStore.set(email, {
      otp,
      purpose: purpose || 'password_change',
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    });

    // Send OTP email
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@nucash.com',
      to: email,
      subject: '🔐 NUCash Admin - Password Change OTP',
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { text-align: center; border-bottom: 3px solid #4CAF50; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #4CAF50; margin: 0; }
    .header p { color: #666; margin: 10px 0 0 0; }
    .otp-box { background: #f0f9f4; padding: 30px; text-align: center; border-radius: 10px; margin: 20px 0; border: 2px solid #4CAF50; }
    .otp-code { font-size: 48px; font-weight: bold; letter-spacing: 10px; color: #2e7d32; margin: 20px 0; font-family: monospace; }
    .otp-label { color: #666; font-size: 16px; font-weight: 600; margin: 0; }
    .otp-expiry { color: #666; font-size: 14px; margin: 10px 0 0 0; }
    .info-box { background: #e8f5e9; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0; }
    .info-box strong { color: #2e7d32; }
    .warning-box { background: #fff3e0; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0; color: #e65100; }
    .warning-box strong { color: #e65100; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Password Change Request</h1>
      <p>NUCash Admin Dashboard</p>
    </div>

    <p>Hello <strong>Admin</strong>,</p>

    <p>We received a request to change your password. Please use the verification code below to proceed with changing your password.</p>

    <div class="otp-box">
      <p class="otp-label">Your Verification Code</p>
      <div class="otp-code">${otp}</div>
      <p class="otp-expiry">Valid for 10 minutes</p>
    </div>

    <div class="info-box">
      <strong>📝 How to use this code:</strong>
      <ol style="margin: 10px 0 0 0; padding-left: 20px;">
        <li>Return to the password change page</li>
        <li>Enter the 6-digit code above</li>
        <li>Set your new password</li>
      </ol>
    </div>

    <div class="warning-box">
      <strong>⚠️ Security Notice:</strong>
      <ul style="margin: 10px 0 0 0; padding-left: 20px;">
        <li>This code expires in <strong>10 minutes</strong></li>
        <li>Never share this code with anyone</li>
        <li>NUCash staff will never ask for this code</li>
        <li>If you didn't request this, please contact us immediately</li>
      </ul>
    </div>

    <p>If you didn't request a password change, please contact us immediately as your account security may be at risk.</p>

    <p>Need help? Contact us at <a href="mailto:nucashsystem@gmail.com" style="color: #4CAF50; text-decoration: none;">nucashsystem@gmail.com</a></p>

    <div class="footer">
      <p>This is an automated message from NUCash System</p>
      <p>National University - Laguna Campus</p>
      <p>&copy; 2026 NUCash. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
      `
    };

    // Try to send email, but if it fails (email not configured), still succeed in development
    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ OTP sent to ${email}: ${otp}`);
    } catch (emailError) {
      console.warn('⚠️  Email sending failed (email not configured)');
      console.log(`📝 Development OTP for ${email}: ${otp}`);
    }

    res.json({
      message: 'OTP sent successfully',
      email,
      // In development, include OTP in response if email isn't configured
      ...(process.env.NODE_ENV !== 'production' && { devOtp: otp })
    });
  } catch (error) {
    console.error('❌ Send OTP error:', error);
    res.status(500).json({
      error: 'Failed to send OTP. Please try again.'
    });
  }
});

// ============================================================================
// POST /api/admin-auth/change-password
// Change admin password with old password and OTP verification
// ============================================================================
router.post('/change-password', authenticateAdmin, async (req, res) => {
  try {
    const { oldPin, newPin, otp } = req.body;

    console.log('🔐 PIN change request for admin:', req.admin);

    // Validation
    if (!oldPin || !newPin || !otp) {
      return res.status(400).json({
        error: 'Old PIN, new PIN, and OTP are required'
      });
    }

    // Validate PIN format (6 digits)
    if (!/^\d{6}$/.test(oldPin) || !/^\d{6}$/.test(newPin)) {
      return res.status(400).json({
        error: 'PIN must be exactly 6 digits'
      });
    }

    if (oldPin === newPin) {
      return res.status(400).json({
        error: 'New PIN must be different from old PIN'
      });
    }

    // Find admin by adminId (handle both string and number types)
    let admin = await Admin.findOne({ adminId: req.admin.adminId });

    // If not found and adminId is a number, try searching as string
    if (!admin && typeof req.admin.adminId === 'number') {
      admin = await Admin.findOne({ adminId: String(req.admin.adminId) });
    }

    // If not found and adminId is a string, try searching as number
    if (!admin && typeof req.admin.adminId === 'string') {
      admin = await Admin.findOne({ adminId: Number(req.admin.adminId) });
    }

    if (!admin) {
      console.log('❌ Admin not found for adminId:', req.admin.adminId, '(tried both string and number)');
      return res.status(404).json({
        error: 'Admin not found'
      });
    }

    // Verify old PIN
    const isValidOldPin = await bcrypt.compare(oldPin, admin.pin);

    if (!isValidOldPin) {
      console.log('❌ Old PIN incorrect for:', admin.email);
      return res.status(401).json({
        error: 'Old PIN is incorrect'
      });
    }

    // Verify OTP
    const storedOtp = otpStore.get(admin.email);
    
    if (!storedOtp) {
      console.log('❌ No OTP found for:', admin.email);
      return res.status(400).json({
        error: 'No OTP found. Please request a new OTP.'
      });
    }

    if (Date.now() > storedOtp.expiresAt) {
      otpStore.delete(admin.email);
      console.log('❌ OTP expired for:', admin.email);
      return res.status(400).json({
        error: 'OTP has expired. Please request a new OTP.'
      });
    }

    if (storedOtp.otp !== otp) {
      console.log('❌ Invalid OTP for:', admin.email, '(Expected:', storedOtp.otp, 'Got:', otp, ')');
      return res.status(401).json({
        error: 'Invalid OTP'
      });
    }

    // Hash new PIN
    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(newPin, salt);

    // Update PIN
    admin.pin = hashedPin;
    await admin.save();

    // Clear OTP
    otpStore.delete(admin.email);

    res.json({
      message: 'PIN changed successfully'
    });

    console.log(`🔐 PIN changed for admin: ${admin.email}`);
  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({
      error: 'Failed to change password. Please try again.'
    });
  }
});

// ============================================================================
// GET /api/admin/auth/me
// Get current admin profile from database
// ============================================================================
router.get('/me', authenticateAdmin, async (req, res) => {
  try {
    console.log('📝 Fetching profile for admin:', req.admin);

    const admin = await Admin.findOne({ adminId: req.admin.adminId }).select('-password -pin');

    if (!admin) {
      console.log('❌ Admin not found:', req.admin.adminId);
      return res.status(404).json({ error: 'Admin not found' });
    }

    console.log('✅ Profile found for:', admin.email);

    res.json({
      adminId: admin.adminId,
      firstName: admin.firstName,
      lastName: admin.lastName,
      middleName: admin.middleName,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
      createdBy: admin.createdBy,
      createdAt: admin.createdAt
    });
  } catch (error) {
    console.error('❌ Error fetching admin profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;