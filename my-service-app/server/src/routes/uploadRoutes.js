const express = require("express");
const router = express.Router();
// 👇 Import file cấu hình Cloudinary bạn đã tạo ở bước trước
const upload = require("../config/cloudinary"); 

// Route Upload: POST /api/upload
// Sử dụng middleware upload.single("image") từ config Cloudinary
router.post("/", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Chưa chọn file nào!" });
    }

    // Cloudinary sẽ trả về đường dẫn ảnh online trong req.file.path
    res.status(200).json({
      success: true,
      url: req.file.path, // Link ảnh https://...
    });
  } catch (error) {
    console.error("Lỗi upload:", error); // Log lỗi ra để dễ debug
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;