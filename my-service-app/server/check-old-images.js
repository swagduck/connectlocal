const mongoose = require('mongoose');
const Service = require('./src/models/Service');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/service-connect')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Tìm các service có ảnh cũ
    const oldServices = await Service.find({
      images: { $regex: '^/uploads/' }
    });
    
    console.log('Found services with old image paths:', oldServices.length);
    
    oldServices.forEach(service => {
      console.log('Service:', service.title);
      console.log('Old images:', service.images);
      console.log('---');
    });
    
    if (oldServices.length > 0) {
      console.log('\nCần cập nhật', oldServices.length, 'service có ảnh cũ!');
    } else {
      console.log('\nKhông tìm thấy service nào có ảnh cũ.');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });
