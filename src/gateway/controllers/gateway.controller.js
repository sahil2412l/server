import { circuitRegistry } from '../resilience/circuitRegistry.js';
import { gatewayConfig } from '../../config/gateway.config.js';
import { serviceRegistry } from '../discovery/serviceRegistry.js';
import { loadBalancer } from '../loadbalancer/loadBalancer.js';
import { cacheService } from '../../config/cache.js';
import { metricsCollector } from '../monitoring/metrics.js';

export const gatewayController = {
  /**
   * @desc    Gateway Health Check & Capability Discovery
   * @route   GET /api/gateway/health
   */
  getGatewayHealth(req, res) {
    const memory = process.memoryUsage();

    res.status(200).json({
      success: true,
      service: gatewayConfig.gatewayName,
      version: gatewayConfig.version,
      status: 'Healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId,
      system: {
        nodeVersion: process.version,
        memoryUsageMB: Math.round(memory.heapUsed / 1024 / 1024),
      },
      architectureStandard: 'Best-Practice Backend Architecture with API Gateway',
      capabilities: [
        'Centralized Gateway Authentication & Security Offloading (OAuth2/JWT)',
        'Multi-Tenancy & Tier-Based Sliding-Window Rate Limiting',
        'Backend-for-Frontend (BFF) Aggregation (Mobile, Web, Admin)',
        'Circuit Breakers & Cascading Failure Resilience',
        'Distributed Correlation ID Tracing',
        'Service Discovery & Microservice Registry',
        'Dynamic Load Balancing (Round-Robin, Least-Connections)',
        'Distributed Caching Layer (Redis / In-Memory Cache Engine)',
        'Lightweight Asynchronous Event Bus (AMQP / Kafka style)',
        'Observability & Prometheus Monitoring (/metrics)',
        'WAF / Firewall & Ingress Security Filter',
      ],
      activeTenant: req.tenant ? {
        id: req.tenant.id,
        tier: req.tenant.tier,
      } : null,
    });
  },

  /**
   * @desc    Get Prometheus Metrics (Scraped by Prometheus/Grafana)
   * @route   GET /api/gateway/metrics
   */
  getPrometheusMetrics(req, res) {
    const textOutput = metricsCollector.getPrometheusFormat();
    res.setHeader('Content-Type', 'text/plain; version=0.0.4');
    res.status(200).send(textOutput);
  },

  /**
   * @desc    Get JSON Metrics & Observability Telemetry
   * @route   GET /api/gateway/metrics/json
   */
  getJSONMetrics(req, res) {
    res.status(200).json({
      success: true,
      correlationId: req.correlationId,
      telemetry: metricsCollector.getJSONFormat(),
    });
  },

  /**
   * @desc    Service Discovery Registry Status
   * @route   GET /api/gateway/discovery
   */
  getServiceDiscovery(req, res) {
    res.status(200).json({
      success: true,
      correlationId: req.correlationId,
      services: serviceRegistry.getAllServices(),
    });
  },

  /**
   * @desc    Cache Layer Health & Hit-Rate Stats
   * @route   GET /api/gateway/cache/stats
   */
  getCacheStats(req, res) {
    res.status(200).json({
      success: true,
      correlationId: req.correlationId,
      cache: cacheService.stats(),
    });
  },

  /**
   * @desc    Load Balancer Telemetry & Status
   * @route   GET /api/gateway/loadbalancer/status
   */
  getLoadBalancerStatus(req, res) {
    res.status(200).json({
      success: true,
      correlationId: req.correlationId,
      strategy: 'round-robin',
      services: serviceRegistry.getAllServices(),
    });
  },

  /**
   * @desc    Get Circuit Breaker Telemetry and Health
   * @route   GET /api/gateway/resilience/status
   */
  getResilienceStatus(req, res) {
    const snapshots = circuitRegistry.getAllSnapshots();
    res.status(200).json({
      success: true,
      resilience: {
        circuitBreakers: snapshots,
      },
      correlationId: req.correlationId,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * @desc    Manually trip a circuit breaker (DevOps / Testing)
   * @route   POST /api/gateway/resilience/trip/:service
   */
  tripCircuitBreaker(req, res) {
    const { service } = req.params;
    const breaker = circuitRegistry.get(service);

    if (!breaker) {
      return res.status(404).json({
        success: false,
        error: `Circuit Breaker '${service}' not found. Available: ${Array.from(circuitRegistry.breakers.keys()).join(', ')}`,
      });
    }

    breaker.trip();
    cacheService.flush();

    res.status(200).json({
      success: true,
      message: `Circuit Breaker '${service}' manually TRIPPED to OPEN state. Cache flushed.`,
      snapshot: breaker.getSnapshot(),
    });
  },

  /**
   * @desc    Manually reset a circuit breaker
   * @route   POST /api/gateway/resilience/reset/:service
   */
  resetCircuitBreaker(req, res) {
    const { service } = req.params;
    const breaker = circuitRegistry.get(service);

    if (!breaker) {
      return res.status(404).json({
        success: false,
        error: `Circuit Breaker '${service}' not found. Available: ${Array.from(circuitRegistry.breakers.keys()).join(', ')}`,
      });
    }

    breaker.reset();

    res.status(200).json({
      success: true,
      message: `Circuit Breaker '${service}' RESET to CLOSED state.`,
      snapshot: breaker.getSnapshot(),
    });
  },
};
