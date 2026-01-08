const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Service = require("./src/models/Service"); // Đảm bảo đúng đường dẫn tới model

// Load biến môi trường
dotenv.config();

// Kết nối DB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Đã kết nối MongoDB..."))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

const deleteData = async () => {
  try {
    // Xóa sạch bảng Service
    await Service.deleteMany();
    console.log("🔥 Đã xóa TOÀN BỘ dịch vụ thành công!");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

// Chạy hàm xóa
deleteData();
