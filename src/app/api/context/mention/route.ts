/**
 * Ticker Mention Tracking API Route
 *
 * POST /api/context/mention
 * Tracks a ticker mention in an entry.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  trackTickerMention,
  getTickerMarketData,
  saveMarketSnapshot,
} from '@/lib/contextSurfacing';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticker, entryId } = body;

    if (!ticker || !entryId) {
      return NextResponse.json(
        { error: 'Ticker and entryId are required' },
        { status: 400 }
      );
    }

    // Track the mention
    await trackTickerMention(ticker, entryId);

    // Also save a market snapshot for historical context
    const marketData = await getTickerMarketData(ticker);
    if (marketData) {
      await saveMarketSnapshot(ticker, marketData);
    }

    return NextResponse.json({
      success: true,
      ticker: ticker.toUpperCase(),
      entryId,
    });
  } catch (error) {
    console.error('Mention tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track mention' },
      { status: 500 }
    );
  }
}
