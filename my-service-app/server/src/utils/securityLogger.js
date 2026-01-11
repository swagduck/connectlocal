const fs = require('fs');
const path = require('path');

// Dynamic import for Sentry to avoid circular dependencies
let captureMessage, captureError;
try {
  const sentry = require('../config/sentry');
  captureMessage = sentry.captureMessage;
  captureError = sentry.captureError;
} catch (err) {
  // Sentry not available, use fallback functions
  console.log('⚠️ Sentry not available in securityLogger');
  captureMessage = () => {}; // Fallback no-op
  captureError = () => {}; // Fallback no-op
}

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Security log file paths
const securityLogFile = path.join(logsDir, 'security.log');
const accessLogFile = path.join(logsDir, 'access.log');

// Log levels
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

// Get current log level from environment
const currentLogLevel = process.env.LOG_LEVEL || 'INFO';

// Check if we should log at this level
function shouldLog(level) {
  const levels = [LOG_LEVELS.DEBUG, LOG_LEVELS.INFO, LOG_LEVELS.WARN, LOG_LEVELS.ERROR];
  const currentLevelIndex = levels.indexOf(currentLogLevel);
  const messageLevelIndex = levels.indexOf(level);
  return messageLevelIndex >= currentLevelIndex;
}

// Format log message
function formatMessage(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const metaString = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
  return `[${timestamp}] ${level}: ${message} ${metaString}`;
}

// Write to log file
function writeToFile(filePath, message) {
  try {
    fs.appendFileSync(filePath, message + '\n');
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

// Security logging functions
const securityLogger = {
  // Log authentication events
  logAuth: (event, userId, ip, userAgent, additional = {}) => {
    if (!shouldLog(LOG_LEVELS.INFO)) return;
    
    const message = formatMessage(LOG_LEVELS.INFO, `AUTH: ${event}`, {
      userId,
      ip,
      userAgent,
      timestamp: new Date().toISOString(),
      ...additional
    });
    
    writeToFile(securityLogFile, message);
  },

  // Log failed login attempts
  logFailedLogin: (email, ip, reason, userAgent) => {
    if (!shouldLog(LOG_LEVELS.WARN)) return;
    
    const message = formatMessage(LOG_LEVELS.WARN, 'FAILED_LOGIN', {
      email,
      ip,
      reason,
      userAgent,
      timestamp: new Date().toISOString()
    });
    
    writeToFile(securityLogFile, message);
  },

  // Log security violations
  logSecurityViolation: (type, details, ip, userId = null) => {
    if (!shouldLog(LOG_LEVELS.ERROR)) return;
    
    const message = formatMessage(LOG_LEVELS.ERROR, 'SECURITY_VIOLATION', {
      type,
      details,
      ip,
      userId,
      timestamp: new Date().toISOString()
    });
    
    writeToFile(securityLogFile, message);
    
    // Send to Sentry for critical security violations
    captureMessage(`Security Violation: ${type}`, 'error', {
      tags: { 
        security: 'violation', 
        violation_type: type,
        user_id: userId || 'anonymous'
      },
      extra: { details, ip, userId }
    });
  },

  // Log rate limiting
  logRateLimit: (ip, endpoint, limit, windowMs) => {
    if (!shouldLog(LOG_LEVELS.WARN)) return;
    
    const message = formatMessage(LOG_LEVELS.WARN, 'RATE_LIMIT_EXCEEDED', {
      ip,
      endpoint,
      limit,
      windowMs,
      timestamp: new Date().toISOString()
    });
    
    writeToFile(securityLogFile, message);
  },

  // Log suspicious activity
  logSuspiciousActivity: (activity, details, ip, userId = null) => {
    if (!shouldLog(LOG_LEVELS.WARN)) return;
    
    const message = formatMessage(LOG_LEVELS.WARN, 'SUSPICIOUS_ACTIVITY', {
      activity,
      details,
      ip,
      userId,
      timestamp: new Date().toISOString()
    });
    
    writeToFile(securityLogFile, message);
  },

  // Log file upload events
  logFileUpload: (filename, userId, ip, fileSize, mimeType) => {
    if (!shouldLog(LOG_LEVELS.INFO)) return;
    
    const message = formatMessage(LOG_LEVELS.INFO, 'FILE_UPLOAD', {
      filename,
      userId,
      ip,
      fileSize,
      mimeType,
      timestamp: new Date().toISOString()
    });
    
    writeToFile(securityLogFile, message);
  },

  // Log admin actions
  logAdminAction: (action, adminId, targetUser, details = {}) => {
    if (!shouldLog(LOG_LEVELS.INFO)) return;
    
    const message = formatMessage(LOG_LEVELS.INFO, 'ADMIN_ACTION', {
      action,
      adminId,
      targetUser,
      details,
      timestamp: new Date().toISOString()
    });
    
    writeToFile(securityLogFile, message);
  },

  // Log data access
  logDataAccess: (resource, userId, ip, action = 'READ') => {
    if (!shouldLog(LOG_LEVELS.DEBUG)) return;
    
    const message = formatMessage(LOG_LEVELS.DEBUG, 'DATA_ACCESS', {
      resource,
      userId,
      ip,
      action,
      timestamp: new Date().toISOString()
    });
    
    writeToFile(securityLogFile, message);
  },

  // Log system errors
  logError: (error, context = {}) => {
    if (!shouldLog(LOG_LEVELS.ERROR)) return;
    
    const message = formatMessage(LOG_LEVELS.ERROR, 'SYSTEM_ERROR', {
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
    
    writeToFile(securityLogFile, message);
    
    // Send to Sentry for error tracking
    captureError(error, {
      tags: { 
        system: 'error',
        component: context.component || 'unknown'
      },
      extra: context
    });
  }
};

// Access logging for API requests
const accessLogger = {
  logRequest: (req, res, responseTime) => {
    if (!shouldLog(LOG_LEVELS.INFO)) return;
    
    const message = formatMessage(LOG_LEVELS.INFO, 'API_REQUEST', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userId: req.user ? req.user._id : null,
      timestamp: new Date().toISOString()
    });
    
    writeToFile(accessLogFile, message);
  }
};

// Middleware to log API requests
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request details
  const originalSend = res.send;
  res.send = function(data) {
    const responseTime = Date.now() - startTime;
    accessLogger.logRequest(req, res, responseTime);
    return originalSend.call(this, data);
  };
  
  next();
};

// Clean up old log files (keep last 30 days)
const cleanupLogs = () => {
  try {
    const files = fs.readdirSync(logsDir);
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    files.forEach(file => {
      const filePath = path.join(logsDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime.getTime() < thirtyDaysAgo) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old log file: ${file}`);
      }
    });
  } catch (error) {
    console.error('Error cleaning up logs:', error);
  }
};

// Run cleanup daily
setInterval(cleanupLogs, 24 * 60 * 60 * 1000);

module.exports = {
  securityLogger,
  accessLogger,
  requestLogger,
  LOG_LEVELS,
  cleanupLogs
};
