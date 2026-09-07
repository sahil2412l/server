import mongoose from 'mongoose';

const coinLogSchema = new mongoose.Schema(
  {
    coinId: {
      type: String,
      required: true,
      index: true,
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
      required: true,
    },
    taskName: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      default: 1,
    },
    issuedAt: {
      type: Date,
    },
    redeemedAt: {
      type: Date,
      default: Date.now,
    },
    redeemedPurpose: {
      type: String,
      default: 'General Redemption',
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

export const CoinLog = mongoose.model('CoinLog', coinLogSchema);
