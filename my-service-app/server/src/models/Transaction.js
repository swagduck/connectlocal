const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function() {
        // Chỉ required khi không phải transaction commission (system transaction)
        return this.type !== "commission";
      },
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["deposit", "payment", "refund", "withdraw", "earning", "commission"], // nạp, thanh toán, hoàn tiền, rút, thu nhập, phí nền tảng
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      default: "momo",
    },
    description: String,
    momoOrderId: String, // Mã đơn hàng phía MoMo trả về (để đối soát)
    momoRequestId: String,
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Transaction", transactionSchema);
