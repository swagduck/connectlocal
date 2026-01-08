const express = require("express");
const router = express.Router();
const {
  createPayment,
  paymentCallback,
  getTransactions,
} = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

// Route nạp tiền (Cần đăng nhập)
router.post("/create-payment", protect, createPayment);

// Route lịch sử giao dịch
router.get("/history", protect, getTransactions);

// Route Callback (MoMo gọi vào, không cần protect jwt nhưng cần check signature nếu làm kỹ)
router.post("/callback", paymentCallback);

module.exports = router;
