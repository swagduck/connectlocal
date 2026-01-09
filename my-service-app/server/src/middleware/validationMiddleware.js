const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');
const validator = require('validator');

// XSS protection middleware
const xssProtection = (req, res, next) => {
  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = xss(value, {
          whiteList: {}, // No HTML tags allowed
          stripIgnoreTag: true,
          stripIgnoreTagBody: ['script']
        });
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

// Input validation middleware
const validateInput = {
  email: (email) => {
    if (!email || !validator.isEmail(email)) {
      return false;
    }
    return true;
  },

  password: (password) => {
    if (!password || password.length < 8) {
      return false;
    }
    // Must contain at least one uppercase, one lowercase, and one number
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return false;
    }
    return true;
  },

  name: (name) => {
    if (!name || name.length < 2 || name.length > 50) {
      return false;
    }
    // Allow only letters, spaces, and some special characters
    if (!/^[a-zA-ZÀ-ỹ\s\-']+$/.test(name)) {
      return false;
    }
    return true;
  },

  phone: (phone) => {
    if (!phone) return true; // Optional field
    // Vietnamese phone number format
    if (!/^(0|\+84)[3-9][0-9]{8}$/.test(phone.replace(/\s/g, ''))) {
      return false;
    }
    return true;
  },

  text: (text, minLength = 1, maxLength = 1000) => {
    if (!text || typeof text !== 'string') {
      return false;
    }
    if (text.length < minLength || text.length > maxLength) {
      return false;
    }
    return true;
  },

  number: (num, min = 0, max = Number.MAX_SAFE_INTEGER) => {
    if (typeof num !== 'number' || isNaN(num)) {
      return false;
    }
    if (num < min || num > max) {
      return false;
    }
    return true;
  },

  url: (url) => {
    if (!url) return true; // Optional field
    return validator.isURL(url);
  },

  mongoId: (id) => {
    if (!id || !validator.isMongoId(id)) {
      return false;
    }
    return true;
  }
};

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field] || req.params[field] || req.query[field];
      
      if (rules.required && (!value || value === '')) {
        errors.push(`${field} là bắt buộc`);
        continue;
      }

      if (value && rules.type && !validateInput[rules.type](value, rules.min, rules.max)) {
        errors.push(`${field} không hợp lệ`);
      }

      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`${field} phải là một trong các giá trị: ${rules.enum.join(', ')}`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    next();
  };
};

// Rate limiting for specific routes
const createRateLimit = (windowMs, max, message) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    for (const [ip, timestamps] of attempts.entries()) {
      attempts.set(ip, timestamps.filter(time => time > windowStart));
      if (attempts.get(ip).length === 0) {
        attempts.delete(ip);
      }
    }

    const userAttempts = attempts.get(key) || [];
    
    if (userAttempts.length >= max) {
      return res.status(429).json({
        success: false,
        message: message || 'Too many requests, please try again later'
      });
    }

    userAttempts.push(now);
    attempts.set(key, userAttempts);

    next();
  };
};

module.exports = {
  xssProtection,
  validateInput,
  validate,
  createRateLimit,
  mongoSanitize
};
