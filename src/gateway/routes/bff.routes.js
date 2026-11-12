import express from 'express';
import { bffController } from '../controllers/bff.controller.js';
import { gatewayAuthenticate, requireGatewayRole } from '../middlewares/gatewayAuth.js';
import { tenantRateLimiter } from '../middlewares/tenantRateLimiter.js';

const router = express.Router();

/**
 * BFF Mobile Routes
 * Highly optimized, reduced payload for mobile native clients
 */
router.get(
  '/mobile/dashboard',
  gatewayAuthenticate,
  tenantRateLimiter(),
  bffController.getMobileDashboard
);

/**
 * BFF Web Portal Routes
 * Comprehensive data views for desktop, web portals, and tablets
 */
router.get(
  '/web/overview',
  gatewayAuthenticate,
  tenantRateLimiter(),
  bffController.getWebOverview
);

/**
 * BFF Admin Operations Routes
 * Organizational tenant summary, analytics, and circuit telemetry
 */
router.get(
  '/admin/tenant-summary',
  gatewayAuthenticate,
  requireGatewayRole(['admin']),
  bffController.getAdminTenantSummary
);

export default router;

