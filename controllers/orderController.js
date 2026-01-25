const Order = require('../models/Order');
const Product = require('../models/Product'); 
const Promotion = require('../models/Promotion'); // 🟢 NEW: Import Promotion
const sendEmail = require('../utils/sendEmail'); 
const PaymentService = require('../services/paymentService'); 

exports.addOrderItems = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authorized. Please login.' });
    }

    const { 
      orderItems, 
      shippingAddress, 
      paymentMethod, 
      itemsPrice, 
      taxPrice, 
      shippingPrice, 
      totalPrice,
      isPaid,
      paidAt,
      promoCode // 🟢 NEW: Receive the code from Frontend
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    } 

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

    // =========================================
    // 🟢 1. BAKONG PAYMENT FLOW
    // =========================================
    if (paymentMethod === 'Bakong') {
        const billNumber = order._id.toString().slice(-10);
        
        try {
            const qrResult = await PaymentService.generateKHQR(totalPrice, billNumber);
            
            if (qrResult.success) {
                order.paymentResult = {
                    id: qrResult.md5,
                    status: 'pending',
                    email_address: req.user.email
                };
                
                await order.save();
                
                // 🟢 NEW: Increment Coupon Usage (Bakong)
                if (promoCode) {
                    await Promotion.findOneAndUpdate(
                        { code: promoCode.toUpperCase() },
                        { $inc: { usageCount: 1 } }
                    );
                }

                // 🟢 NEW: Increment Product Sales Count
                for (const item of orderItems) {
                    await Product.findByIdAndUpdate(item.product, { $inc: { salesCount: item.qty } });
                }
                
                return res.status(201).json({
                    _id: order._id,
                    qrImage: qrResult.qrImage,
                    isBakong: true,
                    totalPrice,
                    paymentMethod
                });
            } else {
                return res.status(400).json({ 
                    message: qrResult.message || "Payment Gateway Error: Could not generate KHQR." 
                });
            }
        } catch (err) {
            console.error("Bakong Service Error:", err);
            return res.status(500).json({ message: "Bakong Service Unavailable" });
        }
    }

    // =========================================
    // 🟢 2. STANDARD FLOW (COD, Card, etc.)
    // =========================================
    const createdOrder = await order.save();

    // 🟢 NEW: Increment Coupon Usage (Standard)
    if (promoCode) {
        await Promotion.findOneAndUpdate(
            { code: promoCode.toUpperCase() },
            { $inc: { usageCount: 1 } }
        );
    }

    // 🟢 NEW: Increment Product Sales Count
    for (const item of orderItems) {
        await Product.findByIdAndUpdate(item.product, { $inc: { salesCount: item.qty } });
    }

    // ✅ SEND RESPONSE IMMEDIATELY
    res.status(201).json(createdOrder);

    // 📧 Send Email AFTER Response (Non-blocking)
    if (paymentMethod !== 'Bakong') {
        setImmediate(async () => {
            try {
                await sendEmail({
                    email: req.user.email,
                    subject: 'Order Confirmation - PetStore+',
                    message: `Thank you for your order! Your Order ID is: ${createdOrder._id}`
                });
                console.log(`✅ Confirmation email sent to ${req.user.email}`);
            } catch (e) { 
                console.error('❌ Email failed to send:', e.message); 
            }
        });
    }
    
  } catch (error) {
    console.error('Order Create Error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.checkOrderPayment = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.isPaid) {
            return res.json({ paid: true });
        }

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
    } catch (error) {
        console.error('Check Payment Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error('Get My Orders Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'firstName lastName email phone')  
      .populate('orderItems.product', 'name price image'); 
    
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    console.error('Get Order Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'id firstName lastName email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Get Orders Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (order) {
      order.status = status;
      if (status === 'Delivered') {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
        if (order.paymentMethod === 'COD') {
           order.isPaid = true;
           order.paidAt = Date.now();
        }
      }
      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    console.error('Update Order Status Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};