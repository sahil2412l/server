/**
 * Multi-Tenant Sliding Window Rate Limiter & Throttler
 * Tracks request counts per tenant within configured time window
 */

class TenantRateLimitStore {
  constructor() {
    // Map<tenantKey, { tokens: number, lastRefill: number, count: number, windowStart: number }>
    this.buckets = new Map();

    // Periodic cleanup of stale buckets every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000).unref();
  }

  getBucket(key, maxRequests, windowMs) {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket || now - bucket.windowStart >= windowMs) {
      bucket = {
        count: 0,
        windowStart: now,
        maxRequests,
        windowMs,
      };
      this.buckets.set(key, bucket);
    }

    return bucket;
  }

  increment(key, maxRequests, windowMs) {
    const bucket = this.getBucket(key, maxRequests, windowMs);
    const now = Date.now();
    bucket.count += 1;

    const remaining = Math.max(0, maxRequests - bucket.count);
    const resetTime = Math.ceil((bucket.windowStart + windowMs - now) / 1000);

    return {
      isAllowed: bucket.count <= maxRequests,
      current: bucket.count,
      remaining,
      limit: maxRequests,
      resetSeconds: Math.max(0, resetTime),
    };
  }

  resetKey(key) {
    this.buckets.delete(key);
  }

  cleanup() {
    const now = Date.now();
    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.windowStart > bucket.windowMs * 2) {
        this.buckets.delete(key);
      }
    }
  }
}

// Global store instance
export const tenantRateLimitStore = new TenantRateLimitStore();

/**
 * Tenant Rate Limiting Middleware
 * Evaluates tenant limits based on tenant tier or custom quotas
 */
export const tenantRateLimiter = (options = {}) => {
  return (req, res, next) => {
    // Determine tenant context from middleware
    const tenant = req.tenant || {
      id: 'tenant-default',
      tier: 'standard',
      rateLimit: { windowMs: 60000, maxRequests: 120 },
    };

    const windowMs = options.windowMs || tenant.rateLimit?.windowMs || 60000;
    const maxRequests = options.maxRequests || tenant.rateLimit?.maxRequests || 120;

    // Partition key can be by tenant ID, or per tenant:user if authenticated
    const key = options.perUser && req.user
      ? `rl:${tenant.id}:user:${req.user.userId || req.user.id}`
      : `rl:${tenant.id}`;

    const status = tenantRateLimitStore.increment(key, maxRequests, windowMs);

    // Standard rate limit headers
    res.setHeader('X-RateLimit-Limit', status.limit);
    res.setHeader('X-RateLimit-Remaining', status.remaining);
    res.setHeader('X-RateLimit-Reset', status.resetSeconds);
    res.setHeader('X-RateLimit-Tier', tenant.tier);

    if (!status.isAllowed) {
      res.setHeader('Retry-After', status.resetSeconds);
      return res.status(429).json({
        success: false,
        error: `Rate limit exceeded for tenant '${tenant.id}' (${tenant.tier} tier). Quota: ${maxRequests} requests per ${windowMs / 1000}s.`,
        tenantId: tenant.id,
        tenantTier: tenant.tier,
        limit: status.limit,
        retryAfterSeconds: status.resetSeconds,
        correlationId: req.correlationId,
      });
    }

    next();
  };
};

