const Order = require('../models/Order');
const Product = require('../models/Product');
const Promotion = require('../models/Promotion'); // 🟢 NEW: Import Promotion
const sendEmail = require('../utils/sendEmail');
const PaymentService = require('../services/paymentService');
const { generateInvoiceHtml } = require('../utils/invoiceTemplate');

exports.addOrderItems = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authorized. Please login.' });
    }

    const {
      orderItems, // [{ product: ID, quantity: N }]
      shippingAddress,
      paymentMethod,
      // itemsPrice,  <-- IGNORED (calculated on server)
      // taxPrice,    <-- IGNORED
      // shippingPrice, <-- IGNORED (or validated)
      // totalPrice,  <-- IGNORED
      isPaid,
      paidAt,
      promoCode
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    // 🟢 1. FETCH PRODUCTS & VALIDATE STOCK & CALCULATE PRICE
    // =========================================
    let calculatedItemsPrice = 0;
    const finalOrderItems = []; // To store items with DB details (price, image)

    for (const item of orderItems) {
      const dbProduct = await Product.findById(item.product);

      if (!dbProduct) {
        return res.status(404).json({ message: `Product not found: ${item.product}` });
      }

      // Check Stock
      if (dbProduct.stockQuantity < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${dbProduct.name}. Only ${dbProduct.stockQuantity} left.`
        });
      }

      // Add to running total
      calculatedItemsPrice += dbProduct.price * item.quantity;

      // Push to final array (Snapshotted data)
      finalOrderItems.push({
        ...item,
        name: dbProduct.name,
        price: dbProduct.price, // Trust DB price
        image: dbProduct.imageUrl,
        product: dbProduct._id
      });
    }

    // 🟢 2. CALCULATE TAX, SHIPPING, PROMO
    // =========================================
    const shippingPrice = calculatedItemsPrice > 50 ? 0 : 5; // Server Logic: Free > $50
    const taxPrice = Number((0.08 * calculatedItemsPrice).toFixed(2)); // 8% Tax

    let discountAmount = 0;

    // Validate Coupon (Server Side Again)
    if (promoCode) {
      const promo = await Promotion.findOne({
        code: promoCode.toUpperCase(),
        isActive: true, // Assuming schema has this or use dates
      });

      // Basic Re-validation (Date/Usage)
      const now = new Date();
      if (promo && now >= promo.startDate && now <= promo.endDate &&
        (!promo.usageLimit || promo.usageCount < promo.usageLimit)) {

        if (promo.type === 'percent') {
          discountAmount = (calculatedItemsPrice * promo.value) / 100;
        } else if (promo.type === 'fixed') {
          discountAmount = promo.value;
        }
      }
    }

    // Final Total
    let finalTotalPrice = calculatedItemsPrice + shippingPrice + taxPrice - discountAmount;
    if (finalTotalPrice < 0) finalTotalPrice = 0;

    // 🟢 3. CREATE ORDER
    // =========================================
    const order = new Order({
      orderItems: finalOrderItems,
      user: req.user._id,
      shippingAddress,
      paymentMethod,
      itemsPrice: calculatedItemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice: finalTotalPrice,
      isPaid: isPaid === true,
      paidAt: isPaid ? (paidAt || Date.now()) : null,
      status: 'Pending',
      promoCode: promoCode ? promoCode.toUpperCase() : null
    });

    // =========================================
    // 🟢 4. BAKONG PAYMENT FLOW
    // =========================================
    if (paymentMethod === 'Bakong') {
      const billNumber = order._id.toString().slice(-10);

      try {
        const qrResult = await PaymentService.generateKHQR(finalTotalPrice, billNumber);

        if (qrResult.success) {
          order.paymentResult = {
            id: qrResult.md5,
            status: 'pending',
            email_address: req.user.email
          };

          await order.save();
          await decrementStockAndIncrementSales(finalOrderItems, promoCode, discountAmount); // Helper function

          // 📧 Send "Pending Payment" Invoice
          setImmediate(async () => {
            try {
              const invoiceHtml = generateInvoiceHtml(order, req.user);
              await sendEmail({
                email: req.user.email,
                subject: 'Pending Invoice - PetStore+ (Scan to Pay)',
                message: invoiceHtml
              });
            } catch (e) { console.error('Email failed:', e.message); }
          });

          return res.status(201).json({
            _id: order._id,
            qrImage: qrResult.qrImage,
            isBakong: true,
            totalPrice: finalTotalPrice,
            paymentMethod
          });
        } else {
          return res.status(400).json({ message: "Payment Gateway Error" });
        }
      } catch (err) {
        console.error("Bakong Error:", err);
        return res.status(500).json({ message: "Bakong Service Unavailable" });
      }
    }

    // =========================================
    // 🟢 5. STANDARD FLOW
    // =========================================
    const createdOrder = await order.save();
    await decrementStockAndIncrementSales(finalOrderItems, promoCode, discountAmount);

    res.status(201).json(createdOrder);

    // 📧 Send Email
    setImmediate(async () => {
      try {
        const invoiceHtml = generateInvoiceHtml(createdOrder, req.user);
        await sendEmail({
          email: req.user.email,
          subject: 'Order Confirmation - PetStore+',
          message: invoiceHtml
        });
      } catch (e) {
        console.error('Email failed:', e.message);
      }
    });

  } catch (error) {
    console.error('Order Create Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// HELPER: Decrement Stock
// HELPER: Decrement Stock
async function decrementStockAndIncrementSales(orderItems, promoCode, discountAmount = 0) {
  // 1. Decrement Stock & Increment Sales
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: {
        salesCount: item.quantity,
        stockQuantity: -item.quantity // 🟢 CRITICAL: Decrement Stock
      }
    });
  }
  // 2. Increment Promo Usage
  // 2. Increment Promo Usage (Atomic Check: usageCount < usageLimit)
  // Logic: Only increment if doing so wouldn't exceed limit (if limit exists)
  // Note: usageLimit might be null/undefined for unlimited promos
  if (promoCode) {
    const promo = await Promotion.findOne({ code: promoCode.toUpperCase() });

    // Only proceed if promo exists. 
    if (promo) {
      const query = { code: promoCode.toUpperCase() };

      // If limit exists, add it to the query to ensure atomic safety
      if (promo.usageLimit) {
        query.usageCount = { $lt: promo.usageLimit };
      }

      const result = await Promotion.findOneAndUpdate(
        query,
        {
          $inc: {
            usageCount: 1,
            totalSavings: discountAmount // Track real savings
          }
        }
      );

      // If result is null (and limit existed), it means we hit the limit race condition.
      // Ideally we rollback, but for now we at least stop the counter from exceeding visual limits.
    }
  }
}

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
        order.status = 'Pending'; // User requested: ALL orders start as Pending even if paid
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
    const order = await Order.findById(req.params.id).populate('user', 'firstName lastName email');

    if (order) {
      const oldStatus = order.status;
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

      // 📧 Send Email Notification if status changed
      if (oldStatus !== status) {
        const { getOrderStatusHtml } = require('../utils/emailTemplates'); // Lazy load

        setImmediate(async () => {
          try {
            const emailHtml = getOrderStatusHtml(updatedOrder, order.user);
            await sendEmail({
              email: order.user.email,
              subject: `Order Update #${order._id} - ${status}`,
              message: emailHtml
            });
            console.log(`✅ Order status email sent to ${order.user.email}`);
          } catch (e) {
            console.error('❌ Failed to send status email:', e.message);
          }
        });
      }

      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    console.error('Update Order Status Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 🟢 NEW: Secure Pay Endpoint (Admin OR Owner)
exports.updateOrderToPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      // 🔒 SECURE: Check if User is Owner OR Admin
      if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        return res.status(401).json({ message: 'Not authorized to update this order' });
      }

      // Handle Cash/COD Confirmation (Not Paid, but Method Update)
      if (req.body.paymentMethod === 'Cash' || req.body.paymentMethod === 'COD') {
        order.paymentMethod = 'COD';
        // Do NOT set isPaid = true for Cash
      } else {
        // Default: Mark as Paid (Card, Bakong)
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentResult = {
          id: req.body.id || 'manual',
          status: 'success',
          update_time: Date.now(),
          email_address: req.user.email,
        };
        // Update Method if provided (e.g. Card)
        if (req.body.paymentMethod) {
          order.paymentMethod = req.body.paymentMethod;
        }
      }

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    console.error('Update Order Paid Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};