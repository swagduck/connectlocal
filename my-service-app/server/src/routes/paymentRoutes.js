const express = require("express");
const router = express.Router();
const {
  createPayment,
  paymentCallback,
  getTransactions,
  deleteTransaction, // 👈 Nhớ import thêm hàm này
} = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

router.post("/create-payment", protect, createPayment);
router.get("/history", protect, getTransactions);
router.post("/callback", paymentCallback);

// 👇 Route Xóa giao dịch
router.delete("/:id", protect, deleteTransaction);

module.exports = router;
