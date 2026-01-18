const express = require('express');
const router = express.Router();
const Stripe = require('stripe');

// 🟢 MAKE SURE YOUR SECRET KEY IS HERE
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Stripe Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 👇 THIS LINE IS CRITICAL. IF MISSING, SERVER CRASHES.
module.exports = router;