const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    // 👇 SỬA: Đổi conversationId -> conversation
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    text: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", MessageSchema);
