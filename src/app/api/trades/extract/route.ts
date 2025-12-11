import { NextRequest, NextResponse } from 'next/server';
import {
  extractTradeData,
  extractTradeDataFromBase64,
  ExtractionResult,
} from '@/lib/tradeExtraction';

/**
 * POST /api/trades/extract
 * Extract trade data from a screenshot attachment
 *
 * Request body:
 * - attachmentUrl: URL of the image to analyze
 * OR
 * - imageData: Base64-encoded image data
 * - mediaType: MIME type (image/jpeg, image/png, image/gif, image/webp)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const contentType = request.headers.get('content-type') || '';

    let result: ExtractionResult;

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get('file');

      if (!file || !(file instanceof File)) {
        return NextResponse.json(
          { error: 'No file provided. Please upload an image file.' },
          { status: 400 }
        );
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        return NextResponse.json(
          {
            error: `Invalid file type: ${file.type}. Supported types: ${validTypes.join(', ')}`,
          },
          { status: 400 }
        );
      }

      // Convert file to base64
      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString('base64');
      const mediaType = file.type as
        | 'image/jpeg'
        | 'image/png'
        | 'image/gif'
        | 'image/webp';

      result = await extractTradeDataFromBase64(base64, mediaType);
    } else {
      // Handle JSON body
      const body = await request.json();

      if (body.attachmentUrl) {
        // URL-based extraction
        if (typeof body.attachmentUrl !== 'string') {
          return NextResponse.json(
            { error: 'attachmentUrl must be a string' },
            { status: 400 }
          );
        }

        result = await extractTradeData(body.attachmentUrl);
      } else if (body.imageData) {
        // Base64-based extraction
        if (typeof body.imageData !== 'string') {
          return NextResponse.json(
            { error: 'imageData must be a string' },
            { status: 400 }
          );
        }

        const mediaType = body.mediaType || 'image/jpeg';
        const validTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
        ];

        if (!validTypes.includes(mediaType)) {
          return NextResponse.json(
            {
              error: `Invalid mediaType: ${mediaType}. Supported types: ${validTypes.join(', ')}`,
            },
            { status: 400 }
          );
        }

        result = await extractTradeDataFromBase64(body.imageData, mediaType);
      } else {
        return NextResponse.json(
          {
            error:
              'Request must include either attachmentUrl, imageData, or a file upload',
          },
          { status: 400 }
        );
      }
    }

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Failed to extract trade data',
          processingTimeMs: result.processingTimeMs,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      processingTimeMs: result.processingTimeMs,
    });
  } catch (error) {
    console.error('Error in trade extraction endpoint:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error during trade extraction' },
      { status: 500 }
    );
  }
}
