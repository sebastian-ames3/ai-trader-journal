import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { extractJournalData, validateOCRResult, OCRResult } from '@/lib/journalOCR';
import { cache, CacheKeys, CacheTTL } from '@/lib/cache';
import { createHash } from 'crypto';
import { rateLimiters, checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/journal/ocr
 * Extract handwritten text and metadata from journal image
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    // Check rate limit
    const rateLimitError = checkRateLimit(rateLimiters.ocr, auth.user.id);
    if (rateLimitError) return rateLimitError;

    // Parse request body
    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json(
        { error: 'imageUrl is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate image URL
    try {
      new URL(imageUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid imageUrl format' },
        { status: 400 }
      );
    }

    // Generate cache key from image URL
    const urlHash = createHash('sha256').update(imageUrl).digest('hex').slice(0, 16);
    const cacheKey = CacheKeys.ocrResult(urlHash);

    // Check cache first
    let result = cache.get<OCRResult>(cacheKey);

    if (!result) {
      console.log('[OCR] Cache miss, calling Claude Vision API...');

      // Call Claude Vision API
      try {
        result = await extractJournalData(imageUrl);
      } catch (error) {
        // Enhanced error logging with full details
        const errorDetails = {
          message: error instanceof Error ? error.message : 'Unknown error',
          type: error?.constructor?.name,
          cause: error instanceof Error ? (error as Error & { cause?: unknown }).cause : undefined,
          imageUrl: imageUrl.substring(0, 100) + '...', // Truncate for logging
        };
        console.error('[OCR] Extraction failed:', JSON.stringify(errorDetails, null, 2));

        // Check if it's a Claude API error
        if (error instanceof Error) {
          const msg = error.message.toLowerCase();
          if (msg.includes('rate limit')) {
            return NextResponse.json(
              { error: 'Rate limit exceeded. Please try again in a moment.', debug: errorDetails },
              { status: 429 }
            );
          }
          if (msg.includes('overloaded')) {
            return NextResponse.json(
              { error: 'OCR service temporarily unavailable. Please try again.', debug: errorDetails },
              { status: 503 }
            );
          }
          if (msg.includes('could not process') || msg.includes('download') || msg.includes('fetch')) {
            return NextResponse.json(
              { error: 'Could not access the uploaded image. The image URL may not be publicly accessible.', debug: errorDetails },
              { status: 502 }
            );
          }
        }

        // Return detailed error for debugging
        return NextResponse.json(
          {
            error: 'Failed to extract journal data. Please try again.',
            debug: process.env.NODE_ENV === 'development' ? errorDetails : { message: errorDetails.message }
          },
          { status: 500 }
        );
      }

      // Cache the result for 15 minutes
      cache.set(cacheKey, result, CacheTTL.FIFTEEN_MINUTES);
      console.log('[OCR] Result cached for', CacheTTL.FIFTEEN_MINUTES, 'ms');
    } else {
      console.log('[OCR] Cache hit, using cached result');
    }

    // Validate result and generate warnings
    const validation = validateOCRResult(result);

    return NextResponse.json({
      success: true,
      data: result,
      warnings: validation.warnings.length > 0 ? validation.warnings : undefined,
    });
  } catch (error) {
    console.error('[OCR] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
