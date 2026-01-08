const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  // 1. Kiểm tra header Authorization có dạng "Bearer <token>"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Lấy token
      token = req.headers.authorization.split(" ")[1];

      // Giải mã token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Tìm user từ DB (bỏ password)
      req.user = await User.findById(decoded.id).select("-password");

      // 🛑 FIX LỖI 500: Kiểm tra nếu user không tồn tại (đã bị xóa)
      if (!req.user) {
        res.status(401);
        throw new Error("User không tồn tại hoặc đã bị xóa.");
      }

      next(); // Cho phép đi tiếp
    } catch (error) {
      console.error(error);
      res.status(401);
      // Trả về JSON lỗi để tránh crash app nếu không bắt được exception
      throw new Error("Token không hợp lệ, vui lòng đăng nhập lại");
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Không có quyền truy cập, thiếu Token");
  }
};

// Middleware phân quyền (Authorize)
const authorize = (...roles) => {
  return (req, res, next) => {
    // Kiểm tra an toàn: nếu req.user chưa có thì chặn luôn
    if (!req.user) {
      res.status(401);
      throw new Error("Chưa đăng nhập (User not found)");
    }

    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(
        `Role '${req.user.role}' không có quyền thực hiện hành động này`
      );
    }
    next();
  };
};

// 👇 QUAN TRỌNG: Phải export dạng Object chứa cả 2 hàm
module.exports = { protect, authorize };
