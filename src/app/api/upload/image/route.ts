/**
 * Image Upload API Route
 *
 * POST /api/upload/image
 * Uploads image files to Cloudflare R2 storage.
 *
 * Request: multipart/form-data with 'image' file
 * Response: { url: string, width?: number, height?: number }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  uploadImage,
  validateFileSize,
  validateContentType,
  isStorageConfigured,
} from '@/lib/storage';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    // Check if storage is configured
    if (!isStorageConfigured()) {
      return NextResponse.json(
        {
          error: 'Storage not configured',
          message: 'Please configure R2 storage environment variables',
        },
        { status: 503 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const imageFile = formData.get('image');

    if (!imageFile || !(imageFile instanceof File)) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate content type
    const contentType = imageFile.type;
    try {
      validateContentType(contentType, 'image');
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid content type' },
        { status: 400 }
      );
    }

    // Validate file size
    try {
      validateFileSize(imageFile.size, 'image');
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'File too large' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to R2
    const url = await uploadImage(buffer, contentType);

    return NextResponse.json({
      url,
      size: imageFile.size,
      contentType,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image file' },
      { status: 500 }
    );
  }
}
