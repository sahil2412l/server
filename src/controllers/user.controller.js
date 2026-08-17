const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { AppError } = require('../middlewares/error.middleware');

/**
 * Generate JWT Token helper
 */
const signToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_123456789!@#$',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

/**
 * Register User
 * POST /api/v1/users/register
 */
exports.register = async (req, res, next) => {
  try {
    const { username, mobile, countryCode, password, email, location, avatarUrl } = req.body;

    // Check if user already exists with username, mobile, or email
    const queryConditions = [{ username }, { mobile }];
    if (email) queryConditions.push({ email });

    const existingUser = await User.findOne({
      $or: queryConditions,
    });

    if (existingUser) {
      let field = 'Username';
      if (existingUser.username === username) field = 'Username';
      else if (existingUser.mobile === mobile) field = 'Mobile number';
      else if (existingUser.email === email) field = 'Email address';
      return next(new AppError(`${field} is already registered.`, 400));
    }

    // Format location if provided
    let locationData = { type: 'Point', coordinates: [0, 0], address: '', state: '', pinCode: '' };
    if (location) {
      locationData = {
        type: 'Point',
        coordinates: [
          Number(location.longitude) || 0,
          Number(location.latitude) || 0,
        ],
        address: location.address || '',
        state: location.state || '',
        pinCode: location.pinCode || location.pincode || '',
      };
    }

    const newUser = await User.create({
      username,
      mobile,
      countryCode: countryCode || '91',
      password,
      email,
      location: locationData,
      avatarUrl,
    });

    const token = signToken(newUser._id);

    // Omit password from output
    newUser.password = undefined;

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: newUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login User (Supports dual login: by Username OR Mobile number)
 * POST /api/v1/users/login
 */
exports.login = async (req, res, next) => {
  try {
    const { username, mobile, identifier, password } = req.body;

    if (!password || (!username && !mobile && !identifier)) {
      return next(
        new AppError('Please provide a mobile number or username, and password.', 400)
      );
    }

    // Determine target lookup term
    const loginQuery = identifier || username || mobile;

    // Find user by either mobile OR username, including password field explicitly
    const user = await User.findOne({
      $or: [{ username: loginQuery }, { mobile: loginQuery }],
    }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Incorrect username/mobile or password.', 401));
    }

    if (user.isBlocked) {
      return next(new AppError('Your account is blocked. Please contact support.', 403));
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);
    user.password = undefined;

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout User
 * POST /api/v1/users/logout
 */
exports.logout = async (req, res, next) => {
  try {
    // Client should discard the JWT token
    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully. Please clear your authentication token.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get User Profile
 * GET /api/v1/users/profile
 */
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Location
 * PUT /api/v1/users/location
 */
exports.updateLocation = async (req, res, next) => {
  try {
    const { latitude, longitude, address, state, pinCode, pincode } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return next(new AppError('Please provide both latitude and longitude.', 400));
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        location: {
          type: 'Point',
          coordinates: [Number(longitude), Number(latitude)],
          address: address || req.user.location?.address || '',
          state: state || req.user.location?.state || '',
          pinCode: pinCode || pincode || req.user.location?.pinCode || '',
        },
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'Location updated successfully.',
      data: {
        location: updatedUser.location,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Coins and Rank
 * GET /api/v1/users/rank-coins
 */
exports.getRankAndCoins = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('username coins rank');
    res.status(200).json({
      status: 'success',
      data: {
        username: user.username,
        coins: user.coins,
        rank: user.rank,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add / Earn Coins (Internal or Reward feature)
 * POST /api/v1/users/coins/add
 */
exports.addCoins = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const coinsToAdd = parseInt(amount, 10);

    if (isNaN(coinsToAdd) || coinsToAdd <= 0) {
      return next(new AppError('Please provide a valid positive coin amount.', 400));
    }

    const user = await User.findById(req.user._id);
    user.coins += coinsToAdd;
    await user.save(); // Will trigger pre-save rank calculation!

    res.status(200).json({
      status: 'success',
      message: `Added ${coinsToAdd} coins to user account.`,
      data: {
        coins: user.coins,
        rank: user.rank,
      },
    });
  } catch (error) {
    next(error);
  }
};
