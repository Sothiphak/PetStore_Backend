const mongoose = require('mongoose');

const PromotionSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true, 
    trim: true 
  },
  type: {
    type: String,
    enum: ['percent', 'fixed', 'shipping'], // Supports 10% off, $5 off, or Free Shipping
    required: true,
    default: 'percent'
  },
  value: { 
    type: Number, 
    required: true,
    min: 0
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  usageLimit: { type: Number, default: 0 }, // 0 = Unlimited
  usageCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Promotion', PromotionSchema);