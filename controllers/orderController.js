// server/controllers/orderController.js
const Order = require('../models/Order');
const Product = require('../models/Product'); 
const sendEmail = require('../utils/sendEmail'); 
const PaymentService = require('../services/paymentService'); 

exports.addOrderItems = async (req, res) => {
  try {
    const { 
      orderItems, 
      shippingAddress, 
      paymentMethod, 
      itemsPrice, 
      taxPrice, 
      shippingPrice, 
      totalPrice,
      isPaid,
      paidAt
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    } 

    // 1. Create the Order Object (Do not save yet)
    const order = new Order({
      orderItems,
      user: req.user._id,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      isPaid: isPaid === true, 
      paidAt: isPaid ? (paidAt || Date.now()) : null,
      status: 'Pending'
    });

    // 🟢 BAKONG LOGIC
    if (paymentMethod === 'Bakong') {
        const billNumber = order._id.toString().slice(-10);
        const qrResult = await PaymentService.generateKHQR(totalPrice, billNumber);
        
        if (qrResult.success) {
            order.paymentResult = {
                id: qrResult.md5,
                status: 'pending',
                email_address: req.user.email
            };
            
            await order.save(); // Save only if QR gen worked
            
            return res.status(201).json({
                _id: order._id,
                qrImage: qrResult.qrImage,
                isBakong: true,
                totalPrice,
                paymentMethod
            });
        } else {
            // 🛑 CRITICAL FIX: If QR Gen fails, STOP the order!
            console.error("KHQR Generation Failed. Check Merchant Credentials.");
            return res.status(400).json({ 
                message: "Payment Gateway Error: Could not generate KHQR. Please check merchant credentials or try COD." 
            });
        }
    }

    // 2. Standard Order Save (COD, Card, etc.)
    const createdOrder = await order.save();

    // 📧 Send Email for standard orders
    if (paymentMethod !== 'Bakong') {
        try {
            await sendEmail({
                email: req.user.email,
                subject: 'Order Confirmation - PetStore+',
                message: `Order received! ID: ${createdOrder._id}`
            });
        } catch (e) { console.error('Email failed', e.message); }
    }

    res.status(201).json(createdOrder);
    
  } catch (error) {
    console.error('Order Create Error:', error);
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// ... keep checkOrderPayment, getMyOrders, getOrderById as they were ...
exports.checkOrderPayment = async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
        if (order.isPaid) return res.json({ paid: true });

        if (order.paymentMethod === 'Bakong' && order.paymentResult?.id) {
            const isPaid = await PaymentService.checkTransaction(order.paymentResult.id);
            if (isPaid) {
                order.isPaid = true;
                order.paidAt = Date.now();
                order.paymentResult.status = 'success';
                order.status = 'Processing';
                await order.save();
                return res.json({ paid: true });
            }
        }
        return res.json({ paid: false });
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
};

exports.getMyOrders = async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
};

exports.getOrderById = async (req, res) => {
    const order = await Order.findById(req.params.id).populate('user', 'firstName lastName email');
    if(order) res.json(order);
    else res.status(404).json({message: 'Order not found'});
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'id firstName lastName email') // Get customer details
      .sort({ createdAt: -1 }); // Newest first
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};