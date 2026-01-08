const express = require("express");
const router = express.Router();
const {
  createBooking,
  getBookings,
  updateBookingStatus,
  deleteBooking,
} = require("../controllers/bookingController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.route("/").post(createBooking).get(getBookings);

router.route("/:id").put(updateBookingStatus).delete(deleteBooking);

module.exports = router;
