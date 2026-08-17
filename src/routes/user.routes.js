const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

/**
 * Validation rules for Registration
 */
const registerValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters'),
  body('mobile')
    .trim()
    .notEmpty()
    .withMessage('Mobile number is required')
    .isMobilePhone()
    .withMessage('Please provide a valid mobile number'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

/**
 * Validation rules for Login
 */
const loginValidation = [
  body('password').notEmpty().withMessage('Password is required'),
  body().custom((body) => {
    if (!body.username && !body.mobile && !body.identifier) {
      throw new Error('Please provide either username, mobile number, or identifier');
    }
    return true;
  }),
];

// Public Auth Routes (Protected by Auth Rate Limiter)
router.post('/register', authLimiter, registerValidation, userController.register);
router.post('/login', authLimiter, loginValidation, userController.login);
router.post('/logout', protect, userController.logout);

// Protected User Routes
router.get('/profile', protect, userController.getProfile);
router.put('/location', protect, userController.updateLocation);
router.get('/rank-coins', protect, userController.getRankAndCoins);
router.post('/coins/add', protect, userController.addCoins);

module.exports = router;
