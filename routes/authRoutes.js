const express = require('express');
const router = express.Router();

const { 
  register, 
  login, 
  getUserProfile, 
  updateProfile,
  forgotPassword, // 👈 Import this
  resetPassword   // 👈 Import this
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);

router.get('/profile', protect, getUserProfile); 
router.put('/profile', protect, updateProfile);

// 👇 New Password Reset Routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;