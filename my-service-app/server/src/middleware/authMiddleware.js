const jwt = require("jsonwebtoken");
const User = require("../models/User");
const crypto = require('crypto');

// Blacklist để lưu token đã bị revoke
const tokenBlacklist = new Set();

const protect = async (req, res, next) => {
  let token;

  // Log debug cho DELETE requests
  if (req.method === 'DELETE' && req.path.includes('/bookings/')) {
    console.log(`🔍 Auth middleware - DELETE request:`, {
      path: req.path,
      method: req.method,
      hasAuthHeader: !!req.headers.authorization,
      authHeader: req.headers.authorization?.substring(0, 20) + '...'
    });
  }

  // 1. Kiểm tra header Authorization có dạng "Bearer <token>"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Lấy token
      token = req.headers.authorization.split(" ")[1];
      
      // Check if token is blacklisted
      if (tokenBlacklist.has(token)) {
        return res.status(401).json({ success: false, message: "Token đã bị revoke, vui lòng đăng nhập lại" });
      }

      // Giải mã token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Tìm user từ DB (bỏ password)
      req.user = await User.findById(decoded.id).select("-password");

      // 🛑 FIX LỖI 500: Kiểm tra nếu user không tồn tại (đã bị xóa)
      if (!req.user) {
        return res.status(401).json({ success: false, message: "User không tồn tại hoặc đã bị xóa." });
      }
      
      // Check if user is banned
      if (req.user.banned) {
        return res.status(403).json({ success: false, message: "Tài khoản của bạn đã bị khóa" });
      }

      // Log success cho DELETE requests
      if (req.method === 'DELETE' && req.path.includes('/bookings/')) {
        console.log(`🔍 Auth middleware - DELETE request authenticated:`, {
          userId: req.user._id,
          userRole: req.user.role,
          userName: req.user.name
        });
      }

      next(); // Cho phép đi tiếp
    } catch (error) {
      console.error('❌ Auth middleware error:', error.message);
      return res.status(401).json({ success: false, message: "Token không hợp lệ, vui lòng đăng nhập lại" });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Không có quyền truy cập, thiếu Token" });
  }
};

// Middleware phân quyền (Authorize)
const authorize = (...roles) => {
  return (req, res, next) => {
    // Kiểm tra an toàn: nếu req.user chưa có thì chặn luôn
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Chưa đăng nhập (User not found)" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: `Role '${req.user.role}' không có quyền thực hiện hành động này`
      });
    }
    next();
  };
};

// Middleware để revoke token
const revokeToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    tokenBlacklist.add(token);
  }
  next();
};

// 👇 QUAN TRỌNG: Phải export dạng Object chứa cả 2 hàm
module.exports = { protect, authorize, revokeToken, tokenBlacklist };
