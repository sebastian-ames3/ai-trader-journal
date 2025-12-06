/**
 * Audio Upload API Route
 *
 * POST /api/upload/audio
 * Uploads audio files to Cloudflare R2 storage.
 *
 * Request: multipart/form-data with 'audio' file
 * Response: { url: string, duration?: number }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  uploadAudio,
  validateFileSize,
  validateContentType,
  isStorageConfigured,
} from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
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
    const audioFile = formData.get('audio');

    if (!audioFile || !(audioFile instanceof File)) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Validate content type
    const contentType = audioFile.type;
    try {
      validateContentType(contentType, 'audio');
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid content type' },
        { status: 400 }
      );
    }

    // Validate file size
    try {
      validateFileSize(audioFile.size, 'audio');
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'File too large' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to R2
    const url = await uploadAudio(buffer, contentType);

    // Get duration from form data if provided (from client-side MediaRecorder)
    const durationStr = formData.get('duration');
    const duration = durationStr ? parseInt(durationStr.toString(), 10) : undefined;

    return NextResponse.json({
      url,
      duration,
      size: audioFile.size,
      contentType,
    });
  } catch (error) {
    console.error('Error uploading audio:', error);
    return NextResponse.json(
      { error: 'Failed to upload audio file' },
      { status: 500 }
    );
  }
}
