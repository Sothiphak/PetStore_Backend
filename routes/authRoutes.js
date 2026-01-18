const express = require('express');
const router = express.Router();

// Import the controller functions (Make sure getUserProfile is included!)
const { register, login, updateProfile, getUserProfile } = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);

// ✅ THIS WAS MISSING: The route to GET data
router.get('/profile', protect, getUserProfile); 

// The route to UPDATE data
router.put('/profile', protect, updateProfile);

module.exports = router;