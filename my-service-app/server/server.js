const dotenv = require("dotenv");
dotenv.config();

const { app, initializeSocket } = require("./src/app");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const { createAdapter } = require("socket.io-redis");
const { createClient } = require("redis");
const socketHandler = require("./src/utils/socket");

// Tạo HTTP Server
const server = http.createServer(app);

// Cấu hình Redis client cho Socket.io Adapter
const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379"
});

// Xử lý Redis connection errors
redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Redis Client Connected');
});

// Kết nối Redis
redisClient.connect().catch(err => {
  console.error('❌ Failed to connect to Redis:', err);
  console.log('⚠️ Socket.io sẽ chạy trong chế độ single-server mode');
});

// Cấu hình Socket.io với Redis Adapter
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  adapter: createAdapter(redisClient, {
    // Redis adapter options
    key: 'serviceconnect', // Prefix cho Redis keys
    requestsTimeout: 5000, // Timeout cho cross-server requests
    publishOnSpecificResponseChannel: true // Optimize cho high traffic
  })
});

// Initialize socket handler
socketHandler(io);

// Initialize socket.io in friend controller
initializeSocket(io);

// --- KẾT NỐI DB & CHẠY SERVER ---
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('📦 MongoDB Connected');
    
    // Start server sau khi Redis đã sẵn sàng (hoặc fallback)
    server.listen(PORT, () => {
      console.log(`🚀 Server & Socket running on port ${PORT}`);
      console.log(`🔗 Socket.io Redis Adapter: ${redisClient.isOpen ? 'ENABLED' : 'DISABLED (fallback mode)'}`);
      console.log(`📱 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
    });
  })
  .catch((err) => console.log("Lỗi kết nối DB:", err));

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  
  // Đóng Redis connection
  if (redisClient.isOpen) {
    await redisClient.quit();
    console.log('📦 Redis connection closed');
  }
  
  // Đóng server
  server.close(() => {
    console.log('🔌 HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  
  // Đóng Redis connection
  if (redisClient.isOpen) {
    await redisClient.quit();
    console.log('📦 Redis connection closed');
  }
  
  // Đóng server
  server.close(() => {
    console.log('🔌 HTTP server closed');
    process.exit(0);
  });
});
