// nucash-server/models/Admin.js
// Schema v3.0 - Admin model for motorpool and system administrators

import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema({
  // Identity
  adminId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },

  schoolUId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  // Name
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  middleName: {
    type: String,
    default: '',
    trim: true
  },

  // Role & Permissions
  role: {
    type: String,
    enum: {
      values: ["motorpool", "merchant", "treasury", "accounting", "sysad"],
      message: '{VALUE} is not a valid admin role'
    },
    required: true
  },

  // Contact & Authentication
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} is not a valid email address`
    }
  },

  // Security
  pin: {
    type: String,
    required: [true, 'PIN is required']
  },

  // Account Status
  // isActive: true when admin changes password from system-generated
  isActive: {
    type: Boolean,
    default: false
  },

  // Password Reset
  resetOtp: {
    type: String,
    default: ''
  },

  resetOtpExpireAt: {
    type: Number,
    default: 0
  },

  // Audit Trail
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Virtual field for full name
AdminSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.middleName ? this.middleName + ' ' : ''}${this.lastName}`.trim();
});

// Ensure virtuals are included in JSON
AdminSchema.set('toJSON', { virtuals: true });
AdminSchema.set('toObject', { virtuals: true });

// Indexes for efficient queries
// Note: email already has unique index from schema
AdminSchema.index({ role: 1 });
AdminSchema.index({ isActive: 1 });

export default mongoose.model('Admin', AdminSchema);