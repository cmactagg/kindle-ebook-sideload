import mongoose from 'mongoose';

const ebookSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  folder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  gridfsFileId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient queries
ebookSchema.index({ folder: 1, uploadedAt: -1 });
ebookSchema.index({ gridfsFileId: 1 });

/**
 * Get total count of ebooks
 * @returns {Promise<number>} Count of all ebooks
 */
ebookSchema.statics.getTotalCount = async function() {
  return this.countDocuments();
};

/**
 * Check if upload limit reached (20 ebooks max)
 * @returns {Promise<boolean>} True if limit reached
 */
ebookSchema.statics.isLimitReached = async function() {
  const count = await this.countDocuments();
  return count >= 20;
};

/**
 * Format file size for display
 * @returns {string} Human-readable file size
 */
ebookSchema.methods.getFormattedSize = function() {
  const bytes = this.size;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const Ebook = mongoose.model('Ebook', ebookSchema);

export default Ebook;
