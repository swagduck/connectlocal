const app = require("./src/app"); // Import app từ file trên
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const http = require("http"); // 1. Import module HTTP chuẩn của Node
const { Server } = require("socket.io"); // 2. Import Socket.io

dotenv.config();

// 3. Tạo HTTP Server bọc lấy Express App
// (Bắt buộc phải làm bước này thì Socket.io mới chạy chung port với Express được)
const server = http.createServer(app);

// 4. Cấu hình Socket.io
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Link Frontend của bạn (kiểm tra kỹ port)
    methods: ["GET", "POST"],
  },
});

// --- PHẦN LOGIC REAL-TIME ---
let onlineUsers = [];

io.on("connection", (socket) => {
  // console.log(`⚡: User connected ${socket.id}`);

  // Khi User online
  socket.on("add_user", (userId) => {
    if (!onlineUsers.some((u) => u.userId === userId)) {
      onlineUsers.push({ userId, socketId: socket.id });
    }
    io.emit("get_users", onlineUsers);
  });

  // Khi gửi tin nhắn
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

  // Khi User thoát
  socket.on("disconnect", () => {
    onlineUsers = onlineUsers.filter((u) => u.socketId !== socket.id);
    io.emit("get_users", onlineUsers);
  });
});
// ----------------------------

// Kết nối DB và Chạy Server
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    // LƯU Ý QUAN TRỌNG: Phải dùng server.listen chứ KHÔNG dùng app.listen
    server.listen(PORT, () =>
      console.log(`🚀 Server & Socket running on port ${PORT}`)
    );
  })
  .catch((err) => console.log(err));
