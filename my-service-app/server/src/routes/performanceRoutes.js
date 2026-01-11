const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// In-memory storage for performance metrics (in production, use database)
const performanceMetrics = {
  vitals: [],
  custom: [],
  sessions: new Map(),
  aggregated: {
    daily: new Map(),
    hourly: new Map()
  }
};

// Store performance metrics
router.post('/metrics', protect, async (req, res) => {
  try {
    const { vitals, custom, session, score } = req.body;
    
    // Store metrics
    if (vitals && Array.isArray(vitals)) {
      performanceMetrics.vitals.push(...vitals);
    }
    
    if (custom && Array.isArray(custom)) {
      performanceMetrics.custom.push(...custom);
    }
    
    if (session) {
      const sessionId = session.startTime || Date.now();
      performanceMetrics.sessions.set(sessionId, session);
    }
    
    // Aggregate metrics
    aggregateMetrics();
    
    // Keep only recent data (last 1000 events)
    if (performanceMetrics.vitals.length > 1000) {
      performanceMetrics.vitals = performanceMetrics.vitals.slice(-1000);
    }
    
    if (performanceMetrics.custom.length > 1000) {
      performanceMetrics.custom = performanceMetrics.custom.slice(-1000);
    }
    
    res.json({
      success: true,
      message: 'Performance metrics stored successfully'
    });
  } catch (error) {
    console.error('Error storing performance metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to store performance metrics'
    });
  }
});

// Get performance metrics
router.get('/metrics', protect, async (req, res) => {
  try {
    const { type = 'all', period = '24h' } = req.query;
    
    let data = {};
    
    switch (type) {
      case 'vitals':
        data = getMetricsByPeriod(performanceMetrics.vitals, period);
        break;
      case 'custom':
        data = getMetricsByPeriod(performanceMetrics.custom, period);
        break;
      case 'sessions':
        data = Array.from(performanceMetrics.sessions.values());
        break;
      case 'aggregated':
        data = {
          daily: Array.from(performanceMetrics.aggregated.daily.entries()),
          hourly: Array.from(performanceMetrics.aggregated.hourly.entries())
        };
        break;
      default:
        data = {
          vitals: getMetricsByPeriod(performanceMetrics.vitals, period),
          custom: getMetricsByPeriod(performanceMetrics.custom, period),
          sessions: Array.from(performanceMetrics.sessions.values()),
          aggregated: {
            daily: Array.from(performanceMetrics.aggregated.daily.entries()),
            hourly: Array.from(performanceMetrics.aggregated.hourly.entries())
          }
        };
    }
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get performance metrics'
    });
  }
});

// Get performance score
router.get('/score', protect, async (req, res) => {
  try {
    const { period = '24h' } = req.query;
    
    const recentVitals = getMetricsByPeriod(performanceMetrics.vitals, period);
    const score = calculatePerformanceScore(recentVitals);
    
    res.json({
      success: true,
      data: {
        score,
        grade: getPerformanceGrade(score),
        metrics: recentVitals.length
      }
    });
  } catch (error) {
    console.error('Error calculating performance score:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate performance score'
    });
  }
});

// Get performance insights
router.get('/insights', protect, async (req, res) => {
  try {
    const insights = generatePerformanceInsights();
    
    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Error generating performance insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate performance insights'
    });
  }
});

