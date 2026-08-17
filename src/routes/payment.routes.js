const express = require('express');
const paymentController = require('../controllers/payment.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.post('/purchase-coins', paymentController.purchaseCoins);
router.get('/history', paymentController.getPaymentHistory);

module.exports = router;
