const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Transaction = require("./src/models/Transaction");

dotenv.config();

const clearData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🔌 Đã kết nối MongoDB");

    // Xóa sạch toàn bộ giao dịch
    await Transaction.deleteMany({});

    console.log("✅ Đã xóa SẠCH lịch sử giao dịch giả!");
    process.exit();
  } catch (error) {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  }
};

clearData();
