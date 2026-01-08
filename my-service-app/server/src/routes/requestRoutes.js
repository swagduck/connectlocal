const express = require("express");
const router = express.Router();
const {
  createRequest,
  getRequests,
  deleteRequest,
  getMyRequests, // <-- Mới
  applyRequest, // <-- Mới
  chooseProvider, // <-- Mới
} = require("../controllers/requestController");
const { protect } = require("../middleware/authMiddleware");

router.route("/").get(getRequests).post(protect, createRequest);

// Route lấy danh sách yêu cầu của riêng mình (Khách quản lý)
router.get("/my-requests", protect, getMyRequests);

router.route("/:id").delete(protect, deleteRequest);

// Thợ ứng tuyển
router.put("/:id/apply", protect, applyRequest);

// Khách chọn thợ
router.put("/:id/choose", protect, chooseProvider);

module.exports = router;
