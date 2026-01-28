// nucash-server/models/Setting.js

import mongoose from 'mongoose';

const SettingSchema = new mongoose.Schema({
  currentFare: { type: Number, required: true, default: 15 },

  // Auto recalculated: -(fare - 1)
  negativeLimit: { type: Number, required: true, default: -14 },

  updatedBy: { type: String, default: "Admin" },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Setting", SettingSchema);