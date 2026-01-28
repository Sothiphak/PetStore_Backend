const express = require('express');
const router = express.Router();
const { 
  getPromotions, 
  createPromotion, 
  deletePromotion,
  validatePromotion,
  getProductDiscounts,
  updatePromotion,
  broadcastPromotion
} = require('../controllers/promotionController');
const { protect, admin } = require('../middleware/authMiddleware');

// Admin Routes
router.route('/')
  .get(protect, admin, getPromotions)
  .post(protect, admin, createPromotion);

// Public Route for Product Badges
router.get('/product-discounts', getProductDiscounts); 

// Broadcast Promotion Email
router.post('/:id/broadcast', protect, admin, broadcastPromotion);

router.route('/:id')
  .put(protect, admin, updatePromotion)
  .delete(protect, admin, deletePromotion);

// Public Route for Customers (Validate Code)
router.post('/validate', validatePromotion);

module.exports = router;