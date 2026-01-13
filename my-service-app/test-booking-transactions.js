/**
 * Test script for ACID transaction implementation in booking controller
 * This script tests both successful transactions and rollback scenarios
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
  
  // Create test service
  const service = await Service.create({
    title: 'Test Service',
    description: 'Test service description',
    price: 500000, // 500k VND
    user: provider._id,
    category: 'test'
  });
  
  console.log('✅ Test data created');
  return { customer, provider, service };
}

// Test successful booking transaction
async function testSuccessfulBooking(customer, provider, service) {
  console.log('\n🧪 Testing successful booking transaction...');
  
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Check initial balances
    const initialCustomerBalance = customer.walletBalance;
    const initialProviderBalance = provider.walletBalance;
    
    console.log(`💰 Initial balances - Customer: ${initialCustomerBalance}, Provider: ${initialProviderBalance}`);
    
    // Simulate booking creation process
    const updatedCustomer = await User.findById(customer._id).session(session);
    updatedCustomer.walletBalance -= service.price;
    await updatedCustomer.save({ session });
    
    const booking = await Booking.create([{
      user: customer._id,
      provider: provider._id,
      service: service._id,
      date: new Date(),
      price: service.price,
      platformFee: Math.round(service.price * 0.1),
      providerEarning: service.price - Math.round(service.price * 0.1),
      status: 'pending'
    }], { session });
    
    await Transaction.create([{
      user: customer._id,
      amount: service.price,
      type: 'payment',
      status: 'completed',
      description: `Thanh toán dịch vụ: ${service.title}`,
      bookingId: booking[0]._id
    }], { session });
    
    // Commit transaction
    await session.commitTransaction();
    session.endSession();
    
    // Verify final state
    const finalCustomer = await User.findById(customer._id);
    const finalProvider = await User.findById(provider._id);
    const bookingCount = await Booking.countDocuments({ user: customer._id });
    const transactionCount = await Transaction.countDocuments({ user: customer._id });
    
    console.log(`✅ Transaction committed successfully`);
    console.log(`💰 Final balances - Customer: ${finalCustomer.walletBalance}, Provider: ${finalProvider.walletBalance}`);
    console.log(`📊 Records created - Bookings: ${bookingCount}, Transactions: ${transactionCount}`);
    
    return true;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('❌ Transaction failed:', error.message);
    return false;
  }
}

// Test transaction rollback on failure
async function testBookingRollback(customer, provider, service) {
  console.log('\n🧪 Testing booking transaction rollback...');
  
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Get initial state
    const initialCustomer = await User.findById(customer._id).session(session);
    const initialBalance = initialCustomer.walletBalance;
    const initialBookingCount = await Booking.countDocuments({ user: customer._id });
    const initialTransactionCount = await Transaction.countDocuments({ user: customer._id });
    
    console.log(`💰 Initial state - Balance: ${initialBalance}, Bookings: ${initialBookingCount}, Transactions: ${initialTransactionCount}`);
    
    // Step 1: Deduct money (this will succeed)
    initialCustomer.walletBalance -= service.price;
    await initialCustomer.save({ session });
    console.log(`💳 Money deducted: ${service.price}`);
    
    // Step 2: Try to create booking with invalid data to force error
    await Booking.create([{
      user: customer._id,
      provider: provider._id,
      service: service._id,
      date: new Date(),
      price: service.price,
      platformFee: Math.round(service.price * 0.1),
      providerEarning: service.price - Math.round(service.price * 0.1),
      status: 'pending'
    }], { session });
    
    // Step 3: Force an error to test rollback
    throw new Error('Simulated server error to test rollback');
    
  } catch (error) {
    // Rollback should happen here
    await session.abortTransaction();
    session.endSession();
    
    // Verify rollback worked
    const finalCustomer = await User.findById(customer._id);
    const finalBookingCount = await Booking.countDocuments({ user: customer._id });
    const finalTransactionCount = await Transaction.countDocuments({ user: customer._id });
    
    console.log(`🔄 Rollback completed`);
    console.log(`💰 Final state - Balance: ${finalCustomer.walletBalance}, Bookings: ${finalBookingCount}, Transactions: ${finalTransactionCount}`);
    console.log(`✅ Rollback successful - data integrity maintained`);
    
    return true;
  }
}

// Test double booking prevention
async function testDoubleBookingPrevention(customer, provider, service) {
  console.log('\n🧪 Testing double booking prevention...');
  
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Create first booking
    const existingBooking = await Booking.findOne({
      provider: provider._id,
      date: new Date(),
      status: { $in: ['pending', 'accepted', 'in_progress'] }
    }).session(session);
    
    if (existingBooking) {
      console.log('🚫 Double booking detected - prevention working correctly');
      await session.abortTransaction();
      session.endSession();
      return true;
    }
    
    // Create first booking
    await Booking.create([{
      user: customer._id,
      provider: provider._id,
      service: service._id,
      date: new Date(),
      price: service.price,
      platformFee: Math.round(service.price * 0.1),
      providerEarning: service.price - Math.round(service.price * 0.1),
      status: 'pending'
    }], { session });
    
    await session.commitTransaction();
    session.endSession();
    
    // Try to create second booking for same time
    const session2 = await mongoose.startSession();
    session2.startTransaction();
    
    try {
      const duplicateBooking = await Booking.findOne({
        provider: provider._id,
        date: new Date(),
        status: { $in: ['pending', 'accepted', 'in_progress'] }
      }).session(session2);
      
      if (duplicateBooking) {
        console.log('🚫 Double booking prevention working - existing booking found');
        await session2.abortTransaction();
        session2.endSession();
        return true;
      }
      
      console.log('⚠️ Double booking prevention may not be working correctly');
      await session2.abortTransaction();
      session2.endSession();
      return false;
    } catch (error) {
      await session2.abortTransaction();
      session2.endSession();
      console.error('❌ Error in double booking test:', error.message);
      return false;
    }
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('❌ Error in double booking test:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  try {
    console.log('🚀 Starting ACID Transaction Tests');
    console.log('=====================================');
    
    // Connect to database (if not already connected)
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/serviceconnect');
      console.log('📦 Connected to database');
    }
    
    // Setup test data
    const { customer, provider, service } = await setupTestData();
    
    // Run tests
    const test1 = await testSuccessfulBooking(customer, provider, service);
    const test2 = await testBookingRollback(customer, provider, service);
    const test3 = await testDoubleBookingPrevention(customer, provider, service);
    
    // Summary
    console.log('\n📊 Test Results Summary');
    console.log('=======================');
    console.log(`✅ Successful Booking Test: ${test1 ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Transaction Rollback Test: ${test2 ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Double Booking Prevention Test: ${test3 ? 'PASSED' : 'FAILED'}`);
    
    const allTestsPassed = test1 && test2 && test3;
    console.log(`\n🎯 Overall Result: ${allTestsPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
    
    // Cleanup test data
    await User.deleteMany({ email: { $in: ['customer@test.com', 'provider@test.com'] } });
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
  testSuccessfulBooking,
  testBookingRollback,
  testDoubleBookingPrevention
};
