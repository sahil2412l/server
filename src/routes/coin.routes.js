import express from 'express';
import {
  earnCoinsForTask,
  getMyCoins,
  verifyCoin,
  verifyAndUseCoin,
  getCoinHistory,
} from '../controllers/coin.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Earn coins upon task completion
router.post('/earn', protect, earnCoinsForTask);

// Fetch all active/available coins with unique IDs
router.get('/my-coins', protect, getMyCoins);

// Verify validity of a specific coin ID
router.get('/verify/:coinId', protect, verifyCoin);

// Verify, consume and remove coin from active DB
router.post('/verify-and-use', protect, verifyAndUseCoin);

// Audit history of consumed coins
router.get('/history', protect, getCoinHistory);

export default router;
