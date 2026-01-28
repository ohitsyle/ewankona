// nucash-server/models/Transaction.js
// Schema v3.0 - Unified transaction model with TXN+date+hex format

import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  // Primary Key - Format: TXN202502179F3A8C12 (TXN + YYYYMMDD + 8-char hex)
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Transaction Type - Debit (payment) or Credit (load)
  transactionType: {
    type: String,
    required: true,
    enum: ["debit", "credit"]
  },
  
  // Amount
  amount: {
    type: Number,
    required: true
  },
  
  // Status
  status: {
    type: String,
    enum: ["Completed", "Failed", "Pending", "Offline", "Refunded"],
    default: "Completed"
  },
  
  // Context Fields (nullable based on transaction type)
  shuttleId: {
    type: String,
    default: null
  },
  driverId: {
    type: String,
    default: null
  },
  merchantId: {
    type: String,
    default: null
  },
  routeId: {
    type: String,
    default: null
  },
  
  // Foreign Key - User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // User Balance at Transaction Time
  balance: {
    type: Number,
    default: 0
  },
  
  // User Identification (denormalized for quick access)
  schoolUId: {
    type: String,
    required: [true, 'School ID number is required'],
    trim: true
  },
  
  email: {
    type: String,
    required: true
  },
  
  // Admin Reference (who processed/approved the transaction)
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },

  // View Permission - Which role can view this transaction
  viewFor: {
    type: String,
    enum: ["user", "merchant", "treasury", "accounting", null],
    default: null,
    index: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Static method to generate transaction ID
TransactionSchema.statics.generateTransactionId = function() {
  // Format: TXN + YYYYMMDD + 8-char hex
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  // Generate 8-character hex string
  const hexStr = Math.random().toString(16).substring(2, 10).toUpperCase();
  
  return `TXN${dateStr}${hexStr}`;
};

export default mongoose.model("Transaction", TransactionSchema);