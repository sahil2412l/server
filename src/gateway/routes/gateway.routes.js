import express from 'express';
import bffRoutes from './bff.routes.js';
import resilienceRoutes from './resilience.routes.js';
import serviceRoutes from './service.routes.js';
import { gatewayController } from '../controllers/gateway.controller.js';
import { correlationIdMiddleware } from '../middlewares/correlationId.js';
import { wafMiddleware } from '../middlewares/waf.js';
import { tenantContextMiddleware } from '../middlewares/tenantContext.js';
import { tenantRateLimiter } from '../middlewares/tenantRateLimiter.js';
import { metricsMiddleware } from '../monitoring/metrics.js';
import { gatewayErrorHandler } from '../middlewares/gatewayErrorHandler.js';

const router = express.Router();

// ==========================================
// 1. GATEWAY GLOBAL MIDDLEWARE PIPELINE
// ==========================================
router.use(correlationIdMiddleware);
router.use(metricsMiddleware);
router.use(wafMiddleware); // Firewall / WAF Ingress Protection
router.use(tenantContextMiddleware);
router.use(tenantRateLimiter());

// ==========================================
// 2. GATEWAY HEALTH & CAPABILITIES
// ==========================================
router.get('/health', gatewayController.getGatewayHealth);

// ==========================================
// 3. MONITORING & OBSERVABILITY (Prometheus/Grafana)
// ==========================================
router.get('/metrics', gatewayController.getPrometheusMetrics);
router.get('/metrics/json', gatewayController.getJSONMetrics);

// ==========================================
// 4. SERVICE DISCOVERY & LOAD BALANCER
// ==========================================
router.get('/discovery', gatewayController.getServiceDiscovery);
router.get('/loadbalancer/status', gatewayController.getLoadBalancerStatus);

// ==========================================
// 5. CACHE LAYER (Redis / In-Memory Stats)
// ==========================================
router.get('/cache/stats', gatewayController.getCacheStats);

// ==========================================
// 6. FAULT TOLERANCE & CIRCUIT BREAKER ROUTES
// ==========================================
router.use('/resilience', resilienceRoutes);

// ==========================================
// 7. BACKEND FOR FRONTEND (BFF) ROUTES
// ==========================================
router.use('/bff', bffRoutes);

// ==========================================
// 8. ROUTED INTERNAL SERVICES
// ==========================================
router.use('/services', serviceRoutes);

// ==========================================
// 9. GATEWAY ERROR HANDLER
// ==========================================
router.use(gatewayErrorHandler);

export default router;
