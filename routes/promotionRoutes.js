const express = require('express');
const router = express.Router();
const { 
  getPromotions, 
  createPromotion, 
  deletePromotion,
  validatePromotion // 👈 Import new function
} = require('../controllers/promotionController');
const { protect, admin } = require('../middleware/authMiddleware');

// Admin Routes
router.route('/')
  .get(protect, admin, getPromotions)
  .post(protect, admin, createPromotion);

router.route('/:id')
  .delete(protect, admin, deletePromotion);

// 🟢 Public Route for Customers (Validate Code)
router.post('/validate', validatePromotion);

module.exports = router;