/**
 * Application Configuration
 * Centralized configuration management to eliminate magic numbers and hardcoded values
 */

const config = {
  // Application Settings
  app: {
    name: 'ServiceConnect',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5001,
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  },

  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/serviceconnect',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '30d',
    issuer: 'serviceconnect',
    audience: 'serviceconnect-users',
  },

  // Booking Configuration
  booking: {
    // Commission and Fees
    commissionRate: parseFloat(process.env.COMMISSION_RATE) || 0.1, // 10%
    platformFeeRate: parseFloat(process.env.PLATFORM_FEE_RATE) || 0.1,
    minimumFee: parseInt(process.env.MINIMUM_FEE) || 5000, // 5,000 VND
    
    // Booking Rules
    maxBookingsPerDay: parseInt(process.env.MAX_BOOKINGS_PER_DAY) || 10,
    cancellationWindowHours: parseInt(process.env.CANCELLATION_WINDOW_HOURS) || 2,
    autoConfirmMinutes: parseInt(process.env.AUTO_CONFIRM_MINUTES) || 30,
    
    // Status Configuration
    statuses: {
      PENDING: 'pending',
      CONFIRMED: 'confirmed',
      IN_PROGRESS: 'in_progress',
      COMPLETED: 'completed',
      CANCELLED: 'cancelled',
    },
    
    // Payment Settings
    paymentTimeoutMinutes: parseInt(process.env.PAYMENT_TIMEOUT_MINUTES) || 15,
    refundPolicy: {
      fullRefundHours: parseInt(process.env.FULL_REFUND_HOURS) || 24,
      partialRefundRate: parseFloat(process.env.PARTIAL_REFUND_RATE) || 0.5,
    },
  },

  // User Configuration
  user: {
    // Validation Rules
    name: {
      minLength: 2,
      maxLength: 50,
    },
    password: {
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
    },
    email: {
      maxLength: 100,
    },
    phone: {
      minLength: 10,
      maxLength: 15,
    },
    
    // Wallet Configuration
    wallet: {
      initialBalance: parseInt(process.env.INITIAL_WALLET_BALANCE) || 0,
      minimumBalance: parseInt(process.env.MINIMUM_WALLET_BALANCE) || 0,
      dailyTransactionLimit: parseInt(process.env.DAILY_TRANSACTION_LIMIT) || 10000000, // 10M VND
    },
    
    // Rate Limiting
    rateLimit: {
      loginAttempts: parseInt(process.env.LOGIN_ATTEMPTS_LIMIT) || 5,
      lockoutMinutes: parseInt(process.env.LOCKOUT_MINUTES) || 15,
      registrationAttempts: parseInt(process.env.REGISTRATION_ATTEMPTS_LIMIT) || 3,
      registrationLockoutMinutes: parseInt(process.env.REGISTRATION_LOCKOUT_MINUTES) || 60,
    },
  },

  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    allowedFileTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
    ],
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
      folder: 'serviceconnect',
    },
  },

  // Email Configuration
  email: {
    provider: process.env.EMAIL_PROVIDER || 'smtp',
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
    from: process.env.EMAIL_FROM || 'noreply@serviceconnect.com',
    templates: {
      welcome: 'welcome',
      bookingConfirmation: 'booking-confirmation',
      bookingCancelled: 'booking-cancelled',
      passwordReset: 'password-reset',
    },
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    options: {
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    },
    keyPrefix: 'serviceconnect:',
    ttl: {
      sessions: 30 * 24 * 60 * 60, // 30 days
      cache: 60 * 60, // 1 hour
      rateLimit: 15 * 60, // 15 minutes
    },
  },

  // External API Configuration
  externalApis: {
    google: {
      maps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY,
        baseUrl: 'https://maps.googleapis.com/maps/api',
        rateLimit: {
          requestsPerSecond: 10,
          requestsPerDay: 100000,
        },
        cost: {
          perRequest: 0.005, // USD
          monthlyBudget: parseFloat(process.env.GOOGLE_MAPS_BUDGET) || 100,
        },
      },
    },
    ai: {
      provider: process.env.AI_PROVIDER || 'gemini',
      gemini: {
        apiKey: process.env.GEMINI_API_KEY,
        model: 'gemini-pro',
        rateLimit: {
          requestsPerMinute: 60,
          requestsPerDay: 1000,
        },
        cost: {
          perRequest: 0.001, // USD
          monthlyBudget: parseFloat(process.env.AI_BUDGET) || 50,
        },
      },
    },
  },

  // Cache Configuration
  cache: {
    provider: process.env.CACHE_PROVIDER || 'memory',
    ttl: {
      userProfiles: 30 * 60, // 30 minutes
      services: 60 * 60, // 1 hour
      bookings: 15 * 60, // 15 minutes
      aiResponses: 24 * 60 * 60, // 24 hours
      mapData: 7 * 24 * 60 * 60, // 7 days
    },
    maxSize: 1000, // Maximum number of cached items
  },

  // Security Configuration
  security: {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    },
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https:", "http://localhost:5173"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 200, // requests per window
      skipSuccessfulRequests: false,
    },
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
    file: {
      enabled: process.env.LOG_FILE_ENABLED === 'true',
      path: process.env.LOG_FILE_PATH || './logs/app.log',
      maxSize: '10m',
      maxFiles: 5,
    },
  },

  // Monitoring Configuration
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    metrics: {
      enabled: process.env.METRICS_ENABLED === 'true',
      port: process.env.METRICS_PORT || 9090,
    },
    alerts: {
      email: process.env.ALERT_EMAIL,
      slack: {
        webhook: process.env.SLACK_WEBHOOK,
        channel: process.env.SLACK_CHANNEL || '#alerts',
      },
    },
  },

  // Business Logic Configuration
  business: {
    // Service Categories
    serviceCategories: [
      'home-cleaning',
      'plumbing',
      'electrical',
      'gardening',
      'moving',
      'tutoring',
      'beauty',
      'fitness',
      'technology',
      'other',
    ],
    
    // Service Pricing
    pricing: {
      minimumPrice: parseInt(process.env.MINIMUM_SERVICE_PRICE) || 50000, // 50K VND
      maximumPrice: parseInt(process.env.MAXIMUM_SERVICE_PRICE) || 10000000, // 10M VND
      priceStep: 5000, // 5K VND increments
    },
    
    // Provider Requirements
    provider: {
      minimumRating: parseFloat(process.env.MINIMUM_PROVIDER_RATING) || 3.0,
      minimumCompletedJobs: parseInt(process.env.MINIMUM_COMPLETED_JOBS) || 5,
      verificationRequired: process.env.PROVIDER_VERIFICATION_REQUIRED !== 'false',
    },
    
    // Customer Support
    support: {
      email: process.env.SUPPORT_EMAIL || 'support@serviceconnect.com',
      phone: process.env.SUPPORT_PHONE || '+84-123-456-789',
      responseTimeHours: parseInt(process.env.SUPPORT_RESPONSE_TIME_HOURS) || 24,
    },
  },
};

