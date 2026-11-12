import { gatewayConfig } from '../../config/gateway.config.js';
import { Tenant } from '../../models/Tenant.js';

// In-memory tenant cache to avoid frequent DB lookups during high throughput
const tenantCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache

/**
 * Helper to extract tenant ID from multiple potential sources
 */
const extractTenantId = (req) => {
  // 1. Header: x-tenant-id
  if (req.headers['x-tenant-id']) {
    return String(req.headers['x-tenant-id']).toLowerCase().trim();
  }

  // 2. Query parameter: ?tenantId=... or ?tenant=...
  if (req.query?.tenantId || req.query?.tenant) {
    return String(req.query.tenantId || req.query.tenant).toLowerCase().trim();
  }

  // 3. Subdomain extraction (e.g., "acme.api.example.com" -> "acme")
  const host = req.headers.host || '';
  const hostParts = host.split('.');
  if (hostParts.length > 2 && hostParts[0] !== 'localhost' && hostParts[0] !== 'api' && hostParts[0] !== 'www') {
    return hostParts[0].toLowerCase().trim();
  }

  // 4. Default fallback tenant
  return 'tenant-default';
};

/**
 * Tenant Context Middleware
 * Identifies the tenant, resolves their tier and rate limits, and attaches to request
 */
export const tenantContextMiddleware = async (req, res, next) => {
  try {
    const tenantId = extractTenantId(req);

    // Check in-memory cache first
    const cached = tenantCache.get(tenantId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      req.tenant = cached.data;
      res.setHeader('x-tenant-id', req.tenant.id);
      res.setHeader('x-tenant-tier', req.tenant.tier);
      return next();
    }

    // Check predefined config tenants
    let tenantInfo = gatewayConfig.defaultTenants[tenantId];

    // If not in config, query Tenant database
    if (!tenantInfo) {
      try {
        const dbTenant = await Tenant.findOne({ tenantId, isActive: true });
        if (dbTenant) {
          tenantInfo = {
            id: dbTenant.tenantId,
            name: dbTenant.name,
            tier: dbTenant.tier,
            isActive: dbTenant.isActive,
            customRateLimit: dbTenant.customRateLimit,
            settings: dbTenant.settings,
          };
        }
      } catch (dbErr) {
        // Continue with fallback if DB is unavailable
      }
    }

    // If still not found, initialize dynamic tenant with standard or default tier
    if (!tenantInfo) {
      // If client explicitly passed a custom tenant ID (e.g. "tenant-mobile-free" or "tenant_custom")
      // Infer tier from name or default to 'standard'
      let inferredTier = 'standard';
      if (tenantId.includes('free')) inferredTier = 'free';
      if (tenantId.includes('premium')) inferredTier = 'premium';
      if (tenantId.includes('enterprise')) inferredTier = 'enterprise';

      tenantInfo = {
        id: tenantId,
        name: `Tenant ${tenantId}`,
        tier: inferredTier,
        isActive: true,
      };
    }

    // Attach resolved tier definitions
    const tierConfig = gatewayConfig.tenantTiers[tenantInfo.tier] || gatewayConfig.tenantTiers.standard;

    const resolvedTenant = {
      id: tenantInfo.id,
      name: tenantInfo.name,
      tier: tenantInfo.tier,
      isActive: tenantInfo.isActive !== false,
      rateLimit: {
        windowMs: tenantInfo.customRateLimit?.windowMs || tierConfig.rateLimitWindowMs,
        maxRequests: tenantInfo.customRateLimit?.maxRequests || tierConfig.maxRequests,
        burstCapacity: tierConfig.burstCapacity,
      },
      features: tierConfig.features,
      settings: tenantInfo.settings || {},
    };

    // Cache the resolved tenant
    tenantCache.set(tenantId, { data: resolvedTenant, timestamp: Date.now() });

    req.tenant = resolvedTenant;
    res.setHeader('x-tenant-id', resolvedTenant.id);
    res.setHeader('x-tenant-tier', resolvedTenant.tier);

    next();
  } catch (error) {
    next(error);
  }
};

