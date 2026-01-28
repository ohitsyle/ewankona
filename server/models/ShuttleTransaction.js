// nucash-server/models/ShuttleTransaction.js
// NEW MODEL: Detailed shuttle payment records

import mongoose from 'mongoose';

const ShuttleTransactionSchema = new mongoose.Schema({
  // Trip reference
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true,
    index: true
  },
  
  // Shuttle/driver/route info
  shuttleId: {
    type: String,
    required: true,
    index: true
  },
  driverId: {
    type: String,
    required: true
  },
  routeId: {
    type: String,
    required: true
  },
  
  // User info (cached for performance)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  cardUid: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    default: ''
  },
  userEmail: {
    type: String,
    default: ''
  },
  
  // Financial
  fareCharged: {
    type: Number,
    required: true
  },
  balanceBefore: {
    type: Number,
    required: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['completed', 'pending', 'failed'],
    default: 'completed'
  },
  paymentMethod: {
    type: String,
    enum: ['nfc', 'cash', 'online'],
    default: 'nfc'
  },
  
  // Timestamps
  timestamp: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual for balance after
ShuttleTransactionSchema.virtual('balanceAfter').get(function() {
  return this.balanceBefore - this.fareCharged;
});

// Ensure virtuals are included
ShuttleTransactionSchema.set('toJSON', { virtuals: true });
ShuttleTransactionSchema.set('toObject', { virtuals: true });

// Indexes
ShuttleTransactionSchema.index({ tripId: 1, timestamp: 1 });
ShuttleTransactionSchema.index({ shuttleId: 1, timestamp: -1 });
ShuttleTransactionSchema.index({ userId: 1, timestamp: -1 });

export default mongoose.model('ShuttleTransaction', ShuttleTransactionSchema);