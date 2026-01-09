const Transaction = require("../models/Transaction");
const User = require("../models/User");

// @desc    Lấy lịch sử giao dịch của user
// @route   GET /api/transactions
exports.getTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .sort("-createdAt")
      .populate("user", "name email");

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Người dùng hủy giao dịch nạp tiền
// @route   PUT /api/transactions/:id/cancel
exports.cancelTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giao dịch"
      });
    }

    // Kiểm tra quyền - chỉ user tạo giao dịch mới được hủy
    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền hủy giao dịch này"
      });
    }

    // Chỉ được hủy giao dịch đang chờ xử lý và là nạp tiền
    if (transaction.status !== "pending" || transaction.type !== "deposit") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể hủy giao dịch nạp tiền đang chờ xử lý"
      });
    }

    // Cập nhật trạng thái thành đã hủy
    transaction.status = "cancelled";
    await transaction.save();

    res.status(200).json({
      success: true,
      message: "Đã hủy giao dịch nạp tiền",
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin lấy tất cả giao dịch
// @route   GET /api/admin/transactions
exports.getAllTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find()
      .populate("user", "name email avatar")
      .sort("-createdAt");

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin cập nhật trạng thái giao dịch
// @route   PUT /api/admin/transactions/:id
exports.updateTransactionStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'completed', 'failed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ"
      });
    }

    const transaction = await Transaction.findById(req.params.id).populate("user");

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giao dịch"
      });
    }

    // Nếu admin hoàn thành giao dịch nạp tiền, cộng tiền vào ví user
    if (status === "completed" && transaction.type === "deposit" && transaction.status !== "completed") {
      const user = await User.findById(transaction.user._id);
      if (user) {
        user.walletBalance += transaction.amount;
        await user.save();
      }
    }

    transaction.status = status;
    await transaction.save();

    res.status(200).json({
      success: true,
      message: `Đã cập nhật trạng thái giao dịch thành: ${status}`,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};
