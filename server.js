/**
 * SecureIDUploader Server - Vercel Compatible
 * Files are stored in MongoDB using GridFS (no filesystem storage)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB, getConnectionStatus } = require('./config/db');
const { initGridFS, getGridFSStatus } = require('./config/gridfs');
const fileRoutes = require('./routes/fileRoutes');

const app = express();

// Trust proxy for Vercel
app.set('trust proxy', 1);

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Body parser with increased limits
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const dbStatus = getConnectionStatus();
  const gridfsStatus = getGridFSStatus();
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    gridfs: gridfsStatus,
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0'
  });
});

// API routes
app.use('/api/files', fileRoutes);

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  
  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum size is 100MB'
    });
  }
  
  // Multer file type error
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  // MongoDB timeout error
  if (err.name === 'MongooseError' && err.message.includes('buffering timed out')) {
    return res.status(503).json({
      success: false,
      message: 'Database connection timeout. Please try again.'
    });
  }
  
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// Initialize database connection
let isConnected = false;

const initializeDB = async () => {
  if (!isConnected) {
    try {
      const conn = await connectDB();
      if (conn) {
        initGridFS(conn.connection);
        isConnected = true;
        console.log('✅ Database and GridFS initialized');
      }
    } catch (error) {
      console.error('❌ Database initialization failed:', error.message);
    }
  }
};

// Initialize on cold start
initializeDB();

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════╗
║          SecureIDUploader Server Started               ║
╠════════════════════════════════════════════════════════╣
║  🚀 Server running on: http://localhost:${PORT}           ║
║  📁 Files stored in MongoDB using GridFS               ║
║  📦 Max file size: 100MB                               ║
║  🔄 Files split into 255KB chunks                      ║
╚════════════════════════════════════════════════════════╝
    `);
  });
}

// Export for Vercel
module.exports = app;
