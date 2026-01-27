// backend/models/User.js
const mongoose = require('mongoose');
const crypto = require('crypto'); // Built-in Node module

const UserSchema = new mongoose.Schema({
  // ... (Your existing fields: firstName, lastName, email, password, etc.) ...
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50 // 🛡️ Limit field length
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50 // 🛡️ Limit field length
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    maxlength: 255 // 🛡️ Limit field length
  },
  password: {
    type: String,
    required: true
  },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  loyaltyPoints: { type: Number, default: 0 },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  isBlocked: { type: Boolean, default: false },

  // 👇 ADD THESE NEW FIELDS FOR RESET TOKEN 👇
  resetPasswordToken: String,
  resetPasswordExpire: Date

}, { timestamps: true });

// 👇 ADD THIS METHOD to generate the token 👇
UserSchema.methods.getResetPasswordToken = function () {
  // 1. Generate a random token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // 2. Hash the token and save it to the database field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // 3. Set expiration (10 minutes)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken; // Return the unhashed token to send via email
};

module.exports = mongoose.model('User', UserSchema);