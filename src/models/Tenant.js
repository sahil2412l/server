import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: [true, 'Tenant ID is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Tenant Name is required'],
      trim: true,
    },
    tier: {
      type: String,
      enum: ['free', 'standard', 'premium', 'enterprise'],
      default: 'standard',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    customRateLimit: {
      maxRequests: { type: Number, default: null },
      windowMs: { type: Number, default: null },
    },
    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export const Tenant = mongoose.model('Tenant', tenantSchema);

