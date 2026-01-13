const express = require("express");
const router = express.Router();
const {
  createBooking,
  getBookings,
  updateBookingStatus,
  deleteBooking,
  restoreBooking,
  getDeletedBookings,
  hardDeleteBooking,
} = require("../controllers/bookingController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

// Standard booking routes
router.route("/").post(createBooking).get(getBookings);

router.route("/:id").put(updateBookingStatus).delete(deleteBooking);

// Soft delete management routes (Admin only for restore and hard delete)
router.route("/:id/restore").post(restoreBooking);
router.route("/deleted").get(getDeletedBookings);
router.route("/:id/hard-delete").delete(hardDeleteBooking);

module.exports = router;
