const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
  accessConversation,
  getMyConversations,
  getMessages,
  sendMessage,
} = require("../controllers/chatController");

router.use(protect);

// 1. Route tạo chat (POST /api/chat)
router.route("/").post(accessConversation);

// 2. Route lấy danh sách chat (Sửa để khớp với frontend gọi /conversations)
// Nếu frontend gọi /api/chat/conversations thì phải define route này:
router.route("/conversations").get(getMyConversations);

// (Tùy chọn) Giữ cả route gốc để dự phòng nếu frontend sửa lại gọi /api/chat
router.route("/").get(getMyConversations);

router.route("/messages").post(sendMessage);
router.route("/messages/:conversationId").get(getMessages);

module.exports = router;
