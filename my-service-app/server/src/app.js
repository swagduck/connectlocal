const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const { xssProtection, createRateLimit } = require('./middleware/validationMiddleware');
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const requestRoutes = require("./routes/requestRoutes");
const adminRoutes = require("./routes/adminRoutes");
const chatRoutes = require("./routes/chatRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
// 👇 1. IMPORT PAYMENT ROUTES TẠI ĐÂY
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Stricter rate limiting for auth routes
const authLimiter = createRateLimit(15 * 60 * 1000, 5, 'Too many login attempts, please try again later');
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', createRateLimit(60 * 60 * 1000, 3, 'Too many registration attempts, please try again later'));

// Input sanitization
app.use(mongoSanitize());
app.use(xssProtection);

// Performance middleware
app.use(compression());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan("combined"));

// Static folder
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/transactions", transactionRoutes);
// 👇 2. ĐĂNG KÝ ROUTE PAYMENT (Đặt trước notFound)
app.use("/api/payment", paymentRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;
