const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./src/models/User");

dotenv.config();

const resetBalance = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🔌 Đã kết nối MongoDB");

    // Tìm user của bạn và set tiền về 0 (Thay email bằng email admin của bạn nếu cần, hoặc reset tất cả)
    await User.updateMany({}, { walletBalance: 0 });

    console.log("✅ Đã reset toàn bộ ví về 0!");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

resetBalance();
