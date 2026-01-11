const request = require('supertest');
const jwt = require('jsonwebtoken');
const User = require('../../../models/User');

describe('Auth Controller', () => {
  describe('POST /api/auth/register', () => {
    test('Should register a new user successfully', async () => {
      const userData = global.testUtils.createTestUser({
        email: 'newuser@test.com'
      });
      
      const response = await request(global.app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body._id).toBeDefined();
      expect(response.body.email).toBe(userData.email);
      expect(response.body.name).toBe(userData.name);
      expect(response.body.role).toBe(userData.role);
    });

    test('Should reject duplicate email', async () => {
      const userData = global.testUtils.createTestUser();
      
      // Create first user
      await request(global.app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);
      
      // Try to create second user with same email
      const response = await request(global.app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('đã được sử dụng');
    });

    test('Should validate required fields', async () => {
      const response = await request(global.app)
        .post('/api/auth/register')
        .send({})
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });

    test('Should validate email format', async () => {
      const userData = global.testUtils.createTestUser({
        email: 'invalid-email'
      });
      
      const response = await request(global.app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });

    test('Should validate password strength', async () => {
      const userData = global.testUtils.createTestUser({
        password: 'weak'
      });
      
      const response = await request(global.app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('8 ký tự');
    });

    test('Should validate name length', async () => {
      const userData = global.testUtils.createTestUser({
        name: 'A'
      });
      
      const response = await request(global.app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('ít nhất 2 ký tự');
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;
    
    beforeEach(async () => {
      const userData = global.testUtils.createTestUser({
        email: 'logintest@test.com'
      });
      testUser = await User.create(userData);
    });

    test('Should login with valid credentials', async () => {
      const loginData = {
        email: 'logintest@test.com',
        password: 'Test123456'
      };
      
      const response = await request(global.app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body._id).toBe(testUser._id.toString());
      expect(response.body.email).toBe(loginData.email);
    });

    test('Should reject invalid email', async () => {
      const loginData = {
        email: 'wrong@test.com',
        password: 'Test123456'
      };
      
      const response = await request(global.app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('không đúng');
    });

    test('Should reject invalid password', async () => {
      const loginData = {
        email: 'logintest@test.com',
        password: 'wrongpassword'
      };
      
      const response = await request(global.app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('không đúng');
    });

    test('Should reject missing credentials', async () => {
      const response = await request(global.app)
        .post('/api/auth/login')
        .send({})
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email và mật khẩu');
    });

    test('Should handle rate limiting', async () => {
      const loginData = {
        email: 'logintest@test.com',
        password: 'wrongpassword'
      };
      
      // Make multiple failed attempts to trigger rate limiting
      for (let i = 0; i < 15; i++) {
        await request(global.app)
          .post('/api/auth/login')
          .send(loginData);
      }
      
      const response = await request(global.app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(429);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Quá nhiều lần');
    });
  });

  describe('GET /api/auth/me', () => {
    let testUser, token;
    
    beforeEach(async () => {
      const userData = global.testUtils.createTestUser({
        email: 'metest@test.com'
      });
      testUser = await User.create(userData);
      token = global.testUtils.generateTestToken(testUser._id);
    });

    test('Should get user profile with valid token', async () => {
      const response = await request(global.app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testUser._id.toString());
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data.name).toBe(testUser.name);
      expect(response.body.data.password).toBeUndefined(); // Password should not be included
    });

    test('Should reject request without token', async () => {
      const response = await request(global.app)
        .get('/api/auth/me')
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });

    test('Should reject request with invalid token', async () => {
      const response = await request(global.app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/updatedetails', () => {
    let testUser, token;
    
    beforeEach(async () => {
      const userData = global.testUtils.createTestUser({
        email: 'updatetest@test.com'
      });
      testUser = await User.create(userData);
      token = global.testUtils.generateTestToken(testUser._id);
    });

    test('Should update user details', async () => {
      const updateData = {
        name: 'Updated Name',
        phone: '0987654321'
      };
      
      const response = await request(global.app)
        .put('/api/auth/updatedetails')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      
      // Verify the update
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.name).toBe(updateData.name);
      expect(updatedUser.phone).toBe(updateData.phone);
    });

    test('Should reject update without token', async () => {
      const updateData = {
        name: 'Updated Name'
      };
      
      const response = await request(global.app)
        .put('/api/auth/updatedetails')
        .send(updateData)
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });

    test('Should validate email format on update', async () => {
      const updateData = {
        email: 'invalid-email'
      };
      
      const response = await request(global.app)
        .put('/api/auth/updatedetails')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/updatepassword', () => {
    let testUser, token;
    
    beforeEach(async () => {
      const userData = global.testUtils.createTestUser({
        email: 'passwordtest@test.com'
      });
      testUser = await User.create(userData);
      token = global.testUtils.generateTestToken(testUser._id);
    });

    test('Should update password with valid data', async () => {
      const passwordData = {
        currentPassword: 'Test123456',
        newPassword: 'NewTest123456'
      };
      
      const response = await request(global.app)
        .put('/api/auth/updatepassword')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('thành công');
      
      // Verify password was updated
      const updatedUser = await User.findById(testUser._id).select('+password');
      const isMatch = await updatedUser.matchPassword('NewTest123456');
      expect(isMatch).toBe(true);
    });

    test('Should reject incorrect current password', async () => {
      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'NewTest123456'
      };
      
      const response = await request(global.app)
        .put('/api/auth/updatepassword')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('không đúng');
    });

    test('Should validate new password strength', async () => {
      const passwordData = {
        currentPassword: 'Test123456',
        newPassword: 'weak'
      };
      
      const response = await request(global.app)
        .put('/api/auth/updatepassword')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('8 ký tự');
    });

    test('Should require both passwords', async () => {
      const passwordData = {
        currentPassword: 'Test123456'
        // Missing newPassword
      };
      
      const response = await request(global.app)
        .put('/api/auth/updatepassword')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('hiện tại và mật khẩu mới');
    });
  });

  describe('POST /api/auth/logout', () => {
    let testUser, token;
    
    beforeEach(async () => {
      const userData = global.testUtils.createTestUser({
        email: 'logouttest@test.com'
      });
      testUser = await User.create(userData);
      token = global.testUtils.generateTestToken(testUser._id);
    });

    test('Should logout successfully', async () => {
      const response = await request(global.app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('thành công');
    });

    test('Should handle logout without token gracefully', async () => {
      const response = await request(global.app)
        .post('/api/auth/logout')
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let testUser, refreshToken;
    
    beforeEach(async () => {
      const userData = global.testUtils.createTestUser({
        email: 'refreshtest@test.com'
      });
      testUser = await User.create(userData);
      
      // Create refresh token (simulating login)
      refreshToken = jwt.sign(
        { id: testUser._id }, 
        process.env.JWT_REFRESH_SECRET || 'test-refresh-secret', 
        { expiresIn: '7d' }
      );
    });

    test('Should refresh token with valid refresh token', async () => {
      const response = await request(global.app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
    });

    test('Should reject invalid refresh token', async () => {
      const response = await request(global.app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });

    test('Should require refresh token', async () => {
      const response = await request(global.app)
        .post('/api/auth/refresh')
        .send({})
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });
  });
});
