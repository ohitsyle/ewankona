// nucash-server/models/ExportHistory.js
// Model for tracking export history

import mongoose from 'mongoose';

const exportHistorySchema = new mongoose.Schema({
  exportType: {
    type: String,
    required: true
    // Removed enum to allow comma-separated values like "Drivers, Trips, Phones"
  },
  fileName: {
    type: String,
    required: false,
    default: ''
  },
  filePath: {
    type: String,
    default: ''
  },
  recordCount: {
    type: Number,
    default: 0
  },
  fileSize: {
    type: String,
    default: ''
  },
  fileData: {
    type: String,
    default: ''
  },
  triggeredBy: {
    type: String,
    enum: ['manual', 'automatic'],
    default: 'manual'
  },
  adminRole: {
    type: String,
    enum: ['motorpool', 'merchant', 'treasury'],
    default: 'motorpool'
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  adminName: {
    type: String,
    default: 'System'
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success'
  },
  errorMessage: {
    type: String,
    default: ''
  },
  exportedAt: {
    type: Date,
    default: Date.now
  }
});

const ExportHistory = mongoose.model('ExportHistory', exportHistorySchema);

export default ExportHistory;
