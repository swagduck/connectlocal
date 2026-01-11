const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

// Create test app instance
const createTestApp = () => {
  const app = express();

  // Basic middleware (reduced for testing)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(mongoSanitize());

  // CORS for testing
  app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Basic rate limiting for testing
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // High limit for testing
    message: { success: false, message: 'Too many requests' }
  });
  app.use('/api/', limiter);

  // Import routes (they will be available after models are loaded)
  try {
    const authRoutes = require('../../routes/authRoutes');
    app.use('/api/auth', authRoutes);
  } catch (error) {
    console.log('Routes not available yet, will be loaded in tests');
  }

  // Error handling
  app.use((err, req, res, next) => {
    console.error('Test app error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'test' ? err.message : undefined
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found'
    });
  });

  return app;
};

module.exports = createTestApp;
