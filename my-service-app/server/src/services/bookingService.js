/**
 * Booking Service Layer
 * Handles all booking-related business logic separated from controller
 */

const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const config = require('../config');
const timezoneService = require('./timezoneService');

class BookingService {
  constructor() {
    this.commissionRate = config.booking.commissionRate;
    this.platformFeeRate = config.booking.platformFeeRate;
    this.minimumFee = config.booking.minimumFee;
  }

  /**
   * Calculate commission and fees for a booking
   */
  calculateFees(price) {
    const platformFee = Math.max(
      Math.round(price * this.platformFeeRate),
      this.minimumFee
    );
    const providerEarning = price - platformFee;
    
    return {
      platformFee,
      providerEarning,
      commissionRate: this.platformFeeRate,
      totalFee: platformFee,
    };
  }

  /**
   * Validate booking data with timezone handling
   */
  async validateBookingData(userId, serviceId, date, userTimezone = null) {
    const errors = [];

    // Validate service exists and is available
    const service = await Service.findById(serviceId);
    if (!service) {
      errors.push('Dịch vụ không tồn tại');
      return { valid: false, errors, service: null };
    }

    // Validate user is not booking their own service
    if (service.user.toString() === userId) {
      errors.push('Bạn không thể tự đặt dịch vụ của chính mình');
    }

    // Validate booking date with timezone awareness
    const dateValidation = timezoneService.validateBookingDate(date, userTimezone);
    if (!dateValidation.valid) {
      errors.push(dateValidation.error);
      return { valid: false, errors, service, dateValidation };
    }

    const bookingDate = dateValidation.bookingDate;

    // Check for double booking (using UTC dates for database consistency)
    const utcBookingDate = timezoneService.toDatabaseDate(date, userTimezone);
    
    const existingBookings = await Booking.findNotDeleted({
      provider: service.user,
      date: {
        $gte: timezoneService.getTodayRange(userTimezone).start,
        $lte: timezoneService.getTodayRange(userTimezone).end
      },
      status: { $in: [
        config.booking.statuses.PENDING,
        config.booking.statuses.CONFIRMED,
        config.booking.statuses.IN_PROGRESS
      ]}
    });

    // Check for time conflicts on the same day
    const timeConflict = existingBookings.some(booking => {
      const existingDate = timezoneService.fromDatabaseDate(booking.date, userTimezone);
      return timezoneService.isSameDay(existingDate, bookingDate, userTimezone);
    });

    if (timeConflict) {
      errors.push('Thợ đã có lịch hẹn vào thời gian này. Vui lòng chọn thời gian khác.');
    }

    // Validate user's daily booking limit
    const todayRange = timezoneService.getTodayRange(userTimezone);
    const todayBookings = await Booking.findNotDeleted({
      user: userId,
      createdAt: { 
        $gte: todayRange.start, 
        $lte: todayRange.end 
      }
    });

    if (todayBookings.length >= config.booking.maxBookingsPerDay) {
      errors.push(`Bạn đã đạt giới hạn đặt lịch trong ngày (${config.booking.maxBookingsPerDay} lịch)`);
    }

    return {
      valid: errors.length === 0,
      errors,
      service,
      dateValidation,
      bookingDate: utcBookingDate // Store UTC date in database
    };
  }

  /**
   * Validate user's wallet balance
   */
  async validateWalletBalance(userId, price) {
    const user = await User.findById(userId);
    if (!user) {
      return { valid: false, error: 'Không tìm thấy thông tin người dùng' };
    }

    if (user.walletBalance < price) {
      return { 
        valid: false, 
        error: `Số dư ví không đủ. Cần ${price.toLocaleString('vi-VN')}đ, bạn có ${user.walletBalance.toLocaleString('vi-VN')}đ.` 
      };
    }

    return { valid: true, user };
  }

  /**
   * Create booking with transaction support and timezone handling
   */
  async createBooking(userId, bookingData, userTimezone = null) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { serviceId, date, note } = bookingData;

      // Validate booking data with timezone
      const validation = await this.validateBookingData(userId, serviceId, date, userTimezone);
      if (!validation.valid) {
        if (session.inTransaction()) {
          await session.abortTransaction();
        }
        session.endSession();
        throw new Error(validation.errors.join(', '));
      }

      const { service, dateValidation, bookingDate } = validation;

