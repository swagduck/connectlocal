const dotenv = require("dotenv");
dotenv.config(); // 👈 BẮT BUỘC PHẢI Ở DÒNG ĐẦU TIÊN

const app = require("./src/app"); // App được cấu hình trong src/app.js
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");

// 👇 IMPORT ROUTE THANH TOÁN MỚI
const paymentRoutes = require("./src/routes/paymentRoutes");

// Tạo HTTP Server
const server = http.createServer(app);

// Cấu hình Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173", // Dùng biến môi trường hoặc mặc định
    methods: ["GET", "POST"],
  },
});

// 👇 KÍCH HOẠT ROUTE THANH TOÁN (Nếu trong app.js chưa có)
app.use("/api/payment", paymentRoutes);

// --- LOGIC SOCKET ---
let onlineUsers = [];

io.on("connection", (socket) => {
  // console.log(`⚡: User connected ${socket.id}`);

  socket.on("add_user", (userId) => {
    if (!onlineUsers.some((u) => u.userId === userId)) {
      onlineUsers.push({ userId, socketId: socket.id });
    }
    io.emit("get_users", onlineUsers);
  });

  socket.on(
    "send_message",
    ({ senderId, receiverId, text, conversationId }) => {
      const user = onlineUsers.find((u) => u.userId === receiverId);
      if (user) {
        io.to(user.socketId).emit("get_message", {
          senderId,
          text,
          conversationId,
          createdAt: Date.now(),
        });
      }
    }
  );

  socket.on("disconnect", () => {
    onlineUsers = onlineUsers.filter((u) => u.socketId !== socket.id);
    io.emit("get_users", onlineUsers);
  });
});

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