// Validation helpers
config.validate = {
  // Validate commission rate
  commissionRate: (rate) => {
    const parsed = parseFloat(rate);
    return !isNaN(parsed) && parsed >= 0 && parsed <= 1;
  },
  
  // Validate phone number
  phoneNumber: (phone) => {
    const phoneRegex = /^[+]?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone) && phone.length >= 10 && phone.length <= 15;
  },
  
  // Validate email
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 100;
  },
  
  // Validate service price
  servicePrice: (price) => {
    const parsed = parseInt(price);
    return !isNaN(parsed) && 
           parsed >= config.business.pricing.minimumPrice && 
           parsed <= config.business.pricing.maximumPrice &&
           parsed % config.business.pricing.priceStep === 0;
  },
};

// Environment-specific overrides
if (config.app.environment === 'production') {
  // Production-specific settings
  config.logging.level = 'warn';
  config.security.helmet.hsts.includeSubDomains = true;
  config.security.rateLimit.max = 100;
} else if (config.app.environment === 'test') {
  // Test-specific settings
  config.database.uri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/serviceconnect_test';
  config.jwt.accessTokenExpiry = '1m';
  config.redis.ttl.sessions = 60; // 1 minute for tests
}

// Configuration validation
config.validateConfig = () => {
  const errors = [];
  
  // Validate required environment variables
  const requiredEnvVars = [
    'JWT_SECRET',
    'MONGODB_URI',
  ];
  
  if (config.app.environment === 'production') {
    requiredEnvVars.push(
      'GOOGLE_MAPS_API_KEY',
      'GEMINI_API_KEY',
      'REDIS_URL'
    );
  }
  
  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  });
  
  // Validate configuration values
  if (!config.validate.commissionRate(config.booking.commissionRate)) {
    errors.push('Invalid commission rate. Must be between 0 and 1.');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
  
  return true;
};

module.exports = config;
