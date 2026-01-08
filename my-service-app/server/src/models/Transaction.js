const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["deposit", "payment", "refund", "withdraw"], // nạp, thanh toán, hoàn tiền, rút
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      default: "momo",
    },
    description: String,
    momoOrderId: String, // Mã đơn hàng phía MoMo trả về (để đối soát)
    momoRequestId: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
