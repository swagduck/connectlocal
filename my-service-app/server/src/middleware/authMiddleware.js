const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  // Kiểm tra xem header có chứa Token dạng: "Bearer eyJhbGciOi..."
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Lấy token ra khỏi chuỗi "Bearer <token>"
      token = req.headers.authorization.split(" ")[1];

      // Giải mã token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Tìm user tương ứng với token đó và gán vào req.user
      // (Loại bỏ trường password)
      req.user = await User.findById(decoded.id).select("-password");

      next(); // Cho phép đi tiếp
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error("Token không hợp lệ, vui lòng đăng nhập lại");
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Không có quyền truy cập, thiếu Token");
  }
};

// Middleware kiểm tra quyền (VD: Chỉ cho phép Provider đăng bài)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(
        `Role ${req.user.role} không có quyền thực hiện hành động này`
      );
    }
    next();
  };
};

module.exports = { protect, authorize };
