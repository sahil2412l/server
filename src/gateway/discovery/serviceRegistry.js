import { EventEmitter } from 'events';

export const SERVICE_STATUS = {
  UP: 'UP',
  DOWN: 'DOWN',
  DRAINING: 'DRAINING',
  UNKNOWN: 'UNKNOWN',
};

/**
 * Service Discovery & Registry
 * Manages dynamic microservice instance registration, health status, and discovery lookups
 */
export class ServiceRegistry extends EventEmitter {
  constructor(options = {}) {
    super();
    // Map<serviceName, Map<instanceId, ServiceInstance>>
    this.services = new Map();
    this.heartbeatTimeoutMs = options.heartbeatTimeoutMs || 30000; // 30s timeout

    this.initDefaultServices();
    this.startHeartbeatWatcher();
  }

  initDefaultServices() {
    // Register primary core domain microservices
    this.register('auth-service', {
      instanceId: 'auth-service-1',
      url: process.env.AUTH_SERVICE_URL || 'http://localhost:5000/api/auth',
      healthUrl: '/health',
      version: '1.0.0',
      weight: 1,
      metadata: { domain: 'identity', secure: true },
    });

    this.register('coin-service', {
      instanceId: 'coin-service-1',
      url: process.env.COIN_SERVICE_URL || 'http://localhost:5000/api/coins',
      healthUrl: '/health',
      version: '1.0.0',
      weight: 1,
      metadata: { domain: 'rewards', ledger: 'mongo' },
    });

    this.register('feedback-service', {
      instanceId: 'feedback-service-1',
      url: process.env.FEEDBACK_SERVICE_URL || 'http://localhost:5000/api/feedback',
      healthUrl: '/health',
      version: '1.0.0',
      weight: 1,
      metadata: { domain: 'social', realtime: true },
    });

    this.register('tenant-service', {
      instanceId: 'tenant-service-1',
      url: process.env.TENANT_SERVICE_URL || 'http://localhost:5000/api/gateway',
      healthUrl: '/api/gateway/health',
      version: '1.0.0',
      weight: 1,
      metadata: { domain: 'governance', multiTenant: true },
    });
  }

  /**
   * Register a new service instance
   */
  register(serviceName, instanceData) {
    if (!this.services.has(serviceName)) {
      this.services.set(serviceName, new Map());
    }

    const instances = this.services.get(serviceName);
    const instanceId = instanceData.instanceId || `${serviceName}-${Date.now()}`;

    const instance = {
      serviceName,
      instanceId,
      url: instanceData.url,
      healthUrl: instanceData.healthUrl || '/health',
      version: instanceData.version || '1.0.0',
      status: instanceData.status || SERVICE_STATUS.UP,
      weight: instanceData.weight || 1,
      connections: 0,
      metadata: instanceData.metadata || {},
      registeredAt: new Date(),
      lastHeartbeat: Date.now(),
    };

    instances.set(instanceId, instance);
    this.emit('serviceRegistered', instance);
    return instance;
  }

  /**
   * Deregister an instance
   */
  deregister(serviceName, instanceId) {
    const instances = this.services.get(serviceName);
    if (instances && instances.has(instanceId)) {
      const removed = instances.get(instanceId);
      instances.delete(instanceId);
      this.emit('serviceDeregistered', removed);
      return true;
    }
    return false;
  }

  /**
   * Keep-alive Heartbeat from a microservice instance
   */
  heartbeat(serviceName, instanceId) {
    const instances = this.services.get(serviceName);
    if (instances && instances.has(instanceId)) {
      const instance = instances.get(instanceId);
      instance.lastHeartbeat = Date.now();
      if (instance.status === SERVICE_STATUS.DOWN) {
        instance.status = SERVICE_STATUS.UP;
        this.emit('serviceUp', instance);
      }
      return true;
    }
    return false;
  }

  /**
   * Lookup available healthy instances for a service
   */
  getInstances(serviceName, onlyHealthy = true) {
    const instances = this.services.get(serviceName);
    if (!instances) return [];

    const list = Array.from(instances.values());
    if (!onlyHealthy) return list;

    return list.filter((inst) => inst.status === SERVICE_STATUS.UP);
  }

  /**
   * Get all registered services snapshot
   */
  getAllServices() {
    const report = {};
    for (const [name, instances] of this.services.entries()) {
      report[name] = Array.from(instances.values()).map((inst) => ({
        instanceId: inst.instanceId,
        url: inst.url,
        status: inst.status,
        version: inst.version,
        weight: inst.weight,
        activeConnections: inst.connections,
        lastHeartbeatAgoSec: Math.round((Date.now() - inst.lastHeartbeat) / 1000),
      }));
    }
    return report;
  }

  startHeartbeatWatcher() {
    // Check every 15 seconds for stale instances
    setInterval(() => {
      const now = Date.now();
      for (const [serviceName, instances] of this.services.entries()) {
        for (const [instanceId, instance] of instances.entries()) {
          if (now - instance.lastHeartbeat > this.heartbeatTimeoutMs) {
            if (instance.status !== SERVICE_STATUS.DOWN) {
              instance.status = SERVICE_STATUS.DOWN;
              this.emit('serviceDown', instance);
            }
          }
        }
      }
    }, 15000).unref();
  }
}

export const serviceRegistry = new ServiceRegistry();
