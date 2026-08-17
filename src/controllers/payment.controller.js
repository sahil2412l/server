const Payment = require('../models/payment.model');
const User = require('../models/user.model');
const Discount = require('../models/discount.model');
const { AppError } = require('../middlewares/error.middleware');

/**
 * Process Payment & Purchase Coins
 * POST /api/v1/payments/purchase-coins
 */
exports.purchaseCoins = async (req, res, next) => {
  try {
    const { amount, coinsToBuy, discountCode, paymentMethod } = req.body;

    if (!amount || !coinsToBuy) {
      return next(new AppError('Payment amount and coinsToBuy are required.', 400));
    }

    let finalAmount = Number(amount);
    let discountAmount = 0;
    let appliedDiscount = null;

    // Apply Discount Code if provided
    if (discountCode) {
      appliedDiscount = await Discount.findOne({ code: discountCode.toUpperCase() });
      if (!appliedDiscount) {
        return next(new AppError('Invalid discount code.', 404));
      }

      const validation = appliedDiscount.isValid(finalAmount);
      if (!validation.valid) {
        return next(new AppError(validation.message, 400));
      }

      // Calculate discount amount
      discountAmount = (finalAmount * appliedDiscount.discountPercentage) / 100;
      if (appliedDiscount.maxDiscountAmount && discountAmount > appliedDiscount.maxDiscountAmount) {
        discountAmount = appliedDiscount.maxDiscountAmount;
      }

      finalAmount = Math.max(0, finalAmount - discountAmount);
    }

    // Generate unique transaction reference ID
    const transactionId = 'TXN-' + Date.now() + '-' + Math.floor(Math.random() * 10000);

    // Create payment transaction record
    const payment = await Payment.create({
      user: req.user._id,
      transactionId,
      amount: finalAmount,
      coinsCredited: Number(coinsToBuy),
      discountCode: discountCode ? discountCode.toUpperCase() : null,
      discountAmount,
      paymentMethod: paymentMethod || 'mock',
      status: 'completed', // Mock payment auto-completes
    });

    // Credit coins to user account
    const user = await User.findById(req.user._id);
    user.coins += Number(coinsToBuy);
    await user.save(); // Automatically updates user Rank if milestone reached!

    // Increment discount code usage count
    if (appliedDiscount) {
      appliedDiscount.timesUsed += 1;
      await appliedDiscount.save();
    }

    res.status(201).json({
      status: 'success',
      message: 'Payment completed successfully. Coins credited!',
      data: {
        payment,
        newCoinBalance: user.coins,
        currentRank: user.rank,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get User Payment History
 * GET /api/v1/payments/history
 */
exports.getPaymentHistory = async (req, res, next) => {
  try {
    const history = await Payment.find({ user: req.user._id }).sort('-createdAt');
    res.status(200).json({
      status: 'success',
      results: history.length,
      data: {
        payments: history,
      },
    });
  } catch (error) {
    next(error);
  }
};
