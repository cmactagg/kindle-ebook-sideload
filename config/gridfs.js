import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

let bucket = null;

/**
 * Get or create GridFS bucket for ebook storage
 * @returns {GridFSBucket} The GridFS bucket instance
 */
export function getGridFSBucket() {
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
