const request = require('supertest');
const User = require('../../../models/User');

describe('Auth Controller - Basic Tests', () => {
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
      expect(response.body.email).toBe(userData.email);
      expect(response.body.name).toBe(userData.name);
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
    });

    test('Should reject missing credentials', async () => {
      const response = await request(global.app)
        .post('/api/auth/login')
        .send({})
        .expect(400);
      
      expect(response.body.success).toBe(false);
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
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data.name).toBe(testUser.name);
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
});
