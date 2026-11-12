import crypto from 'crypto';
import { verifyAccessToken } from '../../config/jwt.config.js';
import { gatewayConfig } from '../../config/gateway.config.js';

/**
 * Generates cryptographic HMAC signature verifying that identity was verified by the Gateway
 */
export const signGatewayHeaders = ({ userId, role, tenantId, timestamp }) => {
  const payload = `${userId}:${role}:${tenantId}:${timestamp}`;
  return crypto
    .createHmac('sha256', gatewayConfig.gatewaySecret)
    .update(payload)
    .digest('hex');
};

/**
 * Gateway Authentication Middleware (Security Offloading)
 * Centralizes JWT token verification at the gateway boundary.
 * Injects verified identity and tenancy headers into the downstream request.
 */
export const gatewayAuthenticate = (req, res, next) => {
  let token = null;

  // 1. Check Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    // 2. Check cookies
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Gateway Unauthorized: Authentication token required at gateway boundary.',
      correlationId: req.correlationId,
    });
  }

  try {
    // Cryptographically verify access token at the gateway perimeter
    const decoded = verifyAccessToken(token);

    const timestamp = Date.now();
    const tenantId = req.tenant?.id || 'tenant-default';
    const tenantTier = req.tenant?.tier || 'standard';

    // Generate cryptographic gateway signature for zero-trust internal security
    const gatewaySignature = signGatewayHeaders({
      userId: decoded.userId,
      role: decoded.role || 'user',
      tenantId,
      timestamp,
    });

    // Injected standardized headers for downstream services
    req.headers['x-user-id'] = decoded.userId;
    req.headers['x-user-uuid'] = decoded.id;
    req.headers['x-user-role'] = decoded.role || 'user';
    req.headers['x-user-email'] = decoded.email || '';
    req.headers['x-tenant-id'] = tenantId;
    req.headers['x-tenant-tier'] = tenantTier;
    req.headers['x-gateway-signature'] = gatewaySignature;
    req.headers['x-gateway-timestamp'] = String(timestamp);

    // Attach enriched user context directly to request
    req.user = {
      _id: decoded.id,
      id: decoded.id,
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role || 'user',
      tenantId,
    };

    req.gatewayAuth = {
      isAuthenticated: true,
      verifiedBy: gatewayConfig.gatewayName,
      verifiedAt: timestamp,
      tokenClaims: decoded,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Gateway Unauthorized: Access token has expired. Please refresh your token.',
        isExpired: true,
        correlationId: req.correlationId,
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Gateway Unauthorized: Invalid or malformed access token.',
      correlationId: req.correlationId,
    });
  }
};

/**
 * Optional Gateway Authentication Middleware
 * Validates token if present; continues without error if absent.
 */
export const optionalGatewayAuthenticate = (req, res, next) => {
  let token = null;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = verifyAccessToken(token);
    const timestamp = Date.now();
    const tenantId = req.tenant?.id || 'tenant-default';
    const tenantTier = req.tenant?.tier || 'standard';

    const gatewaySignature = signGatewayHeaders({
      userId: decoded.userId,
      role: decoded.role || 'user',
      tenantId,
      timestamp,
    });

    req.headers['x-user-id'] = decoded.userId;
    req.headers['x-user-uuid'] = decoded.id;
    req.headers['x-user-role'] = decoded.role || 'user';
    req.headers['x-user-email'] = decoded.email || '';
    req.headers['x-tenant-id'] = tenantId;
    req.headers['x-tenant-tier'] = tenantTier;
    req.headers['x-gateway-signature'] = gatewaySignature;
    req.headers['x-gateway-timestamp'] = String(timestamp);

    req.user = {
      _id: decoded.id,
      id: decoded.id,
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role || 'user',
      tenantId,
    };

    req.gatewayAuth = {
      isAuthenticated: true,
      verifiedBy: gatewayConfig.gatewayName,
      verifiedAt: timestamp,
      tokenClaims: decoded,
    };
  } catch (err) {
    // If token is invalid or expired, continue as unauthenticated
  }

  next();
};

/**
 * Gateway Role Guard
 */
export const requireGatewayRole = (allowedRoles = ['admin']) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Gateway Forbidden: Role '${req.user?.role || 'anonymous'}' is not authorized. Required: ${allowedRoles.join(', ')}`,
        correlationId: req.correlationId,
      });
    }
    next();
  };
};

