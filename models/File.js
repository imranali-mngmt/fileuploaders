/**
 * File Model - MongoDB Schema
 * Stores file metadata with GridFS reference
 */

const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: [true, 'File name is required'],
    trim: true,
    maxlength: [500, 'File name cannot exceed 500 characters']
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required']
  },
  size: {
    type: Number,
    required: [true, 'File size is required']
  },
  category: {
    type: String,
    enum: ['id_front', 'id_back', 'passport', 'drivers_license', 'utility_bill', 'bank_statement', 'other'],
    default: 'other'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    default: ''
  },
  gridfsId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  isGridFS: {
    type: Boolean,
    default: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
fileSchema.index({ category: 1 });
fileSchema.index({ uploadDate: -1 });
fileSchema.index({ gridfsId: 1 });

module.exports = mongoose.model('File', fileSchema);
