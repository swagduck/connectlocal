const mongoose = require("mongoose");

const RequestSchema = new mongoose.Schema({
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
    required: [true, "Vui lòng mô tả chi tiết công việc"],
  },
  category: {
    type: String,
    required: [true, "Vui lòng chọn danh mục"],
  },
  budget: {
    type: Number,
    required: [true, "Vui lòng nhập ngân sách dự kiến"],
  },
  address: {
    type: String,
    required: [true, "Vui lòng nhập địa điểm"],
  },
  // 👇 Thêm danh sách người ứng tuyển
  applicants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  status: {
    type: String,
    enum: ["open", "closed"], // open: Đang tìm, closed: Đã chốt thợ (ẩn đi)
    default: "open",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Request", RequestSchema);
