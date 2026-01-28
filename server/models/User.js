// nucash-server/models/User.js
// Schema v3.0 - Updated to match new specification with auto-increment userId

import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  // Primary Key - Auto-incrementing numeric ID
  userId: {
    type: Number,
    required: true,
    unique: true
  },

  // School Identification
  schoolUId: {
    type: String,
    required: [true, 'School ID number is required'],
    unique: true,
    trim: true
  },

  // RFID Card Identification
  rfidUId: {
    type: String,
    required: [true, 'RFID is required'],
    unique: true,
    trim: true
  },

  // Name Fields
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  middleName: {
    type: String,
    default: '',
    trim: true
  },

  // Role - Student or Employee only
  role: {
    type: String,
    enum: {
      values: ["student", "employee"],
      message: '{VALUE} is not a valid role'
    },
    default: "student",
    required: true
  },

  // Contact Information
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        // Email regex validation
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} is not a valid email address`
    }
  },

  // Security - 6-digit numeric PIN
  pin: {
    type: String,
    required: [true, 'PIN is required']
  },

  // Financial
  balance: {
    type: Number,
    default: 0
  },

  // Account Status
  // isActive: false until user changes system-generated PIN
  isActive: {
    type: Boolean,
    default: false
  },

  // Deactivation status (when user deactivates their own account)
  isDeactivated: {
    type: Boolean,
    default: false
  },

  deactivatedAt: {
    type: Date
  },

  // OTP Reset System
  resetOtp: {
    type: String,
    default: ''
  },
  resetOtpExpireAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Virtual field for full name (computed when needed)
UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.middleName ? this.middleName + ' ' : ''}${this.lastName}`.trim();
});

// Ensure virtuals are included in JSON
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

// Indexes for efficient queries
// Note: schoolUId, rfidUid, email already have unique indexes from schema
UserSchema.index({ isActive: 1 });

// DEBUG: Log whenever a user document is being removed
// This will help identify what's deleting users
UserSchema.pre('deleteOne', { document: true, query: false }, function(next) {
  console.log('⚠️  [USER DELETE] Document deleteOne called for user:', this.email);
  console.log('⚠️  [USER DELETE] Stack trace:', new Error().stack);
  next();
});

UserSchema.pre('deleteMany', function(next) {
  console.log('🚨 [USER DELETE] deleteMany called with filter:', JSON.stringify(this.getFilter()));
  console.log('🚨 [USER DELETE] Stack trace:', new Error().stack);
  next();
});

UserSchema.pre('findOneAndDelete', function(next) {
  console.log('⚠️  [USER DELETE] findOneAndDelete called with filter:', JSON.stringify(this.getFilter()));
  console.log('⚠️  [USER DELETE] Stack trace:', new Error().stack);
  next();
});

// DEBUG: Log all save operations
UserSchema.pre('save', function(next) {
  console.log(`💾 [USER SAVE] Saving user: ${this.email}, _id: ${this._id}, isNew: ${this.isNew}`);
  next();
});

UserSchema.post('save', function(doc) {
  console.log(`✅ [USER SAVE] Successfully saved user: ${doc.email}, _id: ${doc._id}`);
});

const User = mongoose.model("User", UserSchema);

// DEBUG: Log model info on first load
console.log(`📦 User model loaded - Collection: ${User.collection.name}`);

export default User;
