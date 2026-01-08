const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

// Import Controller mới (đảm bảo tên hàm khớp với file Controller ở trên)
const {
  accessConversation,
  getMyConversations,
  getMessages,
  sendMessage,
} = require("../controllers/chatController");

router.use(protect); // Bảo vệ tất cả routes

// 👇 Route gốc "/" tương ứng với "/api/chat"
router
  .route("/")
  .post(accessConversation) // Tạo hoặc lấy chat (Frontend gọi POST /api/chat)
  .get(getMyConversations); // Lấy danh sách (Frontend gọi GET /api/chat)

// Route tin nhắn
router.route("/messages").post(sendMessage);
router.route("/messages/:conversationId").get(getMessages);

module.exports = router;
