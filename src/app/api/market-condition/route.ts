/**
 * Market Condition API Route
 *
 * GET /api/market-condition
 * Returns the latest market condition for the in-app banner.
 */

import { NextResponse } from 'next/server';
import { getLatestMarketCondition, fetchMarketSnapshot, classifyMarketState } from '@/lib/marketData';

export async function GET() {
  try {
    // First, try to get from database (faster, cached)
    const condition = await getLatestMarketCondition();

    // If no recent condition, fetch live
    if (!condition) {
      const snapshot = await fetchMarketSnapshot();

      if (snapshot) {
        const marketState = classifyMarketState(snapshot.spy, snapshot.vix);

        return NextResponse.json({
          spyPrice: snapshot.spy.price,
          spyChange: snapshot.spy.change,
          vixLevel: snapshot.vix.price,
          vixChange: snapshot.vix.change,
          marketState,
          source: 'live',
        });
      }

      return NextResponse.json({ error: 'No market data available' }, { status: 503 });
    }

    return NextResponse.json({
      spyPrice: condition.spyPrice,
      spyChange: condition.spyChange,
      vixLevel: condition.vixLevel,
      vixChange: condition.vixChange,
      marketState: condition.marketState,
      source: 'cached',
    });
  } catch (error) {
    console.error('Market condition error:', error);
    return NextResponse.json(
      { error: 'Failed to get market condition' },
      { status: 500 }
    );
  }
}
