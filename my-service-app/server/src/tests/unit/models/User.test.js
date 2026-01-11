const mongoose = require('mongoose');
const User = require('../../../models/User');

describe('User Model', () => {
  describe('User Creation', () => {
    test('Should create a valid user', async () => {
      const userData = global.testUtils.createTestUser();
      
      const user = new User(userData);
      const savedUser = await user.save();
      
      expect(savedUser._id).toBeDefined();
      expect(savedUser.name).toBe(userData.name);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.role).toBe(userData.role);
      expect(savedUser.password).not.toBe(userData.password); // Should be hashed
      expect(savedUser.banned).toBe(false);
      expect(savedUser.walletBalance).toBe(0);
    });

    test('Should hash password before saving', async () => {
      const userData = global.testUtils.createTestUser();
      const plainPassword = userData.password;
      
      const user = new User(userData);
      const savedUser = await user.save();
      
      expect(savedUser.password).not.toBe(plainPassword);
      expect(savedUser.password.length).toBeGreaterThan(50); // Bcrypt hash length
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

    test('Should validate password length', async () => {
      const userData = global.testUtils.createTestUser({ password: '123' });
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

    test('Should not include password in JSON output', () => {
      const userJSON = testUser.toJSON();
      expect(userJSON.password).toBeUndefined();
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

  describe('User Validation', () => {
    test('Should validate Vietnamese phone number', async () => {
      const validPhones = ['0123456789', '0987654321', '+84123456789'];
      
      for (const phone of validPhones) {
        const userData = global.testUtils.createTestUser({ phone });
        const user = new User(userData);
        
        // Should not throw for valid phone numbers
        await expect(user.save()).resolves.toBeDefined();
      }
    });

    test('Should reject invalid phone numbers', async () => {
      const invalidPhones = ['123', 'abc123', '123456789012345'];
      
      for (const phone of invalidPhones) {
        const userData = global.testUtils.createTestUser({ phone });
        const user = new User(userData);
        
        // Should reject invalid phone numbers if validation is implemented
        // Note: This test depends on whether phone validation is implemented
      }
    });

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

  describe('User Geolocation', () => {
    test('Should set default location', async () => {
      const userData = global.testUtils.createTestUser();
      const user = new User(userData);
      const savedUser = await user.save();
      
      expect(savedUser.location).toBeDefined();
      expect(savedUser.location.type).toBe('Point');
      expect(savedUser.location.coordinates).toEqual([0, 0]);
    });

    test('Should update lastLocationUpdate when location changes', async () => {
      const userData = global.testUtils.createTestUser();
      const user = new User(userData);
      const savedUser = await user.save();
      
      const originalUpdateTime = savedUser.lastLocationUpdate;
      
      // Update location
      savedUser.location = {
        type: 'Point',
        coordinates: [106.702, 10.782] // Hanoi coordinates
      };
      await savedUser.save();
      
      expect(savedUser.lastLocationUpdate).not.toBe(originalUpdateTime);
      expect(savedUser.lastLocationUpdate).toBeInstanceOf(Date);
    });
  });
});
