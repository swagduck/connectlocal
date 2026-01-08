const Service = require("../models/Service");

// @desc    Lấy tất cả dịch vụ (có lọc & tìm kiếm)
// @route   GET /api/services
// @access  Public
exports.getServices = async (req, res, next) => {
  try {
    const reqQuery = { ...req.query };

    // Xử lý Tìm kiếm từ khóa
    if (req.query.keyword) {
      reqQuery.title = { $regex: req.query.keyword, $options: "i" };
    }

    const removeFields = ["select", "sort", "page", "limit", "keyword"];
    removeFields.forEach((param) => delete reqQuery[param]);

    let query = Service.find(reqQuery).populate({
      path: "user",
      select: "name avatar rating reviewCount",
    });

    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }

    const services = await query;

    res.status(200).json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Tạo dịch vụ mới
// @route   POST /api/services
// @access  Private (Chỉ Provider)
exports.createService = async (req, res, next) => {
  try {
    req.body.user = req.user.id;

    if (!req.body.location && req.user.location) {
      req.body.location = req.user.location;
    }

    const service = await Service.create(req.body);

    res.status(201).json({
      success: true,
      data: service,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy chi tiết 1 dịch vụ
// @route   GET /api/services/:id
// @access  Public
exports.getServiceById = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id).populate({
      path: "user",
      select: "name email phone avatar rating reviewCount",
    });

    if (!service) {
      res.status(404);
      throw new Error("Không tìm thấy dịch vụ này");
    }

    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa dịch vụ
// @route   DELETE /api/services/:id
// @access  Private (Chỉ chủ bài viết hoặc Admin)
exports.deleteService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      res.status(404);
      throw new Error("Không tìm thấy dịch vụ");
    }

    // Kiểm tra quyền: Chỉ người tạo ra dịch vụ mới được xóa (hoặc admin)
    // Lưu ý: service.user là object ID, cần toString() để so sánh
    if (service.user.toString() !== req.user.id && req.user.role !== "admin") {
      res.status(401);
      throw new Error("Bạn không có quyền xóa dịch vụ này");
    }

    await service.deleteOne(); // Xóa khỏi database

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
