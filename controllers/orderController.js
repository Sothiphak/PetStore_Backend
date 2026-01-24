const Order = require('../models/Order');
const Product = require('../models/Product'); 
const sendEmail = require('../utils/sendEmail'); 
const PaymentService = require('../services/paymentService'); 

exports.addOrderItems = async (req, res) => {
  try {
    // 1. Security Check
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
      paidAt
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    } 

    // 2. Create the Order Object
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
        
        try {
            const qrResult = await PaymentService.generateKHQR(totalPrice, billNumber);
            
            if (qrResult.success) {
                order.paymentResult = {
                    id: qrResult.md5,
                    status: 'pending',
                    email_address: req.user.email
                };
                
                await order.save();
                
                return res.status(201).json({
                    _id: order._id,
                    qrImage: qrResult.qrImage,
                    isBakong: true,
                    totalPrice,
                    paymentMethod
                });
            } else {
                return res.status(400).json({ 
                    message: "Payment Gateway Error: Could not generate KHQR." 
                });
            }
        } catch (err) {
            console.error("Bakong Service Error:", err);
            return res.status(500).json({ message: "Bakong Service Unavailable" });
        }
    }

    // 3. Standard Order Save (COD, Card, etc.)
    const createdOrder = await order.save();

    // 📧 Send Email (Fail silently if email config is wrong)
    if (paymentMethod !== 'Bakong') {
        try {
            await sendEmail({
                email: req.user.email,
                subject: 'Order Confirmation - PetStore+',
                message: `Thank you for your order! Your Order ID is: ${createdOrder._id}`
            });
        } catch (e) { 
            console.log('Email failed to send (continuing order):', e.message); 
        }
    }

    res.status(201).json(createdOrder);
    
  } catch (error) {
    console.error('Order Create Error:', error);
    // Return the actual validation error message to the frontend
    res.status(500).json({ message: error.message });
  }
};

// ... (Keep the rest of your controller functions: checkOrderPayment, getMyOrders, etc.) ...
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

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'id firstName lastName email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (order) {
      order.status = status;
      
      // If status is 'Delivered', set the time
      if (status === 'Delivered') {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
        
        // If it was COD, mark as Paid now too
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
    res.status(500).json({ message: 'Server Error' });
  }
};