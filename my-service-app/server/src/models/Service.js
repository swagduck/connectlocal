const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Vui lòng nhập tên dịch vụ"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Vui lòng nhập mô tả dịch vụ"],
    },
    category: {
      type: String,
      required: [true, "Vui lòng chọn danh mục"],
      enum: [
        "Điện nước",
        "Sửa chữa nhà",
        "Vệ sinh",
        "Vận chuyển",
        "Gia sư",
        "Làm đẹp",
        "Khác",
      ],
    },
    price: {
      type: Number,
      required: [true, "Vui lòng nhập giá dịch vụ"],
    },
    // 👇 CÁC TRƯỜNG MỚI CHO DỊCH VỤ CHI TIẾT
    priceUnit: {
      type: String,
      default: "lần", // Ví dụ: lần, giờ, m2, cái...
      required: true,
    },
    duration: {
      type: String, // Ví dụ: "30 phút", "1 - 2 tiếng"
      default: "Thỏa thuận",
    },
    warranty: {
      type: String, // Ví dụ: "3 tháng", "Không bảo hành"
      default: "Không",
    },
    location: {
      address: { type: String, required: true },
      city: { type: String, default: "Hồ Chí Minh" },
      // Location coordinates for radius-based search
      coordinates: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          default: [0, 0]
        }
      }
    },
    images: [
      {
        type: String, // Mảng chứa link ảnh dịch vụ
      },
    ],
    // Các trường tính toán Rating (Tự động cập nhật khi có Review)
    averageRating: {
      type: Number,
      default: 0,
    },
    numberOfReviews: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Create geospatial index for radius-based search
serviceSchema.index({ 'location.coordinates': '2dsphere' });

module.exports = mongoose.model("Service", serviceSchema);
