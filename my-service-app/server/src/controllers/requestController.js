const Request = require("../models/Request");
const User = require("../models/User");

// @desc    Tạo yêu cầu mới
exports.createRequest = async (req, res, next) => {
  try {
    const { title, description, category, budget, deadline, address } =
      req.body;

    if (!title || !description || !budget || !deadline || !address) {
      res.status(400);
      throw new Error("Vui lòng điền đầy đủ thông tin");
    }

    if (new Date(deadline) < new Date()) {
      res.status(400);
      throw new Error("Hạn chót phải lớn hơn thời gian hiện tại");
    }

    const user = await User.findById(req.user.id);
    if (user.walletBalance < Number(budget)) {
      res.status(400);
      throw new Error(
        `Số dư ví không đủ! Bạn cần tối thiểu ${Number(
          budget
        ).toLocaleString()}đ.`
      );
    }

    const request = await Request.create({
      user: req.user.id,
      title,
      description,
      category,
      budget: Number(budget),
      deadline,
      address,
      images: req.body.images || [],
      status: "open",
    });

    res.status(201).json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy danh sách yêu cầu
exports.getRequests = async (req, res, next) => {
  try {
    const { category, search, minPrice, maxPrice } = req.query;
    let query = { status: "open" };

    if (category) query.category = category;
    if (search) query.title = { $regex: search, $options: "i" };

    if (minPrice || maxPrice) {
      query.budget = {};
      if (minPrice) query.budget.$gte = Number(minPrice);
      if (maxPrice) query.budget.$lte = Number(maxPrice);
    }

    const requests = await Request.find(query)
      .populate("user", "name avatar role")
      .sort("-createdAt");

    res
      .status(200)
      .json({ success: true, count: requests.length, data: requests });
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
      throw new Error("Không tìm thấy yêu cầu");
    }
    if (request.user.toString() !== req.user.id && req.user.role !== "admin") {
      res.status(401);
      throw new Error("Không có quyền xóa bài này");
    }
    await request.deleteOne();
    res.status(200).json({ success: true, message: "Đã xóa yêu cầu" });
  } catch (error) {
    next(error);
  }
};

// 👇 QUAN TRỌNG: Phải có hàm này thì route mới không lỗi
exports.getRequestById = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id).populate(
      "user",
      "name avatar email phone"
    );
    if (!request) {
      res.status(404);
      throw new Error("Không tìm thấy yêu cầu");
    }
    res.status(200).json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
};
