const mongoose = require('mongoose');
const Service = require('./src/models/Service');
const { getCoordinatesFromAddress } = require('./src/utils/geocoding');

// Test the radius search functionality
async function testRadiusSearch() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/service-app', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('🔗 Connected to MongoDB');

    // Create test services with different locations
    const testServices = [
      {
        user: new mongoose.Types.ObjectId(),
        title: 'Thợ sửa điện Quận 1',
        description: 'Sửa chữa điện nước tại nhà',
        category: 'Điện nước',
        price: 150000,
        location: {
          address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
          city: 'Hồ Chí Minh',
          coordinates: {
            type: 'Point',
            coordinates: [106.7009, 10.7769] // Quận 1
          }
        }
      },
      {
        user: new mongoose.Types.ObjectId(),
        title: 'Thợ sửa điện Quận 7',
        description: 'Sửa chữa điện nước tại nhà',
        category: 'Điện nước',
        price: 120000,
        location: {
          address: '456 Nguyễn Văn Linh, Quận 7, TP.HCM',
          city: 'Hồ Chí Minh',
          coordinates: {
            type: 'Point',
            coordinates: [106.7014, 10.7458] // Quận 7
          }
        }
      }
    ];

    // Clear existing test data and insert new test services
    await Service.deleteMany({ title: { $regex: 'Thợ sửa điện Quận' } });
    await Service.insertMany(testServices);
    console.log('✅ Test services created');

    // Test radius search from Quận 1 coordinates
    const userCoords = [106.7009, 10.7769]; // Quận 1
    const radius = 5000; // 5km

    const nearbyServices = await Service.find({
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: userCoords
          },
          $maxDistance: radius
        }
      }
    }).populate('user', 'name avatar');

    console.log(`🔍 Found ${nearbyServices.length} services within 5km of Quận 1:`);
    nearbyServices.forEach(service => {
      console.log(`  - ${service.title} (${service.location.address})`);
    });

    // Test geocoding utility
    const testAddress = '123 Nguyễn Huệ, Quận 1, TP.HCM';
    const coords = getCoordinatesFromAddress(testAddress);
    console.log(`📍 Geocoding test: "${testAddress}" -> [${coords[0]}, ${coords[1]}]`);

    console.log('✅ Radius search test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testRadiusSearch();
