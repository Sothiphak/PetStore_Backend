const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const Product = require('../models/Product'); // 👈 Import Product Model
const { protect } = require('../middleware/authMiddleware'); // 👈 Import Auth Middleware

// Initialize Stripe
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// @desc    Create Stripe Payment Intent
// @route   POST /api/payment/create-payment-intent
// @access  Private
router.post('/create-payment-intent', protect, async (req, res) => {
  try {
    const { items } = req.body; // Expecting: [{ _id: '...', qty: 2 }]

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "No items in cart" });
    }

    // Calculate Total Price on Server
    let subtotal = 0;

    for (const item of items) {
      // Fetch product from DB to get the REAL price
      const product = await Product.findById(item._id);

      if (product) {
        subtotal += product.price * item.qty;
      } else {
        console.warn(`Product not found during payment: ${item._id}`);
      }
    }

    const SHIPPING_COST = 5.00;
    const TAX_RATE = 0.08;

    // Calculate final total including Tax and Shipping
    const taxAmount = subtotal * TAX_RATE;
    const totalAmount = subtotal + taxAmount + SHIPPING_COST;

    // Stripe expects amount in cents (integer)
    const finalAmount = Math.round(totalAmount * 100);

    // Prevent zero-dollar transactions
    if (finalAmount < 50) { // Stripe minimum is usually ~50 cents
      console.error(`Transaction amount too low: ${finalAmount} cents`);
      return res.status(400).json({ error: `Transaction amount too low (Min $0.50). Total: $${totalAmount.toFixed(2)}` });
    }

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmount,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: req.user._id.toString(),
        email: req.user.email,
        cartItems: JSON.stringify(items.map(i => ({ id: i._id, qty: i.qty })))
      }
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
      calculatedTotal: totalAmount // Optional: send back verified total to frontend
    });

  } catch (error) {
    console.error("Stripe Error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;