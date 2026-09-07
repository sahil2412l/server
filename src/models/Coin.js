import mongoose from 'mongoose';

const coinSchema = new mongoose.Schema(
  {
    coinId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    taskId: {
      type: String,
      required: [true, 'Task ID or reason is required'],
      trim: true,
    },
    taskName: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      default: 1,
      min: 1,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    // No expiration limit as requested
    expiresAt: {
      type: Date,
      default: null, // null means never expires
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export const Coin = mongoose.model('Coin', coinSchema);
