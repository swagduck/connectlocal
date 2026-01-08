const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, "Vui lòng nhập tiêu đề đánh giá"],
    maxlength: 100,
  },
  text: {
    type: String,
    required: [true, "Vui lòng nhập nội dung đánh giá"],
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: [true, "Vui lòng chấm điểm (1-5 sao)"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

// Đảm bảo 1 người chỉ được đánh giá 1 dịch vụ 1 lần
ReviewSchema.index({ service: 1, user: 1 }, { unique: true });

// Hàm tính toán điểm trung bình (Static Method)
ReviewSchema.statics.getAverageRating = async function (serviceId) {
  const obj = await this.aggregate([
    {
      $match: { service: serviceId },
    },
    {
      $group: {
        _id: "$service",
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  try {
    if (obj[0]) {
      // Cập nhật vào Service
      await this.model("Service").findByIdAndUpdate(serviceId, {
        averageRating: obj[0].averageRating.toFixed(1),
        reviewCount: obj[0].reviewCount,
      });

      // Cập nhật vào User (Thợ) để hiển thị uy tín
      const service = await this.model("Service").findById(serviceId);
      if (service) {
        await this.model("User").findByIdAndUpdate(service.user, {
          rating: obj[0].averageRating.toFixed(1),
          reviewCount: obj[0].reviewCount,
        });
      }
    } else {
      // Nếu không còn review nào
      await this.model("Service").findByIdAndUpdate(serviceId, {
        averageRating: 0,
        reviewCount: 0,
      });
    }
  } catch (err) {
    console.error(err);
  }
};

// Gọi hàm tính toán SAU KHI lưu review mới
ReviewSchema.post("save", function () {
  this.constructor.getAverageRating(this.service);
});

// Gọi hàm tính toán TRƯỚC KHI xóa review
ReviewSchema.pre("remove", function () {
  this.constructor.getAverageRating(this.service);
});

module.exports = mongoose.model("Review", ReviewSchema);
