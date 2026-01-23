// server/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const { addOrderItems, getMyOrders, getOrderById, checkOrderPayment } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, addOrderItems);
router.get('/myorders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);

// 👇 New Route for Polling Payment Status
router.get('/:id/payment', protect, checkOrderPayment);

module.exports = router;