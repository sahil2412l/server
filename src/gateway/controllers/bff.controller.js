import { aggregatorService } from '../services/aggregator.service.js';
import { gatewayConfig } from '../../config/gateway.config.js';
import { cacheService } from '../../config/cache.js';

export const bffController = {
  /**
   * @desc    BFF Mobile Client Aggregated Dashboard
   * @route   GET /api/gateway/bff/mobile/dashboard
   * @access  Protected (Gateway Authenticated)
   */
  async getMobileDashboard(req, res, next) {
    try {
      const cacheKey = `bff:mobile:${req.user.userId}:${req.tenant?.id || 'default'}`;
      const cacheTTL = gatewayConfig.bff.mobile.cacheTTLSeconds || 30;
      const bypassCache =
        req.headers['x-bypass-cache'] === 'true' ||
        req.headers['cache-control'] === 'no-cache';

      // Check Distributed Cache Layer first (matches Redis Cache in architecture)
      if (!bypassCache) {
        const cached = await cacheService.get(cacheKey);
        if (cached) {
          res.setHeader('Cache-Control', `private, max-age=${cacheTTL}`);
          res.setHeader('X-BFF-Client', 'mobile');
          res.setHeader('X-Cache', 'HIT');
          res.setHeader('X-Cache-Engine', cacheService.stats().backend);
          return res.status(200).json(cached);
        }
      }

      const result = await aggregatorService.aggregateMobileDashboard(req.user, req.tenant);

      // Only cache healthy/non-degraded responses
      if (!result.meta.degraded) {
        await cacheService.set(cacheKey, result, cacheTTL);
      }

      res.setHeader('Cache-Control', `private, max-age=${cacheTTL}`);
      res.setHeader('X-BFF-Client', 'mobile');
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('X-Cache-Engine', cacheService.stats().backend);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * @desc    BFF Web Client Aggregated Overview
   * @route   GET /api/gateway/bff/web/overview
   * @access  Protected (Gateway Authenticated)
   */
  async getWebOverview(req, res, next) {
    try {
      const cacheKey = `bff:web:${req.user.userId}:${req.tenant?.id || 'default'}`;
      const cacheTTL = gatewayConfig.bff.web.cacheTTLSeconds || 15;
      const bypassCache =
        req.headers['x-bypass-cache'] === 'true' ||
        req.headers['cache-control'] === 'no-cache';

      if (!bypassCache) {
        const cached = await cacheService.get(cacheKey);
        if (cached) {
          res.setHeader('Cache-Control', `private, max-age=${cacheTTL}`);
          res.setHeader('X-BFF-Client', 'web');
          res.setHeader('X-Cache', 'HIT');
          return res.status(200).json(cached);
        }
      }

      const result = await aggregatorService.aggregateWebOverview(req.user, req.tenant);

      if (!result.meta.degraded) {
        await cacheService.set(cacheKey, result, cacheTTL);
      }

      res.setHeader('Cache-Control', `private, max-age=${cacheTTL}`);
      res.setHeader('X-BFF-Client', 'web');
      res.setHeader('X-Cache', 'MISS');

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * @desc    BFF Admin Client Tenant Summary
   * @route   GET /api/gateway/bff/admin/tenant-summary
   * @access  Protected (Admin Only)
   */
  async getAdminTenantSummary(req, res, next) {
    try {
      const result = await aggregatorService.aggregateAdminTenantSummary(req.tenant);

      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('X-BFF-Client', 'admin');

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
