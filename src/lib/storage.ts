/**
 * Cloudflare R2 Storage Service
 *
 * S3-compatible storage for voice memos and screenshots.
 * Uses @aws-sdk/client-s3 for R2 compatibility.
 *
 * Environment variables required:
 * - R2_ENDPOINT: Cloudflare R2 endpoint (e.g., https://xxx.r2.cloudflarestorage.com)
 * - R2_ACCESS_KEY: R2 access key ID
 * - R2_SECRET_KEY: R2 secret access key
 * - R2_BUCKET: R2 bucket name (e.g., trader-journal-media)
 * - R2_PUBLIC_URL: Public URL for accessing files (e.g., https://media.yoursite.com)
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Lazy-initialize S3 client to allow env vars to be loaded first
let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!r2Client) {
    if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY || !process.env.R2_SECRET_KEY) {
      throw new Error('R2 storage is not configured. Please set R2_ENDPOINT, R2_ACCESS_KEY, and R2_SECRET_KEY environment variables.');
    }

    r2Client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY,
        secretAccessKey: process.env.R2_SECRET_KEY,
      },
    });
  }
  return r2Client;
}

/**
 * Check if R2 storage is configured
 */
export function isStorageConfigured(): boolean {
  return !!(
    process.env.R2_ENDPOINT &&
    process.env.R2_ACCESS_KEY &&
    process.env.R2_SECRET_KEY &&
    process.env.R2_BUCKET &&
    process.env.R2_PUBLIC_URL
  );
}

/**
 * Generate a unique file key with timestamp and random suffix
 */
function generateFileKey(prefix: string, extension: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}/${timestamp}-${random}.${extension}`;
}

/**
 * Upload an audio file to R2 storage
 *
 * @param buffer - Audio file buffer
 * @param contentType - MIME type (e.g., 'audio/webm', 'audio/mp4')
 * @returns Public URL of the uploaded file
 */
export async function uploadAudio(
  buffer: Buffer,
  contentType: string = 'audio/webm'
): Promise<string> {
  const extension = contentType.includes('mp4') ? 'm4a' : 'webm';
  const key = generateFileKey('audio', extension);

  const client = getR2Client();

  await client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000', // Cache for 1 year
  }));

  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

/**
 * Upload an image file to R2 storage
 *
 * @param buffer - Image file buffer
 * @param contentType - MIME type (e.g., 'image/webp', 'image/jpeg', 'image/png')
 * @returns Public URL of the uploaded file
 */
export async function uploadImage(
  buffer: Buffer,
  contentType: string = 'image/webp'
): Promise<string> {
  let extension = 'webp';
  if (contentType.includes('jpeg') || contentType.includes('jpg')) {
    extension = 'jpg';
  } else if (contentType.includes('png')) {
    extension = 'png';
  }

  const key = generateFileKey('images', extension);

  const client = getR2Client();

  await client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000', // Cache for 1 year
  }));

  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

/**
 * Delete a file from R2 storage
 *
 * @param url - Public URL of the file to delete
 */
export async function deleteFile(url: string): Promise<void> {
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!publicUrl || !url.startsWith(publicUrl)) {
    throw new Error('Invalid file URL');
  }

  const key = url.replace(`${publicUrl}/`, '');

  const client = getR2Client();

  await client.send(new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
  }));
}

/**
 * Validate file size is within limits
 *
 * @param size - File size in bytes
 * @param type - 'audio' or 'image'
 * @throws Error if file is too large
 */
export function validateFileSize(size: number, type: 'audio' | 'image'): void {
  const maxSizes = {
    audio: 10 * 1024 * 1024, // 10MB for audio (5 min @ ~100KB/min compressed = ~500KB, but allow headroom)
    image: 5 * 1024 * 1024,  // 5MB for images
  };

  if (size > maxSizes[type]) {
    const maxMB = maxSizes[type] / (1024 * 1024);
    throw new Error(`File too large. Maximum size for ${type} is ${maxMB}MB`);
  }
}

/**
 * Validate content type
 *
 * @param contentType - MIME type
 * @param type - 'audio' or 'image'
 * @throws Error if content type is not allowed
 */
export function validateContentType(contentType: string, type: 'audio' | 'image'): void {
  const allowedTypes = {
    audio: ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/x-m4a'],
    image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  };

  if (!allowedTypes[type].some(t => contentType.includes(t.split('/')[1]))) {
    throw new Error(`Invalid content type for ${type}. Allowed: ${allowedTypes[type].join(', ')}`);
  }
}