      // Calculate fees
      const fees = this.calculateFees(service.price);

      // Validate wallet balance
      const balanceValidation = await this.validateWalletBalance(userId, service.price);
      if (!balanceValidation.valid) {
        if (session.inTransaction()) {
          await session.abortTransaction();
        }
        session.endSession();
        throw new Error(balanceValidation.error);
      }

      const { user } = balanceValidation;

      // Deduct money from customer wallet
      user.walletBalance -= service.price;
      await user.save({ session });

      // Create booking with UTC date
      const booking = await Booking.create([{
        user: userId,
        provider: service.user,
        service: serviceId,
        date: bookingDate, // Store UTC date
        note: note || '',
        price: service.price,
        platformFee: fees.platformFee,
        providerEarning: fees.providerEarning,
        status: config.booking.statuses.PENDING,
        timezone: userTimezone || timezoneService.defaultTimezone, // Store user's timezone
      }], { session });

      const bookingDoc = booking[0];

      // Create transaction record
      await Transaction.create([{
        user: userId,
        amount: service.price,
        type: 'payment',
        status: 'completed',
        description: `Thanh toán dịch vụ: ${service.title}`,
        bookingId: bookingDoc._id,
      }], { session });

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      console.log(`✅ Booking created successfully: ${bookingDoc._id}`);
      console.log(`🕐 Booking time: ${timezoneService.formatDate(bookingDate, userTimezone)}`);
      console.log(`💰 Fees: Platform=${fees.platformFee}, Provider=${fees.providerEarning}`);

