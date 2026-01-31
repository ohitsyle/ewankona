// server/models/SystemLog.js
// System activity logging for admin actions

import mongoose from 'mongoose';

const SystemLogSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true,
    index: true
  },
  description: {
    type: String,
    default: ''
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    default: 'info',
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

SystemLogSchema.index({ eventType: 1, timestamp: -1 });

export default mongoose.model('SystemLog', SystemLogSchema);
