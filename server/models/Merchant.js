// nucash-server/models/Merchant.js
// Schema v3.0 - Merchant model (similar to Driver model)

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const MerchantSchema = new mongoose.Schema({
  // Identity
  merchantId: {
    type: String,
    required: true,
    unique: true
  },

  // Business Info
  businessName: {
    type: String,
    required: true
  },

  // Contact Person Name
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  middleName: {
    type: String,
    default: ''
  },

  // Contact (email used for login)
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  // Security - 6-digit numeric PIN (stored as hashed password)
  pin: {
    type: String,
    required: true
  },

  // License Information
  licenseNumber: {
    type: String,
    default: ''
  },
  licenseExpiry: {
    type: Date,
    default: null
  },

  // System
  role: {
    type: String,
    default: 'merchant'
  },
  isActive: {
    type: Boolean,
    default: false  // Requires activation like Admin/User
  },
  createdBy: {
    type: String,
    default: 'Admin'
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Hash PIN before saving (only if modified)
MerchantSchema.pre('save', async function(next) {
  if (this.isModified('pin')) {
    // Check if PIN is already hashed (starts with $2b$ = bcrypt hash)
    if (this.pin.startsWith('$2b$') || this.pin.startsWith('$2a$')) {
      // Already hashed (from seed script), skip validation and hashing
      return next();
    }

    // Validate 6-digit numeric PIN (only for unhashed PINs)
    if (!/^\d{6}$/.test(this.pin)) {
      throw new Error('PIN must be exactly 6 numeric digits');
    }

    // Hash the PIN
    const salt = await bcrypt.genSalt(10);
    this.pin = await bcrypt.hash(this.pin, salt);
  }

  next();
});

// Virtual field for full name (contact person)
MerchantSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.middleName ? this.middleName + ' ' : ''}${this.lastName}`.trim();
});

// Ensure virtuals are included
MerchantSchema.set('toJSON', { virtuals: true });
MerchantSchema.set('toObject', { virtuals: true });

export default mongoose.model('Merchant', MerchantSchema);
