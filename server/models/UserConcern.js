// nucash-server/models/UserConcern.js
// Model for user-submitted concerns, reports, and feedback

import mongoose from 'mongoose';

const UserConcernSchema = new mongoose.Schema({
  // Concern identity
  concernId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: () => `C-${Date.now()}`
  },

  // Type of submission
  submissionType: {
    type: String,
    required: true,
    enum: ['assistance', 'feedback'],
    index: true
  },

  // Submitter info
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  userName: {
    type: String,
    required: true
  },

  userEmail: {
    type: String,
    required: true
  },

  // FOR ASSISTANCE REPORTS
  selectedConcerns: [{
    type: String
  }],

  // FOR FEEDBACK
  reportTo: {
    type: String,
    default: null
  },

  subject: {
    type: String,
    default: null
  },

  feedbackText: {
    type: String,
    default: null
  },

  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: null
  },

  // Status tracking (only for assistance requests)
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved', 'closed'],
    default: function() {
      return this.submissionType === 'assistance' ? 'pending' : null;
    },
    index: true
  },

  // Priority (only for assistance requests)
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: function() {
      return this.submissionType === 'assistance' ? 'medium' : null;
    }
  },

  // Assignment (only for assistance requests)
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },

  assignedDate: {
    type: Date,
    default: null
  },

  // Resolution (only for assistance requests)
  resolution: {
    type: String,
    default: ''
  },

  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },

  resolvedDate: {
    type: Date,
    default: null
  },

  // Internal notes (only for assistance requests)
  internalNotes: {
    type: String,
    default: ''
  },

  // Admin response to feedback (only for feedback)
  adminResponse: {
    type: String,
    default: null
  },

  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },

  respondedDate: {
    type: Date,
    default: null
  },

  // Timestamps
  submittedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Auto-generate concernId
UserConcernSchema.pre('save', async function(next) {
  if (this.isNew && !this.concernId) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.concernId = `${this.submissionType === 'assistance' ? 'AST' : 'FBK'}-${dateStr}-${randomHex}`;
  }

  // Auto-set resolvedDate when status changes to resolved
  if (this.status === 'resolved' && !this.resolvedDate) {
    this.resolvedDate = new Date();
  }

  next();
});

// Indexes for efficient queries
UserConcernSchema.index({ status: 1, priority: -1, submittedAt: -1 });
UserConcernSchema.index({ submissionType: 1, status: 1 });
UserConcernSchema.index({ userId: 1, submittedAt: -1 });

export default mongoose.model('UserConcern', UserConcernSchema);
