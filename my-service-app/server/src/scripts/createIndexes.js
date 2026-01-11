const mongoose = require('mongoose');
require('dotenv').config();

// Import all models to ensure they're registered
const User = require('../models/User');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Friend = require('../models/Friend');
const FriendRequest = require('../models/FriendRequest');
const Transaction = require('../models/Transaction');
const Request = require('../models/Request');

// Index definitions for all collections
const indexDefinitions = [
  // User indexes
  {
    collection: 'users',
    indexes: [
      { key: { email: 1 }, unique: true, name: 'email_unique' },
      { key: { role: 1 }, name: 'role_index' },
      { key: { banned: 1 }, name: 'banned_index' },
      { key: { createdAt: -1 }, name: 'created_at_desc' },
      { key: { role: 1, banned: 1 }, name: 'role_banned_compound' },
      { key: { location: '2dsphere' }, name: 'location_2dsphere' },
      { key: { rating: -1 }, name: 'rating_desc' },
      { key: { lastLocationUpdate: -1 }, name: 'last_location_update_desc' }
    ]
  },

  // Service indexes
  {
    collection: 'services',
    indexes: [
      { key: { user: 1 }, name: 'provider_index' },
      { key: { category: 1 }, name: 'category_index' },
      { key: { price: 1 }, name: 'price_asc' },
      { key: { price: -1 }, name: 'price_desc' },
      { key: { averageRating: -1 }, name: 'rating_desc' },
      { key: { numberOfReviews: -1 }, name: 'review_count_desc' },
      { key: { createdAt: -1 }, name: 'created_at_desc' },
      { key: { category: 1, averageRating: -1 }, name: 'category_rating_compound' },
      { key: { category: 1, price: 1 }, name: 'category_price_compound' },
      { key: { 'location.city': 1 }, name: 'city_index' },
      { key: { title: 'text', description: 'text' }, name: 'search_text' }
    ]
  },

  // Booking indexes
  {
    collection: 'bookings',
    indexes: [
      { key: { user: 1 }, name: 'user_index' },
      { key: { provider: 1 }, name: 'provider_index' },
      { key: { service: 1 }, name: 'service_index' },
      { key: { status: 1 }, name: 'status_index' },
      { key: { date: 1 }, name: 'date_asc' },
      { key: { date: -1 }, name: 'date_desc' },
      { key: { user: 1, status: 1 }, name: 'user_status_compound' },
      { key: { provider: 1, status: 1 }, name: 'provider_status_compound' },
      { key: { date: 1, status: 1 }, name: 'date_status_compound' },
      { key: { createdAt: -1 }, name: 'created_at_desc' }
    ]
  },

  // Review indexes
  {
    collection: 'reviews',
    indexes: [
      { key: { user: 1 }, name: 'user_index' },
      { key: { service: 1 }, name: 'service_index' },
      { key: { rating: -1 }, name: 'rating_desc' },
      { key: { createdAt: -1 }, name: 'created_at_desc' },
      { key: { service: 1, rating: -1 }, name: 'service_rating_compound' },
      { key: { service: 1, createdAt: -1 }, name: 'service_created_compound' }
    ]
  },

  // Message indexes
  {
    collection: 'messages',
    indexes: [
      { key: { conversation: 1 }, name: 'conversation_index' },
      { key: { sender: 1 }, name: 'sender_index' },
      { key: { createdAt: -1 }, name: 'created_at_desc' },
      { key: { conversation: 1, createdAt: -1 }, name: 'conversation_created_compound' },
      { key: { conversation: 1, read: 1 }, name: 'conversation_read_compound' }
    ]
  },

  // Conversation indexes
  {
    collection: 'conversations',
    indexes: [
      { key: { participants: 1 }, name: 'participants_index' },
      { key: { lastMessage: -1 }, name: 'last_message_desc' },
      { key: { updatedAt: -1 }, name: 'updated_at_desc' },
      { key: { participants: 1, updatedAt: -1 }, name: 'participants_updated_compound' }
    ]
  },

  // Friend indexes
  {
    collection: 'friends',
    indexes: [
      { key: { user: 1 }, name: 'user_index' },
      { key: { friend: 1 }, name: 'friend_index' },
      { key: { user: 1, friend: 1 }, name: 'user_friend_unique', unique: true },
      { key: { createdAt: -1 }, name: 'created_at_desc' }
    ]
  },

  // FriendRequest indexes
  {
    collection: 'friendrequests',
    indexes: [
      { key: { sender: 1 }, name: 'sender_index' },
      { key: { receiver: 1 }, name: 'receiver_index' },
      { key: { status: 1 }, name: 'status_index' },
      { key: { sender: 1, receiver: 1 }, name: 'sender_receiver_compound' },
      { key: { receiver: 1, status: 1 }, name: 'receiver_status_compound' },
      { key: { createdAt: -1 }, name: 'created_at_desc' }
    ]
  },

  // Transaction indexes
  {
    collection: 'transactions',
    indexes: [
      { key: { user: 1 }, name: 'user_index' },
      { key: { type: 1 }, name: 'type_index' },
      { key: { status: 1 }, name: 'status_index' },
      { key: { amount: -1 }, name: 'amount_desc' },
      { key: { createdAt: -1 }, name: 'created_at_desc' },
      { key: { user: 1, type: 1 }, name: 'user_type_compound' },
      { key: { user: 1, status: 1 }, name: 'user_status_compound' },
      { key: { type: 1, status: 1 }, name: 'type_status_compound' }
    ]
  },

  // Request indexes
  {
    collection: 'requests',
    indexes: [
      { key: { user: 1 }, name: 'user_index' },
      { key: { category: 1 }, name: 'category_index' },
      { key: { status: 1 }, name: 'status_index' },
      { key: { budget: 1 }, name: 'budget_asc' },
      { key: { budget: -1 }, name: 'budget_desc' },
      { key: { createdAt: -1 }, name: 'created_at_desc' },
      { key: { category: 1, status: 1 }, name: 'category_status_compound' },
      { key: { user: 1, status: 1 }, name: 'user_status_compound' },
      { key: { 'location.city': 1 }, name: 'city_index' },
      { key: { title: 'text', description: 'text' }, name: 'search_text' }
    ]
  }
];

