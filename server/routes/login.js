// nucash-server/routes/login.js
// FIXED: 
// 1. Uses driver.fullName (virtual) for proper name display
// 2. Uses bcrypt.compare() for password verification
// 3. Supports merchant email OR username login
// 4. 6-digit PIN support

import express from 'express';
const router = express.Router();
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import Driver from '../models/Driver.js';
import Merchant from '../models/Merchant.js';
import User from '../models/User.js';
import Admin from '../models/Admin.js';

// Don't read JWT_SECRET at module level - dotenv hasn't loaded yet
// Read it inside functions where it's needed
const getJWTSecret = () => process.env.JWT_SECRET || 'nucash_secret_2025';

/**
 * POST /login/check-email
 * Check if email exists and return user name for PIN entry screen
 */
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log('📧 Checking email:', normalizedEmail);

    // Check drivers first
    const driver = await Driver.findOne({ 
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') },
      isActive: true 
    });

    if (driver) {
      // FIXED: Use fullName virtual, or construct from firstName + lastName
      const driverName = driver.fullName || `${driver.firstName} ${driver.lastName}`.trim();
      console.log('✅ Found driver:', driverName);
      return res.json({
        exists: true,
        name: driverName,
        role: 'driver'
      });
    }

    // Check merchants by email OR username
    const merchant = await Merchant.findOne({
      $or: [
        { email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } },
        { username: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } }
      ],
      isActive: true
    });

    if (merchant) {
      console.log('✅ Found merchant:', merchant.contactPerson || merchant.businessName);
      return res.json({
        exists: true,
        name: merchant.contactPerson || merchant.businessName,
        role: 'merchant'
      });
    }

    // Check users (students/employees) - don't filter by isActive to allow activation flow
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }
    });

    if (user) {
      const userName = user.fullName || `${user.firstName} ${user.lastName}`.trim();
      console.log('✅ Found user:', userName, user.isActive ? '(active)' : '(inactive - needs activation)');
      return res.json({
        exists: true,
        name: userName,
        role: user.role // 'student' or 'employee'
      });
    }

    console.log('❌ Email/username not found:', normalizedEmail);
    return res.json({ exists: false });

  } catch (error) {
    console.error('❌ Check email error:', error);
    res.status(500).json({ error: 'Server error checking email' });
  }
});

/**
 * POST /login
 * Authenticate driver or merchant with email + PIN
 * PIN is sent as 'password' field
 */
