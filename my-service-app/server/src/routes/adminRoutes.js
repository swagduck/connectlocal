const express = require("express");
const router = express.Router();
const {
  getStats,
  getAllUsers,
  deleteUser,
  getAllServices, // <-- Import thêm
  getAllBookings, // <-- Import thêm
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Tất cả các route admin đều phải qua bước kiểm tra này
router.use(protect);
router.use(authorize("admin"));

router.get("/stats", getStats);
router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUser);

// 👇 Route mới cho Dịch vụ và Đơn hàng
router.get("/services", getAllServices);
router.get("/bookings", getAllBookings);

module.exports = router;
