const mongoose = require('mongoose');

const PromotionSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true, // Forces 'SUMMER10' instead of 'summer10'
    trim: true
  },
  discountPercentage: { 
    type: Number, 
    required: true,
    min: 0,
    max: 100
  },
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  // Analytics: Tracks how many times this code was used
  usageCount: { 
    type: Number, 
    default: 0 
  }
}, { timestamps: true });

module.exports = mongoose.model('Promotion', PromotionSchema);