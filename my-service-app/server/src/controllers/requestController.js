const Request = require("../models/Request");
const Booking = require("../models/Booking");
const Service = require("../models/Service");
const User = require("../models/User");

// @desc    Tạo yêu cầu mới
exports.createRequest = async (req, res, next) => {
  try {
    req.body.user = req.user.id;

    // Kiểm tra ví (nếu muốn)
    // const user = await User.findById(req.user.id);
    // if (user.walletBalance < req.body.budget) { ... }

    const request = await Request.create(req.body);
    res.status(201).json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy danh sách yêu cầu (Status = open)
exports.getRequests = async (req, res, next) => {
  try {
    const requests = await Request.find({ status: "open" })
      .populate("user", "name avatar phone role")
      .populate("applicants", "name avatar rating reviewCount")
      .sort("-createdAt");
    res
      .status(200)
      .json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy yêu cầu CỦA TÔI
exports.getMyRequests = async (req, res, next) => {
  try {
    const requests = await Request.find({ user: req.user.id })
      .populate("applicants", "name avatar rating reviewCount phone")
      .sort("-createdAt");
    res
      .status(200)
      .json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    next(error);
  }
};

// @desc    Thợ ứng tuyển
exports.applyRequest = async (req, res, next) => {
  try {
    // Kiểm tra user có phải provider không
    const user = await User.findById(req.user.id);
    if (user.role !== 'provider') {
      res.status(403);
      throw new Error("Chỉ thợ mới có thể ứng tuyển");
    }

    // Kiểm tra thợ đã có dịch vụ chưa
    const hasService = await Service.findOne({ user: req.user.id });
    if (!hasService) {
      res.status(400);
      throw new Error("Bạn cần đăng ít nhất một dịch vụ trước khi ứng tuyển");
    }

    const request = await Request.findById(req.params.id);
    if (!request) {
      res.status(404);
      throw new Error("Không tìm thấy yêu cầu");
    }

    if (request.status !== 'open') {
      res.status(400);
      throw new Error("Yêu cầu này không còn nhận ứng viên");
    }

    // Check đã ứng tuyển chưa
    if (request.applicants.some(id => id.toString() === req.user.id)) {
      res.status(400);
      throw new Error("Bạn đã ứng tuyển đơn này rồi");
    }

    request.applicants.push(req.user.id);
    await request.save();

    // Populate để trả về thông tin đầy đủ
    await request.populate("applicants", "name avatar rating reviewCount");

    res.status(200).json({ 
      success: true, 
      message: "Ứng tuyển thành công!",
      data: request 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Khách chọn thợ -> Tạo Booking
exports.chooseProvider = async (req, res, next) => {
  try {
    const { providerId } = req.body;
    const request = await Request.findById(req.params.id);

    if (!request) {
      res.status(404);
      throw new Error("Không tìm thấy yêu cầu");
    }
    if (request.user.toString() !== req.user.id) {
      res.status(401);
      throw new Error("Không có quyền");
    }

    // Tìm service của thợ để link vào booking (trick)
    const providerService = await Service.findOne({ user: providerId });
    if (!providerService) {
      res.status(400);
      throw new Error("Thợ này chưa đăng dịch vụ nào nên không thể tạo đơn.");
    }

    // Tạo đơn hàng (Booking)
    await Booking.create({
      user: req.user.id,
      provider: providerId,
      service: providerService._id,
      date: Date.now(),
      note: `[Từ Yêu Cầu] ${request.title} - Ngân sách: ${request.budget}`,
      price: request.budget,
      status: "confirmed",
    });

    // Đóng yêu cầu
    request.status = "assigned"; // Hoặc "closed"
    request.applicants = [];
    await request.save();

    res.status(200).json({ success: true, message: "Đã chọn thợ thành công!" });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa yêu cầu
exports.deleteRequest = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      res.status(404);
      throw new Error("Not found");
    }
    if (request.user.toString() !== req.user.id && req.user.role !== "admin") {
      res.status(401);
      throw new Error("Not authorized");
    }
    await request.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

// 👇 Đảm bảo hàm này có mặt nếu route /:id get dùng nó (hoặc xóa route get by id nếu không cần)
exports.getRequestById = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id).populate("user");
    if (!request) {
      res.status(404);
      throw new Error("Not found");
    }
    res.status(200).json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
};
