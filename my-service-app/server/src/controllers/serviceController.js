const Service = require("../models/Service");

// @desc    Tạo dịch vụ mới (Full option)
exports.createService = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      price,
      priceUnit,
      duration,
      warranty,
      address,
      images,
    } = req.body;

    // Validate các trường bắt buộc
    if (!title || !category || !price || !address) {
      res.status(400);
      throw new Error("Vui lòng nhập đủ: Tên, Danh mục, Giá và Địa chỉ");
    }

    const service = await Service.create({
      user: req.user.id,
      title,
      description,
      category,
      price: Number(price),
      priceUnit: priceUnit || "lần", // Mặc định
      duration: duration || "Thỏa thuận", // Mặc định
      warranty: warranty || "Không", // Mặc định
      location: {
        address: address, // Lưu vào object location
        city: "Hồ Chí Minh", // Tạm thời hardcode hoặc lấy từ client gửi lên
      },
      images: images || [],
    });

    res.status(201).json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy danh sách dịch vụ (Tìm kiếm & Lọc)
exports.getServices = async (req, res, next) => {
  try {
    const { keyword, category } = req.query;
    let query = {};

    if (keyword) {
      query.title = { $regex: keyword, $options: "i" };
    }
    if (category) {
      query.category = category;
    }

    const services = await Service.find(query)
      .populate("user", "name avatar")
      .sort("-createdAt");

    res
      .status(200)
      .json({ success: true, count: services.length, data: services });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy chi tiết 1 dịch vụ
exports.getServiceById = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id).populate(
      "user",
      "name avatar email phone rating reviewCount"
    );

    if (!service) {
      res.status(404);
      throw new Error("Không tìm thấy dịch vụ");
    }
    res.status(200).json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa dịch vụ
exports.deleteService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      res.status(404);
      throw new Error("Dịch vụ không tồn tại");
    }

    // Check quyền
    if (service.user.toString() !== req.user.id && req.user.role !== "admin") {
      res.status(401);
      throw new Error("Bạn không sở hữu dịch vụ này");
    }

    await service.deleteOne();
    res.status(200).json({ success: true, message: "Đã xóa dịch vụ" });
  } catch (error) {
    next(error);
  }
};
