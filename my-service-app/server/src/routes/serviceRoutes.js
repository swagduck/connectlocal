const express = require("express");
const router = express.Router();

const {
  getServices,
  createService,
  getServiceById,
  deleteService, // <-- Import thêm hàm này
} = require("../controllers/serviceController");

const { protect, authorize } = require("../middleware/authMiddleware");

// Import Review Router
const reviewRouter = require("./reviewRoutes");

// Reroute sang reviewRouter
router.use("/:serviceId/reviews", reviewRouter);

// Các route chính
router
  .route("/")
  .get(getServices)
  .post(protect, authorize("provider", "admin"), createService);

router.route("/:id").get(getServiceById).delete(protect, deleteService); // <-- Thêm dòng này: Cần đăng nhập mới xóa được

module.exports = router;
