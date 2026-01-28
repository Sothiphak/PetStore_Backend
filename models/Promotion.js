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
    enum: ['percent', 'fixed', 'shipping'],
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
  usageLimit: { type: Number, default: 0 },
  usageCount: { type: Number, default: 0 },
  totalSavings: { type: Number, default: 0 }, // Track actual $ saved
  revenue: { type: Number, default: 0 }, // Track Total Sales Volume

  // Campaign Type
  campaignType: {
    type: String,
    enum: ['promo_code', 'product_discount'],
    default: 'promo_code'
  },

  // Applicable Products
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],

  // Minimum Purchase
  minPurchase: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

module.exports = mongoose.model('Promotion', PromotionSchema);