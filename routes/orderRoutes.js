const express = require('express');
const router = express.Router();
const { addOrderItems, getMyOrders, getOrderById } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

// Route: /api/orders
// 'protect' means the user must be logged in to access these
router.post('/', protect, addOrderItems);
router.get('/myorders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);

module.exports = router;
