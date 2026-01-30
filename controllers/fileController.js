/**
 * File Controller - Vercel Compatible
 * Handles all file operations using GridFS
 */

const File = require('../models/File');
const { ensureConnection } = require('../config/db');
const { 
  uploadToGridFS, 
  downloadFromGridFS, 
  deleteFromGridFS,
  getDownloadStream 
} = require('../config/gridfs');

/**
 * Upload single file
 * POST /api/files/upload
 */
exports.uploadFile = async (req, res) => {
  try {
    // Ensure database connection
    await ensureConnection();

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { originalname, mimetype, size, buffer } = req.file;
    const { category, description } = req.body;

    console.log(`📤 Uploading: ${originalname} (${(size / 1024 / 1024).toFixed(2)} MB)`);

    // Upload to GridFS
    const gridfsResult = await uploadToGridFS(buffer, originalname, {
      contentType: mimetype,
      metadata: { category, description }
    });

    // Create file record
    const file = new File({
      originalName: originalname,
      mimeType: mimetype,
      size: size,
      category: category || 'other',
      description: description || '',
      gridfsId: gridfsResult.fileId,
      isGridFS: true
    });

    await file.save();

    console.log(`✅ File saved: ${originalname}`);

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        id: file._id,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        category: file.category,
        description: file.description,
        uploadDate: file.uploadDate
      }
    });

  } catch (error) {
    console.error('❌ Upload error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message
    });
  }
};

/**
 * Upload multiple files
 * POST /api/files/upload-multiple
 */
exports.uploadMultipleFiles = async (req, res) => {
  try {
    await ensureConnection();

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    console.log(`📤 Uploading ${req.files.length} files...`);

    const uploadedFiles = [];
    const errors = [];

    for (const file of req.files) {
      try {
        const { originalname, mimetype, size, buffer } = file;
        
        console.log(`   📁 Processing: ${originalname}`);

        // Upload to GridFS
        const gridfsResult = await uploadToGridFS(buffer, originalname, {
          contentType: mimetype,
          metadata: { category: req.body.category }
        });

        // Create file record
        const fileDoc = new File({
          originalName: originalname,
          mimeType: mimetype,
          size: size,
          category: req.body.category || 'other',
          description: req.body.description || '',
          gridfsId: gridfsResult.fileId,
          isGridFS: true
        });

        await fileDoc.save();

        uploadedFiles.push({
          id: fileDoc._id,
          originalName: fileDoc.originalName,
          mimeType: fileDoc.mimeType,
          size: fileDoc.size,
          category: fileDoc.category,
          uploadDate: fileDoc.uploadDate
        });

        console.log(`   ✅ Saved: ${originalname}`);

      } catch (fileError) {
        console.error(`   ❌ Failed: ${file.originalname}`, fileError.message);
        errors.push({
          filename: file.originalname,
          error: fileError.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      files: uploadedFiles,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('❌ Multiple upload error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error uploading files',
      error: error.message
    });
  }
};

/**
 * Get all files
 * GET /api/files
 */
exports.getAllFiles = async (req, res) => {
  try {
    await ensureConnection();

    const files = await File.find({})
      .select('-gridfsId')
      .sort({ uploadDate: -1 })
      .lean();

    console.log(`📋 Found ${files.length} files`);

    res.json({
      success: true,
      count: files.length,
      files: files.map(file => ({
        id: file._id,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        sizeFormatted: formatFileSize(file.size),
        category: file.category,
        description: file.description,
        uploadDate: file.uploadDate
      }))
    });

  } catch (error) {
    console.error('❌ Get files error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching files',
      error: error.message
    });
  }
};

/**
 * Get file by ID
 * GET /api/files/:id
 */
exports.getFileById = async (req, res) => {
  try {
    await ensureConnection();

    const file = await File.findById(req.params.id).select('-gridfsId').lean();

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.json({
      success: true,
      file: {
        id: file._id,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        sizeFormatted: formatFileSize(file.size),
        category: file.category,
        description: file.description,
        uploadDate: file.uploadDate
      }
    });

  } catch (error) {
    console.error('❌ Get file error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching file',
      error: error.message
    });
  }
};

/**
 * Download file
 * GET /api/files/:id/download
 */
exports.downloadFile = async (req, res) => {
  try {
    await ensureConnection();

    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    console.log(`📥 Downloading: ${file.originalName}`);

    // Get file data from GridFS
    const fileBuffer = await downloadFromGridFS(file.gridfsId);

    // Set headers
    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`,
      'Content-Length': fileBuffer.length
    });

    res.send(fileBuffer);

  } catch (error) {
    console.error('❌ Download error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error downloading file',
      error: error.message
    });
  }
};

/**
 * View/Preview file
 * GET /api/files/:id/view
 */
exports.viewFile = async (req, res) => {
  try {
    await ensureConnection();

    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Get file data from GridFS
    const fileBuffer = await downloadFromGridFS(file.gridfsId);

    // Set headers for inline viewing
    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(file.originalName)}"`,
      'Content-Length': fileBuffer.length
    });

    res.send(fileBuffer);

  } catch (error) {
    console.error('❌ View error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error viewing file',
      error: error.message
    });
  }
};

/**
 * Delete file
 * DELETE /api/files/:id
 */
exports.deleteFile = async (req, res) => {
  try {
    await ensureConnection();

    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    console.log(`🗑️ Deleting: ${file.originalName}`);

    // Delete from GridFS
    if (file.gridfsId) {
      await deleteFromGridFS(file.gridfsId);
    }

    // Delete file record
    await File.findByIdAndDelete(req.params.id);

    console.log(`✅ Deleted: ${file.originalName}`);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error deleting file',
      error: error.message
    });
  }
};

/**
 * Get files by category
 * GET /api/files/category/:category
 */
exports.getFilesByCategory = async (req, res) => {
  try {
    await ensureConnection();

    const { category } = req.params;

    const files = await File.find({ category })
      .select('-gridfsId')
      .sort({ uploadDate: -1 })
      .lean();

    res.json({
      success: true,
      category: category,
      count: files.length,
      files: files.map(file => ({
        id: file._id,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        sizeFormatted: formatFileSize(file.size),
        category: file.category,
        description: file.description,
        uploadDate: file.uploadDate
      }))
    });

  } catch (error) {
    console.error('❌ Get by category error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching files',
      error: error.message
    });
  }
};

/**
 * Format file size helper
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
