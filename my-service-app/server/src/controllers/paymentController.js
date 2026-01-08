const crypto = require("crypto");
const axios = require("axios");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

// Cấu hình MoMo (Lấy từ .env)
const config = {
  partnerCode: process.env.MOMO_PARTNER_CODE,
  accessKey: process.env.MOMO_ACCESS_KEY,
  secretKey: process.env.MOMO_SECRET_KEY,
  endpoint: "https://test-payment.momo.vn/v2/gateway/api/create", // Link môi trường Test
};

// @desc    Tạo yêu cầu nạp tiền qua MoMo
// @route   POST /api/payment/create-payment
// @access  Private
exports.createPayment = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    // Kiểm tra số tiền hợp lệ (Ví dụ: tối thiểu 10,000đ)
    if (!amount || amount < 10000) {
      res.status(400);
      throw new Error("Số tiền nạp tối thiểu là 10.000 VNĐ");
    }

    // Tạo mã đơn hàng độc nhất (Order ID)
    const orderId = config.partnerCode + new Date().getTime();
    const requestId = orderId;
    const orderInfo = "Nạp tiền vào ví ServiceConnect";
    const redirectUrl = `${process.env.CLIENT_URL}/wallet`; // Quay về trang Ví sau khi thanh toán
    const ipnUrl = "https://your-domain.com/api/payment/callback"; // URL nhận thông báo (Cần public IP hoặc Ngrok để test)
    const requestType = "captureWallet";
    const extraData = ""; // Có thể truyền userId vào đây nếu cần xử lý IPN phức tạp

    // Tạo chữ ký (Signature) theo chuẩn MoMo HMAC SHA256
    const rawSignature = `accessKey=${config.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${config.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

    const signature = crypto
      .createHmac("sha256", config.secretKey)
      .update(rawSignature)
      .digest("hex");

    // Lưu giao dịch "pending" vào Database trước khi gọi MoMo
    await Transaction.create({
      user: userId,
      amount: amount,
      type: "deposit",
      status: "pending", // Đợi MoMo xác nhận
      paymentMethod: "momo",
      momoOrderId: orderId,
      momoRequestId: requestId,
      description: orderInfo,
    });

    // Gửi request sang MoMo
    const requestBody = {
      partnerCode: config.partnerCode,
      accessKey: config.accessKey,
      requestId: requestId,
      amount: amount,
      orderId: orderId,
      orderInfo: orderInfo,
      redirectUrl: redirectUrl,
      ipnUrl: ipnUrl,
      extraData: extraData,
      requestType: requestType,
      signature: signature,
      lang: "vi",
    };

    const response = await axios.post(config.endpoint, requestBody);

    // Trả về link thanh toán (payUrl) để Frontend chuyển hướng người dùng
    res.status(200).json({ payUrl: response.data.payUrl });
  } catch (error) {
    console.error("MoMo Create Error:", error.message);
    // Nếu lỗi từ phía MoMo, trả về thông báo rõ ràng hơn
    if (error.response) {
      console.error("MoMo Response Data:", error.response.data);
    }
    next(error);
  }
};

// @desc    Nhận thông báo IPN từ MoMo (Server gọi Server)
// @route   POST /api/payment/callback
// @access  Public (Không cần Token, nhưng cần check Signature nếu làm kỹ)
exports.paymentCallback = async (req, res) => {
  try {
    console.log("MoMo Callback received:", req.body);

    const { resultCode, orderId, amount } = req.body;

    // resultCode = 0 nghĩa là Giao dịch thành công
    if (resultCode === 0) {
      const transaction = await Transaction.findOne({ momoOrderId: orderId });

      // Chỉ xử lý nếu giao dịch tồn tại và đang là "pending" (tránh cộng tiền 2 lần)
      if (transaction && transaction.status === "pending") {
        // 1. Cập nhật trạng thái giao dịch
        transaction.status = "completed";
        await transaction.save();

        // 2. Cộng tiền vào ví User
        const user = await User.findById(transaction.user);
        if (user) {
          user.walletBalance = (user.walletBalance || 0) + Number(amount);
          await user.save();
          console.log(`✅ Đã cộng ${amount}đ cho user ${user.name}`);
        }
      }
    } else {
      // Nếu thất bại (User hủy hoặc lỗi thẻ), cập nhật status failed
      const transaction = await Transaction.findOne({ momoOrderId: orderId });
      if (transaction) {
        transaction.status = "failed";
        await transaction.save();
      }
    }

    // MoMo yêu cầu trả về status 204 (No Content) để xác nhận đã nhận tin
    res.status(204).json({});
  } catch (error) {
    console.error("IPN Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// @desc    Lấy lịch sử giao dịch của User hiện tại
// @route   GET /api/payment/history
// @access  Private
exports.getTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).sort(
      "-createdAt"
    ); // Mới nhất lên đầu

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa lịch sử giao dịch (Xóa mềm hoặc xóa cứng tùy nhu cầu)
// @route   DELETE /api/payment/:id
// @access  Private
exports.deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      res.status(404);
      throw new Error("Giao dịch không tồn tại");
    }

    // Kiểm tra quyền: Chỉ chủ sở hữu hoặc Admin mới được xóa
    if (
      transaction.user.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      res.status(401);
      throw new Error("Bạn không có quyền xóa lịch sử này");
    }

    // Thực hiện xóa
    await transaction.deleteOne();

    res.status(200).json({
      success: true,
      message: "Đã xóa lịch sử giao dịch thành công",
    });
  } catch (error) {
    next(error);
  }
};
