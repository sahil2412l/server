import { CircuitBreaker } from './circuitBreaker.js';
import { gatewayConfig } from '../../config/gateway.config.js';

class CircuitBreakerRegistry {
  constructor() {
    this.breakers = new Map();
    this.initDefaultBreakers();
  }

  initDefaultBreakers() {
    const configs = gatewayConfig.circuitBreakers;

    this.register('authService', new CircuitBreaker('authService', {
      failureThreshold: configs.authService?.failureThreshold || 4,
      resetTimeout: configs.authService?.resetTimeout || 8000,
      requestTimeout: configs.authService?.requestTimeout || 4000,
      halfOpenSuccessThreshold: configs.authService?.halfOpenSuccessThreshold || 2,
      fallback: (err) => ({
        degraded: true,
        service: 'authService',
        error: 'Authentication service temporarily unavailable via circuit breaker fallback',
      }),
    }));

    this.register('coinService', new CircuitBreaker('coinService', {
      failureThreshold: configs.coinService?.failureThreshold || 3,
      resetTimeout: configs.coinService?.resetTimeout || 10000,
      requestTimeout: configs.coinService?.requestTimeout || 3000,
      halfOpenSuccessThreshold: configs.coinService?.halfOpenSuccessThreshold || 2,
      fallback: (err) => ({
        degraded: true,
        service: 'coinService',
        balance: 0,
        coins: [],
        warning: 'Coin service currently degraded. Displaying cached zero balance.',
      }),
    }));

    this.register('feedbackService', new CircuitBreaker('feedbackService', {
      failureThreshold: configs.feedbackService?.failureThreshold || 3,
      resetTimeout: configs.feedbackService?.resetTimeout || 10000,
      requestTimeout: configs.feedbackService?.requestTimeout || 3000,
      halfOpenSuccessThreshold: configs.feedbackService?.halfOpenSuccessThreshold || 2,
      fallback: (err) => ({
        degraded: true,
        service: 'feedbackService',
        feed: [],
        performance: null,
        warning: 'Feedback and performance stream currently degraded.',
      }),
    }));
  }

  register(name, breaker) {
    this.breakers.set(name, breaker);
    return breaker;
  }

  get(name) {
    return this.breakers.get(name);
  }

  getAllSnapshots() {
    const result = {};
    for (const [name, breaker] of this.breakers.entries()) {
      result[name] = breaker.getSnapshot();
    }
    return result;
  }

  resetAll() {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }
}

export const circuitRegistry = new CircuitBreakerRegistry();

