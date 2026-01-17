const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // --- 1. Identity Information ---
  firstName: { 
    type: String, 
    required: true,
    trim: true // Removes extra spaces
  },
  lastName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true 
  },
  password: { 
    type: String, 
    required: true 
  },

  // --- 2. Contact Information (From your UI) ---
  phone: { 
    type: String, 
    default: '' // Default to empty string if not provided
  },
  address: { 
    type: String, 
    default: '' // Use a simple string to match your single text box input
  },

  // --- 3. System Fields ---
  role: { 
    type: String, 
    enum: ['customer', 'admin'], 
    default: 'customer' 
  },
  loyaltyPoints: { 
    type: Number, 
    default: 0 // You can increase this logic later when they buy items
  },

  // --- 4. Features ---
  wishlist: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product' 
  }],
  
  // Note: We do NOT need an 'orders' array here. 
  // We will find orders by searching the Order collection for this User's ID.

}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);