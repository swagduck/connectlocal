const mongoose = require('mongoose');
const User = require('../../../models/User');

describe('User Model - Simple Tests', () => {
  describe('User Creation', () => {
    test('Should create a valid user', async () => {
      const userData = global.testUtils.createTestUser();
      
      const user = new User(userData);
      const savedUser = await user.save();
      
      expect(savedUser._id).toBeDefined();
      expect(savedUser.name).toBe(userData.name);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.role).toBe(userData.role);
    });

    test('Should hash password before saving', async () => {
      const userData = global.testUtils.createTestUser();
      const plainPassword = userData.password;
      
      const user = new User(userData);
      const savedUser = await user.save();
      
      expect(savedUser.password).not.toBe(plainPassword);
      expect(savedUser.password.length).toBeGreaterThan(50);
    });

    test('Should validate required fields', async () => {
      const user = new User({});
      
      await expect(user.save()).rejects.toThrow();
    });

    test('Should validate email format', async () => {
      const userData = global.testUtils.createTestUser({ email: 'invalid-email' });
      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
    });

    test('Should set default values', async () => {
      const userData = global.testUtils.createTestUser();
      delete userData.role;
      delete userData.walletBalance;
      delete userData.banned;
      
      const user = new User(userData);
      const savedUser = await user.save();
      
      expect(savedUser.role).toBe('user');
      expect(savedUser.walletBalance).toBe(0);
      expect(savedUser.banned).toBe(false);
    });
  });

  describe('User Methods', () => {
    let testUser;
    
    beforeEach(async () => {
      const userData = global.testUtils.createTestUser();
      testUser = new User(userData);
      await testUser.save();
    });

    test('Should match password correctly', async () => {
      const isMatch = await testUser.matchPassword('Test123456');
      expect(isMatch).toBe(true);
    });

    test('Should reject incorrect password', async () => {
      const isMatch = await testUser.matchPassword('wrongpassword');
      expect(isMatch).toBe(false);
    });
  });

  describe('User Validation', () => {
    test('Should validate role enum', async () => {
      const validRoles = ['user', 'provider', 'admin'];
      
      for (const role of validRoles) {
        const userData = global.testUtils.createTestUser({ role });
        const user = new User(userData);
        
        await expect(user.save()).resolves.toBeDefined();
      }
    });

    test('Should reject invalid role', async () => {
      const userData = global.testUtils.createTestUser({ role: 'invalid-role' });
      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('User Indexes', () => {
    test('Should have email index', async () => {
      const indexes = await User.collection.getIndexes();
      const emailIndex = indexes.find(idx => idx.key.email);
      
      expect(emailIndex).toBeDefined();
      expect(emailIndex.unique).toBe(true);
    });

    test('Should have role index', async () => {
      const indexes = await User.collection.getIndexes();
      const roleIndex = indexes.find(idx => idx.key.role);
      
      expect(roleIndex).toBeDefined();
    });

    test('Should have location index', async () => {
      const indexes = await User.collection.getIndexes();
      const locationIndex = indexes.find(idx => idx.key.location);
      
      expect(locationIndex).toBeDefined();
      expect(locationIndex.key.location).toEqual('2dsphere');
    });
  });
});
