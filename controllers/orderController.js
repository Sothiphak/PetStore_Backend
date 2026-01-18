const Order = require('../models/Order');
const Product = require('../models/Product'); 
const sendEmail = require('../utils/sendEmail'); // Ensure this file exists in backend/utils/

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

    // 1. Verify Stock
    for (const item of orderItems) {
      const productInDb = await Product.findById(item.product);
      if (!productInDb) {
        return res.status(404).json({ message: `Product not found: ${item.name}` });
      }
      if (productInDb.stockQuantity < item.quantity) {
        return res.status(400).json({ 
          message: `Sorry, ${item.name} is out of stock (Only ${productInDb.stockQuantity} left).` 
        });
      }
    }

    // 2. Create the Order
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
      paidAt: isPaid ? (paidAt || Date.now()) : null
    });

    const createdOrder = await order.save();

    // 3. Update Inventory & Check for Low Stock
    for (const item of orderItems) {
      // { new: true } returns the updated product so we can see the NEW stock level
      const updatedProduct = await Product.findByIdAndUpdate(item.product, {
        $inc: { stockQuantity: -item.quantity } 
      }, { new: true });

      // 🔔 LOW STOCK ALERT
      if (updatedProduct && updatedProduct.stockQuantity < 5) {
        console.log(`⚠️ LOW STOCK ALERT: ${updatedProduct.name} is down to ${updatedProduct.stockQuantity}!`);
        // You could also trigger an admin email here using sendEmail()
      }
    }

    // 4. 📧 SEND ORDER CONFIRMATION EMAIL
    // We wrap this in a try/catch so email failures don't crash the whole order process
    try {
      const message = `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h1 style="color: #009200;">Order Confirmed! 🐾</h1>
          <p>Hi ${req.user.firstName},</p>
          <p>Thank you for shopping with PetStore+. We have received your order.</p>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 8px;">
            <p><strong>Order ID:</strong> ${createdOrder._id}</p>
            <p><strong>Total Amount:</strong> $${totalPrice}</p>
            <p><strong>Payment Method:</strong> ${paymentMethod}</p>
          </div>
          <p>We will notify you when your items ship!</p>
        </div>
      `;

      await sendEmail({
        email: req.user.email,
        subject: 'Order Confirmation - PetStore+',
        message
      });
      
      console.log(`📧 Confirmation email sent to: ${req.user.email}`);
    } catch (emailError) {
      console.error('Email could not be sent:', emailError.message);
      // We do NOT return an error here, because the order was already successful.
    }

    res.status(201).json(createdOrder);
    
  } catch (error) {
    console.error('Order Create Error:', error);
    res.status(500).json({ message: 'Server Error' });
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