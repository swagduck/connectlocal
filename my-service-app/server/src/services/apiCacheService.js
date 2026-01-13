/**
 * API Cache Service
 * Provides intelligent caching and rate limiting for expensive external API calls
 */

const Redis = require('ioredis');
const config = require('../config');

class APICacheService {
  constructor() {
    this.redis = null;
    this.memoryCache = new Map();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };
    
    this.initializeRedis();
  }

  /**
   * Initialize Redis connection
   */
  async initializeRedis() {
    try {
      this.redis = new Redis(config.redis.url, config.redis.options);
      
      this.redis.on('connect', () => {
        console.log('✅ Redis cache connected');
      });
      
      this.redis.on('error', (err) => {
        console.error('❌ Redis cache error:', err);
        console.log('⚠️ Falling back to memory cache');
      });
      
      // Test connection
      await this.redis.ping();
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error.message);
      console.log('⚠️ Using memory cache only');
      this.redis = null;
    }
  }

  /**
   * Generate cache key
   */
  generateKey(service, api, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join(':');
    
    return `${config.redis.keyPrefix}cache:${service}:${api}:${paramString}`;
  }

  /**
   * Get cached data
   */
  async get(service, api, params = {}) {
    const key = this.generateKey(service, api, params);
    
    try {
      // Try Redis first
      if (this.redis) {
        const cached = await this.redis.get(key);
        if (cached) {
          this.cacheStats.hits++;
          return JSON.parse(cached);
        }
      }
      
      // Fallback to memory cache
      const memoryCached = this.memoryCache.get(key);
      if (memoryCached && memoryCached.expiresAt > Date.now()) {
        this.cacheStats.hits++;
        return memoryCached.data;
      }
      
      this.cacheStats.misses++;
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      this.cacheStats.misses++;
      return null;
    }
  }

  /**
   * Set cached data
   */
  async set(service, api, data, params = {}, customTTL = null) {
    const key = this.generateKey(service, api, params);
    const ttl = customTTL || this.getTTL(service, api);
    
    try {
      // Set in Redis
      if (this.redis) {
        await this.redis.setex(key, ttl, JSON.stringify(data));
      }
      
      // Set in memory cache as fallback
      this.memoryCache.set(key, {
        data,
        expiresAt: Date.now() + (ttl * 1000),
      });
      
      // Clean up memory cache if it gets too large
      if (this.memoryCache.size > 1000) {
        this.cleanupMemoryCache();
      }
      
      this.cacheStats.sets++;
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete cached data
   */
  async delete(service, api, params = {}) {
    const key = this.generateKey(service, api, params);
    
    try {
      // Delete from Redis
      if (this.redis) {
        await this.redis.del(key);
      }
      
      // Delete from memory cache
      this.memoryCache.delete(key);
      
      this.cacheStats.deletes++;
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Clear all cache for a service
   */
  async clearService(service) {
    try {
      if (this.redis) {
        const pattern = `${config.redis.keyPrefix}cache:${service}:*`;
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }
      
      // Clear memory cache
      for (const key of this.memoryCache.keys()) {
        if (key.includes(`cache:${service}:`)) {
          this.memoryCache.delete(key);
        }
      }
      
      console.log(`🧹 Cleared cache for service: ${service}`);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Get TTL for different services/APIs
   */
  getTTL(service, api) {
    const ttlConfig = config.cache.ttl;
    
    switch (service) {
      case 'google':
        switch (api) {
          case 'maps':
            return ttlConfig.mapData || 7 * 24 * 60 * 60; // 7 days
          default:
            return ttlConfig.default || 60 * 60; // 1 hour
        }
      
      case 'ai':
        switch (api) {
          case 'gemini':
            return ttlConfig.aiResponses || 24 * 60 * 60; // 24 hours
          default:
            return ttlConfig.default || 60 * 60;
        }
      
      default:
        return ttlConfig.default || 60 * 60;
    }
  }

  /**
   * Clean up expired memory cache entries
   */
  cleanupMemoryCache() {
    const now = Date.now();
    const keysToDelete = [];
    
    for (const [key, value] of this.memoryCache.entries()) {
      if (value.expiresAt <= now) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.memoryCache.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`🧹 Cleaned up ${keysToDelete.length} expired memory cache entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.cacheStats.hits + this.cacheStats.misses > 0 
      ? (this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses)) * 100 
      : 0;
    
    return {
      ...this.cacheStats,
      hitRate: hitRate.toFixed(2) + '%',
      memoryCacheSize: this.memoryCache.size,
      redisConnected: !!this.redis,
    };
  }

  /**
   * Cached API call wrapper
   */
  async cachedCall(service, api, apiFunction, params = {}, cacheOptions = {}) {
    const { ttl, bypassCache = false, forceRefresh = false } = cacheOptions;
    
    // Generate cache key
    const cacheKey = this.generateKey(service, api, params);
    
    // Try to get from cache (unless bypassed)
    if (!bypassCache && !forceRefresh) {
      const cached = await this.get(service, api, params);
      if (cached) {
        console.log(`🎯 Cache hit: ${service}/${api}`);
        return cached;
      }
    }
    
    // Make API call
    console.log(`🌐 API call: ${service}/${api}`);
    const result = await apiFunction(params);
    
    // Cache the result
    if (result && !bypassCache) {
      await this.set(service, api, result, params, ttl);
    }
    
    return result;
  }

  /**
   * Batch cache operations
   */
  async batchGet(keys) {
    const results = {};
    
    try {
      if (this.redis) {
        // Use Redis MGET for batch operations
        const values = await this.redis.mget(...keys);
        keys.forEach((key, index) => {
          if (values[index]) {
            results[key] = JSON.parse(values[index]);
          }
        });
      } else {
        // Fallback to memory cache
        keys.forEach(key => {
          const cached = this.memoryCache.get(key);
          if (cached && cached.expiresAt > Date.now()) {
            results[key] = cached.data;
          }
        });
      }
    } catch (error) {
      console.error('Batch cache get error:', error);
    }
    
    return results;
  }

  /**
   * Batch cache set
   */
  async batchSet(entries, defaultTTL = 3600) {
    try {
      if (this.redis) {
        // Use Redis pipeline for batch operations
        const pipeline = this.redis.pipeline();
        
        entries.forEach(({ key, data, ttl = defaultTTL }) => {
          pipeline.setex(key, ttl, JSON.stringify(data));
        });
        
        await pipeline.exec();
      }
      
      // Also set in memory cache
      entries.forEach(({ key, data, ttl = defaultTTL }) => {
        this.memoryCache.set(key, {
          data,
          expiresAt: Date.now() + (ttl * 1000),
        });
      });
      
      console.log(`📦 Batch cached ${entries.length} entries`);
    } catch (error) {
      console.error('Batch cache set error:', error);
    }
  }

  /**
   * Cache warming for frequently accessed data
   */
  async warmCache(service, api, warmupData = []) {
    console.log(`🔥 Warming cache for ${service}/${api}`);
    
    for (const { params, data, ttl } of warmupData) {
      await this.set(service, api, data, params, ttl);
    }
    
    console.log(`✅ Cache warming completed: ${warmupData.length} entries`);
  }

  /**
   * Cache invalidation patterns
   */
  async invalidatePattern(pattern) {
    try {
      if (this.redis) {
        const keys = await this.redis.keys(`${config.redis.keyPrefix}${pattern}`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
          console.log(`🗑️ Invalidated ${keys.length} cache entries matching pattern: ${pattern}`);
        }
      }
      
      // Also invalidate from memory cache
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      for (const key of this.memoryCache.keys()) {
        if (regex.test(key)) {
          this.memoryCache.delete(key);
        }
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  /**
   * Health check for cache service
   */
  async healthCheck() {
    const health = {
      status: 'healthy',
      redis: false,
      memory: false,
      stats: this.getStats(),
    };
    
    try {
      // Check Redis
      if (this.redis) {
        await this.redis.ping();
        health.redis = true;
      }
      
      // Check memory cache
      health.memory = this.memoryCache.size > 0;
      
      // Overall status
      health.status = (health.redis || health.memory) ? 'healthy' : 'unhealthy';
    } catch (error) {
      health.status = 'unhealthy';
      health.error = error.message;
    }
    
    return health;
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    try {
      if (this.redis) {
        await this.redis.quit();
        console.log('🔌 Redis cache connection closed');
      }
      
      this.memoryCache.clear();
      console.log('🧹 Memory cache cleared');
    } catch (error) {
      console.error('Cache shutdown error:', error);
    }
  }
}

// Create singleton instance
const apiCacheService = new APICacheService();

// Schedule memory cache cleanup every hour
setInterval(() => {
  apiCacheService.cleanupMemoryCache();
}, 60 * 60 * 1000);

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  await apiCacheService.shutdown();
});

process.on('SIGINT', async () => {
  await apiCacheService.shutdown();
});

module.exports = apiCacheService;
