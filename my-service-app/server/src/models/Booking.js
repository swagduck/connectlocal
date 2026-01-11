const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true, // Khách đặt
  },
  provider: {
    // Thợ nhận việc (Lưu riêng để dễ query)
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
    required: true,
  },
  date: {
    type: Date,
    required: [true, "Vui lòng chọn ngày giờ làm việc"],
  },
  note: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "completed", "cancelled"],
    default: "pending", // Mới đặt thì là đang chờ
  },
  price: {
    type: Number,
    required: true,
  },
  // Thông tin commission cho nền tảng
  platformFee: {
    type: Number,
    required: true,
    default: 0, // Phí nền tảng (10% mặc định)
  },
  providerEarning: {
    type: Number,
    required: true,
    default: 0, // Số tiền thợ nhận được
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Booking", BookingSchema);
