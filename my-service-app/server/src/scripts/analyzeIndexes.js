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

// Query performance analysis
async function analyzeQueryPerformance() {
  try {
    console.log('🔍 Starting query performance analysis...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    
    for (const collection of collections) {
      console.log(`\n📊 Analyzing collection: ${collection.name}`);
      
      try {
        const coll = db.collection(collection.name);
        
        // Get collection stats
        const stats = await coll.stats();
        console.log(`  📦 Documents: ${stats.count.toLocaleString()}`);
        console.log(`  💾 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`  🗄️  Avg Document Size: ${(stats.avgObjSize / 1024).toFixed(2)} KB`);
        
        // Get indexes
        const indexes = await coll.indexes();
        console.log(`  📑 Indexes: ${indexes.length}`);
        
        // Analyze each index
        for (const index of indexes) {
          const keyStr = JSON.stringify(index.key);
          const unique = index.unique ? ' (unique)' : '';
          const sparse = index.sparse ? ' (sparse)' : '';
          console.log(`    - ${keyStr}${unique}${sparse}`);
        }
        
        // Performance recommendations based on collection size
        if (stats.count > 1000) {
          console.log(`  💡 Recommendations for ${collection.name}:`);
          
          // Check for missing common indexes
          if (collection.name === 'users') {
            console.log(`    ✅ Has email index: ${indexes.some(idx => idx.key.email) ? 'Yes' : 'No'}`);
            console.log(`    ✅ Has role index: ${indexes.some(idx => idx.key.role) ? 'Yes' : 'No'}`);
            console.log(`    ✅ Has location index: ${indexes.some(idx => idx.key.location) ? 'Yes' : 'No'}`);
          }
          
          if (collection.name === 'services') {
            console.log(`    ✅ Has category index: ${indexes.some(idx => idx.key.category) ? 'Yes' : 'No'}`);
            console.log(`    ✅ Has price index: ${indexes.some(idx => idx.key.price) ? 'Yes' : 'No'}`);
            console.log(`    ✅ Has text search index: ${indexes.some(idx => idx.key._fts) ? 'Yes' : 'No'}`);
          }
          
          if (collection.name === 'bookings') {
            console.log(`    ✅ Has user+status index: ${indexes.some(idx => idx.key.user && idx.key.status) ? 'Yes' : 'No'}`);
            console.log(`    ✅ Has provider+status index: ${indexes.some(idx => idx.key.provider && idx.key.status) ? 'Yes' : 'No'}`);
          }
        }
        
      } catch (error) {
        console.log(`  ❌ Error analyzing ${collection.name}:`, error.message);
      }
    }
    
    // Overall performance recommendations
    console.log('\n🎯 Overall Performance Recommendations:');
    console.log('1. 📈 Monitor slow queries with MongoDB Compass or Atlas');
    console.log('2. 🔧 Use compound indexes for multi-field queries');
    console.log('3. 📝 Consider text search indexes for content fields');
    console.log('4. 🗺️ Use 2dsphere indexes for location-based queries');
    console.log('5. ⏰ Add TTL indexes for temporary data if needed');
    console.log('6. 📊 Regularly analyze query patterns and adjust indexes');
    
    // Index size analysis
    console.log('\n📊 Index Size Analysis:');
    let totalIndexSize = 0;
    
    for (const collection of collections) {
      try {
        const coll = db.collection(collection.name);
        const stats = await coll.stats();
        totalIndexSize += stats.totalIndexSize || 0;
        
        if (stats.totalIndexSize) {
          console.log(`  ${collection.name}: ${(stats.totalIndexSize / 1024 / 1024).toFixed(2)} MB`);
        }
      } catch (error) {
        // Skip if error
      }
    }
    
    console.log(`\n💾 Total Index Size: ${(totalIndexSize / 1024 / 1024).toFixed(2)} MB`);
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Check for slow queries (requires MongoDB profiling)
async function checkSlowQueries() {
  try {
    console.log('\n🐌 Checking for slow queries...');
    
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    
    // Check if profiling is enabled
    const profilingLevel = await db.admin().command({ profile: -1 });
    
    if (profilingLevel.was && profilingLevel.was.profilingLevel > 0) {
      console.log('✅ Profiling is enabled');
      
      // Get slow queries from system.profile collection
      const slowQueries = await db.collection('system.profile').find({
        millis: { $gt: 100 } // Queries taking more than 100ms
      }).limit(10).toArray();
      
      if (slowQueries.length > 0) {
        console.log(`🐌 Found ${slowQueries.length} slow queries:`);
        
        for (const query of slowQueries) {
          console.log(`  ⏱️  ${query.millis}ms - ${query.op} on ${query.ns}`);
          console.log(`     Query: ${JSON.stringify(query.command)}`);
        }
      } else {
        console.log('✅ No slow queries found (>100ms)');
      }
    } else {
      console.log('⚠️  Profiling is not enabled. Enable it to track slow queries:');
      console.log('   db.setProfilingLevel(2) // Enable slow query profiling');
      console.log('   db.setProfilingLevel(0) // Disable profiling');
    }
    
  } catch (error) {
    console.error('❌ Error checking slow queries:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run analysis
if (require.main === module) {
  analyzeQueryPerformance()
    .then(() => checkSlowQueries())
    .catch(console.error);
}

module.exports = { analyzeQueryPerformance, checkSlowQueries };
