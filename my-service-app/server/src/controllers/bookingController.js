const Booking = require("../models/Booking");
const Service = require("../models/Service");

// @desc    Tạo đơn đặt lịch mới
// @route   POST /api/bookings
// @access  Private (Khách hàng)
exports.createBooking = async (req, res, next) => {
  try {
    const { serviceId, date, note } = req.body;

    const service = await Service.findById(serviceId);
    if (!service) {
      res.status(404);
      throw new Error("Dịch vụ không tồn tại");
    }

    if (service.user.toString() === req.user.id) {
      res.status(400);
      throw new Error("Bạn không thể tự đặt dịch vụ của chính mình");
    }

    const booking = await Booking.create({
      user: req.user.id,
      provider: service.user,
      service: serviceId,
      date,
      note,
    });

    res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy danh sách đơn hàng
// @route   GET /api/bookings
// @access  Private
exports.getBookings = async (req, res, next) => {
  try {
    let query;

    if (req.user.role === "provider") {
      query = Booking.find({ provider: req.user.id });
    } else {
      query = Booking.find({ user: req.user.id });
    }

    const bookings = await query
      .populate({
        path: "service",
        select: "title price images priceUnit",
      })
      .populate({
        path: "user",
        select: "name phone avatar email",
      })
      .populate({
        path: "provider",
        select: "name phone avatar email",
      })
      .sort("-createdAt");

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật trạng thái đơn hàng
// @route   PUT /api/bookings/:id
// @access  Private (Chỉ Provider hoặc Admin)
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      res.status(404);
      throw new Error("Không tìm thấy đơn hàng");
    }

    if (
      booking.provider.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      res.status(403);
      throw new Error("Bạn không có quyền xử lý đơn hàng này");
    }

    booking.status = status;
    await booking.save();

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa đơn hàng
// @route   DELETE /api/bookings/:id
// @access  Private (Chủ đơn hoặc Thợ nhận đơn)
exports.deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      res.status(404);
      throw new Error("Không tìm thấy đơn hàng");
    }

    // Kiểm tra quyền: Người đặt (user) HOẶC Người nhận (provider) đều được xóa
    if (
      booking.user.toString() !== req.user.id &&
      booking.provider.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      res.status(401);
      throw new Error("Bạn không có quyền xóa đơn này");
    }

    await booking.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
