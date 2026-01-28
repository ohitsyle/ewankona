// nucash-server/models/ShuttlePosition.js

import mongoose from 'mongoose';

const shuttlePositionSchema = new mongoose.Schema({
  shuttleId: {
    type: String,
    required: true,
    unique: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  speed: {
    type: Number,
    default: 0
  },
  heading: {
    type: Number,
    default: 0
  },
  accuracy: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  lastUpdate: {
    type: String,
    default: function() {
      return new Date().toISOString();
    }
  }
}, {
  timestamps: true
});

// Index for quick lookups
shuttlePositionSchema.index({ shuttleId: 1 });
shuttlePositionSchema.index({ timestamp: -1 });

export default mongoose.model('ShuttlePosition', shuttlePositionSchema);