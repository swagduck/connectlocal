const User = require("../models/User");
const Service = require("../models/Service");
const Booking = require("../models/Booking");
const Request = require("../models/Request");

// @desc    Lấy thống kê hệ thống (Dashboard Stats)
// @route   GET /api/admin/stats
exports.getStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalServices = await Service.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const totalRequests = await Request.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        users: totalUsers,
        services: totalServices,
        bookings: totalBookings,
        requests: totalRequests,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy tất cả Users
// @route   GET /api/admin/users
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort("-createdAt");
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa User (Và dọn dẹp dữ liệu liên quan)
// @route   DELETE /api/admin/users/:id
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error("Không tìm thấy người dùng");
    }

    // Dọn dẹp dữ liệu rác
    await Service.deleteMany({ user: user._id });
    await Request.deleteMany({ user: user._id });

    await user.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy tất cả Dịch vụ (Để Admin soi bài)
// @route   GET /api/admin/services
exports.getAllServices = async (req, res, next) => {
  try {
    const services = await Service.find()
      .populate("user", "name email")
      .sort("-createdAt");

    res.status(200).json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy tất cả Đơn hàng (Để giải quyết khiếu nại)
// @route   GET /api/admin/bookings
exports.getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "name email phone") // Khách
      .populate("provider", "name email phone") // Thợ
      .populate("service", "title") // Dịch vụ
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
