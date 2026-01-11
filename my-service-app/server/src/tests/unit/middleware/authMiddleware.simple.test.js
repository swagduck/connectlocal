const request = require('supertest');
const User = require('../../../models/User');
const { protect, authorize, revokeToken } = require('../../../middleware/authMiddleware');

describe('Auth Middleware - Simple Tests', () => {
  let testUser, token, adminToken;

  beforeEach(async () => {
    // Create regular user
    const userData = global.testUtils.createTestUser({
      email: 'middlewaretest@test.com'
    });
    testUser = await User.create(userData);
    token = global.testUtils.generateTestToken(testUser._id);

    // Create admin user
    const adminData = global.testUtils.createTestUser({
      email: 'admin@test.com',
      role: 'admin'
    });
    const adminUser = await User.create(adminData);
    adminToken = global.testUtils.generateTestToken(adminUser._id);
  });

  describe('protect middleware', () => {
    test('Should allow access with valid token', async () => {
      const response = await request(global.app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });

    test('Should reject access without token', async () => {
      const response = await request(global.app)
        .get('/api/auth/me')
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });

    test('Should reject access with invalid token', async () => {
      const response = await request(global.app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });
  });

  describe('Token Blacklist', () => {
    test('Should have token blacklist functionality', () => {
      expect(typeof revokeToken).toBe('function');
    });

    test('Should have token blacklist property', () => {
      const authMiddleware = require('../../../middleware/authMiddleware');
      expect(authMiddleware.tokenBlacklist).toBeDefined();
      expect(authMiddleware.tokenBlacklist instanceof Set).toBe(true);
    });
  });

  describe('Token Generation', () => {
    test('Should generate valid JWT tokens', () => {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(testUser._id.toString());
    });

    test('Should have proper token expiration', () => {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(token);
      
      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(Date.now() / 1000);
    });
  });

  describe('Password Validation', () => {
    test('Should validate password correctly', async () => {
      const isMatch = await testUser.matchPassword('Test123456');
      expect(isMatch).toBe(true);
    });

    test('Should reject incorrect password', async () => {
      const isMatch = await testUser.matchPassword('wrongpassword');
      expect(isMatch).toBe(false);
    });
  });

  describe('User Model Validation', () => {
    test('Should have required fields', () => {
      expect(testUser.name).toBeDefined();
      expect(testUser.email).toBeDefined();
      expect(testUser.role).toBeDefined();
    });

    test('Should have default values', () => {
      expect(testUser.banned).toBe(false);
      expect(testUser.walletBalance).toBe(0);
    });

    test('Should not include password in JSON', () => {
      const userJSON = testUser.toJSON();
      expect(userJSON.password).toBeUndefined();
    });
  });
});
