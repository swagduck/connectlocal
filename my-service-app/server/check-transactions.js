const mongoose = require('mongoose');
const Transaction = require('./src/models/Transaction');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/service-app')
  .then(async () => {
    const transactions = await Transaction.find({}).sort('-createdAt').limit(5);
    console.log('Recent transactions:');
    transactions.forEach(t => {
      console.log(`ID: ${t._id}, Status: ${t.status}, Type: ${t.type}, Amount: ${t.amount}`);
    });
    process.exit(0);
  })
  .catch(err => {
    console.error('DB connection error:', err);
    process.exit(1);
  });