// Create indexes function
async function createIndexes() {
  try {
    console.log('🔄 Starting database index creation...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    for (const { collection, indexes } of indexDefinitions) {
      console.log(`\n📁 Creating indexes for collection: ${collection}`);
      
      try {
        const collectionObj = db.collection(collection);
        
        // Get existing indexes
        const existingIndexes = await collectionObj.indexes();
        const existingIndexNames = existingIndexes.map(idx => idx.name);
        
        // Create each index
        for (const indexDef of indexes) {
          const { key, name, unique, sparse } = indexDef;
          
          if (existingIndexNames.includes(name)) {
            console.log(`  ⏭️  Index '${name}' already exists, skipping...`);
            continue;
          }
          
          try {
            await collectionObj.createIndex(key, { 
              name, 
              unique: unique || false, 
              sparse: sparse || false 
            });
            console.log(`  ✅ Created index: ${name}`);
          } catch (error) {
            if (error.code === 11000) {
              console.log(`  ⚠️  Index '${name}' creation failed (duplicate key) - this is normal for unique indexes`);
            } else {
              console.log(`  ❌ Failed to create index '${name}':`, error.message);
            }
          }
        }
        
        // Show final index list
        const finalIndexes = await collectionObj.indexes();
        console.log(`  📊 Total indexes for ${collection}: ${finalIndexes.length}`);
        
      } catch (error) {
        console.log(`  ❌ Error processing collection ${collection}:`, error.message);
      }
    }
    
    console.log('\n🎉 Database index creation completed!');
    
    // Show statistics
    const collections = await db.listCollections().toArray();
    console.log('\n📊 Collection Statistics:');
    for (const collection of collections) {
      const coll = db.collection(collection.name);
      const count = await coll.countDocuments();
      const indexes = await coll.indexes();
      console.log(`  ${collection.name}: ${count} documents, ${indexes.length} indexes`);
    }
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  createIndexes();
}

module.exports = { createIndexes, indexDefinitions };
