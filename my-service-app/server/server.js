const dotenv = require("dotenv");
dotenv.config();

const app = require("./src/app");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");

// (Đã xóa dòng import paymentRoutes thừa ở đây)

// Tạo HTTP Server
const server = http.createServer(app);

// Cấu hình Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// (Đã xóa dòng app.use payment thừa ở đây)

// --- LOGIC SOCKET ---
let onlineUsers = [];
// ... (giữ nguyên phần socket bên dưới) ...

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
