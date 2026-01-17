/**
 * Memory-based Rate Limiting Service
 * Provides rate limiting for authentication and API endpoints using memory storage
 */

const config = require('../config');

class RateLimitService {
  constructor() {
    this.memoryStore = new Map();
    console.log('⚠️ Rate limiting using memory storage (Redis disabled)');
  }

  /**
   * Check if user/IP is rate limited
   */
  async isRateLimitExceeded(key, maxAttempts, windowMinutes) {
    try {
      const now = Date.now();
      const windowMs = windowMinutes * 60 * 1000;
      const record = this.memoryStore.get(key);

      if (!record) {
        // First request
        this.memoryStore.set(key, {
          count: 1,
          resetTime: now + windowMs
        });
        return { 
          exceeded: false, 
          remaining: maxAttempts - 1,
          resetTime: now + windowMs
        };
      }

      // Check if window has expired
      if (now > record.resetTime) {
        // Reset window
        this.memoryStore.set(key, {
          count: 1,
          resetTime: now + windowMs
        });
        return { 
          exceeded: false, 
          remaining: maxAttempts - 1,
          resetTime: now + windowMs
        };
      }

      // Increment count
      record.count++;
      
      if (record.count > maxAttempts) {
        return { 
          exceeded: true, 
          remaining: 0,
          resetTime: record.resetTime
        };
      }

      return { 
        exceeded: false, 
        remaining: maxAttempts - record.count,
        resetTime: record.resetTime
      };
    } catch (error) {
      console.error('Rate limiting check error:', error);
      // Fail open - allow request if memory store fails
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
    try {
      const deleted = this.memoryStore.delete(key);
      
      if (deleted) {
        console.log(`🔄 Rate limit reset for key: ${key}`);
      }
      
      return deleted;
    } catch (error) {
      console.error('Rate limit reset error:', error);
      return false;
    }
  }

  /**
   * Get current rate limit status
   */
  async getRateLimitStatus(key) {
    try {
      const record = this.memoryStore.get(key);
      
      if (!record) {
        return { status: 'not_found', current: 0 };
      }

      const now = Date.now();
      if (now > record.resetTime) {
        return { status: 'expired', current: 0 };
      }

      return {
        status: 'active',
        current: record.count,
        resetTime: record.resetTime,
        remainingTime: Math.max(0, record.resetTime - now)
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
    try {
      const now = Date.now();
      let cleanedCount = 0;

      for (const [key, record] of this.memoryStore.entries()) {
        if (now > record.resetTime) {
          this.memoryStore.delete(key);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
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
    try {
      const now = Date.now();
      const stats = {
        totalKeys: this.memoryStore.size,
        activeKeys: 0,
        types: {
          login_attempts: 0,
          registration_attempts: 0,
          api_limit: 0,
          other: 0
        }
      };

      for (const [key, record] of this.memoryStore.entries()) {
        if (now <= record.resetTime) {
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
      memory: true,
      stats: null
    };

    try {
      health.stats = await this.getStats();
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
      this.memoryStore.clear();
      console.log('🔌 Rate limiting memory store cleared');
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
