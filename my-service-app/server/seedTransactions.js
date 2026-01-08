const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Transaction = require("./src/models/Transaction");
const User = require("./src/models/User");

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🔌 Đã kết nối MongoDB");

    // Lấy user đầu tiên tìm thấy để gán giao dịch
    const user = await User.findOne();
    if (!user) {
      console.log("❌ Không tìm thấy user nào để tạo giao dịch mẫu.");
      process.exit();
    }

    console.log(
      `👤 Đang tạo giao dịch mẫu cho user: ${user.name} (${user.email})`
    );

    // Xóa giao dịch cũ (nếu muốn sạch sẽ)
    // await Transaction.deleteMany({ user: user._id });

    const sampleTransactions = [
      {
        user: user._id,
        amount: 500000,
        type: "deposit",
        status: "completed", // ✅ Thành công
        paymentMethod: "momo",
        description: "Nạp tiền mua gói VIP",
        momoOrderId: "MOMO_TEST_01",
        createdAt: new Date(Date.now() - 86400000), // Hôm qua
      },
      {
        user: user._id,
        amount: 200000,
        type: "payment",
        status: "pending", // ⏳ Đang xử lý
        paymentMethod: "wallet",
        description: "Thanh toán dịch vụ dọn nhà",
        createdAt: new Date(), // Hôm nay
      },
      {
        user: user._id,
        amount: 100000,
        type: "deposit",
        status: "failed", // ❌ Thất bại
        paymentMethod: "momo",
        description: "Nạp tiền lỗi mạng",
        momoOrderId: "MOMO_TEST_03",
        createdAt: new Date(Date.now() - 172800000), // Hôm kia
      },
    ];

    await Transaction.insertMany(sampleTransactions);

    // Cập nhật ví user giả định (cộng 500k thành công)
    user.walletBalance = (user.walletBalance || 0) + 500000;
    await user.save();

    console.log("✅ Đã thêm 3 giao dịch mẫu (Success, Pending, Failed)!");
    process.exit();
  } catch (error) {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  }
};

seedData();
