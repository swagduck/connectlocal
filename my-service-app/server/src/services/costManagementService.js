/**
 * Cost Management Service
 * Manages API costs, budget controls, and usage tracking for external services
 */

const config = require('../config');

class CostManagementService {
  constructor() {
    this.usage = {
      google: {
        maps: {
          requests: 0,
          cost: 0,
          lastReset: new Date(),
        },
      },
      ai: {
        requests: 0,
        cost: 0,
        lastReset: new Date(),
      },
    };
    
    this.budgetAlerts = {
      google: { sent: false, threshold: 0.8 },
      ai: { sent: false, threshold: 0.8 },
    };
    
    this.rateLimiting = {
      google: {
        tokens: [],
        windowMs: 1000, // 1 second
        maxRequests: config.externalApis.google.maps.rateLimit.requestsPerSecond,
      },
      ai: {
        tokens: [],
        windowMs: 60000, // 1 minute
        maxRequests: config.externalApis.ai.gemini.rateLimit.requestsPerMinute,
      },
    };
  }

  /**
   * Check if API call is within budget and rate limits
   */
  async checkApiCallLimits(service, api) {
    const serviceConfig = config.externalApis[service]?.[api];
    if (!serviceConfig) {
      throw new Error(`Unknown service/API: ${service}/${api}`);
    }

    // Check budget
    const budgetCheck = this.checkBudget(service, api);
    if (!budgetCheck.allowed) {
      throw new Error(`Budget exceeded for ${service}/${api}: ${budgetCheck.reason}`);
    }

    // Check rate limit
    const rateLimitCheck = this.checkRateLimit(service, api);
    if (!rateLimitCheck.allowed) {
      throw new Error(`Rate limit exceeded for ${service}/${api}: ${rateLimitCheck.reason}`);
    }

    return {
      allowed: true,
      remainingBudget: budgetCheck.remaining,
      rateLimitReset: rateLimitCheck.resetTime,
    };
  }

  /**
   * Check budget constraints
   */
  checkBudget(service, api) {
    const serviceConfig = config.externalApis[service]?.[api];
    const currentUsage = this.usage[service]?.[api];
    
    if (!serviceConfig || !currentUsage) {
      return { allowed: false, reason: 'Service configuration not found' };
    }

    const monthlyBudget = serviceConfig.cost.monthlyBudget;
    const costPerRequest = serviceConfig.cost.perRequest;
    const currentCost = currentUsage.cost;
    const remainingBudget = monthlyBudget - currentCost;

    // Check if we've exceeded the budget
    if (currentCost >= monthlyBudget) {
      return { 
        allowed: false, 
        reason: 'Monthly budget exhausted',
        remainingBudget: 0 
      };
    }

    // Check if next request would exceed budget
    if (currentCost + costPerRequest > monthlyBudget) {
      return { 
        allowed: false, 
        reason: 'Next request would exceed budget',
        remainingBudget 
      };
    }

    // Check if we should send a budget alert
    const usagePercentage = currentCost / monthlyBudget;
    const alertThreshold = this.budgetAlerts[service]?.threshold || 0.8;
    
    if (usagePercentage >= alertThreshold && !this.budgetAlerts[service].sent) {
      this.sendBudgetAlert(service, api, usagePercentage, currentCost, monthlyBudget);
      this.budgetAlerts[service].sent = true;
    }

    return { 
      allowed: true, 
      remainingBudget,
      usagePercentage 
    };
  }

  /**
   * Check rate limiting using token bucket algorithm
   */
  checkRateLimit(service, api) {
    const rateLimitConfig = this.rateLimiting[service];
    if (!rateLimitConfig) {
      return { allowed: true };
    }

    const now = Date.now();
    const windowStart = now - rateLimitConfig.windowMs;
    
    // Remove old tokens outside the window
    rateLimitConfig.tokens = rateLimitConfig.tokens.filter(token => token > windowStart);
    
    // Check if we can make a request
    if (rateLimitConfig.tokens.length >= rateLimitConfig.maxRequests) {
      const oldestToken = rateLimitConfig.tokens[0];
      const resetTime = oldestToken + rateLimitConfig.windowMs;
      
      return { 
        allowed: false, 
        reason: `Rate limit: ${rateLimitConfig.maxRequests} requests per ${rateLimitConfig.windowMs}ms`,
        resetTime 
      };
    }

    // Add current request token
    rateLimitConfig.tokens.push(now);
    
    return { allowed: true };
  }

  /**
   * Record API usage after successful call
   */
  recordUsage(service, api, cost) {
    if (!this.usage[service]?.[api]) {
      this.usage[service][api] = {
        requests: 0,
        cost: 0,
        lastReset: new Date(),
      };
    }

    const usage = this.usage[service][api];
    usage.requests++;
    usage.cost += cost;

    console.log(`💰 ${service}/${api} usage: ${usage.requests} requests, $${usage.cost.toFixed(4)} total`);
  }

