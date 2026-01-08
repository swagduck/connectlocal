const express = require("express");

// mergeParams: true là BẮT BUỘC để lấy được :serviceId từ router cha
const router = express.Router({ mergeParams: true });

const { getReviews, addReview } = require("../controllers/reviewController");
const { protect } = require("../middleware/authMiddleware");

router.route("/").get(getReviews).post(protect, addReview);

module.exports = router;
