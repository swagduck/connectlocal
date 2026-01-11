const mongoose = require("mongoose");

const FriendSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index để tìm kiếm hiệu quả
FriendSchema.index({ requester: 1, recipient: 1 }, { unique: true });
FriendSchema.index({ recipient: 1, status: 1 }); // Để tìm các lời mời đang chờ

// Cập nhật updatedAt khi thay đổi status
FriendSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Friend", FriendSchema);
