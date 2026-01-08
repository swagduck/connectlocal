const express = require("express");
const router = express.Router();
const {
  createReview,
  getServiceReviews,
  replyReview,
  checkEligibility,
  deleteReview // Import hàm xóa
} = require("../controllers/reviewController");
const { protect } = require("../middleware/authMiddleware");

router.get("/service/:serviceId", getServiceReviews);
router.post("/", protect, createReview);
router.put("/:id/reply", protect, replyReview);
router.get("/check/:serviceId", protect, checkEligibility);

// Route xóa review
router.delete("/:id", protect, deleteReview);

module.exports = router;