// Helper functions
const getMetricsByPeriod = (metrics, period) => {
  const now = Date.now();
  let cutoffTime;
  
  switch (period) {
    case '1h':
      cutoffTime = now - (60 * 60 * 1000);
      break;
    case '24h':
      cutoffTime = now - (24 * 60 * 60 * 1000);
      break;
    case '7d':
      cutoffTime = now - (7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      cutoffTime = now - (30 * 24 * 60 * 60 * 1000);
      break;
    default:
      cutoffTime = now - (24 * 60 * 60 * 1000);
  }
  
  return metrics.filter(metric => metric.timestamp > cutoffTime);
};

const calculatePerformanceScore = (vitals) => {
  if (vitals.length === 0) return 100;
  
  const thresholds = {
    lcp: 2500,
    fid: 100,
    cls: 0.1,
    fcp: 1800,
    ttfb: 800
  };
  
  let totalScore = 0;
  let count = 0;
  
  vitals.forEach(vital => {
    const { name, value } = vital;
    const threshold = thresholds[name];
    
    if (threshold) {
      const score = Math.max(0, Math.min(100, (1 - (value / threshold)) * 100));
      totalScore += score;
      count++;
    }
  });
  
  return count > 0 ? Math.round(totalScore / count) : 100;
};

const getPerformanceGrade = (score) => {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
};

const aggregateMetrics = () => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentHour = now.getHours();
  
  // Aggregate daily metrics
  const todayVitals = performanceMetrics.vitals.filter(v => 
    new Date(v.timestamp).toISOString().split('T')[0] === today
  );
  
  const todayCustom = performanceMetrics.custom.filter(v => 
    new Date(v.timestamp).toISOString().split('T')[0] === today
  );
  
  performanceMetrics.aggregated.daily.set(today, {
    vitals: todayVitals,
    custom: todayCustom,
    score: calculatePerformanceScore(todayVitals),
    count: todayVitals.length + todayCustom.length
  });
  
  // Aggregate hourly metrics
  const hourVitals = performanceMetrics.vitals.filter(v => 
    new Date(v.timestamp).getHours() === currentHour
  );
  
  const hourCustom = performanceMetrics.custom.filter(v => 
    new Date(v.timestamp).getHours() === currentHour
  );
  
  performanceMetrics.aggregated.hourly.set(currentHour, {
    vitals: hourVitals,
    custom: hourCustom,
    score: calculatePerformanceScore(hourVitals),
    count: hourVitals.length + hourCustom.length
  });
  
  // Keep only last 30 days and 24 hours
  if (performanceMetrics.aggregated.daily.size > 30) {
    const entries = Array.from(performanceMetrics.aggregated.daily.entries());
    const recentEntries = entries.slice(-30);
    performanceMetrics.aggregated.daily.clear();
    recentEntries.forEach(([key, value]) => {
      performanceMetrics.aggregated.daily.set(key, value);
    });
  }
  
  if (performanceMetrics.aggregated.hourly.size > 24) {
    const entries = Array.from(performanceMetrics.aggregated.hourly.entries());
    const recentEntries = entries.slice(-24);
    performanceMetrics.aggregated.hourly.clear();
    recentEntries.forEach(([key, value]) => {
      performanceMetrics.aggregated.hourly.set(key, value);
    });
  }
};

const generatePerformanceInsights = () => {
  const recentVitals = getMetricsByPeriod(performanceMetrics.vitals, '24h');
  const recentCustom = getMetricsByPeriod(performanceMetrics.custom, '24h');
  
  const insights = {
    performance: {
      score: calculatePerformanceScore(recentVitals),
      grade: getPerformanceGrade(calculatePerformanceScore(recentVitals)),
      trend: getPerformanceTrend()
    },
    issues: identifyPerformanceIssues(recentVitals, recentCustom),
    recommendations: generateRecommendations(recentVitals, recentCustom),
    summary: {
      totalMetrics: recentVitals.length + recentCustom.length,
      errorRate: calculateErrorRate(recentCustom),
      averageResponseTime: calculateAverageResponseTime(recentCustom)
    }
  };
  
  return insights;
};

const getPerformanceTrend = () => {
  const dailyScores = Array.from(performanceMetrics.aggregated.daily.values())
    .slice(-7)
    .map(day => day.score);
  
  if (dailyScores.length < 2) return 'stable';
  
  const recent = dailyScores.slice(-3);
  const older = dailyScores.slice(-6, -3);
  
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
  
  if (recentAvg > olderAvg + 5) return 'improving';
  if (recentAvg < olderAvg - 5) return 'degrading';
  return 'stable';
};

