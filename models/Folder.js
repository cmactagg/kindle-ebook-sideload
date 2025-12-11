import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
folderSchema.index({ name: 1 });

const Folder = mongoose.model('Folder', folderSchema);

export default Folder;
