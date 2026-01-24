const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getUserProfile, 
  updateProfile,
  forgotPassword, 
  resetPassword,
  getUsers // 👈 Import the new function
} = require('../controllers/authController');

const { protect, admin } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);

router.get('/profile', protect, getUserProfile); 
router.put('/profile', protect, updateProfile);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// 👇 ADD THIS ROUTE FOR THE CUSTOMERS PAGE
router.get('/users', protect, admin, getUsers);

module.exports = router;