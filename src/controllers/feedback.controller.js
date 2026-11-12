import { Feedback } from '../models/Feedback.js';
import {
  broadcastNewComment,
  broadcastNewReview,
  broadcastPerformanceUpdate,
} from '../sockets/socketHandler.js';
import { sanitizeHtml, sanitizeString } from '../utils/sanitizer.js';

// @desc    Post a real-time Comment
// @route   POST /api/feedback/comment
// @access  Protected
export const createComment = async (req, res, next) => {
  try {
    const { content, targetItem } = req.body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Comment content cannot be empty and must be a string',
      });
    }

    // XSS Sanitization & length capping (max 1000 chars)
    const sanitizedContent = sanitizeHtml(sanitizeString(content, 1000));
    const sanitizedTarget = sanitizeHtml(sanitizeString(targetItem || 'General', 150));

    const comment = new Feedback({
      author: req.user._id,
      userId: req.user.userId,
      authorName: req.user.name || req.user.userId,
      authorAvatar: req.user.avatar || '👤',
      type: 'comment',
      content: sanitizedContent,
      targetItem: sanitizedTarget,
      tenantId: req.tenant?.id || req.user?.tenantId || 'tenant-default',
    });

    await comment.save();

    // Instant Real-Time Broadcast to all connected users
    broadcastNewComment(comment);

    res.status(201).json({
      success: true,
      message: 'Comment posted and broadcasted in real-time!',
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit a real-time Review & Rating
// @route   POST /api/feedback/review
// @access  Protected
export const createReview = async (req, res, next) => {
  try {
    const { content, rating, targetItem } = req.body;

    if (!content || typeof content !== 'string' || rating === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both review content and a rating (1-5)',
      });
    }

    const numRating = Number(rating);
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be an integer between 1 and 5',
      });
    }

    // XSS Sanitization
    const sanitizedContent = sanitizeHtml(sanitizeString(content, 2000));
    const sanitizedTarget = sanitizeHtml(sanitizeString(targetItem || 'Course / Platform', 150));

    const review = new Feedback({
      author: req.user._id,
      userId: req.user.userId,
      authorName: req.user.name || req.user.userId,
      authorAvatar: req.user.avatar || '👤',
      type: 'review',
      content: sanitizedContent,
      rating: numRating,
      targetItem: sanitizedTarget,
      tenantId: req.tenant?.id || req.user?.tenantId || 'tenant-default',
    });

    await review.save();

    // Instant Real-Time Broadcast to all connected users
    broadcastNewReview(review);

    res.status(201).json({
      success: true,
      message: 'Review submitted and broadcasted in real-time!',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit & Broadcast Live Performance / Score
// @route   POST /api/feedback/performance
// @access  Protected
export const submitPerformance = async (req, res, next) => {
  try {
    const { score, accuracy, speed, tasksCompleted, details, targetItem } = req.body;

    // Validate and bound metrics
    const safeScore = Math.min(Math.max(Number(score) || 0, 0), 1000);
    const safeAccuracy = Math.min(Math.max(Number(accuracy) || 0, 0), 100);
    const safeTasks = Math.max(parseInt(tasksCompleted, 10) || 0, 0);
    const safeSpeed = sanitizeString(speed || 'Normal', 50);
    const sanitizedTarget = sanitizeHtml(sanitizeString(targetItem || 'General Test', 150));

    const performance = new Feedback({
      author: req.user._id,
      userId: req.user.userId,
      authorName: req.user.name || req.user.userId,
      authorAvatar: req.user.avatar || '👤',
      type: 'performance',
      content: `Performance update by ${req.user.userId}: Score ${safeScore}`,
      targetItem: sanitizedTarget,
      tenantId: req.tenant?.id || req.user?.tenantId || 'tenant-default',
      performanceMetrics: {
        score: safeScore,
        accuracy: safeAccuracy,
        speed: safeSpeed,
        tasksCompleted: safeTasks,
        details: typeof details === 'object' && details !== null ? details : {},
      },
    });

    await performance.save();

    // Instant Real-Time Broadcast to all connected users
    broadcastPerformanceUpdate(performance);

    res.status(201).json({
      success: true,
      message: 'Performance recorded and broadcasted in real-time!',
      data: performance,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Feed / Past comments, reviews, performance
// @route   GET /api/feedback
// @access  Public
export const getFeed = async (req, res, next) => {
  try {
    const { type, limit = 50, page = 1 } = req.query;
    const filter = {};

    if (type && ['comment', 'review', 'performance'].includes(type)) {
      filter.type = type;
    }

    // Bound pagination parameters to prevent DoS memory exhaustion
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);

    const total = await Feedback.countDocuments(filter);
    const feed = await Feedback.find(filter)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit);

    res.status(200).json({
      success: true,
      total,
      count: feed.length,
      page: safePage,
      data: feed,
    });
  } catch (error) {
    next(error);
  }
};
