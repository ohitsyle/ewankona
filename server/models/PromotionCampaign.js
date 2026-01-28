// nucash-server/models/PromotionCampaign.js
// Model for promotional campaigns and loyalty rewards

import mongoose from 'mongoose';

const promotionCampaignSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  rewardType: {
    type: String,
    enum: ['free_ride', 'discount', 'credit'],
    default: 'free_ride'
  },
  minimumRides: {
    type: Number,
    default: 10,
    min: 1
  },
  frequency: {
    type: String,
    enum: ['weekly', 'biweekly', 'monthly'],
    default: 'monthly'
  },
  active: {
    type: Boolean,
    default: true
  },
  rewardsSent: {
    type: Number,
    default: 0
  },
  lastRunDate: {
    type: Date,
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
promotionCampaignSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const PromotionCampaign = mongoose.model('PromotionCampaign', promotionCampaignSchema);

export default PromotionCampaign;
