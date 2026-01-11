// Script để sửa đường dẫn ảnh từ /uploads/ sang Cloudinary
// Chạy khi server đang chạy: http://localhost:5000/api/admin/fix-images

const express = require('express');
const Service = require('./src/models/Service');

const fixImagePaths = async (req, res) => {
  try {
    console.log('🔧 Bắt đầu sửa đường dẫn ảnh...');
    
    // Tìm các service có ảnh cũ
    const oldServices = await Service.find({
      images: { $regex: '^/uploads/' }
    });
    
    console.log(`📁 Tìm thấy ${oldServices.length} service có ảnh cũ`);
    
    let fixedCount = 0;
    
    for (const service of oldServices) {
      console.log(`\n🔍 Sửa service: ${service.title}`);
      console.log('Ảnh cũ:', service.images);
      
      // Xóa các ảnh cũ (để trống)
      service.images = [];
      await service.save();
      
      console.log('✅ Đã xóa ảnh cũ cho:', service.title);
      fixedCount++;
    }
    
    res.status(200).json({
      success: true,
      message: `Đã sửa ${fixedCount} service, xóa ảnh cũ. Vui lòng upload lại ảnh Cloudinary.`,
      fixedCount
    });
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = { fixImagePaths };
