import express from 'express';
import { getGridFSBucket } from '../config/gridfs.js';
import Ebook from '../models/Ebook.js';

const router = express.Router();

// GET /download/:id - Download an ebook
router.get('/:id', async (req, res) => {
  try {
    // Find the ebook document
    const ebook = await Ebook.findById(req.params.id);
    
    if (!ebook) {
      return res.status(404).render('error', { message: 'Ebook not found' });
    }
    
    // Get GridFS bucket
    const bucket = getGridFSBucket();
    
    // Check if file exists in GridFS
    const files = await bucket.find({ _id: ebook.gridfsFileId }).toArray();
    
    if (files.length === 0) {
      return res.status(404).render('error', { message: 'File not found in storage' });
    }
    
    // Set headers for download
    // Force download with attachment disposition
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(ebook.originalName)}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', ebook.size);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-cache');
    
    // Stream file from GridFS to response
    const downloadStream = bucket.openDownloadStream(ebook.gridfsFileId);
    
    downloadStream.on('error', (err) => {
      console.error('Download stream error:', err);
      if (!res.headersSent) {
        res.status(500).render('error', { message: 'Error downloading file' });
      }
    });
    
    downloadStream.pipe(res);
    
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).render('error', { message: 'Failed to download file' });
  }
});

export default router;
