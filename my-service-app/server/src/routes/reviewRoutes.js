const express = require("express");
const router = express.Router();
const {
  createReview,
  getServiceReviews,
  replyReview,
  checkEligibility,
} = require("../controllers/reviewController");
const { protect } = require("../middleware/authMiddleware");

// Route công khai: Lấy danh sách review
router.get("/service/:serviceId", getServiceReviews);

// Route bảo vệ: Tạo/Cập nhật review
router.post("/", protect, createReview);

// Route bảo vệ: Thợ trả lời review
router.put("/:id/reply", protect, replyReview);

// Route bảo vệ: Kiểm tra quyền review (để ẩn/hiện form)
router.get("/check/:serviceId", protect, checkEligibility);

module.exports = router;