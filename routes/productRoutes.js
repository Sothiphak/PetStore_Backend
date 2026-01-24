const express = require('express');
const router = express.Router();
const { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct, // 👈 Added
  deleteProduct, // 👈 Added
  createProductReview 
} = require('../controllers/productController');

// Import Auth Middleware
// 👇 Added 'admin' here
const { protect, admin } = require('../middleware/authMiddleware');

// Public Routes
router.get('/', getProducts);
router.get('/:id', getProductById);

// Protected Admin Routes 🔒
router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

// Protected User Route
router.post('/:id/reviews', protect, createProductReview);

module.exports = router;