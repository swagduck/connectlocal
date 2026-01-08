const crypto = require("crypto");
const axios = require("axios");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

// Cấu hình MoMo (Nên đưa vào .env, ở đây để mẫu)
const config = {
  partnerCode: process.env.MOMO_PARTNER_CODE,
  accessKey: process.env.MOMO_ACCESS_KEY,
  secretKey: process.env.MOMO_SECRET_KEY,
  endpoint: "https://test-payment.momo.vn/v2/gateway/api/create", // Dùng link test
};

// 1. Tạo yêu cầu nạp tiền
exports.createPayment = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    // Tạo mã đơn hàng độc nhất
    const orderId = config.partnerCode + new Date().getTime();
    const requestId = orderId;
    const orderInfo = "Nạp tiền vào ví ServiceConnect";
    const redirectUrl = `${process.env.CLIENT_URL}/wallet`; // Quay về trang ví sau khi xong
    const ipnUrl = "https://your-domain.com/api/payment/callback"; // URL này phải public Internet (Dùng ngrok để test local)
    const requestType = "captureWallet";
    const extraData = ""; // Pass userId vào đây nếu cần xử lý IPN phức tạp

    // Tạo chữ ký (Signature) theo chuẩn MoMo
    const rawSignature = `accessKey=${config.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${config.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

    const signature = crypto
      .createHmac("sha256", config.secretKey)
      .update(rawSignature)
      .digest("hex");

    // Tạo transaction "pending" trong DB trước
    await Transaction.create({
      user: userId,
      amount: amount,
      type: "deposit",
      status: "pending",
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

    // Trả về link thanh toán cho Client
    res.status(200).json({ payUrl: response.data.payUrl });
  } catch (error) {
    console.error("MoMo Create Error:", error.message);
    res.status(500).json({ message: "Lỗi tạo giao dịch MoMo" });
  }
};

// 2. IPN (Instant Payment Notification) - MoMo gọi ngược lại server ta
// Lưu ý: Localhost không nhận được cái này, cần deploy hoặc dùng Ngrok
exports.paymentCallback = async (req, res) => {
  try {
    const { resultCode, orderId, amount } = req.body;

    console.log("MoMo Callback received:", req.body);

    // resultCode = 0 nghĩa là thành công
    if (resultCode === 0) {
      const transaction = await Transaction.findOne({ momoOrderId: orderId });

      if (transaction && transaction.status === "pending") {
        // Cập nhật trạng thái giao dịch
        transaction.status = "completed";
        await transaction.save();

        // Cộng tiền vào ví user
        const user = await User.findById(transaction.user);
        user.walletBalance += Number(amount);
        await user.save();

        console.log(`Đã cộng ${amount} cho user ${user.name}`);
      }
    }

    res.status(204).json({}); // Trả về cho MoMo biết đã nhận
  } catch (error) {
    console.error(error);
    res.status(500).json({});
  }
};

// 3. Lấy lịch sử giao dịch
exports.getTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).sort(
      "-createdAt"
    );
    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    next(error);
  }
};
