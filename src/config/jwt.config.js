import jwt from 'jsonwebtoken';

export const jwtConfig = {
  accessSecret: process.env.JWT_ACCESS_SECRET || 'default_access_secret_key_2026',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_key_2026',
  accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
};

// Generate Short-lived Access Token
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      userId: user.userId,
      email: user.email,
      role: user.role || 'user',
    },
    jwtConfig.accessSecret,
    { expiresIn: jwtConfig.accessExpiry }
  );
};

// Generate Long-lived Refresh Token
export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      userId: user.userId,
    },
    jwtConfig.refreshSecret,
    { expiresIn: jwtConfig.refreshExpiry }
  );
};

// Verify Access Token
export const verifyAccessToken = (token) => {
  return jwt.verify(token, jwtConfig.accessSecret);
};

// Verify Refresh Token
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, jwtConfig.refreshSecret);
};
