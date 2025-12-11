import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import indexRoutes from './routes/index.js';
import uploadRoutes from './routes/upload.js';
import downloadRoutes from './routes/download.js';
import folderRoutes from './routes/folders.js';
import ebookRoutes from './routes/ebooks.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', indexRoutes);
app.use('/upload', uploadRoutes);
app.use('/download', downloadRoutes);
app.use('/folders', folderRoutes);
app.use('/ebooks', ebookRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Connect to MongoDB and start server
// Build MongoDB URL from individual env vars if available (Railway provides these)
// This handles special characters in passwords properly
function getMongoUrl() {
  // Railway provides individual MongoDB variables - prefer these to avoid encoding issues
  const user = process.env.MONGOUSER || process.env.MONGO_USER;
  const password = process.env.MONGOPASSWORD || process.env.MONGO_PASSWORD;
  const host = process.env.MONGOHOST || process.env.MONGO_HOST;
  const port = process.env.MONGOPORT || process.env.MONGO_PORT;
  
  console.log('DEBUG - MONGOUSER:', user);
  console.log('DEBUG - MONGOPASSWORD:', password);
  console.log('DEBUG - MONGOHOST:', host);
  console.log('DEBUG - MONGOPORT:', port);
  console.log('DEBUG - MONGO_URL:', process.env.MONGO_URL);
  
  // If we have individual credentials, build the URL ourselves with proper encoding
  if (user && password && host && port) {
    const database = process.env.MONGO_DATABASE || 'kindle-ebooks';
    // URL-encode both user and password to handle any special characters
    const encodedUser = encodeURIComponent(user);
    const encodedPassword = encodeURIComponent(password);
    const url = `mongodb://${encodedUser}:${encodedPassword}@${host}:${port}/${database}?authSource=admin`;
    console.log('DEBUG - Built connection URL:', url);
    return url;
  }
  
  // Fall back to MONGO_URL if individual vars not available
  if (process.env.MONGO_URL) {
    console.log('DEBUG - Using MONGO_URL:', process.env.MONGO_URL);
    return process.env.MONGO_URL;
  }
  
  // Local development fallback
  console.log('DEBUG - Using local fallback');
  return 'mongodb://localhost:27017/kindle-ebooks';
}

const MONGO_URL = getMongoUrl();

mongoose.connect(MONGO_URL)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

export default app;
