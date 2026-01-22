// Re-export storage functions for backward compatibility
// The actual implementation is in lib/storage.ts which supports both filesystem and MinIO
export {
  uploadImage,
  getImageUrl,
  getImageBuffer,
  BUCKET_NAME,
} from './storage';

