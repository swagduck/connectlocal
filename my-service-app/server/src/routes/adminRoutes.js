const express = require("express");
const router = express.Router();

// Import Controller
const {
  getStats,
  getAllUsers,
  getAllServices,
  getAllBookings,
  getAllRequests,
  updateRequest,
  banUser,
  unbanUser,
  adminUpdateBooking,
  adminDeleteBooking,
  getAllTransactions,
  updateTransactionStatus,
  deleteRequest,
  getRevenueReport,
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { fixImagePaths } = require("../../fix-image-paths");

// Middleware cho tất cả routes
router.use(protect);
router.use(authorize("admin"));

// Route thống kê
router.get("/stats", getStats);
router.get("/revenue", getRevenueReport);

// Route quản lý users
router.get("/users", getAllUsers);
router.put("/users/:id/ban", banUser);
router.put("/users/:id/unban", unbanUser);

// Route quản lý services
router.get("/services", getAllServices);

// Route quản lý bookings
router.get("/bookings", getAllBookings);
router.put("/bookings/:id", adminUpdateBooking);
router.delete("/bookings/:id", adminDeleteBooking);

// Route quản lý requests
router.get("/requests", getAllRequests);
router.put("/requests/:id", updateRequest);
router.delete("/requests/:id", deleteRequest);

// Route quản lý transactions
router.get("/transactions", getAllTransactions);
router.put("/transactions/:id", updateTransactionStatus);

// Route sửa ảnh cũ
router.post("/fix-images", fixImagePaths);

module.exports = router;
