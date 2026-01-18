const mongoose = require('mongoose');

// 1. Define the Schema for a single review
const reviewSchema = mongoose.Schema({
  name: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: { type: String, required: true },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User', // Links to the user who wrote it
  },
}, { timestamps: true });

// 2. Update the Product Schema
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  stockQuantity: { type: Number, required: true, default: 0 },
  imageUrl: { type: String, required: true },
  
  // 👇 NEW: Reviews Array & Ratings
  reviews: [reviewSchema],
  rating: { type: Number, required: true, default: 0 },
  numReviews: { type: Number, required: true, default: 0 },

}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);