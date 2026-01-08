const express = require("express");
const router = express.Router();
// 👇 Import đúng file config Cloudinary
const upload = require("../config/cloudinary"); 

// Route Upload: POST /api/upload
router.post("/", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Chưa chọn file nào!" });
    }

    // Cloudinary trả về link ảnh online (https://...)
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