const Review = require("../models/Review");
const Service = require("../models/Service");
const Booking = require("../models/Booking");

// @desc    Lấy danh sách review của 1 dịch vụ
// @route   GET /api/services/:serviceId/reviews
// @access  Public
exports.getReviews = async (req, res, next) => {
  try {
    if (req.params.serviceId) {
      const reviews = await Review.find({ service: req.params.serviceId })
        .populate({
          path: "user",
          select: "name avatar",
        })
        .sort("-createdAt"); // Mới nhất lên đầu

      return res.status(200).json({
        success: true,
        count: reviews.length,
        data: reviews,
      });
    } else {
      res.status(400).json({ success: false, message: "Thiếu Service ID" });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Viết đánh giá mới
// @route   POST /api/services/:serviceId/reviews
// @access  Private
exports.addReview = async (req, res, next) => {
  try {
    req.body.service = req.params.serviceId;
    req.body.user = req.user.id;

    const service = await Service.findById(req.params.serviceId);

    if (!service) {
      res.status(404);
      throw new Error("Dịch vụ không tồn tại");
    }

    // 1. Kiểm tra: Phải có đơn hàng trạng thái 'completed' mới được review
    const hasBooking = await Booking.findOne({
      user: req.user.id,
      service: req.params.serviceId,
      status: "completed",
    });

    if (!hasBooking) {
      res.status(400);
      throw new Error("Bạn cần hoàn thành dịch vụ này trước khi đánh giá");
    }

    // 2. Kiểm tra: Đã đánh giá chưa?
    const alreadyReviewed = await Review.findOne({
      user: req.user.id,
      service: req.params.serviceId,
    });

    if (alreadyReviewed) {
      res.status(400);
      throw new Error("Bạn đã đánh giá dịch vụ này rồi");
    }

    const review = await Review.create(req.body);

    res.status(201).json({
      success: true,
      data: review,
    });
  } catch (error) {
    next(error);
  }
};
