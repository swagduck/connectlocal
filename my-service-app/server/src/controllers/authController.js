const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Blacklist để lưu token đã bị revoke
const tokenBlacklist = new Set();

// Rate limiting cho login attempts
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 phút

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

// @desc    Đăng ký
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;
    
    // Validation
    if (!name || name.length < 2) {
      return res.status(400).json({ success: false, message: "Tên phải có ít nhất 2 ký tự" });
    }
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: "Email không hợp lệ" });
    }
    
    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, message: "Mật khẩu phải có ít nhất 8 ký tự" });
    }
    
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      return res.status(400).json({ success: false, message: "Mật khẩu phải chứa chữ hoa, chữ thường và số" });
    }
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: "Email này đã được sử dụng" });
    }
    
    const user = await User.create({ name, email, password, phone, role });
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken();
    
    res.status(201).json({
      success: true,
      token,
      refreshToken,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      walletBalance: user.walletBalance || 0, // Thêm wallet balance vào response
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Đăng nhập
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // Check rate limiting
    const attempts = loginAttempts.get(clientIP) || { count: 0, lastAttempt: 0 };
    
    if (attempts.count >= MAX_LOGIN_ATTEMPTS && Date.now() - attempts.lastAttempt < LOCK_TIME) {
      const remainingTime = Math.ceil((LOCK_TIME - (Date.now() - attempts.lastAttempt)) / 60000);
      return res.status(429).json({ 
        success: false, 
        message: `Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau ${remainingTime} phút` 
      });
    }
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập email và mật khẩu" });
    }
    
    const user = await User.findOne({ email }).select("+password");
    
    if (!user || !(await user.matchPassword(password))) {
      // Increment failed attempts
      loginAttempts.set(clientIP, {
        count: attempts.count + 1,
        lastAttempt: Date.now()
      });
      
      return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không đúng" });
    }
    
    // Check if user is banned
    if (user.banned) {
      return res.status(403).json({ success: false, message: "Tài khoản của bạn đã bị khóa" });
    }
    
    // Reset attempts on successful login
    loginAttempts.delete(clientIP);
    
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken();
    
    res.status(200).json({
      success: true,
      token,
      refreshToken,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      address: user.address,
      walletBalance: user.walletBalance || 0, // Thêm wallet balance vào response
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Đăng xuất
exports.logout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      tokenBlacklist.add(token);
    }
    res.status(200).json({ success: true, message: "Đăng xuất thành công" });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh token
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: "Refresh token required" });
    }
    
    // Verify refresh token (you should store refresh tokens in database)
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid refresh token" });
    }
    
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken();
    
    res.status(200).json({
      success: true,
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid refresh token" });
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
