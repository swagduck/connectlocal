const express = require("express");
const router = express.Router();
const {
  createRequest,
  getRequests,
  deleteRequest,
  getMyRequests,
  applyRequest,
  chooseProvider,
  getRequestById, // Import thêm hàm này để tránh lỗi nếu route /:id dùng .get()
} = require("../controllers/requestController");
const { protect } = require("../middleware/authMiddleware");

// Route gốc
router.route("/").get(getRequests).post(protect, createRequest);

// Route của tôi (Đặt TRƯỚC route /:id để tránh bị nhầm id="my-requests")
router.get("/my-requests", protect, getMyRequests);

// Route chi tiết / thao tác
router
  .route("/:id")
  .get(getRequestById) // Xem chi tiết (nếu cần)
  .delete(protect, deleteRequest); // Xóa

// Các route chức năng
router.put("/:id/apply", protect, applyRequest);
router.put("/:id/choose", protect, chooseProvider);

module.exports = router;
