// nucash-server/models/Shuttle.js
// Mongoose model for shuttle vehicles

import mongoose from 'mongoose';

const ShuttleSchema = new mongoose.Schema({
  shuttleId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  vehicleType: {
    type: String,
    required: true
  },
  vehicleModel: {
    type: String,
    required: true
  },
  plateNumber: {
    type: String,
    default: ''
  },
  capacity: {
    type: Number,
    default: 15
  },
  status: {
    type: String,
    enum: ['available', 'reserved', 'taken', 'unavailable'],
    default: 'available'
  },
  currentDriver: {
    type: String,
    default: null
  },
  currentDriverId: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
ShuttleSchema.pre('save', async function() {
  this.updatedAt = new Date();
});

export default mongoose.model('Shuttle', ShuttleSchema);