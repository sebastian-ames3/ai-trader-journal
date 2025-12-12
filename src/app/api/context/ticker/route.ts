/**
 * Ticker Context API Route
 *
 * GET /api/context/ticker?ticker=AAPL
 * Returns full context for a ticker including market data, history, and insights.
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import {
  getFullTickerContext,
  detectTickers,
} from '@/lib/contextSurfacing';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    const content = searchParams.get('content');

    // If content is provided, detect tickers first
    if (content && !ticker) {
      const detectedTickers = await detectTickers(content);

      if (detectedTickers.length === 0) {
        return NextResponse.json({
          tickers: [],
          context: null,
        });
      }

      // Get context for the first detected ticker
      const context = await getFullTickerContext(detectedTickers[0]);

      return NextResponse.json({
        tickers: detectedTickers,
        context,
      });
    }

    if (!ticker) {
      return NextResponse.json(
        { error: 'Ticker or content is required' },
        { status: 400 }
      );
    }

    const context = await getFullTickerContext(ticker.toUpperCase());

    return NextResponse.json(context);
  } catch (error) {
    console.error('Ticker context error:', error);
    return NextResponse.json(
      { error: 'Failed to get ticker context' },
      { status: 500 }
    );
  }
}
