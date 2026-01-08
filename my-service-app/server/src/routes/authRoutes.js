const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateDetails,
  getPublicProfile, // <-- Import thêm
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.put("/updatedetails", protect, updateDetails);

// Route công khai lấy info người khác (Đặt cuối cùng)
router.get("/users/:id", getPublicProfile);

module.exports = router;
