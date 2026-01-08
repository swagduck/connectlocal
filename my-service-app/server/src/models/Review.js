const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    // 👇 Thêm trường phản hồi của Thợ
    reply: { type: String, default: "" },
    replyDate: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);