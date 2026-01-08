const express = require("express");
const router = express.Router();
const {
  createBooking,
  getBookings,
  updateBookingStatus,
  deleteBooking, // <-- Import thêm
} = require("../controllers/bookingController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.route("/").post(createBooking).get(getBookings);

router.route("/:id").put(updateBookingStatus).delete(deleteBooking); // <-- Thêm dòng này

module.exports = router;
