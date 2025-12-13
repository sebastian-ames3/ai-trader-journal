import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { extractJournalData, validateOCRResult } from '@/lib/journalOCR';
import { cache, CacheKeys, CacheTTL } from '@/lib/cache';
import { createHash } from 'crypto';

/**
 * POST /api/journal/ocr
 * Extract handwritten text and metadata from journal image
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    let result = cache.get<ReturnType<typeof extractJournalData>>(cacheKey);

    if (!result) {
      console.log('[OCR] Cache miss, calling Claude Vision API...');

      // Call Claude Vision API
      try {
        result = await extractJournalData(imageUrl);
      } catch (error) {
        console.error('[OCR] Extraction failed:', error);

        // Check if it's a Claude API error
        if (error instanceof Error) {
          if (error.message.includes('rate limit')) {
            return NextResponse.json(
              { error: 'Rate limit exceeded. Please try again in a moment.' },
              { status: 429 }
            );
          }
          if (error.message.includes('overloaded')) {
            return NextResponse.json(
              { error: 'OCR service temporarily unavailable. Please try again.' },
              { status: 503 }
            );
          }
        }

        return NextResponse.json(
          { error: 'Failed to extract journal data. Please try again.' },
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
