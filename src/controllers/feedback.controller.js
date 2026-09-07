import { Feedback } from '../models/Feedback.js';
import {
  broadcastNewComment,
  broadcastNewReview,
  broadcastPerformanceUpdate,
} from '../sockets/socketHandler.js';

// @desc    Post a real-time Comment
// @route   POST /api/feedback/comment
// @access  Protected
export const createComment = async (req, res, next) => {
  try {
    const { content, targetItem } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Comment content cannot be empty',
      });
    }

    const comment = new Feedback({
      author: req.user._id,
      userId: req.user.userId,
      authorName: req.user.name || req.user.userId,
      authorAvatar: req.user.avatar || '👤',
      type: 'comment',
      content: content.trim(),
      targetItem: targetItem || 'General',
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

    if (!content || !rating) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both review content and a rating (1-5)',
      });
    }

    const review = new Feedback({
      author: req.user._id,
      userId: req.user.userId,
      authorName: req.user.name || req.user.userId,
      authorAvatar: req.user.avatar || '👤',
      type: 'review',
      content: content.trim(),
      rating: Number(rating),
      targetItem: targetItem || 'Course / Platform',
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

    const performance = new Feedback({
      author: req.user._id,
      userId: req.user.userId,
      authorName: req.user.name || req.user.userId,
      authorAvatar: req.user.avatar || '👤',
      type: 'performance',
      content: `Performance update by ${req.user.userId}: Score ${score || 0}`,
      targetItem: targetItem || 'General Test',
      performanceMetrics: {
        score: score || 0,
        accuracy: accuracy || 0,
        speed: speed || 'Normal',
        tasksCompleted: tasksCompleted || 0,
        details: details || {},
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

    const total = await Feedback.countDocuments(filter);
    const feed = await Feedback.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      count: feed.length,
      page: Number(page),
      data: feed,
    });
  } catch (error) {
    next(error);
  }
};
