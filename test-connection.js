// test-connection.js - Run this to test your setup
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('🔍 Testing MongoDB connection...');
  
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env.local');
    return;
  }
  
  console.log('📍 URI:', uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')); // Hide credentials
  
  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log('✅ MongoDB connection successful!');
    
    // Test database access
    const db = client.db();
    const collections = await db.listCollections().toArray();
    console.log('📊 Database collections:', collections.length);
    
    await client.close();
    console.log('✅ Connection test completed successfully!');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Suggestion: Start MongoDB with: docker run -d -p 27017:27017 mongo:latest');
    } else if (error.message.includes('authentication')) {
      console.log('💡 Suggestion: Check your username/password in the connection string');
    } else if (error.message.includes('network')) {
      console.log('💡 Suggestion: Check your network connection or MongoDB Atlas IP whitelist');
    }
  }
}

testConnection();