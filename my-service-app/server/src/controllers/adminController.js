const User = require("../models/User");
const Service = require("../models/Service");
const Booking = require("../models/Booking");
const Request = require("../models/Request");
const Transaction = require("../models/Transaction");

// @desc    Lấy thống kê hệ thống (Dashboard Stats)
// @route   GET /api/admin/stats
exports.getStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalServices = await Service.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const totalRequests = await Request.countDocuments();

    // Tính toán doanh thu
    const completedBookings = await Booking.find({ status: "completed" });
    const totalRevenue = completedBookings.reduce((sum, booking) => sum + (booking.platformFee || 0), 0);
    const totalProviderEarnings = completedBookings.reduce((sum, booking) => sum + (booking.providerEarning || 0), 0);
    const totalTransactionValue = completedBookings.reduce((sum, booking) => sum + (booking.price || 0), 0);

    // Thống kê theo tháng
    const currentMonth = new Date();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    
    const monthlyBookings = completedBookings.filter(booking => 
      new Date(booking.createdAt) >= firstDayOfMonth
    );
    
    const monthlyRevenue = monthlyBookings.reduce((sum, booking) => sum + (booking.platformFee || 0), 0);
    const monthlyTransactions = monthlyBookings.length;

    res.status(200).json({
      success: true,
      data: {
        users: totalUsers,
        services: totalServices,
        bookings: totalBookings,
        requests: totalRequests,
        revenue: totalRevenue,
        totalProviderEarnings,
        totalTransactionValue,
        monthlyRevenue,
        monthlyTransactions,
        completedBookings: completedBookings.length,
        pendingBookings: await Booking.countDocuments({ status: "pending" }),
        cancelledBookings: await Booking.countDocuments({ status: "cancelled" }),
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

// @desc    Lấy tất cả Yêu cầu tìm thợ
// @route   GET /api/admin/requests
exports.getAllRequests = async (req, res, next) => {
  try {
    const requests = await Request.find()
      .populate("user", "name email avatar")
      .sort("-createdAt");

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật trạng thái Yêu cầu (Duyệt/Từ chối)
// @route   PUT /api/admin/requests/:id
exports.updateRequest = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ"
      });
    }

    const request = await Request.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate("user", "name email");

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy yêu cầu"
      });
    }

    res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Ban User (Khóa tài khoản)
// @route   PUT /api/admin/users/:id/ban
exports.banUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { banned: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng"
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unban User (Mở khóa tài khoản)
// @route   PUT /api/admin/users/:id/unban
exports.unbanUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { banned: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng"
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin cập nhật trạng thái Đơn hàng (Có xử lý hoàn tiền)
// @route   PUT /api/admin/bookings/:id
exports.adminUpdateBooking = async (req, res, next) => {
  try {
    const { status } = req.body;
    let booking = await Booking.findById(req.params.id)
      .populate("service")
      .populate("user")
      .populate("provider");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng"
      });
    }

    // --- LOGIC HOÀN TIỀN KHI ADMIN HỦY ĐƠN ---
    if (status === "cancelled" && booking.status !== "cancelled") {
      const amount = booking.price || booking.service.price;

      // 1. Trả lại tiền cho Khách
      const customer = await User.findById(booking.user._id);
      if (customer) {
        customer.walletBalance += amount;
        await customer.save();
      }

      // 2. Trừ tiền của Thợ (vì lúc đặt đã cộng rồi)
      const provider = await User.findById(booking.provider._id);
      if (provider) {
        provider.walletBalance -= amount;
        await provider.save();
      }

      // 3. Lưu lịch sử giao dịch hoàn tiền
      await Transaction.create({
        user: customer._id,
        amount: amount,
        type: "refund",
        status: "completed",
        description: `Admin hủy đơn dịch vụ: ${booking.service.title}`,
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

// @desc    Admin lấy tất cả giao dịch
// @route   GET /api/admin/transactions
exports.getAllTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find()
      .populate("user", "name email avatar")
      .sort("-createdAt");

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
      topProviders: [],
      recentTransactions: []
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin cập nhật trạng thái giao dịch
// @route   PUT /api/admin/transactions/:id
exports.updateTransactionStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'completed', 'failed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ"
      });
    }

    const transaction = await Transaction.findById(req.params.id).populate("user");

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giao dịch"
      });
    }

    // Nếu admin hoàn thành giao dịch nạp tiền, cộng tiền vào ví user
    if (status === "completed" && transaction.type === "deposit" && transaction.status !== "completed") {
      const user = await User.findById(transaction.user._id);
      if (user) {
        user.walletBalance += transaction.amount;
        await user.save();
      }
    }

    transaction.status = status;
    await transaction.save();

    res.status(200).json({
      success: true,
      message: `Đã cập nhật trạng thái giao dịch thành: ${status}`,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa Yêu cầu
// @route   DELETE /api/admin/requests/:id
exports.deleteRequest = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy yêu cầu"
      });
    }

    await request.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy báo cáo doanh thu chi tiết
