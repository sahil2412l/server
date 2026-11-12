import crypto from 'crypto';
import { gatewayConfig } from '../../config/gateway.config.js';

const SIGNATURE_MAX_DRIFT_MS = 5 * 60 * 1000; // 5 minutes max timestamp drift

/**
 * Internal Service Guard
 * Verifies that the incoming request passed through the API Gateway
 * and was not called directly by an unauthorized external party.
 */
export const requireGatewaySignature = (req, res, next) => {
  const signature = req.headers['x-gateway-signature'];
  const timestamp = Number(req.headers['x-gateway-timestamp']);
  const userId = req.headers['x-user-id'];
  const role = req.headers['x-user-role'] || 'user';
  const tenantId = req.headers['x-tenant-id'] || 'tenant-default';

  if (!signature || !timestamp || !userId) {
    return res.status(403).json({
      success: false,
      error: 'Direct internal service access forbidden: Missing Gateway Signature.',
      correlationId: req.correlationId,
    });
  }

  // Check timestamp drift to prevent replay attacks
  if (Math.abs(Date.now() - timestamp) > SIGNATURE_MAX_DRIFT_MS) {
    return res.status(403).json({
      success: false,
      error: 'Gateway signature timestamp expired or skewed beyond allowable tolerance.',
      correlationId: req.correlationId,
    });
  }

  // Recalculate signature
  const payload = `${userId}:${role}:${tenantId}:${timestamp}`;
  const expectedSignature = crypto
    .createHmac('sha256', gatewayConfig.gatewaySecret)
    .update(payload)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(403).json({
      success: false,
      error: 'Invalid Gateway Signature: Request did not originate from trusted API Gateway.',
      correlationId: req.correlationId,
    });
  }

  // Populate req.user from trusted headers without requiring additional database lookups
  req.user = req.user || {
    _id: req.headers['x-user-uuid'],
    id: req.headers['x-user-uuid'],
    userId,
    role,
    email: req.headers['x-user-email'] || '',
    tenantId,
  };

  next();
};

