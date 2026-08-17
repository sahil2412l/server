const Discount = require('../models/discount.model');
const { AppError } = require('../middlewares/error.middleware');

/**
 * Create a new Discount Code (Admin only)
 * POST /api/v1/discounts/create
 */
exports.createDiscount = async (req, res, next) => {
  try {
    const { code, discountPercentage, maxDiscountAmount, minPurchaseAmount, expiresAt, usageLimit } = req.body;

    if (!code || !discountPercentage || !expiresAt) {
      return next(new AppError('Code, discountPercentage, and expiresAt are required.', 400));
    }

    const discount = await Discount.create({
      code: code.toUpperCase(),
      discountPercentage,
      maxDiscountAmount,
      minPurchaseAmount,
      expiresAt,
      usageLimit,
    });

    res.status(201).json({
      status: 'success',
      data: {
        discount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Validate Discount Code
 * POST /api/v1/discounts/validate
 */
exports.validateDiscount = async (req, res, next) => {
  try {
    const { code, purchaseAmount } = req.body;

    if (!code) {
      return next(new AppError('Please provide a discount code to validate.', 400));
    }

    const discount = await Discount.findOne({ code: code.toUpperCase() });
    if (!discount) {
      return next(new AppError('Discount code not found.', 404));
    }

    const validation = discount.isValid(Number(purchaseAmount) || 0);

    if (!validation.valid) {
      return res.status(400).json({
        status: 'fail',
        valid: false,
        message: validation.message,
      });
    }

    // Calculate sample discount
    let discountAmount = ((Number(purchaseAmount) || 0) * discount.discountPercentage) / 100;
    if (discount.maxDiscountAmount && discountAmount > discount.maxDiscountAmount) {
      discountAmount = discount.maxDiscountAmount;
    }

    res.status(200).json({
      status: 'success',
      valid: true,
      data: {
        code: discount.code,
        discountPercentage: discount.discountPercentage,
        estimatedDiscount: discountAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};
