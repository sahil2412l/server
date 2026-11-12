import { verifyAccessToken } from '../config/jwt.config.js';
import { User } from '../models/User.js';

export const protect = async (req, res, next) => {
  // 1. Gateway Security Offloading Fast-Path:
  // If request has already been authenticated at the Gateway boundary
  if (req.user && req.user._id) {
    return next();
  }

  let token = null;

  // 2. Check Authorization Header (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    // 3. Or check cookies if present
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized! No authentication token provided.',
      correlationId: req.correlationId,
    });
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id).select('-refreshToken');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User belonging to this token no longer exists.',
        correlationId: req.correlationId,
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Your account has been deactivated.',
        correlationId: req.correlationId,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Access Token has expired. Please refresh your token.',
        isExpired: true,
        correlationId: req.correlationId,
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid token authentication failed.',
      correlationId: req.correlationId,
    });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'Access denied: Administrator privileges required.',
      correlationId: req.correlationId,
    });
  }
};
