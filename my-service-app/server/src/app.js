const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
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
const friendRoutes = require("./routes/friendRoutes");
const aiRoutes = require("./routes/ai");
const { setSocketIO } = require("./controllers/friendController");
const socketHandler = require("./utils/socket");

const app = express();

// CORS configuration - MUST be first to handle preflight requests
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200
}));

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:", "http://localhost:5173"],
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

// Rate limiting - skip preflight requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: { success: false, message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS' // Skip rate limiting for preflight
});
app.use('/api/', limiter);

// Stricter rate limiting for auth routes - skip preflight
const authLimiter = createRateLimit(15 * 60 * 1000, 5, 'Too many login attempts, please try again later');
const registerLimiter = createRateLimit(60 * 60 * 1000, 3, 'Too many registration attempts, please try again later');

app.use('/api/auth/login', (req, res, next) => {
  if (req.method === 'OPTIONS') return next(); // Skip rate limiting for preflight
  authLimiter(req, res, next);
});
app.use('/api/auth/register', (req, res, next) => {
  if (req.method === 'OPTIONS') return next(); // Skip rate limiting for preflight
  registerLimiter(req, res, next);
});

// Input sanitization
app.use(mongoSanitize());
app.use(xssProtection);

// Performance middleware
app.use(compression());
app.use(cookieParser()); // Add cookie parser for secure authentication
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan("combined"));

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
app.use("/api/friends", friendRoutes);
app.use("/api/ai", aiRoutes);

// Add logging middleware for debugging
app.use("/api/chat/messages", (req, res, next) => {
  console.log('🔍 DEBUG: /api/chat/messages route hit!');
  console.log('🔍 DEBUG: Method:', req.method);
  console.log('🔍 DEBUG: Body:', req.body);
  console.log('🔍 DEBUG: User:', req.user);
  next();
});

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Function to initialize socket.io (called from server.js)
const initializeSocket = (io) => {
  const { sendToUser } = socketHandler(io);
  setSocketIO(io);
  // Make io and sendToUser available to all routes via app.set()
  app.set('io', io);
  app.set('sendToUser', sendToUser);
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = { app, initializeSocket };
