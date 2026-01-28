// nucash-server/models/Route.js
// Routes with FROM and TO locations (like Waze)
// Route name auto-generated from locations

import mongoose from 'mongoose';

const RouteSchema = new mongoose.Schema({
  // Route identity
  routeId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Route name (auto-generated: "From → To")
  routeName: {
    type: String,
    required: true
  },

  // FROM location (Point A)
  fromName: {
    type: String,
    required: true
  },
  fromLatitude: {
    type: Number,
    required: true
  },
  fromLongitude: {
    type: Number,
    required: true
  },

  // TO location (Point B)
  toName: {
    type: String,
    required: true
  },
  toLatitude: {
    type: Number,
    required: true
  },
  toLongitude: {
    type: Number,
    required: true
  },
  
  // NO distance_km field - calculated real-time
  // NO estimated_time_min field - calculated real-time
  
  // Pricing
  fare: {
    type: Number,
    required: true,
    default: 15
  },
  
  // System
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
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
RouteSchema.pre('save', async function() {
  this.updatedAt = new Date();
});

export default mongoose.model('Route', RouteSchema);