import { User } from '../models/User.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../config/jwt.config.js';

// Cookie options for security (Cross-domain friendly for production)
const isProduction = process.env.NODE_ENV === 'production';
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { userId, email, phoneNumber, password, name, avatar } = req.body;

    // 1. Validation
    if (!userId || !email || !phoneNumber || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide userId, email, phoneNumber, and password',
      });
    }

    // 2. Check for duplicate userId or email
    const existingUserId = await User.findOne({ userId: userId.toLowerCase().trim() });
    if (existingUserId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is already taken. Please choose another.',
      });
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        error: 'Email is already registered. Please login instead.',
      });
    }

    // 3. Create User
    const user = new User({
      userId: userId.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      phoneNumber: phoneNumber.trim(),
      password,
      name: name || userId,
      avatar: avatar || '🎓',
    });

    // 4. Generate Tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    // 5. Send Cookies & Response
    res.cookie('refreshToken', refreshToken, cookieOptions);
    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully!',
      tokens: {
        accessToken,
        refreshToken,
      },
      user: {
        id: user._id,
        userId: user.userId,
        email: user.email,
        phoneNumber: user.phoneNumber,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & login
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { identifier, email, userId, password } = req.body;

    const loginId = identifier || email || userId;
    if (!loginId || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email or userId, and password',
      });
    }

    // Find by either email or userId
    const user = await User.findOne({
      $or: [
        { email: loginId.toLowerCase().trim() },
        { userId: loginId.toLowerCase().trim() },
      ],
    }).select('+password +refreshToken');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. User not found.',
      });
    }

    // Verify Password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password. Authentication failed.',
      });
    }

    // Generate fresh tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token in database
    user.refreshToken = refreshToken;
    await user.save();

    // Set Cookies
    res.cookie('refreshToken', refreshToken, cookieOptions);
    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      tokens: {
        accessToken,
        refreshToken,
      },
      user: {
        id: user._id,
        userId: user.userId,
        email: user.email,
        phoneNumber: user.phoneNumber,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh Access Token using Refresh Token
// @route   POST /api/auth/refresh-token
// @access  Public (needs valid refresh token)
export const refreshToken = async (req, res, next) => {
  try {
    const incomingRefreshToken =
      req.body.refreshToken || req.cookies?.refreshToken;

    if (!incomingRefreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh Token is required',
      });
    }

    // 1. Verify token validity & expiration
    let decoded;
    try {
      decoded = verifyRefreshToken(incomingRefreshToken);
    } catch (err) {
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired refresh token. Please login again.',
      });
    }

    // 2. Find user and check if token matches DB record
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== incomingRefreshToken) {
      return res.status(403).json({
        success: false,
        error: 'Refresh token revoked or invalid. Please login again.',
      });
    }

    // 3. Issue new tokens (Token Rotation for maximum safety)
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.cookie('refreshToken', newRefreshToken, cookieOptions);
    res.cookie('accessToken', newAccessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'Tokens refreshed successfully',
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user & invalidate refresh token
// @route   POST /api/auth/logout
// @access  Protected (or with refresh token)
export const logout = async (req, res, next) => {
  try {
    const incomingRefreshToken =
      req.body.refreshToken || req.cookies?.refreshToken;

    if (req.user) {
      // Clear token from DB
      await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    } else if (incomingRefreshToken) {
      try {
        const decoded = verifyRefreshToken(incomingRefreshToken);
        await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
      } catch (e) {
        // Continue clearing cookies regardless
      }
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Logged out successfully. Tokens invalidated.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Protected
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        userId: user.userId,
        email: user.email,
        phoneNumber: user.phoneNumber,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};
