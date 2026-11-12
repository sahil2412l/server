import express from 'express';
import { gatewayController } from '../controllers/gateway.controller.js';
import { optionalGatewayAuthenticate } from '../middlewares/gatewayAuth.js';
import { gatewayConfig } from '../../config/gateway.config.js';

const router = express.Router();

/**
 * Admin or Internal Control Guard
 * Ensures only authorized administrators or trusted internal automation can modify circuit breaker states
 */
const requireAdminOrKey = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];

  if (adminKey && adminKey === gatewayConfig.gatewaySecret) {
    return next();
  }

  if (req.user && req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'Access denied: Administrative credentials or valid x-admin-key required to modify resilience circuit breakers.',
    correlationId: req.correlationId,
  });
};

// Real-time circuit breaker health telemetry
router.get('/status', optionalGatewayAuthenticate, gatewayController.getResilienceStatus);

// Manual testing / DevOps breaker controls (Strictly Protected)
router.post('/trip/:service', optionalGatewayAuthenticate, requireAdminOrKey, gatewayController.tripCircuitBreaker);
router.post('/reset/:service', optionalGatewayAuthenticate, requireAdminOrKey, gatewayController.resetCircuitBreaker);

export default router;
