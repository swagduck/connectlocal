const dotenv = require("dotenv");
dotenv.config();

const { app, initializeSocket } = require("./src/app");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const socketHandler = require("./src/utils/socket");

// Tạo HTTP Server
const server = http.createServer(app);

// Cấu hình Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
});

// Initialize socket handler
socketHandler(io);

// Initialize socket.io in friend controller
initializeSocket(io);

// --- KẾT NỐI DB & CHẠY SERVER ---
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    server.listen(PORT, () =>
      console.log(`🚀 Server & Socket running on port ${PORT}`)
    );
  })
  .catch((err) => console.log("Lỗi kết nối DB:", err));
