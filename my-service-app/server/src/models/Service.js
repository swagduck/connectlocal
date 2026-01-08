const mongoose = require("mongoose");

const ServiceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Liên kết tới bảng User (người đăng)
    required: true,
  },
  title: {
    type: String,
    required: [true, "Vui lòng nhập tên dịch vụ"],
    trim: true,
    maxlength: [100, "Tên dịch vụ không quá 100 ký tự"],
  },
  description: {
    type: String,
    required: [true, "Vui lòng nhập mô tả chi tiết"],
  },
  category: {
    type: String,
    required: [true, "Vui lòng chọn danh mục"],
    enum: [
      "Sửa chữa nhà",
      "Điện nước",
      "Vệ sinh",
      "Gia sư",
      "Làm đẹp",
      "Vận chuyển",
      "Khác",
    ],
  },
  price: {
    type: Number,
    required: [true, "Vui lòng nhập giá dịch vụ"],
  },
  priceUnit: {
    // Đơn vị giá (VND/giờ, VND/lần...)
    type: String,
    default: "VND/lần",
  },
  images: {
    type: [String], // Mảng chứa đường dẫn ảnh
    default: [],
  },
  location: {
    // Vị trí làm việc (Quan trọng cho bản đồ)
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number],
      index: "2dsphere",
    },
    address: String,
  },
  isActive: {
    // Trạng thái bật/tắt dịch vụ
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Service", ServiceSchema);
