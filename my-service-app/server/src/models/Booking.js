const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true, // Khách đặt
  },
  provider: {
    // Thợ nhận việc (Lưu riêng để dễ query)
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
    required: true,
  },
  date: {
    type: Date,
    required: [true, "Vui lòng chọn ngày giờ làm việc"],
  },
  note: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "completed", "cancelled"],
    default: "pending", // Mới đặt thì là đang chờ
  },
  price: {
    type: Number,
    required: true,
  },
  // Thông tin commission cho nền tảng
  platformFee: {
    type: Number,
    required: true,
    default: 0, // Phí nền tảng (10% mặc định)
  },
  providerEarning: {
    type: Number,
    required: true,
    default: 0, // Số tiền thợ nhận được
  },
  // Soft delete fields
  isDeleted: {
    type: Boolean,
    default: false,
    select: false // Mặc định không include trong queries
  },
  deletedAt: {
    type: Date,
    select: false // Mặc định không include trong queries
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    select: false // Mặc định không include trong queries
  },
  deletionReason: {
    type: String,
    select: false // Mặc định không include trong queries
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

// Middleware để tự động cập nhật updatedAt
BookingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method để tìm cả deleted và non-deleted records
BookingSchema.statics.findWithDeleted = function(filter = {}) {
  return this.find(filter);
};

// Static method để chỉ tìm deleted records
BookingSchema.statics.findDeleted = function(filter = {}) {
  return this.find({ ...filter, isDeleted: true });
};

// Static method để chỉ tìm non-deleted records (default)
BookingSchema.statics.findNotDeleted = function(filter = {}) {
  return this.find({ ...filter, isDeleted: false });
};

// Instance method để soft delete
BookingSchema.methods.softDelete = function(deletedBy, reason = '') {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  this.deletionReason = reason;
  return this.save();
};

// Instance method để restore
BookingSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = undefined;
  this.deletedBy = undefined;
  this.deletionReason = undefined;
  return this.save();
};

module.exports = mongoose.model("Booking", BookingSchema);
