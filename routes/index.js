import express from 'express';
import Folder from '../models/Folder.js';
import Ebook from '../models/Ebook.js';

const router = express.Router();

// GET / - Home page showing root ebooks and folders
router.get('/', async (req, res) => {
  try {
    // Get all folders
    const folders = await Folder.find().sort({ name: 1 }).lean();
    
    // Get ebook counts per folder
    const folderCounts = await Ebook.aggregate([
      { $match: { folder: { $ne: null } } },
      { $group: { _id: '$folder', count: { $sum: 1 } } }
    ]);
    
    // Create a map of folder ID to count
    const countMap = {};
    folderCounts.forEach(fc => {
      countMap[fc._id.toString()] = fc.count;
    });
    
    // Add count to each folder
    folders.forEach(folder => {
      folder.ebookCount = countMap[folder._id.toString()] || 0;
    });
    
    // Get ebooks in root (no folder)
    const ebooks = await Ebook.find({ folder: null }).sort({ uploadedAt: -1 });
    
    // Get total ebook count
    const ebookCount = await Ebook.getTotalCount();
    
    res.render('index', {
      folders,
      ebooks,
      ebookCount,
      maxEbooks: 20,
      error: req.query.error || null,
      success: req.query.success || null
    });
  } catch (err) {
    console.error('Error loading home page:', err);
    res.status(500).render('error', { message: 'Failed to load home page' });
  }
});

export default router;
