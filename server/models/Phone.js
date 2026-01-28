// nucash-server/models/Phone.js
// Model for managing NFC-enabled phones assigned to drivers

import mongoose from 'mongoose';

const PhoneSchema = new mongoose.Schema({
  // Phone identity
  phoneId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Phone details
  phoneModel: {
    type: String,
    required: true
  },
  phoneType: {
    type: String,
    required: true,
    enum: ['Android', 'iOS', 'Other'],
    default: 'Android'
  },
  serialNumber: {
    type: String,
    default: ''
  },
  imei: {
    type: String,
    default: ''
  },
  
  // NFC capability
  nfcEnabled: {
    type: Boolean,
    default: true
  },
  
  // Assignment (Driver)
  assignedDriverId: {
    type: String,
    default: null
  },
  assignedDriverName: {
    type: String,
    default: null
  },
  assignedDate: {
    type: Date,
    default: null
  },

  // Assignment (Merchant)
  assignedMerchantId: {
    type: String,
    default: null
  },
  assignedBusinessName: {
    type: String,
    default: null
  },
  assignedMerchantDate: {
    type: Date,
    default: null
  },
  
  // Status
  status: {
    type: String,
    enum: ['available', 'assigned', 'maintenance', 'retired'],
    default: 'available'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Purchase info
  purchaseDate: {
    type: Date,
    default: null
  },
  warrantyExpiry: {
    type: Date,
    default: null
  },
  
  // Metadata
  notes: {
    type: String,
    default: ''
  },
  createdBy: {
    type: String,
    default: 'Admin'
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
PhoneSchema.pre('save', async function() {
  this.updatedAt = new Date();
});

// Indexes
PhoneSchema.index({ status: 1 });
PhoneSchema.index({ assignedDriverId: 1 });
PhoneSchema.index({ assignedMerchantId: 1 });

export default mongoose.model('Phone', PhoneSchema);