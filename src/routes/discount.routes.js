const express = require('express');
const discountController = require('../controllers/discount.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

// Validate discount code (Available to all logged-in users)
router.post('/validate', discountController.validateDiscount);

// Create discount code (Restricted to Admin role)
router.post('/create', restrictTo('admin'), discountController.createDiscount);

module.exports = router;
