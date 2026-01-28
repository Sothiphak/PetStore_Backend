const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  register,
  login,
  getUserProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
  getUsers,
  toggleBlockStatus
} = require('../controllers/authController');

const { protect, admin } = require('../middleware/authMiddleware');

// Stricter rate limiting for authentication
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { message: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', register);
router.post('/login', authLimiter, login);

router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateProfile);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// User Management (Admin)
router.get('/users', protect, admin, getUsers);
router.put('/users/:id/block', protect, admin, toggleBlockStatus);

module.exports = router;