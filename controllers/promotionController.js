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
    const { 
      code, type, value, startDate, endDate, usageLimit,
      campaignType, applicableProducts, minPurchase 
    } = req.body;
    
    // Check if code exists
    const exists = await Promotion.findOne({ code: code.toUpperCase() });
    if (exists) return res.status(400).json({ message: 'Code already exists' });

    // Validation: Check Dates & Values
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }
    if (value <= 0) {
      return res.status(400).json({ message: 'Discount value must be positive' });
    }

    const promotion = new Promotion({
      code,
      type,
      value,
      startDate,
      endDate,
      usageLimit,
      campaignType: campaignType || 'promo_code',
      applicableProducts: applicableProducts || [],
      minPurchase: minPurchase || 0
    });

    const created = await promotion.save();
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ message: 'Invalid Data', error: error.message });
  }
};

// @desc    Update promotion
// @route   PUT /api/promotions/:id
exports.updatePromotion = async (req, res) => {
  try {
    const promo = await Promotion.findById(req.params.id);
    if (!promo) {
      return res.status(404).json({ message: 'Promotion not found' });
    }
    
    const { 
      type, value, startDate, endDate, usageLimit, 
      campaignType, applicableProducts, minPurchase 
    } = req.body;
    
    // Validation: Check Dates on Update
    const start = startDate ? new Date(startDate) : new Date(promo.startDate);
    const end = endDate ? new Date(endDate) : new Date(promo.endDate);
    
    if (start >= end) {
       return res.status(400).json({ message: 'End date must be after start date' });
    }

    // Update fields (use existing if not provided)
    promo.type = type || promo.type;
    promo.value = value !== undefined ? value : promo.value;
    promo.startDate = startDate || promo.startDate;
    promo.endDate = endDate || promo.endDate;
    promo.usageLimit = usageLimit !== undefined ? usageLimit : promo.usageLimit;
    promo.campaignType = campaignType || promo.campaignType;
    promo.applicableProducts = applicableProducts || promo.applicableProducts;
    promo.minPurchase = minPurchase !== undefined ? minPurchase : promo.minPurchase;
    
    const updated = await promo.save();
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: 'Update failed', error: error.message });
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

// @desc    Get active product discounts (for displaying badges)
// @route   GET /api/promotions/product-discounts
exports.getProductDiscounts = async (req, res) => {
  try {
    const now = new Date();
    const discounts = await Promotion.find({
      campaignType: 'product_discount',
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).populate('applicableProducts', 'name');
    
    // Create a map of productId -> discount info
    const discountMap = {};
    discounts.forEach(promo => {
      promo.applicableProducts.forEach(product => {
        discountMap[product._id.toString()] = {
          type: promo.type,
          value: promo.value,
          code: promo.code
        };
      });
    });
    
    res.json(discountMap);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Validate a code from Cart
// @route   POST /api/promotions/validate
exports.validatePromotion = async (req, res) => {
  try {
    const { code, cartTotal } = req.body;
    
    const promo = await Promotion.findOne({ 
      code: code.toUpperCase(), 
      isActive: true,
      campaignType: 'promo_code'
    });

    if (!promo) {
      return res.status(404).json({ message: 'Invalid or expired code' });
    }

    // 1. Check Dates
    const now = new Date();
    // Validating dates
    if (now < new Date(promo.startDate) || now > new Date(promo.endDate)) { 
      return res.status(400).json({ message: 'This promotion is not active yet or has expired' });
    }

    // 2. Check Usage Limit
    if (promo.usageLimit > 0 && promo.usageCount >= promo.usageLimit) {
      return res.status(400).json({ message: 'Usage limit reached' });
    }

    // 3. Check Minimum Purchase
    if (promo.minPurchase > 0 && cartTotal < promo.minPurchase) {
      return res.status(400).json({ 
        message: `Minimum purchase of $${promo.minPurchase} required` 
      });
    }

    // 4. Calculate Discount
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

// @desc    Broadcast promotion to all users
// @route   POST /api/promotions/:id/broadcast
exports.broadcastPromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);
    if (!promotion) {
      return res.status(404).json({ message: 'Promotion not found' });
    }

    // Lazy load standard User model & email helpers
    const User = require('../models/User'); 
    const sendEmail = require('../utils/sendEmail');
    const { getPromotionHtml } = require('../utils/emailTemplates');

    // 1. Get all users with email
    const users = await User.find({ email: { $exists: true } }).select('email firstName');

    if (users.length === 0) {
      return res.status(400).json({ message: 'No users to email' });
    }

    // 2. Prepare Email Content
    const emailHtml = getPromotionHtml(promotion);
    const subject = `Special Offer: ${promotion.type === 'percent' ? `${promotion.value}% OFF` : `$${promotion.value} OFF`} at PetStore+! 🐾`;

    // 3. Send in Background (Basic Loop)
    // NOTE: In production, use a Message Queue (BullMQ, RabbitMQ)
    setImmediate(async () => {
        let successCount = 0;
        console.log(`Starting Broadcast for Promo: ${promotion.code} to ${users.length} users...`);
        
        for (const user of users) {
             try {
                await sendEmail({
                    email: user.email,
                    subject: subject,
                    message: emailHtml
                });
                successCount++;
             } catch (e) {
                console.error(`Failed to email ${user.email}:`, e.message);
             }
        }
        console.log(`Broadcast Complete. Sent to ${successCount}/${users.length} users.`);
    });

    res.json({ message: `Broadcast started for ${users.length} users.` });

  } catch (error) {
    console.error('Broadcast Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};