router.post('/', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: 'Email and PIN are required' });
    }

    const normalizedEmail = emailOrUsername.trim().toLowerCase();
    console.log('🔐 Login attempt for:', normalizedEmail);

    // Try driver login first
    const driver = await Driver.findOne({ 
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') },
      isActive: true 
    });

    if (driver) {
      // FIXED: Use bcrypt.compare() for hashed passwords
      let isValidPin = false;
      
      // Check if password is hashed (starts with $2b$ or $2a$)
      if (driver.password.startsWith('$2b$') || driver.password.startsWith('$2a$')) {
        // Hashed password - use bcrypt compare
        isValidPin = await bcrypt.compare(password, driver.password);
      } else {
        // Plain text password (legacy) - direct compare
        isValidPin = driver.password === password;
      }
      
      if (isValidPin) {
        const token = jwt.sign(
          { id: driver._id, role: 'driver', driverId: driver.driverId },
          getJWTSecret(),
          { expiresIn: '24h' }
        );

        // FIXED: Use fullName virtual or construct name
        const driverName = driver.fullName || `${driver.firstName} ${driver.lastName}`.trim();
        console.log('✅ Driver login successful:', driverName);

        return res.json({
          token,
          role: 'driver',
          driverId: driver.driverId,
          name: driverName,
          email: driver.email
        });
      } else {
        console.log('❌ Invalid PIN for driver:', normalizedEmail);
        return res.status(401).json({ error: 'Invalid PIN' });
      }
    }

    // Try admin login (motorpool, treasury, merchant admins) - check without isActive filter first
    const admin = await Admin.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }
    });

    if (admin) {
      // Use bcrypt.compare() for hashed PINs
      let isValidPin = false;

      if (admin.pin.startsWith('$2b$') || admin.pin.startsWith('$2a$')) {
        isValidPin = await bcrypt.compare(password, admin.pin);
      } else {
        isValidPin = admin.pin === password;
      }

      if (!isValidPin) {
        console.log('❌ Invalid PIN for admin:', normalizedEmail);
        return res.status(401).json({ error: 'Invalid PIN' });
      }

      // Check if admin needs activation
      if (!admin.isActive) {
        console.log('⚠️  Admin account needs activation:', normalizedEmail);
        return res.status(403).json({
          requiresActivation: true,
          accountId: admin._id.toString(),
          accountType: 'admin',
          email: admin.email,
          fullName: `${admin.firstName} ${admin.lastName}`,
          message: 'Account activation required'
        });
      }

      // Admin is active, proceed with login
      console.log('🔐 Signing admin token with getJWTSecret():', getJWTSecret());
      const token = jwt.sign(
        { id: admin._id, role: admin.role || 'admin', adminId: admin.adminId },
        getJWTSecret(),
        { expiresIn: '24h' }
      );

      const adminName = `${admin.firstName} ${admin.lastName}`.trim();
      console.log('✅ Admin login successful:', adminName);

      return res.json({
        token,
        role: admin.role || 'admin',
        adminId: admin.adminId,
        name: adminName,
        email: admin.email
      });
    }

    // Try merchant login (by email OR username)
    const merchant = await Merchant.findOne({ 
      $or: [
        { email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } },
        { username: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } }
      ],
      isActive: true 
    });

    if (merchant) {
      // FIXED: Use bcrypt.compare() for hashed passwords
      let isValidPin = false;
      
      if (merchant.password.startsWith('$2b$') || merchant.password.startsWith('$2a$')) {
        isValidPin = await bcrypt.compare(password, merchant.password);
      } else {
        isValidPin = merchant.password === password;
      }
      
      if (isValidPin) {
        const token = jwt.sign(
          { id: merchant._id, role: 'merchant', merchantId: merchant.merchantId },
          getJWTSecret(),
          { expiresIn: '24h' }
        );

        console.log('✅ Merchant login successful:', merchant.businessName);

        return res.json({
          token,
          role: 'merchant',
          merchantId: merchant.merchantId,
          businessName: merchant.businessName,
          contactPerson: merchant.contactPerson
        });
      } else {
        console.log('❌ Invalid PIN for merchant:', normalizedEmail);
        return res.status(401).json({ error: 'Invalid PIN' });
      }
    }

    // Try user login (students/employees) - check without isActive filter first
    console.log(`🔍 Searching for user with email: ${normalizedEmail}`);
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }
    });

    // Debug: List all users in database
    const allUsers = await User.find({}).select('email isActive');
    console.log(`📋 All users in database (${allUsers.length}):`, allUsers.map(u => `${u.email} (active: ${u.isActive})`));

    if (user) {
      // Use bcrypt.compare() for hashed PINs
      let isValidPin = false;

      if (user.pin.startsWith('$2b$') || user.pin.startsWith('$2a$')) {
        isValidPin = await bcrypt.compare(password, user.pin);
      } else {
        isValidPin = user.pin === password;
      }

      if (!isValidPin) {
        console.log('❌ Invalid PIN for user:', normalizedEmail);
        return res.status(401).json({ error: 'Invalid PIN' });
      }

      // Check if user needs activation
      if (!user.isActive) {
        console.log('⚠️  User account needs activation:', normalizedEmail);
        return res.status(403).json({
          requiresActivation: true,
          accountId: user._id.toString(),
          accountType: 'user',
          email: user.email,
          fullName: user.fullName || `${user.firstName} ${user.lastName}`,
          message: 'Account activation required'
        });
      }

      // User is active, proceed with login
      const token = jwt.sign(
        { id: user._id, role: user.role, userId: user.userId },
        getJWTSecret(),
        { expiresIn: '24h' }
      );

      const userName = user.fullName || `${user.firstName} ${user.lastName}`.trim();
      console.log('✅ User login successful:', userName);

      return res.json({
        token,
        role: user.role, // 'student' or 'employee'
        userId: user._id.toString(),
        name: userName,
        email: user.email
      });
    }

    console.log('❌ User not found:', normalizedEmail);
    return res.status(401).json({ error: 'User not found' });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

export default router;