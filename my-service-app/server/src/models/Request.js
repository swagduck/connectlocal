const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Vui lòng nhập tiêu đề yêu cầu"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Vui lòng nhập mô tả chi tiết"],
    },
    category: {
      type: String,
      required: [true, "Vui lòng chọn danh mục"],
    },
    // 👇 CÁC TRƯỜNG MỚI ĐỂ CHECK VÍ VÀ HIỂN THỊ
    budget: {
      type: Number,
      required: [true, "Vui lòng nhập ngân sách dự kiến"],
    },
    deadline: {
      type: Date,
      required: [true, "Vui lòng nhập hạn chót (deadline)"],
    },
    address: {
      type: String,
      required: [true, "Vui lòng nhập địa điểm thực hiện"],
    },
    status: {
      type: String,
      enum: ["open", "assigned", "completed", "cancelled"], // open: đang tìm, assigned: đã có thợ nhận
      default: "open",
    },
    images: [
      {
        type: String, // Link ảnh hiện trạng (nếu có)
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Request", requestSchema);
