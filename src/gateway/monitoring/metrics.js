import { circuitRegistry } from '../resilience/circuitRegistry.js';
import { cacheService } from '../../config/cache.js';
import { serviceRegistry } from '../discovery/serviceRegistry.js';
import { eventBus } from '../messaging/eventBus.js';

class MetricsCollector {
  constructor() {
    this.requestCounts = new Map(); // key: "METHOD /path STATUS" -> count
    this.durations = []; // recent durations in ms
    this.startTime = Date.now();
  }

  recordRequest(method, path, statusCode, durationMs) {
    // Group endpoints to prevent metric cardinality explosion
    const normalizedPath = path.replace(/[0-9a-fA-F]{24}/g, ':id')
      .replace(/COIN_[A-Z0-9]+/g, ':coinId')
      .split('?')[0];

    const key = `${method} ${normalizedPath} ${statusCode}`;
    const current = this.requestCounts.get(key) || 0;
    this.requestCounts.set(key, current + 1);

    this.durations.push(durationMs);
    if (this.durations.length > 500) {
      this.durations.shift();
    }
  }

  getPrometheusFormat() {
    const memory = process.memoryUsage();
    const uptimeSec = Math.round(process.uptime());

    const lines = [
      '# HELP process_uptime_seconds Total process uptime in seconds',
      '# TYPE process_uptime_seconds gauge',
      `process_uptime_seconds ${uptimeSec}`,
      '',
      '# HELP nodejs_heap_used_bytes Process heap memory used',
      '# TYPE nodejs_heap_used_bytes gauge',
      `nodejs_heap_used_bytes ${memory.heapUsed}`,
      '',
      '# HELP nodejs_heap_total_bytes Process heap total',
      '# TYPE nodejs_heap_total_bytes gauge',
      `nodejs_heap_total_bytes ${memory.heapTotal}`,
      '',
      '# HELP http_requests_total Total number of HTTP requests processed by the API Gateway',
      '# TYPE http_requests_total counter',
    ];

    for (const [key, count] of this.requestCounts.entries()) {
      const [method, route, status] = key.split(' ');
      lines.push(`http_requests_total{method="${method}",route="${route}",status="${status}"} ${count}`);
    }

    // Circuit Breaker metrics
    lines.push('', '# HELP circuit_breaker_state Circuit breaker status (1=CLOSED, 0=OPEN/HALF_OPEN)', '# TYPE circuit_breaker_state gauge');
    const cbSnapshots = circuitRegistry.getAllSnapshots();
    for (const [name, snap] of Object.entries(cbSnapshots)) {
      const stateVal = snap.state === 'CLOSED' ? 1 : 0;
      lines.push(`circuit_breaker_state{service="${name}",state="${snap.state}"} ${stateVal}`);
    }

    // Cache metrics
    const cacheStats = cacheService.stats();
    lines.push(
      '',
      '# HELP cache_hits_total Total cache hits in distributed cache layer',
      '# TYPE cache_hits_total counter',
      `cache_hits_total ${cacheStats.hits || 0}`,
      '# HELP cache_misses_total Total cache misses in distributed cache layer',
      '# TYPE cache_misses_total counter',
      `cache_misses_total ${cacheStats.misses || 0}`
    );

    // Event bus metrics
    const busMetrics = eventBus.getMetrics();
    lines.push(
      '',
      '# HELP event_bus_published_total Total asynchronous messages published to event bus',
      '# TYPE event_bus_published_total counter',
      `event_bus_published_total ${busMetrics.published}`,
      `event_bus_delivered_total ${busMetrics.delivered}`,
      `event_bus_failed_total ${busMetrics.failed}`
    );

    return lines.join('\n');
  }

  getJSONFormat() {
    const memory = process.memoryUsage();
    const avgDuration =
      this.durations.length > 0
        ? (this.durations.reduce((a, b) => a + b, 0) / this.durations.length).toFixed(2)
        : 0;

    return {
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      system: {
        heapUsedMB: Math.round(memory.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memory.heapTotal / 1024 / 1024),
        rssMB: Math.round(memory.rss / 1024 / 1024),
      },
      performance: {
        averageLatencyMs: Number(avgDuration),
        sampleSize: this.durations.length,
      },
      servicesDiscovered: serviceRegistry.getAllServices(),
      circuitBreakers: circuitRegistry.getAllSnapshots(),
      cache: cacheService.stats(),
      eventBus: eventBus.getMetrics(),
    };
  }
}

export const metricsCollector = new MetricsCollector();

/**
 * Express middleware to record Prometheus latency and request metrics
 */
export const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    metricsCollector.recordRequest(req.method, req.path, res.statusCode, duration);
  });
  next();
};
