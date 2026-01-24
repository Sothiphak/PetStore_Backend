const express = require('express');
const router = express.Router();
const { 
  addOrderItems, 
  getMyOrders, 
  getOrderById, 
  checkOrderPayment,
  getOrders // 👈 Import the new function
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

// 1. Root Route
router.route('/')
  .post(protect, addOrderItems)      
  .get(protect, admin, getOrders);    

// 2. My Orders Route
router.route('/myorders').get(protect, getMyOrders);

// 3. ID Routes (Must be at bottom)
router.route('/:id').get(protect, getOrderById);
router.route('/:id/payment').get(protect, checkOrderPayment);

module.exports = router;