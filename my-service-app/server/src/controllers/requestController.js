const Request = require("../models/Request");
const Booking = require("../models/Booking"); // Import Booking để tạo đơn
const Service = require("../models/Service"); // Import Service để tạo Service ảo (nếu cần) hoặc trick

// ... createRequest giữ nguyên
exports.createRequest = async (req, res, next) => {
  try {
    req.body.user = req.user.id;
    const request = await Request.create(req.body);
    res.status(201).json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
};

// ... getRequests giữ nguyên (Chỉ lấy status 'open')
exports.getRequests = async (req, res, next) => {
  try {
    const requests = await Request.find({ status: "open" })
      .populate("user", "name avatar phone")
      .sort("-createdAt");
    res
      .status(200)
      .json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    next(error);
  }
};

// 👇 Lấy danh sách yêu cầu CỦA TÔI (Để khách vào xem ai ứng tuyển)
exports.getMyRequests = async (req, res, next) => {
  try {
    const requests = await Request.find({ user: req.user.id })
      .populate("applicants", "name avatar rating reviewCount phone") // Lấy thông tin thợ ứng tuyển
      .sort("-createdAt");
    res
      .status(200)
      .json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    next(error);
  }
};

// 👇 Thợ bấm "Ứng tuyển"
exports.applyRequest = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      res.status(404);
      throw new Error("Không tìm thấy yêu cầu");
    }

    // Kiểm tra xem đã ứng tuyển chưa
    if (request.applicants.includes(req.user.id)) {
      res.status(400);
      throw new Error("Bạn đã ứng tuyển đơn này rồi");
    }

    request.applicants.push(req.user.id);
    await request.save();

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
};

// 👇 Khách bấm "Chọn thợ này" -> Tạo Booking luôn
exports.chooseProvider = async (req, res, next) => {
  try {
    const { providerId } = req.body; // ID của ông thợ được chọn
    const requestId = req.params.id;

    const request = await Request.findById(requestId);
    if (!request) {
      res.status(404);
      throw new Error("Không tìm thấy yêu cầu");
    }

    if (request.user.toString() !== req.user.id) {
      res.status(401);
      throw new Error("Không có quyền");
    }

    // 1. Tạo một Booking mới
    // Lưu ý: Vì Booking cần serviceId, ta có thể tạo 1 Service ảo hoặc chỉ định Booking này đặc biệt.
    // Để đơn giản, ta sẽ trick: Booking schema của ta cần Service.
    // Cách tốt nhất: Tìm 1 service bất kỳ của ông thợ đó để link vào, hoặc update Booking Schema cho phép service null.
    // Ở đây mình giả định tìm Service đầu tiên của thợ đó để gán (cho đúng logic database cũ)

    const Service = require("../models/Service");
    const providerService = await Service.findOne({ user: providerId });

    // Nếu thợ này chưa đăng bài nào thì không tạo booking kiểu cũ được -> Có thể báo lỗi hoặc tạo service mặc định
    // Để code chạy mượt, ta sẽ tạo booking.
    // LƯU Ý: Bạn nên vào Model Booking sửa `service: { required: false }` nếu muốn linh hoạt hơn.
    // Ở đây mình dùng service tìm được.

    const bookingPayload = {
      user: req.user.id,
      provider: providerId,
      service: providerService ? providerService._id : null, // Cần serviceId để hiển thị ảnh
      date: Date.now(), // Làm ngay
      note: `Yêu cầu từ việc tìm người: ${request.title}. Ngân sách: ${request.budget}`,
      status: "confirmed", // Xác nhận luôn vì thợ đã ứng tuyển nghĩa là muốn làm
    };

    // Nếu thợ không có service nào thì ta không tạo được booking theo Schema cũ.
    // Giả sử thợ đã đăng bài (logic trước đó bắt thợ đăng bài mới hiện Profile)

    if (!providerService) {
      res.status(400);
      throw new Error("Thợ này chưa có hồ sơ dịch vụ nào để tạo đơn.");
    }

    await Booking.create(bookingPayload);

    // 2. Đóng yêu cầu (Để biến mất khỏi trang tìm việc)
    request.status = "closed";
    request.applicants = []; // Xóa danh sách chờ cho nhẹ
    await request.save();

    res
      .status(200)
      .json({
        success: true,
        message: "Đã chốt thợ & Tạo đơn hàng thành công!",
      });
  } catch (error) {
    next(error);
  }
};

// ... deleteRequest giữ nguyên
exports.deleteRequest = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      res.status(404);
      throw new Error("Không tìm thấy");
    }
    if (request.user.toString() !== req.user.id && req.user.role !== "admin") {
      res.status(401);
      throw new Error("Không có quyền xóa");
    }
    await request.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
