const express = require("express");
const router = express.Router();
const {
  createService,
  getServices,
  getServiceById,
  deleteService,
  // updateService (nếu bạn làm thêm hàm update sau này)
} = require("../controllers/serviceController");
const { protect } = require("../middleware/authMiddleware");

// Route lấy tất cả & tạo mới
router.route("/").get(getServices).post(protect, createService); // Cần đăng nhập mới được tạo

// Route lấy chi tiết & xóa
router.route("/:id").get(getServiceById).delete(protect, deleteService); // Cần đăng nhập mới được xóa

module.exports = router;
