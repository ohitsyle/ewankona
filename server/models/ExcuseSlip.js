// nucash-server/models/ExcuseSlip.js
// Model for excuse slips issued to passengers for shuttle delays

import mongoose from 'mongoose';

const excuseSlipSchema = new mongoose.Schema({
  slipNumber: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  schoolId: {
    type: String,
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true
  },
  driverName: {
    type: String,
    required: true
  },
  shuttleId: {
    type: String,
    required: true
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    default: null
  },
  routeName: {
    type: String,
    default: ''
  },
  delayMinutes: {
    type: Number,
    required: true,
    min: 1
  },
  reason: {
    type: String,
    required: true
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'used', 'void'],
    default: 'active'
  },
  verificationCode: {
    type: String,
    required: true
  }
});

// Generate slip number
excuseSlipSchema.pre('save', async function(next) {
  if (!this.slipNumber) {
    const count = await mongoose.model('ExcuseSlip').countDocuments();
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    this.slipNumber = `ES-${date}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Generate verification code
excuseSlipSchema.pre('save', function(next) {
  if (!this.verificationCode) {
    this.verificationCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  }
  next();
});

const ExcuseSlip = mongoose.model('ExcuseSlip', excuseSlipSchema);

export default ExcuseSlip;
