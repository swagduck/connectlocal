const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

// Import Controller
const {
  createConversation,
  getMyConversations,
  getMessages,
  sendMessage,
} = require("../controllers/chatController");

// Middleware bảo vệ
router.use(protect);

// Định nghĩa các đường dẫn
router.post("/conversation", createConversation);
router.get("/conversations", getMyConversations);
router.get("/messages/:conversationId", getMessages);
router.post("/messages", sendMessage);

// 👇 DÒNG QUAN TRỌNG NHẤT: BẮT BUỘC PHẢI CÓ
module.exports = router;
