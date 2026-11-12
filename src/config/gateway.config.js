/**
 * API Gateway & BFF Architecture Configuration
 * Centralized settings for Routing, Multi-tenancy, BFF tiers, Circuit Breakers, and Gateway Security
 */

export const gatewayConfig = {
  // Gateway core identity and security secret
  gatewaySecret: process.env.GATEWAY_SECRET || 'gateway_shared_hmac_secret_key_2026',
  gatewayName: 'Antigravity-API-Gateway',
  version: '2.0.0',

  // Tenant Tier Definitions with rate limit quotas (requests per minute window)
  tenantTiers: {
    free: {
      name: 'Free Tier',
      rateLimitWindowMs: 60 * 1000, // 1 minute
      maxRequests: 30,              // 30 req/min
      burstCapacity: 10,
      features: ['basic_profile', 'basic_coins', 'public_feed'],
    },
    standard: {
      name: 'Standard Tier',
      rateLimitWindowMs: 60 * 1000,
      maxRequests: 120,             // 120 req/min
      burstCapacity: 30,
      features: ['basic_profile', 'basic_coins', 'public_feed', 'realtime_events'],
    },
    premium: {
      name: 'Premium Tier',
      rateLimitWindowMs: 60 * 1000,
      maxRequests: 300,             // 300 req/min
      burstCapacity: 60,
      features: ['basic_profile', 'basic_coins', 'public_feed', 'realtime_events', 'bff_mobile', 'bff_web', 'priority_queue'],
    },
    enterprise: {
      name: 'Enterprise Tier',
      rateLimitWindowMs: 60 * 1000,
      maxRequests: 1000,            // 1000 req/min
      burstCapacity: 200,
      features: ['all', 'custom_webhooks', 'sla_99_99', 'dedicated_cache'],
    },
  },

  // Known / Pre-configured Tenants (can be extended dynamically via DB / Tenant model)
  defaultTenants: {
    'tenant-default': {
      id: 'tenant-default',
      name: 'Default Tenant Organization',
      tier: 'standard',
      isActive: true,
    },
    'tenant-mobile-free': {
      id: 'tenant-mobile-free',
      name: 'Mobile Free App Consumer',
      tier: 'free',
      isActive: true,
    },
    'tenant-web-premium': {
      id: 'tenant-web-premium',
      name: 'Web Enterprise Client',
      tier: 'enterprise',
      isActive: true,
    },
  },

  // Circuit Breaker Defaults per Internal Service Domain
  circuitBreakers: {
    authService: {
      failureThreshold: 4,        // Failures before opening
      resetTimeout: 8000,         // Wait 8s before testing half-open
      requestTimeout: 4000,       // Max request wait duration in ms
      halfOpenSuccessThreshold: 2,// Successes needed to close
    },
    coinService: {
      failureThreshold: 3,
      resetTimeout: 10000,
      requestTimeout: 3000,
      halfOpenSuccessThreshold: 2,
    },
    feedbackService: {
      failureThreshold: 3,
      resetTimeout: 10000,
      requestTimeout: 3000,
      halfOpenSuccessThreshold: 2,
    },
  },

  // Backend for Frontend (BFF) Configuration
  bff: {
    mobile: {
      maxFeedItems: 5,
      enablePayloadCompression: true,
      cacheTTLSeconds: 30,
    },
    web: {
      maxFeedItems: 25,
      enablePayloadCompression: false,
      cacheTTLSeconds: 15,
    },
    admin: {
      includeMetrics: true,
      cacheTTLSeconds: 5,
    },
  },
};

