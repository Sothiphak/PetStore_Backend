const Promotion = require('../models/Promotion');

// @desc    Get all promotions (Admin)
// @route   GET /api/promotions
exports.getPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find({}).sort({ createdAt: -1 });
    res.json(promotions);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a promotion
// @route   POST /api/promotions
exports.createPromotion = async (req, res) => {
  try {
    const { name, code, type, value, startDate, endDate, usageLimit } = req.body;
    
    // Check if code exists
    const exists = await Promotion.findOne({ code: code.toUpperCase() });
    if (exists) return res.status(400).json({ message: 'Code already exists' });

    const promotion = new Promotion({
      code,
      type,
      value,
      startDate,
      endDate,
      usageLimit
    });

    const created = await promotion.save();
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ message: 'Invalid Data', error: error.message });
  }
};

// @desc    Delete promotion
// @route   DELETE /api/promotions/:id
exports.deletePromotion = async (req, res) => {
  try {
    const promo = await Promotion.findById(req.params.id);
    if(promo) {
      await promo.deleteOne();
      res.json({ message: 'Promotion removed' });
    } else {
      res.status(404).json({ message: 'Not Found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// 👇 THIS IS THE KEY FUNCTION FOR CUSTOMERS 👇
// @desc    Validate a code from Cart
// @route   POST /api/promotions/validate
exports.validatePromotion = async (req, res) => {
  try {
    const { code, cartTotal } = req.body;
    
    const promo = await Promotion.findOne({ 
      code: code.toUpperCase(), 
      isActive: true 
    });

    if (!promo) {
      return res.status(404).json({ message: 'Invalid or expired code' });
    }

    // 1. Check Dates
    const now = new Date();
    if (now < new Date(promo.startDate) || now > new Date(promo.endDate)) {
      return res.status(400).json({ message: 'This promotion is not active yet or has expired' });
    }

    // 2. Check Usage Limit
    if (promo.usageLimit > 0 && promo.usageCount >= promo.usageLimit) {
      return res.status(400).json({ message: 'Usage limit reached' });
    }

    // 3. Calculate Discount
    let discountAmount = 0;
    if (promo.type === 'percent') {
      discountAmount = (cartTotal * promo.value) / 100;
    } else if (promo.type === 'fixed') {
      discountAmount = promo.value;
    }
    
    // Prevent negative total
    if (discountAmount > cartTotal) discountAmount = cartTotal;

    res.json({
      success: true,
      code: promo.code,
      type: promo.type,
      value: promo.value,
      discountAmount,
      message: 'Coupon Applied!'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Validation failed' });
  }
};