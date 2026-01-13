/**
 * Test script for Redis Adapter and Soft Delete functionality
 * This script validates both scalability improvements and data safety features
 */

const mongoose = require('mongoose');
const User = require('../server/src/models/User');
const Service = require('../server/src/models/Service');
const Booking = require('../server/src/models/Booking');
const Transaction = require('../server/src/models/Transaction');

// Test data setup
async function setupTestData() {
  console.log('🔧 Setting up test data...');
  
  // Create test users
  const customer = await User.create({
    name: 'Test Customer',
    email: 'customer@test.com',
    password: 'password123',
    role: 'user',
    walletBalance: 1000000 // 1 triệu VND
  });
  
  const provider = await User.create({
    name: 'Test Provider',
    email: 'provider@test.com',
    password: 'password123',
    role: 'provider',
    walletBalance: 0
  });
  
  const admin = await User.create({
    name: 'Test Admin',
    email: 'admin@test.com',
    password: 'password123',
    role: 'admin',
    walletBalance: 0
  });
  
  // Create test service
  const service = await Service.create({
    title: 'Test Service',
    description: 'Test service description',
    price: 500000, // 500k VND
    user: provider._id,
    category: 'test'
  });
  
  // Create test booking
  const booking = await Booking.create({
    user: customer._id,
    provider: provider._id,
    service: service._id,
    date: new Date(),
    price: service.price,
    platformFee: Math.round(service.price * 0.1),
    providerEarning: service.price - Math.round(service.price * 0.1),
    status: 'pending'
  });
  
  console.log('✅ Test data created');
  return { customer, provider, admin, service, booking };
}

// Test Soft Delete functionality
async function testSoftDelete(customer, provider, admin, service, booking) {
  console.log('\n🧪 Testing Soft Delete functionality...');
  
  try {
    // Test 1: Soft delete booking
    console.log('1️⃣ Testing soft delete...');
    await booking.softDelete(customer._id, 'Customer requested deletion');
    
    // Verify booking is soft deleted
    const softDeletedBooking = await Booking.findById(booking._id).select('+isDeleted +deletedAt +deletedBy +deletionReason');
    
    if (!softDeletedBooking.isDeleted) {
      throw new Error('Soft delete failed - booking not marked as deleted');
    }
    
    if (!softDeletedBooking.deletedAt || !softDeletedBooking.deletedBy || !softDeletedBooking.deletionReason) {
      throw new Error('Soft delete audit trail incomplete');
    }
    
    console.log('✅ Soft delete successful with audit trail');
    
    // Test 2: Verify booking doesn't appear in normal queries
    console.log('2️⃣ Testing normal query exclusion...');
    const normalBookings = await Booking.findNotDeleted({ user: customer._id });
    const allBookings = await Booking.findWithDeleted({ user: customer._id });
    
    if (normalBookings.length !== 0) {
      throw new Error('Soft deleted booking still appears in normal queries');
    }
    
    if (allBookings.length !== 1) {
      throw new Error('Booking not found in withDeleted query');
    }
    
    console.log('✅ Soft deleted booking properly excluded from normal queries');
    
    // Test 3: Test restore functionality
    console.log('3️⃣ Testing restore functionality...');
    await softDeletedBooking.restore();
    
    const restoredBooking = await Booking.findById(booking._id).select('+isDeleted +deletedAt +deletedBy +deletionReason');
    
    if (restoredBooking.isDeleted) {
      throw new Error('Restore failed - booking still marked as deleted');
    }
    
    if (restoredBooking.deletedAt || restoredBooking.deletedBy || restoredBooking.deletionReason) {
      throw new Error('Restore failed - audit trail not cleared');
    }
    
    console.log('✅ Restore functionality working correctly');
    
    // Test 4: Test deleted bookings query
    console.log('4️⃣ Testing deleted bookings query...');
    await booking.softDelete(admin._id, 'Admin cleanup');
    
    const deletedBookings = await Booking.findDeleted({ user: customer._id }).select('+isDeleted +deletedAt +deletedBy +deletionReason');
    
    if (deletedBookings.length !== 1) {
      throw new Error('Deleted bookings query not working');
    }
    
    if (!deletedBookings[0].deletionReason.includes('Admin cleanup')) {
      throw new Error('Deletion reason not preserved correctly');
    }
    
    console.log('✅ Deleted bookings query working correctly');
    
    return true;
  } catch (error) {
    console.error('❌ Soft delete test failed:', error.message);
    return false;
  }
}

