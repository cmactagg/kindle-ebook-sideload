import express from 'express';
import Folder from '../models/Folder.js';
import Ebook from '../models/Ebook.js';

const router = express.Router();

// GET /folders/:id - View folder contents
router.get('/:id', async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    
    if (!folder) {
      return res.status(404).render('error', { message: 'Folder not found' });
    }
    
    // Get ebooks in this folder
    const ebooks = await Ebook.find({ folder: folder._id }).sort({ uploadedAt: -1 });
    
    // Get all folders for display
    const folders = await Folder.find().sort({ name: 1 });
    
    res.render('folder', {
      folder,
      folders,
      ebooks,
      error: req.query.error || null,
      success: req.query.success || null
    });
  } catch (err) {
    console.error('Error loading folder:', err);
    res.status(500).render('error', { message: 'Failed to load folder' });
  }
});

// POST /folders - Create a new folder
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.redirect('/?error=' + encodeURIComponent('Folder name is required'));
    }
    
    // Check if folder name already exists
    const existing = await Folder.findOne({ name: name.trim() });
    if (existing) {
      return res.redirect('/?error=' + encodeURIComponent('A folder with that name already exists'));
    }
    
    const folder = new Folder({
      name: name.trim()
    });
    
    await folder.save();
    
    res.redirect('/?success=' + encodeURIComponent(`Folder "${name}" created!`));
  } catch (err) {
    console.error('Error creating folder:', err);
    res.redirect('/?error=' + encodeURIComponent('Failed to create folder'));
  }
});

// POST /folders/:id/delete - Delete a folder (must be empty)
router.post('/:id/delete', async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    
    if (!folder) {
      return res.redirect('/?error=' + encodeURIComponent('Folder not found'));
    }
    
    // Check if folder has ebooks
    const ebookCount = await Ebook.countDocuments({ folder: folder._id });
    
    if (ebookCount > 0) {
      return res.redirect(`/folders/${folder._id}?error=` + encodeURIComponent(`Cannot delete folder. It contains ${ebookCount} ebook(s). Please delete or move them first.`));
    }
    
    await Folder.findByIdAndDelete(folder._id);
    
    res.redirect('/?success=' + encodeURIComponent(`Folder "${folder.name}" deleted!`));
  } catch (err) {
    console.error('Error deleting folder:', err);
    res.redirect('/?error=' + encodeURIComponent('Failed to delete folder'));
  }
});

export default router;
