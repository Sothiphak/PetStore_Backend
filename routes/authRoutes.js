// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { register, login, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware'); // We need to create this next

router.post('/register', register);
router.post('/login', login);
router.put('/profile', protect, updateProfile); // 'protect' means you must be logged in

module.exports = router;