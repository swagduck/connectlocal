const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");

const {
  getTransactions,
  cancelTransaction,
  getAllTransactions,
  updateTransactionStatus,
} = require("../controllers/transactionController");

// Áp dụng middleware bảo vệ cho tất cả routes
router.use(protect);

// User routes
router.get("/", getTransactions);
router.put("/:id/cancel", cancelTransaction);

// Admin routes
router.get("/", getAllTransactions);
router.put("/:id", updateTransactionStatus);

module.exports = router;
