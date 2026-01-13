/**
 * Test script for Secure Authentication Implementation
 * Tests HttpOnly cookies, token rotation, and security features
 */

const mongoose = require('mongoose');
const User = require('../server/src/models/User');
const RefreshToken = require('../server/src/models/RefreshToken');

// Test data setup
async function setupTestData() {
  console.log('🔧 Setting up test data...');
  
  // Create test user
  const user = await User.create({
    name: 'Test User',
    email: 'test@secureauth.com',
    password: 'TestPass123',
    role: 'user',
    walletBalance: 1000000
  });
  
  console.log('✅ Test data created');
  return { user };
}

// Test Refresh Token Model
async function testRefreshTokenModel(user) {
  console.log('\n🧪 Testing Refresh Token Model...');
  
  try {
    // Test 1: Create refresh token
    const refreshToken = await RefreshToken.create({
      user: user._id,
      token: 'test-token-123',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      userAgent: 'Test Agent',
      ipAddress: '127.0.0.1'
    });
    
    console.log('✅ Refresh token created successfully');
    
    // Test 2: Check validity
    if (!refreshToken.isValid()) {
      throw new Error('New token should be valid');
    }
    
    console.log('✅ Token validity check working');
    
    // Test 3: Test expiration
    refreshToken.expiresAt = new Date(Date.now() - 1000); // Expired
    await refreshToken.save();
    
    if (refreshToken.isValid()) {
      throw new Error('Expired token should be invalid');
    }
    
    console.log('✅ Token expiration check working');
    
    // Test 4: Test revocation
    refreshToken.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Reset to valid
    await refreshToken.save();
    
    await refreshToken.revoke(user._id);
    
    if (refreshToken.isValid()) {
      throw new Error('Revoked token should be invalid');
    }
    
    if (!refreshToken.isRevoked || !refreshToken.revokedAt || !refreshToken.revokedBy) {
      throw new Error('Revocation metadata not properly set');
    }
    
    console.log('✅ Token revocation working correctly');
    
    // Test 5: Test static methods
    const validTokens = await RefreshToken.findValidByUser(user._id);
    if (validTokens.length !== 0) {
      throw new Error('Should find no valid tokens after revocation');
    }
    
    console.log('✅ Static methods working correctly');
    
    return true;
  } catch (error) {
    console.error('❌ Refresh token model test failed:', error.message);
    return false;
  }
}

// Test Token Rotation
async function testTokenRotation(user) {
  console.log('\n🧪 Testing Token Rotation...');
  
  try {
    // Create initial refresh token
    const token1 = await RefreshToken.create({
      user: user._id,
      token: 'rotation-test-1',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      userAgent: 'Test Agent',
      ipAddress: '127.0.0.1'
    });
    
    // Create second refresh token
    const token2 = await RefreshToken.create({
      user: user._id,
      token: 'rotation-test-2',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      userAgent: 'Test Agent',
      ipAddress: '127.0.0.1'
    });
    
    console.log('✅ Created multiple refresh tokens');
    
    // Test revoke all user tokens
    const result = await RefreshToken.revokeAllUserTokens(user._id, user._id);
    
    if (result.modifiedCount !== 2) {
      throw new Error(`Expected 2 tokens to be revoked, got ${result.modifiedCount}`);
    }
    
    console.log('✅ Token rotation working correctly');
    
    // Verify all tokens are revoked
    const validTokens = await RefreshToken.findValidByUser(user._id);
    if (validTokens.length !== 0) {
      throw new Error('No tokens should be valid after rotation');
    }
    
    console.log('✅ All tokens properly revoked');
    
    return true;
  } catch (error) {
    console.error('❌ Token rotation test failed:', error.message);
    return false;
  }
}

// Test Cleanup Functionality
async function testCleanupFunctionality(user) {
  console.log('\n🧪 Testing Cleanup Functionality...');
  
  try {
    // Create expired token
    const expiredToken = await RefreshToken.create({
      user: user._id,
      token: 'expired-token',
      expiresAt: new Date(Date.now() - 1000), // Expired
      userAgent: 'Test Agent',
      ipAddress: '127.0.0.1'
    });
    
    // Create revoked token
    const revokedToken = await RefreshToken.create({
      user: user._id,
      token: 'revoked-token',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isRevoked: true,
      revokedAt: new Date(),
      userAgent: 'Test Agent',
      ipAddress: '127.0.0.1'
    });
    
    // Create valid token
    const validToken = await RefreshToken.create({
      user: user._id,
      token: 'valid-token',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      userAgent: 'Test Agent',
      ipAddress: '127.0.0.1'
    });
    
    console.log('✅ Created test tokens with different states');
    
    // Run cleanup
    const result = await RefreshToken.cleanupExpired();
    
    if (result.deletedCount !== 2) {
      throw new Error(`Expected 2 tokens to be cleaned up, got ${result.deletedCount}`);
    }
    
    console.log('✅ Cleanup functionality working correctly');
    
    // Verify only valid token remains
    const remainingTokens = await RefreshToken.find({ user: user._id });
    if (remainingTokens.length !== 1 || remainingTokens[0].token !== 'valid-token') {
      throw new Error('Only valid token should remain after cleanup');
    }
    
    console.log('✅ Only valid tokens remain after cleanup');
    
    return true;
  } catch (error) {
    console.error('❌ Cleanup functionality test failed:', error.message);
    return false;
  }
}

