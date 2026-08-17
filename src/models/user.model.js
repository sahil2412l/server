const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      index: true,
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    countryCode: {
      type: String,
      required: [true, 'Country code is required'],
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    coins: {
      type: Number,
      default: 0,
      min: [0, 'Coins cannot be negative'],
    },
    rank: {
      type: String,
      enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
      default: 'Bronze',
    },
    location: {
      address: {
        type: String,
        default: '',
      },
      state: {
        type: String,
        default: '',
      },
      pinCode: {
        type: String,
        default: '',
      },
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);


// Static helper to calculate rank from coin balance
userSchema.statics.getRankFromCoins = function (coins) {
  if (coins >= 5000) return 'Diamond';
  if (coins >= 2000) return 'Platinum';
  if (coins >= 500) return 'Gold';
  if (coins >= 100) return 'Silver';
  return 'Bronze';
};

// Pre-save middleware for password hashing and auto rank calculation
userSchema.pre('save', async function (next) {
  // Update rank based on coins if coins field is modified
  if (this.isModified('coins')) {
    this.rank = mongoose.model('User').getRankFromCoins(this.coins);
  }

  // Only hash password if it has been modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check entered password against stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
