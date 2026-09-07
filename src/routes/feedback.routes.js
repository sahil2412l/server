import express from 'express';
import {
  createComment,
  createReview,
  submitPerformance,
  getFeed,
} from '../controllers/feedback.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Real-time Commenting
router.post('/comment', protect, createComment);

// Real-time Reviews & Ratings
router.post('/review', protect, createReview);

// Real-time Live Performance Score
router.post('/performance', protect, submitPerformance);

// Public Feed (comments, reviews, performance)
router.get('/', getFeed);

export default router;