// @route   GET /api/admin/revenue
exports.getRevenueReport = async (req, res, next) => {
  try {
    const { period = '30d' } = req.query;
    
    // Xác định khoảng thời gian
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Lấy các booking hoàn thành trong khoảng thời gian
    const completedBookings = await Booking.find({
      status: "completed",
      createdAt: { $gte: startDate, $lte: now }
    }).populate('service', 'title category')
      .populate('provider', 'name email avatar role')
      .sort('-createdAt');

    // Cập nhật các booking cũ thiếu thông tin commission
    for (let booking of completedBookings) {
      if (!booking.platformFee || !booking.providerEarning) {
        const commissionRate = 0.1;
        const platformFee = Math.round(booking.price * commissionRate);
        const providerEarning = booking.price - platformFee;
        
        booking.platformFee = platformFee;
        booking.providerEarning = providerEarning;
        
        // Cập nhật vào database
        await Booking.findByIdAndUpdate(booking._id, {
          platformFee: platformFee,
          providerEarning: providerEarning
        });
      }
    }

    // Tính toán các chỉ số
    const totalRevenue = completedBookings.reduce((sum, booking) => sum + (booking.platformFee || 0), 0);
    const totalProviderEarnings = completedBookings.reduce((sum, booking) => sum + (booking.providerEarning || 0), 0);
    const totalTransactionValue = completedBookings.reduce((sum, booking) => sum + (booking.price || 0), 0);
    const averageOrderValue = completedBookings.length > 0 ? totalTransactionValue / completedBookings.length : 0;

    // Doanh thu theo danh mục
    const revenueByCategory = {};
    completedBookings.forEach(booking => {
      const category = booking.service?.category || 'Khác';
      if (!revenueByCategory[category]) {
        revenueByCategory[category] = {
          revenue: 0,
          count: 0,
          totalValue: 0
        };
      }
      revenueByCategory[category].revenue += booking.platformFee || 0;
      revenueByCategory[category].count += 1;
      revenueByCategory[category].totalValue += booking.price || 0;
    });

    // Doanh thu theo ngày (cho chart)
    const dailyRevenue = {};
    completedBookings.forEach(booking => {
      const date = new Date(booking.createdAt).toISOString().split('T')[0];
      if (!dailyRevenue[date]) {
        dailyRevenue[date] = {
          revenue: 0,
          count: 0,
          totalValue: 0
        };
      }
      dailyRevenue[date].revenue += booking.platformFee || 0;
      dailyRevenue[date].count += 1;
      dailyRevenue[date].totalValue += booking.price || 0;
    });

    // Top providers
    const providerStats = {};
    completedBookings.forEach(booking => {
      const providerId = booking.provider?._id;
      const providerName = booking.provider?.name || 'Unknown';
      const providerRole = booking.provider?.role || 'unknown';
      
      if (!providerStats[providerId]) {
        providerStats[providerId] = {
          name: providerName,
          role: providerRole,
          revenue: 0,
          count: 0,
          totalValue: 0
        };
      }
      providerStats[providerId].revenue += booking.platformFee || 0;
      providerStats[providerId].count += 1;
      providerStats[providerId].totalValue += booking.price || 0;
    });

    const topProviders = Object.values(providerStats)
      .filter(provider => provider.role === 'provider') // Chỉ lấy thợ thật sự
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Xử lý recentTransactions với populate đầy đủ
    const recentTransactions = [];
    for (let i = 0; i < Math.min(completedBookings.length, 20); i++) {
      const booking = completedBookings[i];
      let serviceInfo = booking.service;
      
      // Nếu service không được populate, thử lấy lại
      if (!serviceInfo || typeof serviceInfo !== 'object') {
        try {
          const service = await Service.findById(booking.service);
          if (service) {
            serviceInfo = {
              _id: service._id,
              title: service.title,
              category: service.category
            };
          }
        } catch (error) {
          console.log('Failed to fetch service for booking:', booking._id);
        }
      }
      
      recentTransactions.push({
        _id: booking._id,
        service: serviceInfo,
        provider: booking.provider,
        price: booking.price,
        platformFee: booking.platformFee,
        providerEarning: booking.providerEarning,
        createdAt: booking.createdAt,
        status: booking.status
      });
    }

    res.status(200).json({
      success: true,
      data: {
        period,
        summary: {
          totalRevenue,
          totalProviderEarnings,
          totalTransactionValue,
          averageOrderValue: Math.round(averageOrderValue),
          totalBookings: completedBookings.length,
          commissionRate: 0.1, // 10%
          netProfit: totalRevenue // Doanh thu ròng = phí nền tảng
        },
        revenueByCategory,
        dailyRevenue: Object.entries(dailyRevenue)
          .map(([date, data]) => ({ date, ...data }))
          .sort((a, b) => new Date(a.date) - new Date(b.date)),
        topProviders,
        recentTransactions
      }
    });
  } catch (error) {
    next(error);
  }
};