const identifyPerformanceIssues = (vitals, custom) => {
  const issues = [];
  
  // Check Core Web Vitals
  vitals.forEach(vital => {
    const thresholds = {
      lcp: 2500,
      fid: 100,
      cls: 0.1,
      fcp: 1800,
      ttfb: 800
    };
    
    if (vital.value > thresholds[vital.name]) {
      issues.push({
        type: 'vital',
        name: vital.name,
        value: vital.value,
        threshold: thresholds[vital.name],
        severity: vital.value > thresholds[vital.name] * 2 ? 'high' : 'medium'
      });
    }
  });
  
  // Check custom metrics
  custom.forEach(metric => {
    if (metric.name === 'api-request' && metric.value > 1000) {
      issues.push({
        type: 'api',
        name: 'slow-api',
        value: metric.value,
        threshold: 1000,
        severity: metric.value > 2000 ? 'high' : 'medium'
      });
    }
    
    if (metric.name === 'javascript-error') {
      issues.push({
        type: 'error',
        name: 'js-error',
        value: 1,
        severity: 'high'
      });
    }
    
    if (metric.name === 'memory-usage' && metric.value > 50) {
      issues.push({
        type: 'memory',
        name: 'high-memory',
        value: metric.value,
        threshold: 50,
        severity: metric.value > 100 ? 'high' : 'medium'
      });
    }
  });
  
  return issues;
};

const generateRecommendations = (vitals, custom) => {
  const recommendations = [];
  const issues = identifyPerformanceIssues(vitals, custom);
  
  issues.forEach(issue => {
    switch (issue.type) {
      case 'vital':
        if (issue.name === 'lcp') {
          recommendations.push({
            priority: 'high',
            title: 'Optimize Largest Contentful Paint',
            description: 'Reduce image sizes and optimize loading critical resources',
            action: 'Implement lazy loading and optimize images'
          });
        }
        if (issue.name === 'fid') {
          recommendations.push({
            priority: 'high',
            title: 'Reduce First Input Delay',
            description: 'Minimize JavaScript execution time and break up long tasks',
            action: 'Implement code splitting and reduce main thread work'
          });
        }
        if (issue.name === 'cls') {
          recommendations.push({
            priority: 'medium',
            title: 'Reduce Cumulative Layout Shift',
            description: 'Ensure elements have defined dimensions and avoid inserting content above existing content',
            action: 'Add size attributes to images and reserve space for dynamic content'
          });
        }
        break;
        
      case 'api':
        recommendations.push({
          priority: 'high',
          title: 'Optimize API Response Times',
          description: 'Implement caching and optimize database queries',
          action: 'Add response caching and optimize slow endpoints'
        });
        break;
        
      case 'memory':
        recommendations.push({
          priority: 'medium',
          title: 'Reduce Memory Usage',
          description: 'Fix memory leaks and optimize data structures',
          action: 'Implement proper cleanup and reduce memory allocations'
        });
        break;
        
      case 'error':
        recommendations.push({
          priority: 'high',
          title: 'Fix JavaScript Errors',
          description: 'Address runtime errors and improve error handling',
          action: 'Add proper error boundaries and improve error handling'
        });
        break;
    }
  });
  
  return recommendations;
};

const calculateErrorRate = (custom) => {
  const errors = custom.filter(m => m.name === 'javascript-error' || m.name === 'unhandled-promise-rejection');
  const total = custom.length;
  return total > 0 ? (errors.length / total) * 100 : 0;
};

const calculateAverageResponseTime = (custom) => {
  const apiCalls = custom.filter(m => m.name === 'api-request');
  if (apiCalls.length === 0) return 0;
  
  const totalTime = apiCalls.reduce((sum, m) => sum + m.value, 0);
  return totalTime / apiCalls.length;
};

module.exports = router;
