const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// Cấu hình nơi lưu và tên file
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/"); // Lưu vào thư mục uploads ở root server
  },
  filename(req, file, cb) {
    // Đặt tên file: fieldname-thời_gian.đuôi_file (để tránh trùng tên)
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// Kiểm tra định dạng file (chỉ cho up ảnh)
function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb("Lỗi: Chỉ chấp nhận file ảnh (jpg, jpeg, png)!");
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// Route Upload: POST /api/upload
router.post("/", upload.single("image"), (req, res) => {
  // Trả về đường dẫn file để Frontend lưu vào DB
  // Ví dụ: /uploads/image-123456789.jpg
  res.send(`/${req.file.path.replace(/\\/g, "/")}`);
});

module.exports = router;
