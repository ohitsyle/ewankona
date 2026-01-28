// nucash-server/models/MerchantTransaction.js
// NEW MODEL: Detailed merchant payment records

import mongoose from 'mongoose';

const MerchantTransactionSchema = new mongoose.Schema({
  // Merchant info
  merchantId: {
    type: String,
    required: true,
    index: true
  },
  merchantName: {
    type: String,
    default: ''
  },
  businessName: {
    type: String,
    default: ''
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
  amount: {
    type: Number,
    required: true
  },
  balanceBefore: {
    type: Number,
    required: true
  },
  
  // Items (optional)
  itemDescription: {
    type: String,
    default: ''
  },
  quantity: {
    type: Number,
    default: 1
  },
  
  // Status
  status: {
    type: String,
    enum: ['completed', 'pending', 'failed'],
    default: 'completed'
  },
  paymentMethod: {
    type: String,
    enum: ['nfc', 'cash'],
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
MerchantTransactionSchema.virtual('balanceAfter').get(function() {
  return this.balanceBefore - this.amount;
});

// Ensure virtuals are included
MerchantTransactionSchema.set('toJSON', { virtuals: true });
MerchantTransactionSchema.set('toObject', { virtuals: true });

// Indexes
MerchantTransactionSchema.index({ merchantId: 1, timestamp: -1 });
MerchantTransactionSchema.index({ userId: 1, timestamp: -1 });

export default mongoose.model('MerchantTransaction', MerchantTransactionSchema);