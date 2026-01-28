// nucash-server/models/Configuration.js
// Model for system configurations (auto-exports, excuse slips, etc.)

import mongoose from 'mongoose';

const configurationSchema = new mongoose.Schema({
  configType: {
    type: String,
    enum: ['autoExport', 'excuseSlips', 'tabVisibility'],
    required: true,
    unique: true
  },

  // Admin role (for role-specific configurations)
  adminRole: {
    type: String,
    enum: ['motorpool', 'merchant', 'treasury'],
    default: 'motorpool'
  },

  // Auto Export Configuration
  autoExport: {
    enabled: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'custom'],
      default: 'daily'
    },
    exportTypes: {
      type: [String],
      // Now supports both motorpool and merchant export types
      enum: ['Drivers', 'Routes', 'Trips', 'Shuttles', 'Phones', 'Logs', 'Concerns', 'Merchants'],
      default: []
    },
    time: {
      type: String,
      default: '00:00'
    },
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
      default: 0
    },
    dayOfMonth: {
      type: Number,
      min: 1,
      max: 31,
      default: 1
    },
    emailRecipients: {
      type: [String],
      default: []
    }
  },

  // Excuse Slip Configuration
  excuseSlips: {
    enabled: {
      type: Boolean,
      default: true
    },
    validityHours: {
      type: Number,
      default: 24,
      min: 1
    },
    requireDriverApproval: {
      type: Boolean,
      default: true
    },
    template: {
      type: String,
      default: 'This is to certify that {studentName} ({schoolId}) was delayed due to shuttle service delay on {date}. Delay duration: {delayMinutes} minutes. Route: {routeName}.'
    }
  },

  // Tab Visibility Configuration
  tabVisibility: {
    home: { type: Boolean, default: true },
    drivers: { type: Boolean, default: true },
    shuttles: { type: Boolean, default: true },
    routes: { type: Boolean, default: true },
    phones: { type: Boolean, default: true },
    trips: { type: Boolean, default: true },
    concerns: { type: Boolean, default: true },
    promotions: { type: Boolean, default: true },
    configurations: { type: Boolean, default: true },
    logs: { type: Boolean, default: true }
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
configurationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Configuration = mongoose.model('Configuration', configurationSchema);

export default Configuration;
