/**
 * MongoDB Connection Configuration - Vercel Compatible
 * Optimized for serverless environment with connection caching
 */

const mongoose = require('mongoose');

// Cache connection for serverless
let cachedConnection = null;
let connectionStatus = {
  isConnected: false,
  host: null,
  database: null,
  lastConnected: null
};

/**
 * Connect to MongoDB with connection caching for serverless
 */
const connectDB = async () => {
  // Return cached connection if available
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('📦 Using cached database connection');
    return cachedConnection;
  }

  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.error('❌ MONGODB_URI is not defined in environment variables');
    throw new Error('MONGODB_URI is not defined');
  }

  // Mask password for logging
  const maskedURI = mongoURI.replace(/:([^:@]+)@/, ':****@');
  console.log('🔗 Connecting to MongoDB:', maskedURI);

  try {
    // Connection options optimized for serverless
    const options = {
      // Timeouts
      serverSelectionTimeoutMS: 30000,  // 30 seconds for serverless
      connectTimeoutMS: 30000,
      socketTimeoutMS: 60000,           // 1 minute socket timeout
      
      // Connection pool (smaller for serverless)
      maxPoolSize: 5,
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      
      // Retry settings
      retryWrites: true,
      retryReads: true,
      
      // Buffer settings
      bufferCommands: true,
    };

    const conn = await mongoose.connect(mongoURI, options);
    
    // Cache the connection
    cachedConnection = conn;
    
    // Update status
    connectionStatus = {
      isConnected: true,
      host: conn.connection.host,
      database: conn.connection.name,
      lastConnected: new Date().toISOString()
    };

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;

  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    connectionStatus.isConnected = false;
    throw error;
  }
};

/**
 * Get current connection status
 */
const getConnectionStatus = () => {
  return {
    ...connectionStatus,
    readyState: mongoose.connection.readyState,
    readyStateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState]
  };
};

/**
 * Ensure database is connected before operations
 */
const ensureConnection = async () => {
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  return mongoose.connection;
};

module.exports = { 
  connectDB, 
  getConnectionStatus,
  ensureConnection
};
