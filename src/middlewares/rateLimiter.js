import rateLimit from 'express-rate-limit';

// Strict rate limit for registration and login
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per 15 minutes
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for refresh token endpoint to prevent token rotation abuse
export const refreshTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: {
    success: false,
    error: 'Too many token refresh requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for coin verification to prevent brute-forcing coin IDs
export const coinVerifyLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 attempts per minute
  message: {
    success: false,
    error: 'Too many coin verification requests. Throttled to prevent abuse.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API Rate Limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    error: 'Too many API requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