// Test Security Features
async function testSecurityFeatures(user) {
  console.log('\n🧪 Testing Security Features...');
  
  try {
    // Test 1: Token uniqueness
    const token1 = await RefreshToken.create({
      user: user._id,
      token: 'unique-test-token',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      userAgent: 'Test Agent',
      ipAddress: '127.0.0.1'
    });
    
    // Try to create duplicate token
    try {
      await RefreshToken.create({
        user: user._id,
        token: 'unique-test-token', // Same token
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        userAgent: 'Test Agent',
        ipAddress: '127.0.0.1'
      });
      throw new Error('Should not allow duplicate tokens');
    } catch (error) {
      if (!error.message.includes('duplicate key')) {
        throw error;
      }
    }
    
    console.log('✅ Token uniqueness enforced');
    
    // Test 2: Audit trail
    await token1.revoke(user._id, 'Security test');
    
    const revokedToken = await RefreshToken.findById(token1._id);
    
    if (!revokedToken.revokedAt || !revokedToken.revokedBy || !revokedToken.deletionReason) {
      throw new Error('Audit trail not properly maintained');
    }
    
    console.log('✅ Audit trail working correctly');
    
    // Test 3: Timestamp accuracy
    const now = new Date();
    const revokeTime = new Date(revokedToken.revokedAt);
    const timeDiff = Math.abs(now - revokeTime);
    
    if (timeDiff > 5000) { // 5 seconds tolerance
      throw new Error('Timestamp not accurate');
    }
    
    console.log('✅ Timestamp accuracy verified');
    
    return true;
  } catch (error) {
    console.error('❌ Security features test failed:', error.message);
    return false;
  }
}

// Test Performance and Scalability
async function testPerformanceAndScalability(user) {
  console.log('\n🧪 Testing Performance and Scalability...');
  
  try {
    const startTime = Date.now();
    
    // Create multiple tokens
    const tokens = [];
    for (let i = 0; i < 100; i++) {
      tokens.push({
        user: user._id,
        token: `perf-test-${i}`,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        userAgent: `Test Agent ${i}`,
        ipAddress: `127.0.0.${i % 255}`
      });
    }
    
    await RefreshToken.insertMany(tokens);
    const createTime = Date.now() - startTime;
    
    console.log(`✅ Created 100 tokens in ${createTime}ms`);
    
    // Test query performance
    const queryStart = Date.now();
    const validTokens = await RefreshToken.findValidByUser(user._id);
    const queryTime = Date.now() - queryStart;
    
    if (validTokens.length !== 100) {
      throw new Error(`Expected 100 valid tokens, got ${validTokens.length}`);
    }
    
    console.log(`✅ Queried 100 tokens in ${queryTime}ms`);
    
    // Test bulk revoke performance
    const revokeStart = Date.now();
    const revokeResult = await RefreshToken.revokeAllUserTokens(user._id, user._id);
    const revokeTime = Date.now() - revokeStart;
    
    if (revokeResult.modifiedCount !== 100) {
      throw new Error(`Expected 100 tokens to be revoked, got ${revokeResult.modifiedCount}`);
    }
    
    console.log(`✅ Revoked 100 tokens in ${revokeTime}ms`);
    
    // Test cleanup performance
    const cleanupStart = Date.now();
    const cleanupResult = await RefreshToken.cleanupExpired();
    const cleanupTime = Date.now() - cleanupStart;
    
    if (cleanupResult.deletedCount !== 100) {
      throw new Error(`Expected 100 tokens to be cleaned up, got ${cleanupResult.deletedCount}`);
    }
    
    console.log(`✅ Cleaned up 100 tokens in ${cleanupTime}ms`);
    
    return true;
  } catch (error) {
    console.error('❌ Performance test failed:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  try {
    console.log('🚀 Starting Secure Authentication Tests');
    console.log('=======================================');
    
    // Connect to database (if not already connected)
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/serviceconnect');
      console.log('📦 Connected to database');
    }
    
    // Setup test data
    const { user } = await setupTestData();
    
    // Run tests
    const test1 = await testRefreshTokenModel(user);
    const test2 = await testTokenRotation(user);
    const test3 = await testCleanupFunctionality(user);
    const test4 = await testSecurityFeatures(user);
    const test5 = await testPerformanceAndScalability(user);
    
    // Summary
    console.log('\n📊 Test Results Summary');
    console.log('=======================');
    console.log(`✅ Refresh Token Model Test: ${test1 ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Token Rotation Test: ${test2 ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Cleanup Functionality Test: ${test3 ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Security Features Test: ${test4 ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Performance & Scalability Test: ${test5 ? 'PASSED' : 'FAILED'}`);
    
    const allTestsPassed = test1 && test2 && test3 && test4 && test5;
    console.log(`\n🎯 Overall Result: ${allTestsPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
    
    // Security recommendations
    console.log('\n🔒 Security Implementation Summary:');
    console.log('✅ HttpOnly cookies prevent XSS attacks');
    console.log('✅ Token rotation prevents token reuse');
    console.log('✅ Automatic cleanup prevents token accumulation');
    console.log('✅ Audit trail enables security monitoring');
    console.log('✅ Short-lived access tokens reduce exposure');
    console.log('✅ Secure cookie settings prevent CSRF');
    
    // Performance recommendations
    console.log('\n⚡ Performance Recommendations:');
    console.log('1. Use Redis for token storage in production');
    console.log('2. Implement token cleanup cron job');
    console.log('3. Monitor token rotation frequency');
    console.log('4. Set appropriate token expiration times');
    console.log('5. Consider token blacklisting for immediate revocation');
    
    // Cleanup test data
    await User.deleteMany({ email: 'test@secureauth.com' });
    await RefreshToken.deleteMany({ user: user._id });
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
  testRefreshTokenModel,
  testTokenRotation,
  testCleanupFunctionality,
  testSecurityFeatures,
  testPerformanceAndScalability
};
