// server/models/Feedback.js
// Legacy feedback model for sysad (UserConcern handles assistance/feedback)

import mongoose from 'mongoose';

const FeedbackSchema = new mongoose.Schema({
  rating: { type: Number, min: 0, max: 5, default: null },
  comment: { type: String, default: '' },
  userName: { type: String, default: '' },
  userEmail: { type: String, default: '' }
}, {
  timestamps: true
});

export default mongoose.model('Feedback', FeedbackSchema);
