const Sentry = require("@sentry/node");

// Initialize Sentry
const initSentry = () => {
  // Only initialize in production or if SENTRY_DSN is provided
  if (process.env.NODE_ENV === 'production' || process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      
      // Set tracesSampleRate to 1.0 to capture 100%
      // of transactions for performance monitoring.
      // We recommend adjusting this value in production
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      
      // Environment
      environment: process.env.NODE_ENV || 'development',
      
      // Release version
      release: process.env.npm_package_version || '1.0.0',
      
      // Integrations
      integrations: [
        // Enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),
        // Enable Express.js tracing
        new Sentry.Integrations.Express({ app: null }),
      ],
      
      // Before sending events, add additional context
      beforeSend(event) {
        // Don't send events in development unless explicitly enabled
        if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_ENABLE_IN_DEV) {
          return null;
        }
        
        // Add custom tags
        event.tags = {
          ...event.tags,
          service: 'service-app-api',
          version: process.env.npm_package_version || '1.0.0',
        };
        
        // Filter out sensitive data
        if (event.request && event.request.headers) {
          // Remove sensitive headers
          const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
          Object.keys(event.request.headers).forEach(header => {
            if (sensitiveHeaders.includes(header.toLowerCase())) {
              event.request.headers[header] = '[FILTERED]';
            }
          });
        }
        
        // Filter out sensitive data in user context
        if (event.user && event.user.email) {
          // Hash email for privacy
          event.user.email_hash = require('crypto')
            .createHash('sha256')
            .update(event.user.email)
            .digest('hex');
          delete event.user.email;
        }
        
        return event;
      },
      
      // Custom context
      initialScope: {
        tags: {
          service: 'service-app-api',
          framework: 'express',
          runtime: 'nodejs',
        },
        user: {
          id: 'anonymous',
        },
      },
    });
    
    console.log('✅ Sentry initialized successfully');
  } else {
    console.log('⚠️ Sentry disabled - no SENTRY_DSN provided');
  }
};

// Error handler middleware
const sentryErrorHandler = (err, req, res, next) => {
  // Only send to Sentry if it's initialized
  if (Sentry.getCurrentHub().getClient()) {
    // Add request context to the error
    Sentry.withScope((scope) => {
      scope.setUser({
        id: req.user?._id || 'anonymous',
        email: req.user?.email ? undefined : undefined, // Will be filtered in beforeSend
        ip: req.ip,
      });
      
      scope.setTag('route', req.route?.path || req.originalUrl);
      scope.setTag('method', req.method);
      scope.setExtra('body', req.body);
      scope.setExtra('query', req.query);
      scope.setExtra('params', req.params);
      
      // Capture the exception
      Sentry.captureException(err);
    });
  }
  
  // Continue with the next error handler
  next(err);
};

// Request handler for tracing
const sentryRequestHandler = Sentry.Handlers.requestHandler();

// Tracing handler for performance monitoring
const sentryTracingHandler = Sentry.Handlers.tracingHandler();

// Manual error capture utility
const captureError = (error, context = {}) => {
  if (Sentry.getCurrentHub().getClient()) {
    Sentry.withScope((scope) => {
      // Set context
      Object.keys(context).forEach(key => {
        scope.setExtra(key, context[key]);
      });
      
      // Set tags
      if (context.tags) {
        Object.keys(context.tags).forEach(key => {
          scope.setTag(key, context.tags[key]);
        });
      }
      
      // Set user if provided
      if (context.user) {
        scope.setUser(context.user);
      }
      
      Sentry.captureException(error);
    });
  }
};

// Manual message capture utility
const captureMessage = (message, level = 'info', context = {}) => {
  if (Sentry.getCurrentHub().getClient()) {
    Sentry.withScope((scope) => {
      // Set context
      Object.keys(context).forEach(key => {
        scope.setExtra(key, context[key]);
      });
      
      // Set tags
      if (context.tags) {
        Object.keys(context.tags).forEach(key => {
          scope.setTag(key, context.tags[key]);
        });
      }
      
      Sentry.captureMessage(message, level);
    });
  }
};

// Performance monitoring utility
const startTransaction = (name, op = 'custom') => {
  if (Sentry.getCurrentHub().getClient()) {
    return Sentry.startTransaction({
      name,
      op,
    });
  }
  return null;
};

module.exports = {
  initSentry,
  sentryErrorHandler,
  sentryRequestHandler,
  sentryTracingHandler,
  captureError,
  captureMessage,
  startTransaction,
  Sentry,
};
