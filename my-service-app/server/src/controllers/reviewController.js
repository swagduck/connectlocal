const Review = require("../models/Review");
const Service = require("../models/Service");
const Booking = require("../models/Booking");

// @desc    Tạo hoặc Cập nhật đánh giá
// (Mỗi khách chỉ 1 đánh giá/dịch vụ, nếu đánh giá lại sẽ tính là cập nhật)
exports.createReview = async (req, res) => {
  const { rating, comment, serviceId } = req.body;

  try {
    // 1. Kiểm tra xem khách đã có đơn hàng 'completed' với dịch vụ này chưa
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

    // 2. Kiểm tra xem khách đã từng đánh giá dịch vụ này chưa
    const existingReview = await Review.findOne({
      user: req.user._id,
      service: serviceId
    });

    if (existingReview) {
      // --- TRƯỜNG HỢP: ĐÃ CÓ (CẬP NHẬT) ---
      existingReview.rating = Number(rating);
      existingReview.comment = comment;
      
      // Reset lại phản hồi của thợ (để thợ biết mà trả lời lại nội dung mới)
      existingReview.reply = ""; 
      existingReview.replyDate = null;
      
      await existingReview.save();
    } else {
      // --- TRƯỜNG HỢP: CHƯA CÓ (TẠO MỚI) ---
      await Review.create({
        user: req.user._id,
        service: serviceId,
        rating: Number(rating),
        comment,
      });
    }

    // 3. Tính toán lại số sao trung bình của Service (Real-time)
    const reviews = await Review.find({ service: serviceId });
    const numberOfReviews = reviews.length;
    
    // Tính trung bình cộng
    const averageRating = numberOfReviews === 0 ? 0 : 
      reviews.reduce((acc, item) => item.rating + acc, 0) / numberOfReviews;

    // Cập nhật vào Service
    await Service.findByIdAndUpdate(serviceId, {
      averageRating: averageRating.toFixed(1),
      numberOfReviews,
    });

    res.status(200).json({ success: true, message: "Đánh giá của bạn đã được ghi nhận!" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Lấy danh sách đánh giá của một dịch vụ
exports.getServiceReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ service: req.params.serviceId })
      .populate("user", "name avatar") // Lấy tên và avatar người đánh giá
      .sort("-updatedAt"); // Sắp xếp theo ngày cập nhật mới nhất
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

    // Kiểm tra quyền sở hữu dịch vụ (chỉ chủ dịch vụ mới được reply)
    if (review.service.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Bạn không có quyền phản hồi đánh giá này" });
    }

    review.reply = reply;
    review.replyDate = Date.now();
    await review.save();

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Kiểm tra xem user có quyền đánh giá dịch vụ này không (để Frontend hiển thị form)
exports.checkEligibility = async (req, res) => {
  try {
    const { serviceId } = req.params;
    
    // Tìm đơn hàng đã hoàn thành của user với dịch vụ này
    const hasCompletedBooking = await Booking.findOne({
      user: req.user._id,
      service: serviceId,
      status: "completed",
    });

    // Trả về true nếu tìm thấy
    res.status(200).json({ 
      canReview: !!hasCompletedBooking 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};