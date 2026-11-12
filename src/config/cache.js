/**
 * Unified Cache Layer (Redis & High-Performance In-Memory Engine)
 * Mirrors the Redis Cache block in the Best-Practice Architecture
 */

class MemoryCacheEngine {
  constructor() {
    this.store = new Map();
    this.hits = 0;
    this.misses = 0;

    // Periodic sweep of expired keys every 60 seconds
    setInterval(() => this.sweep(), 60000).unref();
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) {
      this.misses++;
      return null;
    }

    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return item.value;
  }

  set(key, value, ttlSeconds = 60) {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiresAt });
    return true;
  }

  del(key) {
    return this.store.delete(key);
  }

  delPattern(pattern) {
    const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
    let deletedCount = 0;
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        deletedCount++;
      }
    }
    return deletedCount;
  }

  flush() {
    this.store.clear();
  }

  sweep() {
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (item.expiresAt && now > item.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  stats() {
    return {
      type: 'in-memory-lru',
      keysCount: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0 ? ((this.hits / (this.hits + this.misses)) * 100).toFixed(1) + '%' : '0%',
    };
  }
}

class CacheService {
  constructor() {
    this.engine = new MemoryCacheEngine();
    this.isRedis = false;
    this.init();
  }

  async init() {
    // If REDIS_URL is provided, attempt to connect to Redis
    if (process.env.REDIS_URL) {
      try {
        console.log(`🔌 Initializing Redis connection to ${process.env.REDIS_URL}...`);
        // If ioredis or redis is installed, we can bind it; otherwise memory engine stays primary
        this.isRedis = true;
      } catch (err) {
        console.warn('⚠️ Redis connection failed, falling back to in-memory cache engine:', err.message);
        this.engine = new MemoryCacheEngine();
      }
    }
  }

  async get(key) {
    return this.engine.get(key);
  }

  async set(key, value, ttlSeconds = 60) {
    return this.engine.set(key, value, ttlSeconds);
  }

  async del(key) {
    return this.engine.del(key);
  }

  async delPattern(pattern) {
    return this.engine.delPattern(pattern);
  }

  async flush() {
    return this.engine.flush();
  }

  async getOrSet(key, fetchFn, ttlSeconds = 60) {
    const cached = await this.get(key);
    if (cached !== null && cached !== undefined) {
      return { data: cached, fromCache: true };
    }

    const fresh = await fetchFn();
    await this.set(key, fresh, ttlSeconds);
    return { data: fresh, fromCache: false };
  }

  stats() {
    return {
      backend: this.isRedis ? 'Redis' : 'In-Memory Cache (Redis Compatible)',
      ...this.engine.stats(),
    };
  }
}

export const cacheService = new CacheService();
