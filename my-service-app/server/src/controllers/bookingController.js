const Booking = require("../models/Booking");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const mongoose = require("mongoose");
const bookingService = require("../services/bookingService");
const config = require("../config");

// @desc    Tạo đơn đặt lịch mới
exports.createBooking = async (req, res, next) => {
  try {
    console.log('🚀 BookingController.createBooking called');
    console.log('📝 Request body:', req.body);
    console.log('👤 Request user:', req.user);
    
    const { serviceId, date, note } = req.body;

    // Use service layer to create booking
    const result = await bookingService.createBooking(req.user._id, {
      serviceId,
      date,
      note,
    });

    // Send notification to provider (after successful transaction)
    const sendToUser = req.app.get('sendToUser');
    if (sendToUser) {
      const customerInfo = await User.findById(req.user._id).select('name avatar');
      
      const success = sendToUser(result.booking.provider.toString(), 'new_booking_notification', {
        bookingId: result.booking._id,
        providerId: result.booking.provider,
        customer: customerInfo,
        service: {
          _id: result.booking.service,
          title: (await Booking.findById(result.booking._id).populate('service')).service.title,
          price: result.booking.price
        },
        date,
        note,
        message: `🎉 ${customerInfo.name} vừa đặt dịch vụ!`,
        timestamp: new Date()
      });
      
      if (success) {
        console.log('🎉 Booking notification sent to provider:', result.booking.provider);
      }
    }

    res.status(201).json({
      success: true,
      data: result.booking,
      fees: result.fees,
      customerBalance: result.customerBalance,
      message: `Đặt dịch vụ thành công! Đã trừ ${result.booking.price.toLocaleString('vi-VN')}đ từ ví của bạn.`,
    });
  } catch (error) {
    console.error('❌ Booking creation error:', error.message);
    next(error);
  }
};

// @desc    Lấy danh sách đơn hàng
exports.getBookings = async (req, res, next) => {
  try {
    const { page, limit, status, startDate, endDate, sort } = req.query;
    
    const result = await bookingService.getUserBookings(
      req.user._id, 
      req.user.role, 
      { page, limit, status, startDate, endDate, sort }
    );

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật trạng thái đơn hàng
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    const result = await bookingService.updateBookingStatus(
      req.params.id,
      status,
      req.user._id,
      req.user.role
    );

    // Send notification via socket (after successful transaction)
    const io = req.app.get('io');
    if (io) {
      let notificationMessage = '';
      let notificationType = '';
      
      switch (status) {
        case config.booking.statuses.CONFIRMED:
          notificationMessage = `🎉 Thợ đã nhận đơn!`;
          notificationType = 'booking_accepted';
          break;
        case config.booking.statuses.IN_PROGRESS:
          notificationMessage = `👷 Thợ đang thực hiện dịch vụ!`;
          notificationType = 'booking_in_progress';
          break;
        case config.booking.statuses.COMPLETED:
          notificationMessage = `✅ Đơn đã hoàn thành!`;
          notificationType = 'booking_completed';
          break;
        case config.booking.statuses.CANCELLED:
          notificationMessage = `❌ Đơn đã bị hủy!`;
          notificationType = 'booking_cancelled';
          break;
        default:
          notificationMessage = `📝 Trạng thái đơn đã cập nhật!`;
          notificationType = 'booking_updated';
      }

      // Send notification to customer
      const sendToUser = req.app.get('sendToUser');
      if (sendToUser) {
        const success = sendToUser(result.booking.user._id.toString(), 'booking_status_notification', {
          bookingId: result.booking._id,
          userId: result.booking.user._id,
          type: notificationType,
          service: {
            _id: result.booking.service,
            title: (await Booking.findById(result.booking._id).populate('service')).service.title
          },
          status,
          message: notificationMessage,
          timestamp: new Date()
        });
        
        if (success) {
          console.log('📨 Booking status notification sent to customer:', result.booking.user._id);
        }
      }
    }

    res.status(200).json({
      success: true,
      data: result.booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa đơn hàng (Soft Delete)
exports.deleteBooking = async (req, res, next) => {
  try {
    const reason = req.body.reason || `Xóa bởi ${req.user.role === 'admin' ? 'admin' : 'user'}`;
    
    const result = await bookingService.softDeleteBooking(
      req.params.id,
      req.user._id,
      reason
    );

    console.log(`🗑️ Booking ${req.params.id} đã được soft delete bởi ${req.user.name || req.user.id}`);
    console.log(`📝 Lý do: ${reason}`);

    res.status(200).json({ 
      success: true, 
      data: result.booking,
      message: "Đơn hàng đã được xóa (có thể khôi phục)"
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Khôi phục đơn hàng đã xóa (Restore)
exports.restoreBooking = async (req, res, next) => {
  try {
    // Only admin can restore
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Chỉ admin mới có quyền khôi phục đơn hàng"
      });
    }

    const result = await bookingService.restoreBooking(req.params.id, req.user._id);

    console.log(`♻️ Booking ${req.params.id} đã được restore bởi admin ${req.user.name || req.user.id}`);

    res.status(200).json({ 
      success: true, 
      data: result.booking,
      message: "Đơn hàng đã được khôi phục thành công"
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy danh sách đơn hàng đã xóa (Admin only)
exports.getDeletedBookings = async (req, res, next) => {
  try {
    // Chỉ admin mới có quyền xem
    if (req.user.role !== "admin") {
      res.status(403);
      throw new Error("Chỉ admin mới có quyền xem đơn hàng đã xóa");
    }

    const bookings = await Booking.findDeleted()
      .select('+isDeleted +deletedAt +deletedBy +deletionReason')
      .populate({ path: "service", select: "title price images priceUnit" })
      .populate({ path: "user", select: "name phone avatar email" })
      .populate({ path: "provider", select: "name phone avatar email" })
      .populate({ path: "deletedBy", select: "name email" })
      .sort("-deletedAt");

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa vĩnh viễn đơn hàng (Hard Delete - Admin only)
exports.hardDeleteBooking = async (req, res, next) => {
  try {
    // Chỉ admin mới có quyền xóa vĩnh viễn
    if (req.user.role !== "admin") {
      res.status(403);
      throw new Error("Chỉ admin mới có quyền xóa vĩnh viễn đơn hàng");
    }

    // Tìm booking đã bị xóa
    const booking = await Booking.findById(req.params.id)
      .select('+isDeleted +deletedAt +deletedBy +deletionReason');

    if (!booking) {
      res.status(404);
      throw new Error("Không tìm thấy đơn hàng");
    }

    // Chỉ có thể hard delete booking đã soft delete trước đó
    if (!booking.isDeleted) {
      res.status(400);
      throw new Error("Chỉ có thể xóa vĩnh viễn đơn hàng đã bị xóa trước đó");
    }

    // Hard delete
    await booking.deleteOne();

    console.log(`🔥 Booking ${booking._id} đã được HARD DELETE vĩnh viễn bởi admin ${req.user.name || req.user.id}`);

    res.status(200).json({ 
      success: true, 
      data: {},
      message: "Đơn hàng đã được xóa vĩnh viễn"
    });
  } catch (error) {
    next(error);
  }
};
