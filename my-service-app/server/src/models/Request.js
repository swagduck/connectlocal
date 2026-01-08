const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    budget: { type: Number, required: true },
    deadline: { type: Date, required: true },
    address: { type: String, required: true },
    status: {
      type: String,
      enum: ["open", "assigned", "completed", "cancelled", "closed"],
      default: "open",
    },
    images: [{ type: String }],

    // 👇 THÊM TRƯỜNG NÀY ĐỂ KHẮC PHỤC LỖI 500 KHI POPULATE
    applicants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Request", requestSchema);
