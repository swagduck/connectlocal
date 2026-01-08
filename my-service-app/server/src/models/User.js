const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Vui lòng nhập tên"],
  },
  email: {
    type: String,
    required: [true, "Vui lòng nhập email"],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Vui lòng nhập email hợp lệ",
    ],
  },
  password: {
    type: String,
    required: [true, "Vui lòng nhập mật khẩu"],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ["user", "provider", "admin"],
    default: "user",
  },
  phone: {
    type: String,
    default: "",
  },
  avatar: {
    type: String,
    default: "",
  },
  // 👇 THÊM TRƯỜNG ĐỊA CHỈ
  address: {
    type: String,
    default: "",
  },
  // Các trường dành riêng cho Thợ (Provider)
  rating: {
    type: Number,
    default: 0,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Mã hóa mật khẩu trước khi lưu
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Phương thức kiểm tra mật khẩu
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
