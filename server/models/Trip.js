// nucash-server/models/Trip.js
// NEW MODEL: Complete shuttle trip records

import mongoose from 'mongoose';

const TripSchema = new mongoose.Schema({
  // Trip info
  tripId: {
    type: String,
    unique: true,
    sparse: true
  },
  shuttleId: {
    type: String,
    required: true,
    index: true
  },
  driverId: {
    type: String,
    required: true,
    index: true
  },
  driverName: {
    type: String,
    default: ''
  },
  routeId: {
    type: String,
    required: true
  },
  
  // Timing
  departureTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  arrivalTime: {
    type: Date,
    default: null
  },
  durationMinutes: {
    type: Number,
    default: null
  },
  
  // Starting location (Point A - saved when trip begins)
  startLatitude: {
    type: Number,
    required: true
  },
  startLongitude: {
    type: Number,
    required: true
  },
  startLocationName: {
    type: String,
    default: ''
  },
  
  // Ending location (Point B - from route)
  endLatitude: {
    type: Number,
    required: true
  },
  endLongitude: {
    type: Number,
    required: true
  },
  endLocationName: {
    type: String,
    default: ''
  },
  
  // Trip stats
  passengerCount: {
    type: Number,
    default: 0
  },
  totalCollections: {
    type: Number,
    default: 0
  },
  distanceTraveledKm: {
    type: Number,
    default: null
  },
  
  // Status
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'cancelled'],
    default: 'in_progress'
  },

  // Admin notes/comments
  notes: [{
    adminId: {
      type: String,
      required: true
    },
    adminName: {
      type: String,
      default: 'Admin'
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate tripId before first save
TripSchema.pre('save', async function() {
  this.updatedAt = new Date();

  // Generate tripId if not exists (only on creation)
  if (this.isNew && !this.tripId) {
    const Trip = this.constructor;
    const count = await Trip.countDocuments();
    this.tripId = `TRP-${String(count + 1).padStart(3, '0')}`;
  }

  // Calculate duration if both times exist
  if (this.arrivalTime && this.departureTime) {
    this.durationMinutes = Math.round((this.arrivalTime - this.departureTime) / (1000 * 60));
  }
});

// Indexes for efficient queries
TripSchema.index({ shuttleId: 1, departureTime: -1 });
TripSchema.index({ driverId: 1, departureTime: -1 });
TripSchema.index({ status: 1, departureTime: -1 });

export default mongoose.model('Trip', TripSchema);