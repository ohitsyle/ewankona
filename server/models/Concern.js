// server/models/Concern.js
// Legacy concern model for sysad department (UserConcern handles assistance/feedback)

import mongoose from 'mongoose';

const ConcernSchema = new mongoose.Schema({
  department: {
    type: String,
    default: 'sysad',
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'resolved'],
    default: 'pending',
    index: true
  },
  subject: { type: String, default: '' },
  description: { type: String, default: '' },
  userName: { type: String, default: '' },
  userEmail: { type: String, default: '' },
  reply: { type: String, default: null },
  resolvedAt: { type: Date, default: null },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  resolvedByName: { type: String, default: null }
}, {
  timestamps: true
});

ConcernSchema.index({ department: 1, status: 1 });

export default mongoose.model('Concern', ConcernSchema);
