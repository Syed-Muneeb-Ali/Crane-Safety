import { Client } from 'minio';
import { promises as fs } from 'fs';
import path from 'path';

// Storage type: 'filesystem' or 'minio'
const STORAGE_TYPE = (process.env.STORAGE_TYPE || 'filesystem').toLowerCase();
const STORAGE_DIR = process.env.STORAGE_DIR || path.join(process.cwd(), 'storage', 'images');

// MinIO client (only initialized if using MinIO)
let minioClient: Client | null = null;
const BUCKET_NAME = process.env.MINIO_BUCKET || 'crane-images';

if (STORAGE_TYPE === 'minio') {
  minioClient = new Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  });
}

// Ensure storage directory exists (for filesystem)
async function ensureStorageDir() {
  if (STORAGE_TYPE === 'filesystem') {
    try {
      await fs.mkdir(STORAGE_DIR, { recursive: true });
    } catch (error) {
      console.error('Error creating storage directory:', error);
      throw error;
    }
  }
}

// Ensure bucket exists (for MinIO)
async function ensureBucket() {
  if (STORAGE_TYPE === 'minio' && minioClient) {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      // Set bucket policy for public read access
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
          },
        ],
      };
      await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
    }
  }
}

/**
 * Upload an image and return a reference/key
 */
export async function uploadImage(
  buffer: Buffer,
  filename: string,
  contentType: string = 'image/jpeg'
): Promise<string> {
  const objectName = `${Date.now()}-${filename}`;

  if (STORAGE_TYPE === 'filesystem') {
    await ensureStorageDir();
    const filePath = path.join(STORAGE_DIR, objectName);
    await fs.writeFile(filePath, buffer);
    return objectName;
  } else if (STORAGE_TYPE === 'minio' && minioClient) {
    await ensureBucket();
    await minioClient.putObject(BUCKET_NAME, objectName, buffer, buffer.length, {
      'Content-Type': contentType,
    });
    return objectName;
  } else {
    throw new Error(`Invalid storage type: ${STORAGE_TYPE}`);
  }
}

/**
 * Get image URL (for MinIO) or path (for filesystem)
 */
export async function getImageUrl(objectName: string): Promise<string> {
  if (STORAGE_TYPE === 'filesystem') {
    // Return relative path that will be served by Next.js API route
    return `/api/images/${objectName}`;
  } else if (STORAGE_TYPE === 'minio' && minioClient) {
    // Generate presigned URL valid for 1 hour
    return await minioClient.presignedGetObject(BUCKET_NAME, objectName, 3600);
  } else {
    throw new Error(`Invalid storage type: ${STORAGE_TYPE}`);
  }
}

/**
 * Get image buffer from storage
 */
export async function getImageBuffer(objectName: string): Promise<Buffer> {
  if (STORAGE_TYPE === 'filesystem') {
    const filePath = path.join(STORAGE_DIR, objectName);
    return await fs.readFile(filePath);
  } else if (STORAGE_TYPE === 'minio' && minioClient) {
    const chunks: Buffer[] = [];
    const stream = await minioClient.getObject(BUCKET_NAME, objectName);
    
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  } else {
    throw new Error(`Invalid storage type: ${STORAGE_TYPE}`);
  }
}

// Export storage type for reference
export { STORAGE_TYPE, STORAGE_DIR, BUCKET_NAME };

