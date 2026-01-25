const express = require('express');
const router = express.Router();
const { 
  getPromotions, 
  createPromotion, 
  deletePromotion,
  validatePromotion,
  getProductDiscounts,
  updatePromotion
} = require('../controllers/promotionController');
const { protect, admin } = require('../middleware/authMiddleware');

// Admin Routes
router.route('/')
  .get(protect, admin, getPromotions)
  .post(protect, admin, createPromotion);

// 🟢 NEW: Public Route for Product Badges (MUST come before /:id)
router.get('/product-discounts', getProductDiscounts); 

router.route('/:id')
  .put(protect, admin, updatePromotion)
  .delete(protect, admin, deletePromotion);

// 🟢 Public Route for Customers (Validate Code)
router.post('/validate', validatePromotion);

module.exports = router;