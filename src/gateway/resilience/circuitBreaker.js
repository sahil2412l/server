import { EventEmitter } from 'events';

export const CIRCUIT_STATE = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN',
};

/**
 * Enterprise Circuit Breaker
 * Protects downstream services from cascading failure cascades
 */
export class CircuitBreaker extends EventEmitter {
  constructor(name, options = {}) {
    super();
    this.name = name;
    this.failureThreshold = options.failureThreshold || 3;
    this.resetTimeout = options.resetTimeout || 10000; // 10 seconds
    this.requestTimeout = options.requestTimeout || 3000; // 3 seconds
    this.halfOpenSuccessThreshold = options.halfOpenSuccessThreshold || 2;
    this.fallback = options.fallback || null;

    // State machine tracking
    this.state = CIRCUIT_STATE.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
    this.lastFailureTime = null;
    this.lastStateChange = new Date();

    // Metrics counters
    this.metrics = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      rejectedCalls: 0,
      fallbackCalls: 0,
      timeouts: 0,
    };
  }

  /**
   * Executes an asynchronous action through the circuit breaker
   */
  async execute(action, fallbackOverride = null) {
    this.metrics.totalCalls++;

    // Evaluate state transition from OPEN to HALF_OPEN
    if (this.state === CIRCUIT_STATE.OPEN) {
      if (Date.now() >= this.nextAttempt) {
        this.transitionTo(CIRCUIT_STATE.HALF_OPEN);
      } else {
        this.metrics.rejectedCalls++;
        return this.handleFallback(
          new Error(`CircuitBreaker '${this.name}' is OPEN. Requests blocked until retry timeout.`),
          fallbackOverride
        );
      }
    }

    // Execute with timeout race
    try {
      const result = await this.executeWithTimeout(action);
      this.onSuccess();
      return result;
    } catch (error) {
      return this.onFailure(error, fallbackOverride);
    }
  }

  /**
   * Wraps promise execution with a timeout
   */
  executeWithTimeout(action) {
    return new Promise(async (resolve, reject) => {
      let isTimedOut = false;
      const timer = setTimeout(() => {
        isTimedOut = true;
        this.metrics.timeouts++;
        reject(new Error(`Operation timed out after ${this.requestTimeout}ms in CircuitBreaker '${this.name}'`));
      }, this.requestTimeout);

      try {
        const response = await action();
        if (!isTimedOut) {
          clearTimeout(timer);
          resolve(response);
        }
      } catch (err) {
        if (!isTimedOut) {
          clearTimeout(timer);
          reject(err);
        }
      }
    });
  }

  onSuccess() {
    this.metrics.successfulCalls++;

    if (this.state === CIRCUIT_STATE.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.halfOpenSuccessThreshold) {
        this.transitionTo(CIRCUIT_STATE.CLOSED);
      }
    } else if (this.state === CIRCUIT_STATE.CLOSED) {
      this.failureCount = 0;
    }
  }

  onFailure(error, fallbackOverride) {
    this.metrics.failedCalls++;
    this.lastFailureTime = new Date();

    if (this.state === CIRCUIT_STATE.HALF_OPEN) {
      // Immediate trip back to OPEN if probe fails in HALF_OPEN
      this.transitionTo(CIRCUIT_STATE.OPEN);
    } else if (this.state === CIRCUIT_STATE.CLOSED) {
      this.failureCount++;
      if (this.failureCount >= this.failureThreshold) {
        this.transitionTo(CIRCUIT_STATE.OPEN);
      }
    }

    return this.handleFallback(error, fallbackOverride);
  }

  handleFallback(error, fallbackOverride) {
    const activeFallback = fallbackOverride || this.fallback;
    if (typeof activeFallback === 'function') {
      this.metrics.fallbackCalls++;
      return activeFallback(error);
    }

    // If fallback is static value
    if (activeFallback !== null && activeFallback !== undefined) {
      this.metrics.fallbackCalls++;
      return activeFallback;
    }

    // If no fallback defined, propagate error
    throw error;
  }

  transitionTo(newState) {
    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = new Date();

    if (newState === CIRCUIT_STATE.OPEN) {
      this.nextAttempt = Date.now() + this.resetTimeout;
      this.successCount = 0;
    } else if (newState === CIRCUIT_STATE.CLOSED) {
      this.failureCount = 0;
      this.successCount = 0;
    } else if (newState === CIRCUIT_STATE.HALF_OPEN) {
      this.successCount = 0;
    }

    this.emit('stateChange', {
      name: this.name,
      from: oldState,
      to: newState,
      timestamp: this.lastStateChange,
    });
  }

  trip() {
    this.transitionTo(CIRCUIT_STATE.OPEN);
  }

  reset() {
    this.transitionTo(CIRCUIT_STATE.CLOSED);
  }

  getSnapshot() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      failureThreshold: this.failureThreshold,
      resetTimeoutMs: this.resetTimeout,
      requestTimeoutMs: this.requestTimeout,
      lastFailureTime: this.lastFailureTime,
      lastStateChange: this.lastStateChange,
      metrics: { ...this.metrics },
    };
  }
}

