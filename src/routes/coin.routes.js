import express from 'express';
import {
  earnCoinsForTask,
  getMyCoins,
  verifyCoin,
  verifyAndUseCoin,
  getCoinHistory,
} from '../controllers/coin.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { coinVerifyLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

// Earn coins upon task completion
router.post('/earn', protect, earnCoinsForTask);

// Fetch all active/available coins with unique IDs
router.get('/my-coins', protect, getMyCoins);

// Verify validity of a specific coin ID (protected by rate limiter)
router.get('/verify/:coinId', protect, coinVerifyLimiter, verifyCoin);

// Verify, consume and remove coin from active DB (protected by rate limiter)
router.post('/verify-and-use', protect, coinVerifyLimiter, verifyAndUseCoin);

// Audit history of consumed coins
router.get('/history', protect, getCoinHistory);

export default router;
