const express = require('express');
const router = express.Router();
const { 
  getProducts, 
  getProductById, 
  createProduct, 
  createProductReview 
} = require('../controllers/productController');

// Import Auth Middleware
const { protect } = require('../middleware/authMiddleware');

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', createProduct);

// 👇 NEW ROUTE (Protected)
router.post('/:id/reviews', protect, createProductReview);

module.exports = router;