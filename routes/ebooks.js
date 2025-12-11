import express from 'express';
import { getGridFSBucket } from '../config/gridfs.js';
import Ebook from '../models/Ebook.js';
import Folder from '../models/Folder.js';

const router = express.Router();

// POST /ebooks/:id/delete - Delete an ebook
router.post('/:id/delete', async (req, res) => {
  try {
    const ebook = await Ebook.findById(req.params.id);
    
    if (!ebook) {
      return res.redirect('/?error=' + encodeURIComponent('Ebook not found'));
    }
    
    // Store folder ID to redirect back to it
    const folderId = ebook.folder;
    const ebookName = ebook.originalName;
    
    // Delete from GridFS
    try {
      const bucket = getGridFSBucket();
      await bucket.delete(ebook.gridfsFileId);
    } catch (gridfsErr) {
      console.error('Error deleting from GridFS:', gridfsErr);
      // Continue anyway - file might already be deleted
    }
    
    // Delete ebook document
    await Ebook.findByIdAndDelete(ebook._id);
    
    // Redirect back to folder or home
    const successMsg = encodeURIComponent(`"${ebookName}" deleted!`);
    if (folderId) {
      res.redirect(`/folders/${folderId}?success=${successMsg}`);
    } else {
      res.redirect(`/?success=${successMsg}`);
    }
  } catch (err) {
    console.error('Error deleting ebook:', err);
    res.redirect('/?error=' + encodeURIComponent('Failed to delete ebook'));
  }
});

// POST /ebooks/:id/move - Move ebook to a different folder
router.post('/:id/move', async (req, res) => {
  try {
    const ebook = await Ebook.findById(req.params.id);
    
    if (!ebook) {
      return res.redirect('/?error=' + encodeURIComponent('Ebook not found'));
    }
    
    const { folder: newFolderId } = req.body;
    const oldFolderId = ebook.folder;
    
    // Validate new folder if provided
    if (newFolderId && newFolderId !== '') {
      const folder = await Folder.findById(newFolderId);
      if (!folder) {
        return res.redirect('/?error=' + encodeURIComponent('Target folder not found'));
      }
      ebook.folder = folder._id;
    } else {
      // Move to root
      ebook.folder = null;
    }
    
    await ebook.save();
    
    const successMsg = encodeURIComponent(`"${ebook.originalName}" moved!`);
    
    // Redirect back to old folder or home
    if (oldFolderId) {
      res.redirect(`/folders/${oldFolderId}?success=${successMsg}`);
    } else {
      res.redirect(`/?success=${successMsg}`);
    }
  } catch (err) {
    console.error('Error moving ebook:', err);
    res.redirect('/?error=' + encodeURIComponent('Failed to move ebook'));
  }
});

export default router;
