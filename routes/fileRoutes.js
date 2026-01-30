/**
 * File Routes
 */

const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  uploadFile,
  uploadMultipleFiles,
  getAllFiles,
  getFileById,
  downloadFile,
  viewFile,
  deleteFile,
  getFilesByCategory
} = require('../controllers/fileController');

// Upload routes
router.post('/upload', upload.single('file'), uploadFile);
router.post('/upload-multiple', upload.array('files', 10), uploadMultipleFiles);

// Get routes
router.get('/', getAllFiles);
router.get('/category/:category', getFilesByCategory);
router.get('/:id', getFileById);
router.get('/:id/download', downloadFile);
router.get('/:id/view', viewFile);

// Delete route
router.delete('/:id', deleteFile);

module.exports = router;
