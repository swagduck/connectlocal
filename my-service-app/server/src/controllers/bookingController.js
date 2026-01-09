const Booking = require("../models/Booking");
const Service = require("../models/Service");
const User = require("../models/User"); // Nhớ import User để xử lý ví
const Transaction = require("../models/Transaction"); // Nhớ import Transaction

// @desc    Tạo đơn đặt lịch mới
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

    // Kiểm tra số dư ví của khách
    const customer = await User.findById(req.user._id);
    if (customer.walletBalance < service.price) {
      res.status(400);
      throw new Error("Số dư ví không đủ. Vui lòng nạp thêm tiền.");
    }

    // Trừ tiền từ ví khách
    customer.walletBalance -= service.price;
    await customer.save();

    // Tạo booking
    const booking = await Booking.create({
      user: req.user._id,
      provider: service.user,
      service: serviceId,
      date,
      note,
      price: service.price, // Lưu giá tại thời điểm đặt
    });

    // Tạo transaction ghi nhận thanh toán
    await Transaction.create({
      user: req.user._id,
      amount: service.price,
      type: "payment",
      status: "completed",
      description: `Thanh toán dịch vụ: ${service.title}`,
      bookingId: booking._id
    });

    console.log(`💳 Đã trừ ${service.price}đ từ ví khách ${customer.name} cho dịch vụ ${service.title}`);

    res.status(201).json({
      success: true,
      data: booking,
      message: `Đặt dịch vụ thành công! Đã trừ ${service.price.toLocaleString('vi-VN')}đ từ ví của bạn.`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy danh sách đơn hàng
exports.getBookings = async (req, res, next) => {
  try {
    let query;
    if (req.user.role === "provider") {
      query = Booking.find({ provider: req.user.id });
    } else {
      query = Booking.find({ user: req.user.id });
    }

    const bookings = await query
      .populate({ path: "service", select: "title price images priceUnit" })
      .populate({ path: "user", select: "name phone avatar email" })
      .populate({ path: "provider", select: "name phone avatar email" })
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

// @desc    Cập nhật trạng thái đơn hàng (Có xử lý hoàn tiền)
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    let booking = await Booking.findById(req.params.id)
      .populate("service")
      .populate("user");

    if (!booking) {
      res.status(404);
      throw new Error("Không tìm thấy đơn hàng");
    }

    // Kiểm tra quyền (Provider hoặc Admin)
    if (
      booking.provider.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      res.status(403);
      throw new Error("Bạn không có quyền xử lý đơn hàng này");
    }

    // --- LOGIC HOÀN TIỀN KHI THỢ HOÀN THÀNH CÔNG VIỆC ---
    if (status === "completed" && booking.status !== "completed") {
      const amount = booking.price || booking.service.price;

      // 1. Cộng tiền cho Thợ
      const provider = await User.findById(booking.provider);
      if (provider) {
        provider.walletBalance += amount;
        await provider.save();
        console.log(`✅ Đã cộng ${amount}đ cho thợ ${provider.name}`);
      }

      // 2. Lưu lịch sử giao dịch
      await Transaction.create({
        user: provider._id,
        amount: amount,
        type: "earning",
        status: "completed",
        description: `Thu tiền từ hoàn thành dịch vụ: ${booking.service.title}`,
        bookingId: booking._id
      });
    }

    // --- LOGIC HOÀN TIỀN KHI HỦY ĐƠN ---
    if (status === "cancelled" && booking.status !== "cancelled") {
      const amount = booking.price || booking.service.price;

      // 1. Trả lại tiền cho Khách
      const customer = await User.findById(booking.user);
      customer.walletBalance += amount;
      await customer.save();
      console.log(`✅ Đã hoàn ${amount}đ cho khách ${customer.name}`);

      // 2. Lưu lịch sử giao dịch hoàn tiền
      await Transaction.create({
        user: customer._id,
        amount: amount,
        type: "refund",
        status: "completed",
        description: `Hoàn tiền do hủy đơn dịch vụ: ${booking.service.title}`,
        bookingId: booking._id
      });
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
exports.deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404);
      throw new Error("Không tìm thấy đơn hàng");
    }

    if (
      booking.user.toString() !== req.user.id &&
      booking.provider.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      res.status(401);
      throw new Error("Bạn không có quyền xóa đơn này");
    }

    await booking.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
