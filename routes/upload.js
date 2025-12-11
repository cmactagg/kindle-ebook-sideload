import express from 'express';
import multer from 'multer';
import { Readable } from 'stream';
import { getGridFSBucket } from '../config/gridfs.js';
import Ebook from '../models/Ebook.js';
import Folder from '../models/Folder.js';
import { 
  validateFile, 
  sanitizeUploadFilename, 
  getContentType,
  MAX_FILE_SIZE 
} from '../middleware/fileValidator.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  }
});

// GET /upload - Show upload form
router.get('/', async (req, res) => {
  try {
    const folders = await Folder.find().sort({ name: 1 });
    const ebookCount = await Ebook.getTotalCount();
    const limitReached = ebookCount >= 20;
    
    res.render('upload', {
      folders,
      ebookCount,
      limitReached,
      maxEbooks: 20,
      error: req.query.error || null,
      success: req.query.success || null
    });
  } catch (err) {
    console.error('Error loading upload page:', err);
    res.status(500).render('error', { message: 'Failed to load upload page' });
  }
});

// POST /upload - Handle file upload
router.post('/', upload.single('ebook'), async (req, res) => {
  try {
    // Check if file was provided
    if (!req.file) {
      return res.redirect('/upload?error=' + encodeURIComponent('No file selected'));
    }
    
    // Check ebook limit
    if (await Ebook.isLimitReached()) {
      return res.redirect('/upload?error=' + encodeURIComponent('Maximum of 20 ebooks reached. Please delete some ebooks first.'));
    }
    
    // Validate file
    const validation = await validateFile(req.file.buffer, req.file.originalname);
    
    if (!validation.valid) {
      return res.redirect('/upload?error=' + encodeURIComponent(validation.errors.join(', ')));
    }
    
    // Get folder if specified
    const folderId = req.body.folder || null;
    if (folderId && folderId !== '') {
      const folder = await Folder.findById(folderId);
      if (!folder) {
        return res.redirect('/upload?error=' + encodeURIComponent('Selected folder not found'));
      }
    }
    
    // Prepare file for GridFS
    const safeFilename = sanitizeUploadFilename(req.file.originalname);
    const contentType = getContentType(validation.detectedType, req.file.originalname);
    
    // Upload to GridFS
    const bucket = getGridFSBucket();
    const readableStream = Readable.from(req.file.buffer);
    
    const uploadStream = bucket.openUploadStream(safeFilename, {
      contentType: contentType,
      metadata: {
        originalName: req.file.originalname,
        uploadedAt: new Date()
      }
    });
    
    // Pipe the file to GridFS
    await new Promise((resolve, reject) => {
      readableStream.pipe(uploadStream)
        .on('error', reject)
        .on('finish', resolve);
    });
    
    // Create ebook document
    const ebook = new Ebook({
      filename: safeFilename,
      originalName: req.file.originalname,
      contentType: contentType,
      size: req.file.buffer.length,
      folder: folderId && folderId !== '' ? folderId : null,
      gridfsFileId: uploadStream.id
    });
    
    await ebook.save();
    
    // Redirect back with success message
    const successMsg = `"${req.file.originalname}" uploaded successfully!`;
    res.redirect('/upload?success=' + encodeURIComponent(successMsg));
    
  } catch (err) {
    console.error('Upload error:', err);
    
    // Handle multer file size error
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.redirect('/upload?error=' + encodeURIComponent('File too large. Maximum size is 100 MB.'));
    }
    
    res.redirect('/upload?error=' + encodeURIComponent('Upload failed: ' + err.message));
  }
});

// Error handling middleware for multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.redirect('/upload?error=' + encodeURIComponent('File too large. Maximum size is 100 MB.'));
    }
    return res.redirect('/upload?error=' + encodeURIComponent('Upload error: ' + err.message));
  }
  next(err);
});

export default router;
