/**
 * GridFS Configuration - Vercel Compatible
 * For storing large files in MongoDB
 */

const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

let gridFSBucket = null;
let gridFSStatus = {
  initialized: false,
  bucketName: 'uploads',
  chunkSize: 255 * 1024 // 255KB chunks
};

/**
 * Initialize GridFS bucket
 */
const initGridFS = (connection) => {
  try {
    if (!connection || !connection.db) {
      console.log('⏳ Waiting for database connection for GridFS...');
      return null;
    }

    gridFSBucket = new GridFSBucket(connection.db, {
      bucketName: 'uploads',
      chunkSizeBytes: 255 * 1024 // 255KB chunks
    });

    gridFSStatus.initialized = true;
    console.log('✅ GridFS initialized with bucket: uploads');
    return gridFSBucket;
  } catch (error) {
    console.error('❌ GridFS initialization error:', error.message);
    throw error;
  }
};

/**
 * Get or create GridFS bucket
 */
const getGridFSBucket = () => {
  if (!gridFSBucket && mongoose.connection.readyState === 1) {
    initGridFS(mongoose.connection);
  }
  return gridFSBucket;
};

/**
 * Get GridFS status
 */
const getGridFSStatus = () => {
  return {
    ...gridFSStatus,
    available: gridFSBucket !== null
  };
};

/**
 * Upload file to GridFS
 */
const uploadToGridFS = (fileBuffer, filename, options = {}) => {
  return new Promise((resolve, reject) => {
    const bucket = getGridFSBucket();
    
    if (!bucket) {
      return reject(new Error('GridFS bucket not initialized'));
    }

    const uploadStream = bucket.openUploadStream(filename, {
      contentType: options.contentType || 'application/octet-stream',
      metadata: options.metadata || {}
    });

    uploadStream.on('error', (error) => {
      console.error('❌ GridFS upload error:', error.message);
      reject(error);
    });

    uploadStream.on('finish', () => {
      console.log(`✅ GridFS upload complete: ${filename}`);
      resolve({
        fileId: uploadStream.id,
        filename: filename,
        length: fileBuffer.length
      });
    });

    uploadStream.end(fileBuffer);
  });
};

/**
 * Download file from GridFS
 */
const downloadFromGridFS = (fileId) => {
  return new Promise((resolve, reject) => {
    const bucket = getGridFSBucket();
    
    if (!bucket) {
      return reject(new Error('GridFS bucket not initialized'));
    }

    const chunks = [];
    const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));

    downloadStream.on('error', (error) => {
      reject(error);
    });

    downloadStream.on('data', (chunk) => {
      chunks.push(chunk);
    });

    downloadStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
  });
};

/**
 * Get download stream from GridFS
 */
const getDownloadStream = (fileId) => {
  const bucket = getGridFSBucket();
  
  if (!bucket) {
    throw new Error('GridFS bucket not initialized');
  }

  return bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
};

/**
 * Delete file from GridFS
 */
const deleteFromGridFS = async (fileId) => {
  const bucket = getGridFSBucket();
  
  if (!bucket) {
    throw new Error('GridFS bucket not initialized');
  }

  await bucket.delete(new mongoose.Types.ObjectId(fileId));
  console.log(`✅ GridFS file deleted: ${fileId}`);
};

/**
 * Check if file exists in GridFS
 */
const fileExistsInGridFS = async (fileId) => {
  const bucket = getGridFSBucket();
  
  if (!bucket) {
    return false;
  }

  const cursor = bucket.find({ _id: new mongoose.Types.ObjectId(fileId) });
  const files = await cursor.toArray();
  return files.length > 0;
};

module.exports = {
  initGridFS,
  getGridFSBucket,
  getGridFSStatus,
  uploadToGridFS,
  downloadFromGridFS,
  getDownloadStream,
  deleteFromGridFS,
  fileExistsInGridFS
};
