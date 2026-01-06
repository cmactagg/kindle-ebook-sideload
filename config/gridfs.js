import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

let bucket = null;

/**
 * Get or create GridFS bucket for ebook storage
 * @returns {GridFSBucket} The GridFS bucket instance
 */
export function getGridFSBucket() {
  // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const isConnected = mongoose.connection.readyState === 1;
  
  // Reset bucket if connection is stale
  if (!isConnected && bucket) {
    console.log('GridFS bucket reset due to stale connection');
    bucket = null;
  }
  
  if (!bucket) {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('MongoDB connection not established');
    }
    bucket = new GridFSBucket(db, {
      bucketName: 'ebooks'
    });
  }
  return bucket;
}

/**
 * Reset bucket (useful for testing or reconnection)
 */
export function resetBucket() {
  bucket = null;
}

export default { getGridFSBucket, resetBucket };
