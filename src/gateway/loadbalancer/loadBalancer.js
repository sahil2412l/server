import { serviceRegistry, SERVICE_STATUS } from '../discovery/serviceRegistry.js';

export const LB_STRATEGY = {
  ROUND_ROBIN: 'round-robin',
  LEAST_CONNECTIONS: 'least-connections',
  RANDOM: 'random',
};

/**
 * Gateway Load Balancer
 * Balances client requests across healthy microservice instances discovered from the Service Registry
 */
export class LoadBalancer {
  constructor(registry = serviceRegistry) {
    this.registry = registry;
    // Map<serviceName, number> for round-robin pointer
    this.indices = new Map();
  }

  /**
   * Selects an instance based on specified strategy
   */
  choose(serviceName, strategy = LB_STRATEGY.ROUND_ROBIN) {
    const instances = this.registry.getInstances(serviceName, true);

    if (!instances || instances.length === 0) {
      return null;
    }

    if (instances.length === 1) {
      return instances[0];
    }

    switch (strategy) {
      case LB_STRATEGY.RANDOM:
        return this.chooseRandom(instances);
      case LB_STRATEGY.LEAST_CONNECTIONS:
        return this.chooseLeastConnections(instances);
      case LB_STRATEGY.ROUND_ROBIN:
      default:
        return this.chooseRoundRobin(serviceName, instances);
    }
  }

  chooseRoundRobin(serviceName, instances) {
    const currentIndex = this.indices.get(serviceName) || 0;
    const selected = instances[currentIndex % instances.length];
    this.indices.set(serviceName, (currentIndex + 1) % instances.length);
    return selected;
  }

  chooseLeastConnections(instances) {
    let minInst = instances[0];
    for (let i = 1; i < instances.length; i++) {
      if ((instances[i].connections || 0) < (minInst.connections || 0)) {
        minInst = instances[i];
      }
    }
    return minInst;
  }

  chooseRandom(instances) {
    const idx = Math.floor(Math.random() * instances.length);
    return instances[idx];
  }

  acquire(instance) {
    if (instance) {
      instance.connections = (instance.connections || 0) + 1;
    }
  }

  release(instance) {
    if (instance && instance.connections > 0) {
      instance.connections--;
    }
  }
}

export const loadBalancer = new LoadBalancer();