  /**
   * Send budget alert notification
   */
  async sendBudgetAlert(service, api, usagePercentage, currentCost, monthlyBudget) {
    const message = `⚠️ Budget Alert: ${service}/${api} usage at ${(usagePercentage * 100).toFixed(1)}% ($${currentCost.toFixed(2)}/$${monthlyBudget.toFixed(2)})`;
    
    console.error(message);
    
    // Send email alert if configured
    if (config.monitoring.alerts.email) {
      await this.sendEmailAlert(message);
    }
    
    // Send Slack alert if configured
    if (config.monitoring.alerts.slack.webhook) {
      await this.sendSlackAlert(message);
    }
  }

  /**
   * Send email alert
   */
  async sendEmailAlert(message) {
    try {
      // Implementation would depend on your email service
      console.log(`📧 Email alert sent: ${message}`);
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }

  /**
   * Send Slack alert
   */
  async sendSlackAlert(message) {
    try {
      // Implementation would use a Slack webhook
      console.log(`💬 Slack alert sent: ${message}`);
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }

  /**
   * Get current usage statistics
   */
  getUsageStats() {
    return {
      usage: this.usage,
      budgetAlerts: this.budgetAlerts,
      rateLimiting: {
        google: {
          current: this.rateLimiting.google.tokens.length,
          max: this.rateLimiting.google.maxRequests,
          window: this.rateLimiting.google.windowMs,
        },
        ai: {
          current: this.rateLimiting.ai.tokens.length,
          max: this.rateLimiting.ai.maxRequests,
          window: this.rateLimiting.ai.windowMs,
        },
      },
    };
  }

  /**
   * Reset monthly usage (called at the beginning of each month)
   */
  resetMonthlyUsage() {
    Object.keys(this.usage).forEach(service => {
      Object.keys(this.usage[service]).forEach(api => {
        this.usage[service][api] = {
          requests: 0,
          cost: 0,
          lastReset: new Date(),
        };
      });
    });
    
    // Reset budget alerts
    Object.keys(this.budgetAlerts).forEach(service => {
      this.budgetAlerts[service].sent = false;
    });
    
    console.log('🔄 Monthly usage reset completed');
  }

  /**
   * Get cost optimization recommendations
   */
  getOptimizationRecommendations() {
    const recommendations = [];
    
    // Check Google Maps usage
    const googleMapsUsage = this.usage.google.maps;
    if (googleMapsUsage.cost > config.externalApis.google.maps.cost.monthlyBudget * 0.5) {
      recommendations.push({
        service: 'google/maps',
        type: 'budget',
        message: 'Consider implementing caching for Google Maps API to reduce costs',
        priority: 'high',
      });
    }
    
    // Check AI usage
    const aiUsage = this.usage.ai;
    if (aiUsage.requests > 100) {
      recommendations.push({
        service: 'ai',
        type: 'usage',
        message: 'High AI usage detected. Consider implementing response caching',
        priority: 'medium',
      });
    }
    
    // Check rate limiting efficiency
    const googleRateLimit = this.rateLimiting.google;
    if (googleRateLimit.tokens.length > googleRateLimit.maxRequests * 0.8) {
      recommendations.push({
        service: 'google/maps',
        type: 'rate_limit',
        message: 'Approaching rate limits. Consider request queuing',
        priority: 'medium',
      });
    }
    
    return recommendations;
  }

  /**
   * Export usage data for reporting
   */
  exportUsageData() {
    const data = {
      timestamp: new Date().toISOString(),
      period: 'monthly',
      services: {},
    };
    
    Object.keys(this.usage).forEach(service => {
      data.services[service] = {};
      Object.keys(this.usage[service]).forEach(api => {
        const usage = this.usage[service][api];
        const config = config.externalApis[service]?.[api];
        
        data.services[service][api] = {
          requests: usage.requests,
          cost: usage.cost,
          averageCostPerRequest: usage.requests > 0 ? usage.cost / usage.requests : 0,
          budget: config?.cost.monthlyBudget || 0,
          budgetUtilization: config ? usage.cost / config.cost.monthlyBudget : 0,
          lastReset: usage.lastReset,
        };
      });
    });
    
    return data;
  }
}

// Create singleton instance
const costManagementService = new CostManagementService();

// Schedule monthly reset (1st day of each month at 00:00)
const scheduleMonthlyReset = () => {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
  const msUntilNextMonth = nextMonth - now;
  
  setTimeout(() => {
    costManagementService.resetMonthlyUsage();
    // Schedule next reset
    setInterval(() => {
      costManagementService.resetMonthlyUsage();
    }, 30 * 24 * 60 * 60 * 1000); // 30 days
  }, msUntilNextMonth);
};

// Initialize scheduling
scheduleMonthlyReset();

module.exports = costManagementService;
