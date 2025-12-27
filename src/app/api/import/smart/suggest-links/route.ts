import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { suggestLinks, type TradeForSuggestion } from '@/lib/suggestions';

export const dynamic = 'force-dynamic';

interface SuggestLinksRequest {
  trades: TradeForSuggestion[];
  options?: {
    minConfidence?: number;
    includeExisting?: boolean;
    useAi?: boolean;
  };
}

/**
 * POST /api/import/smart/suggest-links
 * Analyze trades and suggest link groups
 *
 * Request body:
 * {
 *   trades: [
 *     { id, ticker, strategyType, openedAt, closedAt?, debitCredit, realizedPL?, status, legs? }
 *   ],
 *   options?: {
 *     minConfidence?: number,
 *     includeExisting?: boolean,
 *     useAi?: boolean
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Authentication check
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    // Parse request body
    const body: SuggestLinksRequest = await request.json();
    const { trades, options } = body;

    if (!Array.isArray(trades)) {
      return NextResponse.json(
        { success: false, error: 'trades array is required' },
        { status: 400 }
      );
    }

    // Validate trades have required fields
    const invalidTrades = trades.filter(
      (t) =>
        !t.id ||
        !t.ticker ||
        !t.openedAt ||
        !t.status
    );

    if (invalidTrades.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `${invalidTrades.length} trades missing required fields (id, ticker, openedAt, status)`,
        },
        { status: 400 }
      );
    }

    // Run suggestion algorithm
    const suggestions = suggestLinks(trades, options || {});

    const processingTime = Date.now() - startTime;

    console.log(
      `[Smart Import] Suggest-links: ${trades.length} trades -> ${suggestions.length} suggestions in ${processingTime}ms`
    );

    return NextResponse.json({
      success: true,
      data: {
        suggestions,
        existingMatches: [], // TODO: implement existing trade matching
        processingTime,
        aiUsed: false,
      },
    });
  } catch (error) {
    console.error('[Smart Import] Suggest-links error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
