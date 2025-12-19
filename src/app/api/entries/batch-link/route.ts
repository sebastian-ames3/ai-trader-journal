import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { bulkLinkEntries } from '@/lib/autoLinking';

export const dynamic = 'force-dynamic';

interface BatchLinkRequest {
  entryIds: string[];
  ticker?: string;
  autoLinkThreshold?: number; // Minimum confidence to auto-link (0-1)
}

/**
 * PATCH /api/entries/batch-link
 * Bulk link entries to trades based on auto-linking algorithm
 *
 * Request body:
 * {
 *   entryIds: string[],     // Entry IDs to attempt linking
 *   ticker?: string,        // Optional: filter by ticker
 *   autoLinkThreshold?: number // Optional: min confidence (default 0.7)
 * }
 *
 * Response:
 * {
 *   linked: number,
 *   skipped: number,
 *   errors: Array<{ entryId: string, error: string }>
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    // Authentication check
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { user } = auth;

    // Parse request body
    const body: BatchLinkRequest = await request.json();
    const { entryIds, ticker } = body;

    if (!Array.isArray(entryIds) || entryIds.length === 0) {
      return NextResponse.json(
        { error: 'entryIds array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate max batch size
    const maxBatchSize = 100;
    if (entryIds.length > maxBatchSize) {
      return NextResponse.json(
        { error: `Maximum batch size is ${maxBatchSize} entries` },
        { status: 400 }
      );
    }

    // Perform bulk linking
    console.log(`[Batch Link] Starting bulk link for ${entryIds.length} entries`);
    const result = await bulkLinkEntries(user.id, entryIds, ticker);

    console.log(`[Batch Link] Completed: ${result.linked} linked, ${result.skipped} skipped`);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Batch Link] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
