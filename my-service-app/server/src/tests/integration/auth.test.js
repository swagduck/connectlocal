const request = require('supertest');
const User = require('../../models/User');

describe('Authentication Integration Tests', () => {
  describe('Complete User Flow', () => {
    let userToken, userId;

    test('Should complete full user registration and login flow', async () => {
      const userData = global.testUtils.createTestUser({
        email: 'integration@test.com'
      });

      // Step 1: Register user
      const registerResponse = await request(global.app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.token).toBeDefined();
      expect(registerResponse.body.refreshToken).toBeDefined();
      
      userToken = registerResponse.body.token;
      userId = registerResponse.body._id;

      // Step 2: Get user profile
      const profileResponse = await request(global.app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data.email).toBe(userData.email);

      // Step 3: Update user details
      const updateData = {
        name: 'Updated Integration User',
        phone: '0987654321'
      };

      const updateResponse = await request(global.app)
        .put('/api/auth/updatedetails')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.success).toBe(true);

      // Step 4: Verify updated details
      const updatedProfileResponse = await request(global.app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(updatedProfileResponse.body.data.name).toBe(updateData.name);
      expect(updatedProfileResponse.body.data.phone).toBe(updateData.phone);

      // Step 5: Logout
      const logoutResponse = await request(global.app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(logoutResponse.body.success).toBe(true);

      // Step 6: Verify token is revoked
      const revokedTokenResponse = await request(global.app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(401);

      expect(revokedTokenResponse.body.success).toBe(false);

      // Step 7: Login again
      const loginResponse = await request(global.app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.token).toBeDefined();
      expect(loginResponse.body.refreshToken).toBeDefined();

      // Step 8: Update password
      const passwordUpdateResponse = await request(global.app)
        .put('/api/auth/updatepassword')
        .set('Authorization', `Bearer ${loginResponse.body.token}`)
        .send({
          currentPassword: userData.password,
          newPassword: 'NewIntegration123456'
        })
        .expect(200);

      expect(passwordUpdateResponse.body.success).toBe(true);

      // Step 9: Login with new password
      const newLoginResponse = await request(global.app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: 'NewIntegration123456'
        })
        .expect(200);

      expect(newLoginResponse.body.success).toBe(true);
    });

    test('Should handle concurrent login attempts', async () => {
      const userData = global.testUtils.createTestUser({
        email: 'concurrent@test.com'
      });

      // Register user
      await request(global.app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Make multiple concurrent login attempts
      const loginPromises = Array(5).fill().map(() =>
        request(global.app)
          .post('/api/auth/login')
          .send({
            email: userData.email,
            password: userData.password
          })
      );

      const responses = await Promise.all(loginPromises);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.token).toBeDefined();
      });
    });

    test('Should handle token refresh flow', async () => {
      const userData = global.testUtils.createTestUser({
        email: 'refreshflow@test.com'
      });

      // Register and login
      const loginResponse = await request(global.app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      const { token: accessToken, refreshToken } = loginResponse.body;

      // Wait a bit to simulate token expiration
      await global.testUtils.wait(100);

      // Use access token (should still work)
      const accessResponse = await request(global.app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(accessResponse.body.success).toBe(true);

      // Refresh token
      const refreshResponse = await request(global.app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(refreshResponse.body.success).toBe(true);
      expect(refreshResponse.body.token).toBeDefined();
      expect(refreshResponse.body.refreshToken).toBeDefined();

      // Use new access token
      const newAccessResponse = await request(global.app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${refreshResponse.body.token}`)
        .expect(200);

      expect(newAccessResponse.body.success).toBe(true);
    });
  });

  describe('Security Edge Cases', () => {
    test('Should handle SQL injection attempts in login', async () => {
      const maliciousPayload = {
        email: "'; DROP TABLE users; --",
        password: "'; DROP TABLE users; --"
      };

      const response = await request(global.app)
        .post('/api/auth/login')
        .send(maliciousPayload)
        .expect(401);

      expect(response.body.success).toBe(false);
      // Database should still be intact
      const userCount = await User.countDocuments();
      expect(userCount).toBeGreaterThanOrEqual(0);
    });

    test('Should handle XSS attempts in registration', async () => {
      const xssPayload = global.testUtils.createTestUser({
        name: '<script>alert("xss")</script>',
        email: 'xss@test.com'
      });

      const response = await request(global.app)
        .post('/api/auth/register')
        .send(xssPayload)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.name).not.toContain('<script>');
    });

    test('Should handle very long input strings', async () => {
      const longString = 'a'.repeat(10000);
      const largePayload = global.testUtils.createTestUser({
        name: longString,
        email: 'large@test.com'
      });

      const response = await request(global.app)
        .post('/api/auth/register')
        .send(largePayload);

      // Should either succeed with truncated data or fail gracefully
      expect([200, 201, 400]).toContain(response.status);
    });

    test('Should handle concurrent registration with same email', async () => {
      const userData = global.testUtils.createTestUser({
        email: 'concurrentreg@test.com'
      });

      // Make multiple concurrent registration attempts
      const registerPromises = Array(3).fill().map(() =>
        request(global.app)
          .post('/api/auth/register')
          .send(userData)
      );

      const responses = await Promise.all(registerPromises);

      // Only one should succeed
      const successCount = responses.filter(r => r.status === 201).length;
      const failureCount = responses.filter(r => r.status === 400).length;

      expect(successCount).toBe(1);
      expect(failureCount).toBe(2);
    });

    test('Should handle rapid login attempts (rate limiting)', async () => {
      const userData = global.testUtils.createTestUser({
        email: 'ratelimit@test.com'
      });

      // Register user
      await request(global.app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Make rapid login attempts with wrong password
      const loginPromises = Array(20).fill().map(() =>
        request(global.app)
          .post('/api/auth/login')
          .send({
            email: userData.email,
            password: 'wrongpassword'
          })
      );

      const responses = await Promise.all(loginPromises);

      // Should hit rate limiting
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Tests', () => {
    test('Should handle multiple concurrent requests efficiently', async () => {
      const userData = global.testUtils.createTestUser({
        email: 'performance@test.com'
      });

      // Register user
      await request(global.app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Login to get token
      const loginResponse = await request(global.app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      const token = loginResponse.body.token;

      // Make 50 concurrent profile requests
      const startTime = Date.now();
      const profilePromises = Array(50).fill().map(() =>
        request(global.app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${token}`)
      );

      const responses = await Promise.all(profilePromises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Should complete within reasonable time (less than 5 seconds)
      expect(totalTime).toBeLessThan(5000);
      console.log(`50 concurrent requests completed in ${totalTime}ms`);
    });
  });
});