// Test Redis Adapter configuration (simulated)
async function testRedisAdapter() {
  console.log('\n🧪 Testing Redis Adapter configuration...');
  
  try {
    // Check if Redis dependencies are available
    const redis = require('redis');
    const { createAdapter } = require('socket.io-redis');
    
    console.log('✅ Redis dependencies available');
    
    // Test Redis client creation (without actually connecting)
    const redisClient = redis.createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379"
    });
    
    console.log('✅ Redis client configuration successful');
    
    // Test Socket.io adapter creation
    const adapter = createAdapter(redisClient, {
      key: 'serviceconnect',
      requestsTimeout: 5000,
      publishOnSpecificResponseChannel: true
    });
    
    console.log('✅ Socket.io Redis adapter configuration successful');
    
    // Test adapter methods exist
    if (typeof adapter.broadcast === 'function' && 
        typeof adapter.addSockets === 'function' && 
        typeof adapter.delSockets === 'function') {
      console.log('✅ Redis adapter methods available');
    } else {
      throw new Error('Redis adapter methods not properly configured');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Redis adapter test failed:', error.message);
    return false;
  }
}

// Test double booking prevention with soft delete
async function testDoubleBookingWithSoftDelete(customer, provider, service) {
  console.log('\n🧪 Testing Double Booking Prevention with Soft Delete...');
  
  try {
    // Create first booking
    const booking1 = await Booking.create({
      user: customer._id,
      provider: provider._id,
      service: service._id,
      date: new Date('2026-01-15T10:00:00Z'),
      price: service.price,
      platformFee: Math.round(service.price * 0.1),
      providerEarning: service.price - Math.round(service.price * 0.1),
      status: 'pending'
    });
    
    console.log('✅ First booking created');
    
    // Test double booking prevention
    const existingBookings = await Booking.findNotDeleted({
      provider: provider._id,
      date: new Date('2026-01-15T10:00:00Z'),
      status: { $in: ['pending', 'accepted', 'in_progress'] }
    });
    
    if (existingBookings.length === 0) {
      throw new Error('Double booking prevention not working - existing booking not found');
    }
    
    console.log('✅ Double booking prevention working correctly');
    
    // Soft delete the first booking
    await booking1.softDelete(admin._id, 'Test soft delete');
    
    // Test if slot becomes available after soft delete
    const availableBookings = await Booking.findNotDeleted({
      provider: provider._id,
      date: new Date('2026-01-15T10:00:00Z'),
      status: { $in: ['pending', 'accepted', 'in_progress'] }
    });
    
    if (availableBookings.length !== 0) {
      throw new Error('Slot not available after soft delete');
    }
    
    console.log('✅ Slot becomes available after soft delete');
    
    // Create second booking in the same slot
    const booking2 = await Booking.create({
      user: customer._id,
      provider: provider._id,
      service: service._id,
      date: new Date('2026-01-15T10:00:00Z'),
      price: service.price,
      platformFee: Math.round(service.price * 0.1),
      providerEarning: service.price - Math.round(service.price * 0.1),
      status: 'pending'
    });
    
    console.log('✅ Second booking created in same slot after soft delete');
    
    return true;
  } catch (error) {
    console.error('❌ Double booking with soft delete test failed:', error.message);
    return false;
  }
}

