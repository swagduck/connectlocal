const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const cookie = require('cookie');

// Blacklist để lưu token đã bị revoke
const tokenBlacklist = new Set();

// Rate limiting cho login attempts
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 phút

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "15m" }); // Short-lived access token
};

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

// Cookie settings for security
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true, // Prevents XSS attacks
    secure: isProduction, // Only send over HTTPS in production
    sameSite: 'strict', // CSRF protection
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/',
  };
};

// Set refresh token cookie
const setRefreshTokenCookie = (res, refreshToken) => {
  const cookieOptions = getCookieOptions();
  res.cookie('refreshToken', refreshToken, cookieOptions);
};

// Clear refresh token cookie
const clearRefreshTokenCookie = (res) => {
  const cookieOptions = getCookieOptions();
  res.clearCookie('refreshToken', cookieOptions);
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
    
    // Generate tokens
    const accessToken = generateToken(user._id);
    const refreshTokenString = generateRefreshToken();
    
    // Store refresh token in database
    const refreshToken = await RefreshToken.create({
      user: user._id,
      token: refreshTokenString,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip,
    });
    
    // Set refresh token in HttpOnly cookie
    setRefreshTokenCookie(res, refreshTokenString);
    
    // Return user data and access token only (no refresh token in body)
    res.status(201).json({
      success: true,
      token: accessToken, // Only access token in response body
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        walletBalance: user.walletBalance || 0,
      },
      message: "Đăng ký thành công"
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
    
    // Generate tokens
    const accessToken = generateToken(user._id);
    const refreshTokenString = generateRefreshToken();
    
    // Revoke all existing refresh tokens for this user (token rotation)
    await RefreshToken.revokeAllUserTokens(user._id);
    
    // Store new refresh token in database
    const refreshToken = await RefreshToken.create({
      user: user._id,
      token: refreshTokenString,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip,
    });
    
    // Set refresh token in HttpOnly cookie
    setRefreshTokenCookie(res, refreshTokenString);
    
    // Return user data and access token only (no refresh token in body)
    res.status(200).json({
      success: true,
      token: accessToken, // Only access token in response body
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        address: user.address,
        walletBalance: user.walletBalance || 0,
      },
      message: "Đăng nhập thành công"
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Đăng xuất
exports.logout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    // Add access token to blacklist
    if (token) {
      tokenBlacklist.add(token);
    }
    
    // Get refresh token from cookie
    const refreshToken = req.cookies.refreshToken;
    
    // Revoke refresh token in database
    if (refreshToken) {
      const storedToken = await RefreshToken.findOne({ token: refreshToken });
      if (storedToken) {
        await storedToken.revoke(req.user?._id);
      }
    }
    
    // Clear refresh token cookie
    clearRefreshTokenCookie(res);
    
    res.status(200).json({ 
      success: true, 
      message: "Đăng xuất thành công" 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh token
exports.refreshToken = async (req, res, next) => {
  try {
    // Get refresh token from HttpOnly cookie
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ 
        success: false, 
        message: "Refresh token required - Please login again" 
      });
    }
    
    // Find refresh token in database
    const storedToken = await RefreshToken.findOne({ token: refreshToken });
    
    if (!storedToken || !storedToken.isValid()) {
      // Clear invalid cookie
      clearRefreshTokenCookie(res);
      return res.status(401).json({ 
        success: false, 
        message: "Invalid or expired refresh token - Please login again" 
      });
    }
    
    // Get user from stored token
    const user = await User.findById(storedToken.user);
    
    if (!user) {
      await storedToken.revoke();
      clearRefreshTokenCookie(res);
      return res.status(401).json({ 
        success: false, 
        message: "User not found - Please login again" 
      });
    }
    
    // Check if user is banned
    if (user.banned) {
      await storedToken.revoke();
      clearRefreshTokenCookie(res);
      return res.status(403).json({ 
        success: false, 
        message: "Tài khoản của bạn đã bị khóa" 
      });
    }
    
    // Generate new tokens
    const newAccessToken = generateToken(user._id);
    const newRefreshTokenString = generateRefreshToken();
    
    // Revoke old refresh token (token rotation)
    await storedToken.revoke(user._id);
    
    // Create new refresh token
    const newRefreshToken = await RefreshToken.create({
      user: user._id,
      token: newRefreshTokenString,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip,
    });
    
    // Update last used timestamp for old token
    storedToken.lastUsedAt = new Date();
    await storedToken.save();
    
    // Set new refresh token in HttpOnly cookie
    setRefreshTokenCookie(res, newRefreshTokenString);
    
    // Return new access token only
    res.status(200).json({
      success: true,
      token: newAccessToken,
      message: "Token refreshed successfully"
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    clearRefreshTokenCookie(res);
    res.status(401).json({ 
      success: false, 
      message: "Token refresh failed - Please login again" 
    });
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

// @desc    Revoke all user tokens (Admin only or user self)
exports.revokeAllTokens = async (req, res, next) => {
  try {
    const userId = req.params.id || req.user._id;
    
    // Check permissions
    if (userId !== req.user._id && req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Bạn không có quyền thu hồi token này" 
      });
    }
    
    // Revoke all refresh tokens for user
    const result = await RefreshToken.revokeAllUserTokens(userId, req.user._id);
    
    // Clear current cookie
    clearRefreshTokenCookie(res);
    
    console.log(`🔒 Revoked ${result.modifiedCount} refresh tokens for user ${userId}`);
    
    res.status(200).json({ 
      success: true, 
      message: `Đã thu hồi ${result.modifiedCount} token. Vui lòng đăng nhập lại.` 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get active sessions (Admin only or user self)
exports.getActiveSessions = async (req, res, next) => {
  try {
    const userId = req.params.id || req.user._id;
    
    // Check permissions
    if (userId !== req.user._id && req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Bạn không có quyền xem session này" 
      });
    }
    
    // Get all valid refresh tokens for user
    const tokens = await RefreshToken.find({
      user: userId,
      isRevoked: false,
      expiresAt: { $gt: new Date() }
    })
    .select('token userAgent ipAddress createdAt lastUsedAt expiresAt')
    .sort('-createdAt');
    
    res.status(200).json({ 
      success: true, 
      count: tokens.length,
      data: tokens 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cleanup expired tokens (Admin only or scheduled job)
exports.cleanupExpiredTokens = async (req, res, next) => {
  try {
    // Only admin can trigger manually
    if (req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Chỉ admin mới có quyền thực hiện tác vụ này" 
      });
    }
    
    const result = await RefreshToken.cleanupExpired();
    
    console.log(`🧹 Cleaned up ${result.deletedCount} expired/revoked tokens`);
    
    res.status(200).json({ 
      success: true, 
      message: `Đã dọn dẹp ${result.deletedCount} token hết hạn/thu hồi` 
    });
  } catch (error) {
    next(error);
  }
};

// Schedule automatic cleanup (run every 24 hours)
setInterval(async () => {
  try {
    const result = await RefreshToken.cleanupExpired();
    if (result.deletedCount > 0) {
      console.log(`🧹 Auto-cleanup: Removed ${result.deletedCount} expired tokens`);
    }
  } catch (error) {
    console.error('❌ Auto-cleanup error:', error);
  }
}, 24 * 60 * 60 * 1000); // 24 hours
