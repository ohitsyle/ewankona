// nucash-server/models/Geofence.js
// UPDATED: Enhanced for motorpool admin management

import mongoose from 'mongoose';

const GeofenceSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  latitude: { 
    type: Number, 
    required: true 
  },
  longitude: { 
    type: Number, 
    required: true 
  },
  radius: { 
    type: Number, 
    default: 100 // meters
  },
  type: {
    type: String,
    enum: ['campus', 'terminal', 'stop', 'landmark', 'other'],
    default: 'stop'
  },
  active: { 
    type: Boolean, 
    default: true 
  },
  order: {
    type: Number,
    default: 0 // For ordering in lists
  },
  address: {
    type: String,
    default: '' // Full address for display
  },
  notes: {
    type: String,
    default: '' // Admin notes
  },
  createdBy: {
    type: String,
    default: 'System'
  },
  updatedBy: {
    type: String,
    default: null
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
GeofenceSchema.pre('save', async function() {
  this.updatedAt = new Date();
});

export default mongoose.model('Geofence', GeofenceSchema);