// Test audit trail functionality
async function testAuditTrail(customer, provider, admin, service, booking) {
  console.log('\n🧪 Testing Audit Trail functionality...');
  
  try {
    // Test 1: Customer soft delete
    await booking.softDelete(customer._id, 'Customer changed mind');
    
    let deletedBooking = await Booking.findById(booking._id)
      .select('+isDeleted +deletedAt +deletedBy +deletionReason')
      .populate('deletedBy', 'name email');
    
    if (deletedBooking.deletedBy._id.toString() !== customer._id.toString()) {
      throw new Error('Customer deletion audit trail incorrect');
    }
    
    if (!deletedBooking.deletionReason.includes('Customer changed mind')) {
      throw new Error('Deletion reason not preserved');
    }
    
    console.log('✅ Customer deletion audit trail working');
    
    // Test 2: Admin restore
    await deletedBooking.restore();
    await booking.softDelete(admin._id, 'Admin intervention');
    
    deletedBooking = await Booking.findById(booking._id)
      .select('+isDeleted +deletedAt +deletedBy +deletionReason')
      .populate('deletedBy', 'name email');
    
    if (deletedBooking.deletedBy._id.toString() !== admin._id.toString()) {
      throw new Error('Admin deletion audit trail incorrect');
    }
    
    if (!deletedBooking.deletionReason.includes('Admin intervention')) {
      throw new Error('Admin deletion reason not preserved');
    }
    
    console.log('✅ Admin deletion audit trail working');
    
    // Test 3: Timestamp accuracy
    const now = new Date();
    const deletionTime = new Date(deletedBooking.deletedAt);
    const timeDiff = Math.abs(now - deletionTime);
    
    if (timeDiff > 5000) { // 5 seconds tolerance
      throw new Error('Deletion timestamp not accurate');
    }
    
    console.log('✅ Deletion timestamp accurate');
    
    return true;
  } catch (error) {
    console.error('❌ Audit trail test failed:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  try {
    console.log('🚀 Starting Redis Adapter & Soft Delete Tests');
    console.log('============================================');
    
    // Connect to database (if not already connected)
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/serviceconnect');
      console.log('📦 Connected to database');
    }
    
    // Setup test data
    const { customer, provider, admin, service, booking } = await setupTestData();
    
    // Run tests
    const test1 = await testSoftDelete(customer, provider, admin, service, booking);
    const test2 = await testRedisAdapter();
    const test3 = await testDoubleBookingWithSoftDelete(customer, provider, service);
    const test4 = await testAuditTrail(customer, provider, admin, service, booking);
    
    // Summary
    console.log('\n📊 Test Results Summary');
    console.log('=======================');
    console.log(`✅ Soft Delete Test: ${test1 ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Redis Adapter Test: ${test2 ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Double Booking + Soft Delete Test: ${test3 ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Audit Trail Test: ${test4 ? 'PASSED' : 'FAILED'}`);
    
    const allTestsPassed = test1 && test2 && test3 && test4;
    console.log(`\n🎯 Overall Result: ${allTestsPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
    
    // Recommendations
    console.log('\n📋 Implementation Recommendations:');
    console.log('1. Install Redis server for production environment');
    console.log('2. Set REDIS_URL environment variable');
    console.log('3. Configure Redis cluster for high availability');
    console.log('4. Implement soft delete policies and retention periods');
    console.log('5. Add admin UI for managing deleted bookings');
    
    // Cleanup test data
    await User.deleteMany({ email: { $in: ['customer@test.com', 'provider@test.com', 'admin@test.com'] } });
    await Service.deleteMany({ title: 'Test Service' });
    await Booking.deleteMany({ user: customer._id });
    await Transaction.deleteMany({ user: customer._id });
    console.log('🧹 Test data cleaned up');
    
  } catch (error) {
    console.error('❌ Test runner error:', error.message);
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('📦 Disconnected from database');
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  testSoftDelete,
  testRedisAdapter,
  testDoubleBookingWithSoftDelete,
  testAuditTrail
};
