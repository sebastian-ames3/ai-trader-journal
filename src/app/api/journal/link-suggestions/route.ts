import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getLinkSuggestions } from '@/lib/autoLinking';
import { parseISO } from 'date-fns';

export const dynamic = 'force-dynamic';

/**
 * POST /api/journal/link-suggestions
 * Get trade match suggestions for a journal entry
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { user } = auth;

    // Parse request body
    const body = await request.json();
    const { tickers, date, content } = body;

    // Validate required fields
    if (!tickers || !Array.isArray(tickers)) {
      return NextResponse.json(
        { error: 'tickers must be an array' },
        { status: 400 }
      );
    }

    if (!date || typeof date !== 'string') {
      return NextResponse.json(
        { error: 'date is required and must be an ISO 8601 string' },
        { status: 400 }
      );
    }

    // Parse date
    let parsedDate: Date;
    try {
      parsedDate = parseISO(date);
      if (isNaN(parsedDate.getTime())) {
        throw new Error('Invalid date');
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid date format. Expected ISO 8601 string.' },
        { status: 400 }
      );
    }

    // Validate tickers array
    if (tickers.length === 0) {
      return NextResponse.json({
        data: [],
        message: 'No tickers provided',
      });
    }

    // Validate ticker format (simple check)
    const invalidTickers = tickers.filter(
      (t: unknown) => typeof t !== 'string' || t.trim().length === 0
    );
    if (invalidTickers.length > 0) {
      return NextResponse.json(
        { error: 'All tickers must be non-empty strings' },
        { status: 400 }
      );
    }

    // Get suggestions
    const suggestions = await getLinkSuggestions(
      user.id,
      {
        tickers,
        date: parsedDate,
        content: content || undefined,
      },
      5 // Max 5 suggestions
    );

    // Log for debugging
    console.log('[Link Suggestions]', {
      userId: user.id,
      tickers,
      date,
      suggestionsCount: suggestions.length,
      topScore: suggestions[0]?.matchScore,
    });

    return NextResponse.json({
      data: suggestions,
      count: suggestions.length,
    });
  } catch (error) {
    console.error('[Link Suggestions] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
