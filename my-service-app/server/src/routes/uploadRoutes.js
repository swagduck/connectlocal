const express = require("express");
const router = express.Router();
// Import biến 'upload' từ file cấu hình Cloudinary
// Đảm bảo đường dẫn này đúng với cấu trúc thư mục của bạn
const upload = require("../config/cloudinary"); 

// Route: POST /api/upload
// 'image' là key mà frontend gửi lên trong FormData
router.post("/", upload.single("image"), (req, res) => {
  try {
    // Nếu upload thành công, Cloudinary sẽ trả về thông tin file trong req.file
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Chưa chọn file nào!" });
    }

    // Trả về đường dẫn ảnh online (req.file.path)
    res.status(200).json({
      success: true,
      url: req.file.path, 
    });
  } catch (error) {
    console.error("Lỗi Upload:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;