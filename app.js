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



// Connect to MongoDB and start server
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/kindle-ebooks';

// Track server instance for graceful shutdown
let server = null;

// Track reconnection interval
let reconnectInterval = null;

// Connection options for Railway sleep mode
const mongooseOptions = {
  socketTimeoutMS: 300000,        // Close sockets after 5 minutes of inactivity
  serverSelectionTimeoutMS: 30000, // Timeout after 30s if server not found
  maxIdleTimeMS: 300000,          // Remove connection from pool after 5 minutes idle
  maxPoolSize: 10,                 // Maximum 10 connections in pool
  minPoolSize: 0                   // No minimum connections (allow pool to empty)
};

// Connection state middleware - return 503 if disconnected
app.use((req, res, next) => {
  // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (mongoose.connection.readyState !== 1) {
    return res.status(503)
      .set('Retry-After', '10')
      .json({ 
        error: 'Service temporarily unavailable',
        message: 'Database is reconnecting, please try again in a few seconds'
      });
  }
  next();
});

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

// Mongoose connection event listeners
mongoose.connection.on('connected', () => {
  console.log('✓ MongoDB connected');
  // Clear reconnection interval if it exists
  if (reconnectInterval) {
    clearInterval(reconnectInterval);
    reconnectInterval = null;
  }
});

mongoose.connection.on('disconnected', () => {
  console.log('✗ MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✓ MongoDB reconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('close', () => {
  console.log('MongoDB connection closed');
});

// Function to connect to MongoDB with retry logic
function connectWithRetry() {
  mongoose.connect(MONGO_URL, mongooseOptions)
    .then(() => {
      console.log('Connected to MongoDB');
      if (!server) {
        server = app.listen(PORT, () => {
          console.log(`Server running on port ${PORT}`);
        });
      }
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err);
      console.log('Retrying connection in 5 seconds...');
      if (!reconnectInterval) {
        reconnectInterval = setInterval(() => {
          console.log('Attempting to reconnect to MongoDB...');
          connectWithRetry();
        }, 5000);
      }
    });
}

// Initial connection
connectWithRetry();

// Graceful shutdown handlers
function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  // Clear reconnection interval if it exists
  if (reconnectInterval) {
    clearInterval(reconnectInterval);
  }
  
  // Close server to stop accepting new connections
  if (server) {
    server.close(() => {
      console.log('HTTP server closed');
      
      // Close MongoDB connection
      mongoose.connection.close(false)
        .then(() => {
          console.log('MongoDB connection closed');
          process.exit(0);
        })
        .catch((err) => {
          console.error('Error closing MongoDB connection:', err);
          process.exit(1);
        });
    });
  } else {
    // If server hasn't started yet, just close mongoose
    mongoose.connection.close(false)
      .then(() => {
        console.log('MongoDB connection closed');
        process.exit(0);
      })
      .catch((err) => {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
      });
  }
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
