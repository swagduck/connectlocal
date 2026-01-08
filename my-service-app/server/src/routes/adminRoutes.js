const express = require("express");
const router = express.Router();

// Import Controller
const {
  getStats,
  getAllUsers,
  deleteUser,
  getAllServices,
  getAllBookings,
} = require("../controllers/adminController");

// Import Middleware (Đảm bảo đường dẫn đúng)
const { protect, authorize } = require("../middleware/authMiddleware");

// --- ÁP DỤNG MIDDLEWARE BẢO VỆ ---
// Tất cả các route bên dưới đều yêu cầu Login (protect) và quyền Admin (authorize)
router.use(protect);
router.use(authorize("admin"));

// --- CÁC ROUTES ---
router.get("/stats", getStats);
router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUser);

router.get("/services", getAllServices);
router.get("/bookings", getAllBookings);

module.exports = router;
