import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { extractJournalData, validateOCRResult, OCRResult } from '@/lib/journalOCR';
import { cache, CacheKeys, CacheTTL } from '@/lib/cache';
import { createHash } from 'crypto';
import { rateLimiters, checkRateLimit } from '@/lib/rateLimit';
import { errorResponse, validationError } from '@/lib/errors';

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
    const rateLimitError = await checkRateLimit(rateLimiters.ocr, auth.user.id);
    if (rateLimitError) return rateLimitError;

    // Parse request body
    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl || typeof imageUrl !== 'string') {
      return validationError('imageUrl is required and must be a string');
    }

    // Validate image URL
    try {
      new URL(imageUrl);
    } catch {
      return validationError('Invalid imageUrl format');
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
            return errorResponse('Rate limit exceeded. Please try again in a moment.', {
              status: 429,
              debugContext: errorDetails,
            });
          }
          if (msg.includes('overloaded')) {
            return errorResponse('OCR service temporarily unavailable. Please try again.', {
              status: 503,
              debugContext: errorDetails,
            });
          }
          if (msg.includes('could not process') || msg.includes('download') || msg.includes('fetch')) {
            return errorResponse('Could not access the uploaded image. The image URL may not be publicly accessible.', {
              status: 502,
              debugContext: errorDetails,
            });
          }
        }

        return errorResponse('Failed to extract journal data. Please try again.', {
          status: 500,
          debugContext: errorDetails,
        });
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
    return errorResponse('Internal server error', {
      status: 500,
      debugContext: {
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}
