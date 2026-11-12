import { EventEmitter } from 'events';

/**
 * Enterprise Event Bus / Message Broker
 * Implements the "Lightweight Messaging / AMQP / Kafka" pattern for asynchronous internal microservice communication
 */
export class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
    this.deadLetterQueue = [];
    this.metrics = {
      published: 0,
      delivered: 0,
      failed: 0,
    };

    this.initDefaultSubscriptions();
  }

  initDefaultSubscriptions() {
    // Audit listener
    this.subscribe('audit.log', async (event) => {
      // Async audit handling
      // console.log(`📋 [EventBus Audit] ${event.topic}:`, event.payload);
    });
  }

  /**
   * Publish an event asynchronously to all subscribers
   */
  async publish(topic, payload = {}) {
    this.metrics.published++;

    const event = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      topic,
      payload,
      timestamp: new Date().toISOString(),
    };

    // Defer execution using setImmediate to avoid blocking the event loop
    setImmediate(async () => {
      try {
        const listeners = this.listeners(topic);
        if (listeners.length > 0) {
          await Promise.all(
            listeners.map(async (handler) => {
              try {
                await handler(event);
                this.metrics.delivered++;
              } catch (handlerErr) {
                this.metrics.failed++;
                this.routeToDLQ(event, handlerErr);
              }
            })
          );
        }
      } catch (err) {
        this.metrics.failed++;
        this.routeToDLQ(event, err);
      }
    });

    return event;
  }

  /**
   * Subscribe a microservice handler to an event topic
   */
  subscribe(topic, handler) {
    this.on(topic, handler);
    return () => this.off(topic, handler);
  }

  /**
   * Dead Letter Queue for failed asynchronous messages
   */
  routeToDLQ(event, error) {
    console.error(`⚠️ [EventBus DLQ] Delivery failed for topic '${event.topic}':`, error.message);
    this.deadLetterQueue.push({
      event,
      error: error.message,
      failedAt: new Date().toISOString(),
    });

    // Retain only last 100 failed events to prevent memory bloating
    if (this.deadLetterQueue.length > 100) {
      this.deadLetterQueue.shift();
    }
  }

  getMetrics() {
    return {
      topicsRegistered: this.eventNames().length,
      ...this.metrics,
      dlqSize: this.deadLetterQueue.length,
      recentDLQ: this.deadLetterQueue.slice(-5),
    };
  }
}

export const eventBus = new EventBus();
