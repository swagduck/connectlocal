const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const createTestApp = require('./setup/testApp');

let mongoServer;

// Test database setup
beforeAll(async () => {
  // Start in-memory MongoDB server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to the in-memory database
  await mongoose.connect(mongoUri);
  
  // Create test app instance
  global.app = createTestApp();
  
  console.log('🧪 Test database and app connected');
});

// Cleanup after all tests
afterAll(async () => {
  // Disconnect from database
  await mongoose.disconnect();
  
  // Stop the in-memory server
  if (mongoServer) {
    await mongoServer.stop();
  }
  
  console.log('🧪 Test database and app disconnected');
});

// Cleanup between tests
afterEach(async () => {
  // Clear all collections between tests
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Global test utilities
global.testUtils = {
  // Create test user data
  createTestUser: (overrides = {}) => ({
    name: 'Test User',
    email: 'test@example.com',
    password: 'Test123456',
    phone: '0123456789',
    role: 'user',
    ...overrides
  }),
  
  // Create test service data
  createTestService: (overrides = {}) => ({
    title: 'Test Service',
    description: 'This is a test service description',
    category: 'Khác',
    price: 100000,
    priceUnit: 'lần',
    duration: '1-2 tiếng',
    warranty: '1 tháng',
    location: {
      address: '123 Test Street, Test City',
      city: 'Test City'
    },
    images: ['https://example.com/image.jpg'],
    ...overrides
  }),
  
  // Create test booking data
  createTestBooking: (overrides = {}) => ({
    date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    note: 'Test booking note',
    status: 'pending',
    price: 100000,
    platformFee: 10000,
    providerEarning: 90000,
    ...overrides
  }),
  
  // Create test review data
  createTestReview: (overrides = {}) => ({
    rating: 5,
    comment: 'Great service!',
    ...overrides
  }),
  
  // Generate JWT token for testing
  generateTestToken: (userId = '507f1f77bcf86cd799439011') => {
    const jwt = require('jsonwebtoken');
    return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
  },
  
  // Wait for async operations
  wait: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms))
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};
