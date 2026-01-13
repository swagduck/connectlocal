/**
 * Redis-based Rate Limiting Service
 * Provides distributed rate limiting for authentication and API endpoints
 */

const Redis = require('ioredis');
const config = require('../config');

class RateLimitService {
  constructor() {
    this.redis = null;
    this.initializeRedis();
  }

  /**
   * Initialize Redis connection
   */
  async initializeRedis() {
    try {
      this.redis = new Redis(config.redis.url, config.redis.options);
      
      this.redis.on('connect', () => {
        console.log('✅ Rate limiting Redis connected');
      });
      
      this.redis.on('error', (err) => {
        console.error('❌ Rate limiting Redis error:', err);
      });
      
      // Test connection
      await this.redis.ping();
    } catch (error) {
      console.error('❌ Failed to connect to rate limiting Redis:', error.message);
      this.redis = null;
    }
  }

  /**
   * Check if user/IP is rate limited
   */
  async isRateLimitExceeded(key, maxAttempts, windowMinutes) {
    if (!this.redis) {
      console.warn('⚠️ Redis not available, skipping rate limiting');
      return { exceeded: false, remaining: maxAttempts };
    }

    try {
      const redisKey = `${config.redis.keyPrefix}rate_limit:${key}`;
      const current = await this.redis.incr(redisKey);
      
      // Set expiration on first attempt
      if (current === 1) {
        await this.redis.expire(redisKey, windowMinutes * 60);
      }

      const remaining = Math.max(0, maxAttempts - current);
      const exceeded = current > maxAttempts;

      return {
        exceeded,
        remaining,
        current,
        maxAttempts,
        ttl: await this.redis.ttl(redisKey)
      };
    } catch (error) {
      console.error('Rate limiting check error:', error);
      // Fail open - allow request if Redis fails
      return { exceeded: false, remaining: maxAttempts };
    }
  }

  /**
   * Check login attempts for IP or email
   */
  async checkLoginAttempts(identifier, type = 'ip') {
    const key = `login_attempts:${type}:${identifier}`;
    const maxAttempts = config.user.rateLimit.loginAttempts;
    const windowMinutes = config.user.rateLimit.lockoutMinutes;

    return await this.isRateLimitExceeded(key, maxAttempts, windowMinutes);
  }

  /**
   * Check registration attempts for IP
   */
  async checkRegistrationAttempts(ip) {
    const key = `registration_attempts:${ip}`;
    const maxAttempts = config.user.rateLimit.registrationAttempts;
    const windowMinutes = config.user.rateLimit.registrationLockoutMinutes;

    return await this.isRateLimitExceeded(key, maxAttempts, windowMinutes);
  }

  /**
   * Check API endpoint rate limiting
   */
  async checkApiRateLimit(userId, endpoint, customLimit = null) {
    const key = `api_limit:${userId}:${endpoint}`;
    const maxRequests = customLimit || 200; // Default API rate limit
    const windowMinutes = 15; // 15-minute window

    return await this.isRateLimitExceeded(key, maxRequests, windowMinutes);
  }

  /**
   * Reset rate limit for a key
   */
  async resetRateLimit(key) {
    if (!this.redis) {
      console.warn('⚠️ Redis not available, cannot reset rate limit');
      return false;
    }

    try {
      const redisKey = `${config.redis.keyPrefix}rate_limit:${key}`;
      const result = await this.redis.del(redisKey);
      
      if (result > 0) {
        console.log(`🔄 Rate limit reset for key: ${key}`);
      }
      
      return result > 0;
    } catch (error) {
      console.error('Rate limit reset error:', error);
      return false;
    }
  }

  /**
   * Get current rate limit status
   */
  async getRateLimitStatus(key) {
    if (!this.redis) {
      return { status: 'unavailable' };
    }

    try {
      const redisKey = `${config.redis.keyPrefix}rate_limit:${key}`;
      const [current, ttl] = await Promise.all([
        this.redis.get(redisKey),
        this.redis.ttl(redisKey)
      ]);

      return {
        status: 'active',
        current: current ? parseInt(current) : 0,
        ttl: ttl > 0 ? ttl : null
      };
    } catch (error) {
      console.error('Rate limit status error:', error);
      return { status: 'error' };
    }
  }

  /**
   * Clean up expired rate limit keys (maintenance)
   */
  async cleanupExpiredKeys() {
    if (!this.redis) {
      return;
    }

    try {
      const pattern = `${config.redis.keyPrefix}rate_limit:*`;
      const keys = await this.redis.keys(pattern);
      
      if (keys.length === 0) {
        return;
      }

      // Check TTL for each key and remove expired ones
      const pipeline = this.redis.pipeline();
      let cleanedCount = 0;

      for (const key of keys) {
        const ttl = await this.redis.ttl(key);
        if (ttl === -1) { // No expiration set, remove it
          pipeline.del(key);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        await pipeline.exec();
        console.log(`🧹 Cleaned up ${cleanedCount} expired rate limit keys`);
      }
    } catch (error) {
      console.error('Rate limit cleanup error:', error);
    }
  }

  /**
   * Get rate limiting statistics
   */
  async getStats() {
    if (!this.redis) {
      return { status: 'unavailable' };
    }

    try {
      const pattern = `${config.redis.keyPrefix}rate_limit:*`;
      const keys = await this.redis.keys(pattern);
      
      const stats = {
        totalKeys: keys.length,
        activeKeys: 0,
        types: {
          login_attempts: 0,
          registration_attempts: 0,
          api_limit: 0,
          other: 0
        }
      };

      for (const key of keys) {
        const ttl = await this.redis.ttl(key);
        if (ttl > 0) {
          stats.activeKeys++;
        }

        // Categorize by type
        if (key.includes('login_attempts')) {
          stats.types.login_attempts++;
        } else if (key.includes('registration_attempts')) {
          stats.types.registration_attempts++;
        } else if (key.includes('api_limit')) {
          stats.types.api_limit++;
        } else {
          stats.types.other++;
        }
      }

      return stats;
    } catch (error) {
      console.error('Rate limiting stats error:', error);
      return { status: 'error' };
    }
  }

  /**
   * Health check for rate limiting service
   */
  async healthCheck() {
    const health = {
      status: 'healthy',
      redis: false,
      stats: null
    };

    try {
      if (this.redis) {
        await this.redis.ping();
        health.redis = true;
        health.stats = await this.getStats();
      } else {
        health.status = 'degraded';
        health.reason = 'Redis not available';
      }
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
        console.log('🔌 Rate limiting Redis connection closed');
      }
    } catch (error) {
      console.error('Rate limiting shutdown error:', error);
    }
  }
}

// Create singleton instance
const rateLimitService = new RateLimitService();

// Schedule cleanup every hour
setInterval(() => {
  rateLimitService.cleanupExpiredKeys();
}, 60 * 60 * 1000);

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  await rateLimitService.shutdown();
});

process.on('SIGINT', async () => {
  await rateLimitService.shutdown();
});

module.exports = rateLimitService;
