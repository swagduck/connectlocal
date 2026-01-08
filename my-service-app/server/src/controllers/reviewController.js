const Review = require("../models/Review");
const Service = require("../models/Service");
const Booking = require("../models/Booking");

// @desc    Tạo hoặc Cập nhật đánh giá
exports.createReview = async (req, res) => {
  const { rating, comment, serviceId } = req.body;

  try {
    // 1. Kiểm tra xem khách đã có đơn hàng 'completed'
    const hasCompletedBooking = await Booking.findOne({
      user: req.user._id,
      service: serviceId,
      status: "completed",
    });

    if (!hasCompletedBooking) {
      return res.status(403).json({ 
        message: "Bạn chỉ có thể đánh giá sau khi đã hoàn thành đơn hàng." 
      });
    }

    // 2. Kiểm tra xem khách đã từng đánh giá chưa (để update)
    const existingReview = await Review.findOne({
      user: req.user._id,
      service: serviceId
    });

    if (existingReview) {
      // Cập nhật
      existingReview.rating = Number(rating);
      existingReview.comment = comment;
      existingReview.reply = ""; // Reset phản hồi của thợ
      existingReview.replyDate = null;
      await existingReview.save();
    } else {
      // Tạo mới
      await Review.create({
        user: req.user._id,
        service: serviceId,
        rating: Number(rating),
        comment,
      });
    }

    // 3. Tính toán lại số sao trung bình (Real-time)
    await calculateAverageRating(serviceId);

    res.status(200).json({ success: true, message: "Đánh giá thành công!" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Lấy danh sách đánh giá
exports.getServiceReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ service: req.params.serviceId })
      .populate("user", "name avatar")
      .sort("-updatedAt");
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Thợ phản hồi đánh giá
exports.replyReview = async (req, res) => {
  const { reply } = req.body;
  try {
    const review = await Review.findById(req.params.id).populate("service");
    if (!review) return res.status(404).json({ message: "Không tìm thấy đánh giá" });

    if (review.service.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Không có quyền phản hồi" });
    }

    review.reply = reply;
    review.replyDate = Date.now();
    await review.save();

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Kiểm tra quyền đánh giá
exports.checkEligibility = async (req, res) => {
  try {
    const { serviceId } = req.params;
    
    const hasCompletedBooking = await Booking.findOne({
      user: req.user._id,
      service: serviceId,
      status: "completed",
    });

    res.status(200).json({ 
      canReview: !!hasCompletedBooking 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Xóa đánh giá (MỚI)
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Không tìm thấy đánh giá" });
    }

    // Chỉ chủ sở hữu review hoặc Admin mới được xóa
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: "Không có quyền xóa" });
    }

    const serviceId = review.service; // Lưu ID để tính lại điểm
    await review.deleteOne();

    // Tính lại điểm sau khi xóa
    await calculateAverageRating(serviceId);

    res.status(200).json({ success: true, message: "Đã xóa đánh giá" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function: Tính toán trung bình sao
const calculateAverageRating = async (serviceId) => {
    const reviews = await Review.find({ service: serviceId });
    const numberOfReviews = reviews.length;
    
    const averageRating = numberOfReviews === 0 ? 0 : 
      reviews.reduce((acc, item) => item.rating + acc, 0) / numberOfReviews;

    await Service.findByIdAndUpdate(serviceId, {
      averageRating: averageRating.toFixed(1),
      numberOfReviews,
    });
};