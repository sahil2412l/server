const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Discount code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    discountPercentage: {
      type: Number,
      required: true,
      min: [1, 'Discount percentage must be at least 1%'],
      max: [100, 'Discount percentage cannot exceed 100%'],
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
    },
    minPurchaseAmount: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
    },
    usageLimit: {
      type: Number,
      default: 100,
    },
    timesUsed: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Method to check if discount code is valid
discountSchema.methods.isValid = function (purchaseAmount = 0) {
  if (!this.isActive) return { valid: false, message: 'Discount code is inactive' };
  if (new Date() > this.expiresAt) return { valid: false, message: 'Discount code has expired' };
  if (this.timesUsed >= this.usageLimit) return { valid: false, message: 'Discount code limit reached' };
  if (purchaseAmount < this.minPurchaseAmount) {
    return { valid: false, message: `Minimum purchase amount of ${this.minPurchaseAmount} required` };
  }
  return { valid: true };
};

const Discount = mongoose.model('Discount', discountSchema);
module.exports = Discount;
