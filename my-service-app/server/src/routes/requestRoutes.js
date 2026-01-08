const express = require("express");
const router = express.Router();
const {
  createRequest,
  getRequests,
  deleteRequest,
  getRequestById, // 👈 Cần import hàm này vào
} = require("../controllers/requestController");
const { protect } = require("../middleware/authMiddleware");

// Route cho /api/requests
router.route("/").post(protect, createRequest).get(getRequests);

// Route cho /api/requests/:id
router
  .route("/:id")
  .get(getRequestById) // 👈 Dòng này gây lỗi nếu getRequestById bị thiếu
  .delete(protect, deleteRequest);

module.exports = router;