      return {
        success: true,
        booking: bookingDoc,
        fees,
        customerBalance: user.walletBalance,
        dateValidation
      };

    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      session.endSession();
      console.error('❌ Booking creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Update booking status with transaction support
   */
  async updateBookingStatus(bookingId, newStatus, userId, userRole) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find and populate booking
      const booking = await Booking.findById(bookingId)
        .populate('service')
        .populate('user')
        .populate('provider')
        .session(session);

      if (!booking) {
        if (session.inTransaction()) {
          await session.abortTransaction();
        }
        session.endSession();
        throw new Error('Không tìm thấy đơn hàng');
      }

      // Check if service exists
      if (!booking.service) {
        if (session.inTransaction()) {
          await session.abortTransaction();
        }
        session.endSession();
        throw new Error('Dịch vụ của đơn hàng này không tồn tại hoặc đã bị xóa');
      }

      // Validate permissions
      const providerId = booking.provider._id ? booking.provider._id.toString() : booking.provider.toString();
      const customerId = booking.user._id ? booking.user._id.toString() : booking.user.toString();
      const userIdStr = userId.toString ? userId.toString() : userId;
      
      console.log(`🔍 Permission check:`, {
        bookingId,
        providerId,
        customerId,
        userId: userIdStr,
        userRole,
        isProvider: providerId === userIdStr,
        isCustomer: customerId === userIdStr,
        isAdmin: userRole === 'admin'
      });
      
      // Check if user has permission
      const isProvider = providerId === userIdStr;
      const isCustomer = customerId === userIdStr;
      const isAdmin = userRole === 'admin';
      
      if (!isProvider && !isCustomer && !isAdmin) {
        if (session.inTransaction()) {
          await session.abortTransaction();
        }
        session.endSession();
        throw new Error('Bạn không có quyền xử lý đơn hàng này');
      }
      
      // Additional permission checks based on user role and status
      if (isCustomer && !['cancelled'].includes(newStatus)) {
        if (session.inTransaction()) {
          await session.abortTransaction();
        }
        session.endSession();
        throw new Error('Khách hàng chỉ có thể hủy đơn hàng');
      }

      // Validate status transition
      const validTransitions = this.getValidStatusTransitions(booking.status);
      if (!validTransitions.includes(newStatus)) {
        if (session.inTransaction()) {
          await session.abortTransaction();
        }
        session.endSession();
        throw new Error(`Không thể chuyển từ ${booking.status} sang ${newStatus}`);
      }

      // Handle status-specific logic
      await this.handleStatusChange(booking, newStatus, session);

      // Update booking status
      booking.status = newStatus;
      await booking.save({ session });

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      console.log(`✅ Booking ${bookingId} status updated to ${newStatus}`);

      return {
        success: true,
        booking,
        previousStatus: booking.status,
      };

    } catch (error) {
      // Only abort transaction if it's still in progress
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      session.endSession();
      console.error('❌ Booking status update failed:', error.message);
      throw error;
    }
  }

  /**
   * Handle status-specific business logic
   */
  async handleStatusChange(booking, newStatus, session) {
    switch (newStatus) {
      case config.booking.statuses.COMPLETED:
        await this.processCompletion(booking, session);
        break;
      
      case config.booking.statuses.CANCELLED:
        await this.processCancellation(booking, session);
        break;
      
      default:
        // No special processing needed for other statuses
        break;
    }
  }

  /**
   * Process booking completion - pay provider
   */
  async processCompletion(booking, session) {
    const amount = booking.providerEarning;
    const providerId = booking.provider._id ? booking.provider._id : booking.provider;

    // Find provider and add money
    const provider = await User.findById(providerId).session(session);
    if (!provider) {
      throw new Error('Không tìm thấy thông tin thợ');
    }

    provider.walletBalance += amount;
    await provider.save({ session });

    // Create transaction for provider payment
    await Transaction.create([{
      user: provider._id,
      amount,
      type: 'earning',
      status: 'completed',
      description: `Thu tiền từ hoàn thành dịch vụ: ${booking.service?.title || 'Dịch vụ'}`,
      bookingId: booking._id,
    }], { session });

    // Create platform fee transaction
    if (booking.platformFee > 0) {
      await Transaction.create([{
        user: null, // System transaction
        amount: booking.platformFee,
        type: 'commission',
        status: 'completed',
        description: `Phí nền tảng từ dịch vụ: ${booking.service?.title || 'Dịch vụ'}`,
        bookingId: booking._id,
      }], { session });
    }

    console.log(`💰 Paid provider ${amount}đ for booking ${booking._id}`);
  }

  /**
   * Process booking cancellation - refund customer
   */
  async processCancellation(booking, session) {
    const amount = booking.price || booking.service?.price || 0;

    // Find customer and refund money
    const customer = await User.findById(booking.user._id).session(session);
    if (!customer) {
      throw new Error('Không tìm thấy thông tin khách hàng');
    }

    customer.walletBalance += amount;
    await customer.save({ session });

    // Create refund transaction
    await Transaction.create([{
      user: customer._id,
      amount,
      type: 'refund',
      status: 'completed',
      description: `Hoàn tiền do hủy đơn dịch vụ: ${booking.service?.title || 'Dịch vụ'}`,
      bookingId: booking._id,
    }], { session });

    console.log(`💸 Refunded ${amount}đ to customer for cancelled booking ${booking._id}`);
  }

  /**
   * Get valid status transitions
   */
  getValidStatusTransitions(currentStatus) {
    const transitions = {
      [config.booking.statuses.PENDING]: [
        config.booking.statuses.CONFIRMED,
        config.booking.statuses.CANCELLED,
      ],
      [config.booking.statuses.CONFIRMED]: [
        config.booking.statuses.IN_PROGRESS,
        config.booking.statuses.COMPLETED,
        config.booking.statuses.CANCELLED,
      ],
      [config.booking.statuses.IN_PROGRESS]: [
        config.booking.statuses.COMPLETED,
        config.booking.statuses.CANCELLED,
      ],
      [config.booking.statuses.COMPLETED]: [], // Final state
      [config.booking.statuses.CANCELLED]: [], // Final state
    };

    return transitions[currentStatus] || [];
  }

  /**
   * Get user bookings with filtering and pagination (timezone-aware)
   */
  async getUserBookings(userId, userRole, filters = {}, userTimezone = null) {
    const {
      status,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sort = '-createdAt'
    } = filters;

    // Build query
    let query = { isDeleted: false };
    
    console.log(`🔍 getUserBookings:`, { userId, userRole });
    
    if (userRole === 'provider') {
      // Providers can see bookings where they are the provider OR where they are the customer (self-booked)
      query.$or = [
        { provider: userId },
        { user: userId }
      ];
      console.log(`🔍 Filtering bookings for provider: ${userId} (as provider or customer)`);
    } else {
      query.user = userId;
      console.log(`🔍 Filtering bookings for user (customer): ${userId}`);
    }

    // Add status filter
    if (status) {
      query.status = status;
    }

    // Add date range filter with timezone handling
    if (startDate || endDate) {
      const dateRange = timezoneService.getDateRange(startDate, endDate, userTimezone);
      query.date = {
        $gte: dateRange.start,
        $lte: dateRange.end
      };
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('service', 'title price images priceUnit')
        .populate('user', 'name phone avatar email')
        .populate('provider', 'name phone avatar email')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(query)
    ]);

    // Convert dates to user's timezone for display
    const bookingsWithTimezone = bookings.map(booking => {
      const bookingObj = booking.toObject();
      bookingObj.localDate = timezoneService.fromDatabaseDate(booking.date, userTimezone);
      bookingObj.formattedDate = timezoneService.formatDate(booking.date, userTimezone);
      return bookingObj;
    });

    return {
      bookings: bookingsWithTimezone,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get booking statistics (timezone-aware)
   */
  async getBookingStats(userId, userRole, period = 'month', userTimezone = null) {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'day':
        startDate = timezoneService.getTodayRange(userTimezone).start;
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = timezoneService.getTodayRange(userTimezone).start;
        startDate.setDate(1);
        break;
      case 'year':
        startDate = timezoneService.getTodayRange(userTimezone).start;
        startDate.setMonth(0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const matchQuery = {
      isDeleted: false,
      createdAt: { $gte: startDate }
    };

    if (userRole === 'provider') {
      matchQuery.provider = userId;
    } else {
      matchQuery.user = userId;
    }

    const stats = await Booking.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$price' },
          averagePrice: { $avg: '$price' },
        }
      }
    ]);

    // Format results
    const formattedStats = {
      total: 0,
      totalRevenue: 0,
      byStatus: {},
    };

    stats.forEach(stat => {
      formattedStats.total += stat.count;
      formattedStats.totalRevenue += stat.totalRevenue;
      formattedStats.byStatus[stat._id] = {
        count: stat.count,
        totalRevenue: stat.totalRevenue,
        averagePrice: Math.round(stat.averagePrice),
      };
    });

    return formattedStats;
  }

  /**
   * Soft delete booking
   */
  async softDeleteBooking(bookingId, userId, reason = '') {
    console.log(`🔍 Soft delete request:`, { bookingId, userId, reason });
    
    const booking = await Booking.findById(bookingId)
      .select('+isDeleted +deletedAt +deletedBy +deletionReason')
      .populate('user')
      .populate('provider');
    
    console.log(`🔍 Found booking:`, { 
      bookingId: booking?._id, 
      isDeleted: booking?.isDeleted,
      userId: booking?.user?._id,
      providerId: booking?.provider?._id
    });
    
    if (!booking) {
      throw new Error('Không tìm thấy đơn hàng');
    }

    if (booking.isDeleted) {
      throw new Error('Đơn hàng đã bị xóa trước đó');
    }

    // Check permissions - user can delete their own bookings, provider can delete bookings assigned to them
    const userIdStr = userId.toString ? userId.toString() : userId;
    
    // Get IDs from populated objects
    const bookingUserId = booking.user._id ? booking.user._id.toString() : booking.user.toString();
    const bookingProviderId = booking.provider._id ? booking.provider._id.toString() : booking.provider.toString();
    
    console.log(`🔍 Permission check:`, {
      userIdStr,
      bookingUser: booking.user,
      bookingProvider: booking.provider,
      userMatch: bookingUserId === userIdStr,
      providerMatch: bookingProviderId === userIdStr
    });
    
    // Allow user (customer) to delete their own bookings
    // Allow provider to delete bookings assigned to them
    if (bookingUserId !== userIdStr && 
        bookingProviderId !== userIdStr) {
      throw new Error('Bạn không có quyền xóa đơn này');
    }

    await booking.softDelete(userIdStr, reason);

    return {
      success: true,
      booking: {
        id: booking._id,
        deletedAt: booking.deletedAt,
        deletedBy: booking.deletedBy,
      },
    };
  }

  /**
   * Restore deleted booking
   */
  async restoreBooking(bookingId, userId) {
    const booking = await Booking.findById(bookingId)
      .select('+isDeleted +deletedAt +deletedBy +deletionReason');

    if (!booking) {
      throw new Error('Không tìm thấy đơn hàng');
    }

    if (!booking.isDeleted) {
      throw new Error('Đơn hàng này chưa bị xóa');
    }

    await booking.restore();

    return {
      success: true,
      booking,
    };
  }
}

module.exports = new BookingService();
