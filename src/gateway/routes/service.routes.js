import express from 'express';
import authRoutes from '../../routes/auth.routes.js';
import coinRoutes from '../../routes/coin.routes.js';
import feedbackRoutes from '../../routes/feedback.routes.js';
import { gatewayAuthenticate, optionalGatewayAuthenticate } from '../middlewares/gatewayAuth.js';
import { tenantRateLimiter } from '../middlewares/tenantRateLimiter.js';

const router = express.Router();

/**
 * Service Gateway Routing
 * Centralizes incoming client traffic through authentication offloading & tenant throttling
 */

// Auth Service routing
router.use('/auth', tenantRateLimiter(), authRoutes);

// Coin Service routing (offloads JWT authentication at the gateway level)
router.use(
  '/coins',
  gatewayAuthenticate,
  tenantRateLimiter(),
  coinRoutes
);

// Feedback Service routing
router.use(
  '/feedback',
  optionalGatewayAuthenticate,
  tenantRateLimiter(),
  feedbackRoutes
);

export default router;

