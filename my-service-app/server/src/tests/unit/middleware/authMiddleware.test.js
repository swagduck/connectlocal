const request = require('supertest');
const User = require('../../../models/User');
const { protect, authorize, revokeToken } = require('../../../middleware/authMiddleware');

describe('Auth Middleware', () => {
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
      expect(response.body.message).toContain('Token');
    });

    test('Should reject access with invalid token', async () => {
      const response = await request(global.app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('không hợp lệ');
    });

    test('Should reject access with malformed token', async () => {
      const response = await request(global.app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });

    test('Should reject access with expired token', async () => {
      // Create expired token
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { id: testUser._id },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' } // Expired
      );

      const response = await request(global.app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });

    test('Should reject access for non-existent user', async () => {
      // Create token for non-existent user
      const fakeToken = global.testUtils.generateTestToken('507f1f77bcf86cd799439012');

      const response = await request(global.app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${fakeToken}`)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('không tồn tại');
    });

    test('Should reject access for banned user', async () => {
      // Ban the test user
      await User.findByIdAndUpdate(testUser._id, { banned: true });

      const response = await request(global.app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('bị khóa');

      // Unban the user
      await User.findByIdAndUpdate(testUser._id, { banned: false });
    });

    test('Should set req.user object', async () => {
      // This test would require access to the req object in a route
      // For now, we'll test it indirectly by checking if the user data is correct
      const response = await request(global.app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.data._id).toBe(testUser._id.toString());
      expect(response.body.data.email).toBe(testUser.email);
    });
  });

  describe('authorize middleware', () => {
    test('Should allow access for correct role', async () => {
      // Create a test route that uses authorize middleware
      const express = require('express');
      const router = express.Router();
      
      router.get('/admin-only', 
        protect, 
        authorize('admin'), 
        (req, res) => res.json({ success: true, user: req.user })
      );

      // Add the test route to the app
      global.app.use('/test', router);

      const response = await request(global.app)
        .get('/test/admin-only')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });

    test('Should reject access for incorrect role', async () => {
      // Create a test route that requires admin role
      const express = require('express');
      const router = express.Router();
      
      router.get('/admin-only', 
        protect, 
        authorize('admin'), 
        (req, res) => res.json({ success: true })
      );

      global.app.use('/test', router);

      const response = await request(global.app)
        .get('/test/admin-only')
        .set('Authorization', `Bearer ${token}`) // Regular user token
        .expect(403);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('không có quyền');
    });

    test('Should allow access for multiple roles', async () => {
      const express = require('express');
      const router = express.Router();
      
      router.get('/admin-or-provider', 
        protect, 
        authorize('admin', 'provider'), 
        (req, res) => res.json({ success: true })
      );

      global.app.use('/test', router);

      const response = await request(global.app)
        .get('/test/admin-or-provider')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });

    test('Should handle missing req.user gracefully', async () => {
      const express = require('express');
      const router = express.Router();
      
      router.get('/protected', 
        authorize('admin'), // Without protect middleware first
        (req, res) => res.json({ success: true })
      );

      global.app.use('/test', router);

      const response = await request(global.app)
        .get('/test/protected')
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User not found');
    });
  });

  describe('revokeToken middleware', () => {
    test('Should add token to blacklist', async () => {
      const express = require('express');
      const router = express.Router();
      
      router.post('/logout', 
        protect,
        revokeToken,
        (req, res) => res.json({ success: true })
      );

      global.app.use('/test', router);

      const response = await request(global.app)
        .post('/test/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);

      // Try to use the same token again
      const secondResponse = await request(global.app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
      
      expect(secondResponse.body.success).toBe(false);
      expect(secondResponse.body.message).toContain('revoke');
    });

    test('Should handle missing token gracefully', async () => {
      const express = require('express');
      const router = express.Router();
      
      router.post('/logout', 
        revokeToken,
        (req, res) => res.json({ success: true })
      );

      global.app.use('/test', router);

      const response = await request(global.app)
        .post('/test/logout')
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
  });

  describe('Token Blacklist', () => {
    test('Should prevent reuse of blacklisted tokens', async () => {
      // First, revoke the token
      const express = require('express');
      const router = express.Router();
      
      router.post('/revoke', 
        protect,
        revokeToken,
        (req, res) => res.json({ success: true })
      );

      global.app.use('/test', router);

      await request(global.app)
        .post('/test/revoke')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Try to use the revoked token
      const response = await request(global.app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('revoke');
    });

    test('Should allow different tokens after revocation', async () => {
      // Revoke the first token
      const express = require('express');
      const router = express.Router();
      
      router.post('/revoke', 
        protect,
        revokeToken,
        (req, res) => res.json({ success: true })
      );

      global.app.use('/test', router);

      await request(global.app)
        .post('/test/revoke')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Create a new token for the same user
      const newToken = global.testUtils.generateTestToken(testUser._id);

      // The new token should work
      const response = await request(global.app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
  });
});
