// nucash-server/models/Driver.js
// FIXED: Skip validation if password is already hashed (for seeding)

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const DriverSchema = new mongoose.Schema({
  // Identity
  driverId: { 
    type: String, 
    required: true, 
    unique: true
  },
  
  // Name
  firstName: { 
    type: String, 
    required: true 
  },
  lastName: { 
    type: String, 
    required: true 
  },
  middleInitial: { 
    type: String, 
    default: '' 
  },
  
  // Contact (email used for login)
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  
  // Security - 6-digit numeric PIN (stored as hashed password)
  password: { 
    type: String, 
    required: true 
  },
  
  // Assignment (NULLABLE - assigned during shuttle selection)
  shuttleId: {
    type: String,
    default: null
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
    default: 'driver'
  },
  isActive: { 
    type: Boolean, 
    default: true  // Auto-active on creation
  },
  createdBy: { 
    type: String, 
    default: 'Admin' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving (only if modified)
DriverSchema.pre('save', async function(next) {
  this.updatedAt = new Date();
  
  if (this.isModified('password')) {
    // Check if password is already hashed (starts with $2b$ = bcrypt hash)
    if (this.password.startsWith('$2b$') || this.password.startsWith('$2a$')) {
      // Already hashed (from seed script), skip validation and hashing
      return next();
    }
    
    // Validate 6-digit numeric PIN (only for unhashed passwords)
    if (!/^\d{6}$/.test(this.password)) {
      throw new Error('Password must be exactly 6 numeric digits');
    }
    
    // Hash the PIN
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  
  next();
});

// Virtual field for full name
DriverSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.middleInitial ? this.middleInitial + '. ' : ''}${this.lastName}`.trim();
});

// Ensure virtuals are included
DriverSchema.set('toJSON', { virtuals: true });
DriverSchema.set('toObject', { virtuals: true });

export default mongoose.model('Driver', DriverSchema);