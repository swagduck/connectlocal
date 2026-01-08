const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cấu hình Multer Storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'service-connect', // Tên thư mục lưu trên Cloudinary
    allowedFormats: ['jpeg', 'png', 'jpg'],
  },
});

const upload = multer({ storage });

module.exports = upload;