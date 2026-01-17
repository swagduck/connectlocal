const dotenv = require("dotenv");
dotenv.config();

const { app, initializeSocket } = require("./src/app");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const socketHandler = require("./src/utils/socket");

// Tạo HTTP Server
const server = http.createServer(app);

// Cấu hình Socket.io mà không cần Redis Adapter
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  }
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
    
    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server & Socket running on port ${PORT}`);
      console.log(`📱 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
      console.log('🔗 Socket.io Redis Adapter: DISABLED (running in single-server mode)');
    });
  })
  .catch((err) => console.log("Lỗi kết nối DB:", err));

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  
  // Đóng server
  server.close(() => {
    console.log('🔌 HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  
  // Đóng server
  server.close(() => {
    console.log('🔌 HTTP server closed');
    process.exit(0);
  });
});
