const Booking = require("../models/Booking");
const Service = require("../models/Service");
const User = require("../models/User"); // 👈 Import User để trừ tiền
const Transaction = require("../models/Transaction"); // 👈 Import Transaction để lưu lịch sử

// @desc    Tạo đơn đặt hàng mới & Trừ tiền ví
// @route   POST /api/bookings
// @access  Private (Khách hàng)
exports.createBooking = async (req, res, next) => {
  try {
    const { serviceId, date, note } = req.body;

    // 1. Tìm dịch vụ để lấy giá tiền
    const service = await Service.findById(serviceId).populate("user", "name");
    if (!service) {
      res.status(404);
      throw new Error("Dịch vụ không tồn tại");
    }

    // 2. Lấy thông tin người mua (để check số dư mới nhất)
    const buyer = await User.findById(req.user.id);

    // 3. KIỂM TRA SỐ DƯ VÍ
    const price = service.price;
    if (buyer.walletBalance < price) {
      res.status(400);
      // Gợi ý nạp tiền nếu thiếu
      throw new Error(
        `Số dư không đủ. Cần ${price.toLocaleString()}đ nhưng ví chỉ còn ${buyer.walletBalance.toLocaleString()}đ. Hãy nạp thêm!`
      );
    }

    // 4. TRỪ TIỀN & LƯU
    buyer.walletBalance -= price;
    await buyer.save();

    // 5. TẠO LỊCH SỬ GIAO DỊCH (Trừ tiền)
    await Transaction.create({
      user: buyer._id,
      amount: price,
      type: "payment", // Loại: Thanh toán
      status: "completed",
      paymentMethod: "wallet",
      description: `Thanh toán dịch vụ: ${service.name}`,
    });

    // 6. CỘNG TIỀN CHO THỢ (Tùy chọn: Có thể làm tính năng "Rút tiền" sau, giờ cộng ảo vào ví thợ hoặc giữ ở ví Admin chờ thanh toán)
    // Ở đây mình sẽ tạm cộng luôn cho Thợ để demo cho vui (Thực tế nên giữ lại 10-20% phí sàn)
    const provider = await User.findById(service.user._id);
    if (provider) {
      provider.walletBalance = (provider.walletBalance || 0) + price;
      await provider.save();

      // Tạo log nhận tiền cho thợ
      await Transaction.create({
        user: provider._id,
        amount: price,
        type: "deposit", // Thợ nhận được tiền coi như nạp
        status: "completed",
        paymentMethod: "wallet",
        description: `Nhận thanh toán từ khách ${buyer.name} cho dịch vụ ${service.name}`,
      });
    }

    // 7. TẠO BOOKING
    const booking = await Booking.create({
      user: req.user.id,
      service: serviceId,
      provider: service.user._id, // ID của thợ
      date: date || Date.now(),
      status: "pending", // Đợi thợ xác nhận (nhưng tiền đã trừ)
      note: note,
      price: price, // Lưu giá tại thời điểm đặt (đề phòng thợ tăng giá sau này)
    });

    res.status(201).json({
      success: true,
      message: "Đặt lịch & Thanh toán thành công!",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// ... (Giữ nguyên các hàm getBookings, updateBookingStatus cũ của bạn ở dưới nếu có)
// Nếu bạn chưa có, mình viết luôn hàm lấy danh sách đơn giản:

exports.getBookings = async (req, res, next) => {
  try {
    // Nếu là user thường: Xem đơn mình đặt
    // Nếu là provider: Xem đơn người ta đặt mình
    let query = { user: req.user.id };
    if (req.user.role === "provider") {
      query = { provider: req.user.id };
    }

    const bookings = await Booking.find(query)
      .populate("service", "name price image")
      .populate("user", "name email phone") // Lấy thông tin khách
      .populate("provider", "name email phone") // Lấy thông tin thợ
      .sort("-createdAt");

    res
      .status(200)
      .json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    next(error);
  }
};
