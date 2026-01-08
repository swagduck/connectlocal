const User = require("../models/User");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// @desc    Đăng ký
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error("Email này đã được sử dụng");
    }
    const user = await User.create({ name, email, password, phone, role });
    const token = generateToken(user._id);
    res
      .status(201)
      .json({
        success: true,
        token,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      });
  } catch (error) {
    next(error);
  }
};

// @desc    Đăng nhập
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400);
      throw new Error("Vui lòng nhập email và mật khẩu");
    }
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      res.status(401);
      throw new Error("Email hoặc mật khẩu không đúng");
    }
    const token = generateToken(user._id);
    // Trả về cả address khi login
    res
      .status(200)
      .json({
        success: true,
        token,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        address: user.address,
      });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy info bản thân
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật info bản thân
exports.updateDetails = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      avatar: req.body.avatar,
      address: req.body.address, // <-- Đã thêm address
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy hồ sơ công khai
exports.getPublicProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      res.status(404);
      throw new Error("Không tìm thấy người dùng");
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
