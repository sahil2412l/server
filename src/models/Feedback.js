import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    authorName: {
      type: String,
      default: 'Anonymous',
    },
    authorAvatar: {
      type: String,
      default: '👤',
    },
    type: {
      type: String,
      enum: ['comment', 'review', 'performance'],
      default: 'comment',
      required: true,
    },
    content: {
      type: String,
      required: function () {
        return this.type === 'comment' || this.type === 'review';
      },
      trim: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    targetItem: {
      type: String,
      default: 'General',
      trim: true,
    },
    performanceMetrics: {
      score: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 },
      speed: { type: String, default: 'Normal' },
      tasksCompleted: { type: Number, default: 0 },
      details: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast querying
feedbackSchema.index({ type: 1, createdAt: -1 });
feedbackSchema.index({ userId: 1 });

export const Feedback = mongoose.model('Feedback', feedbackSchema);
