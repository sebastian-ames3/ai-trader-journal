import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/trades/unassigned
 * Get trades that are not assigned to any thesis.
 *
 * These trades can be grouped and assigned to suggested or new theses.
 *
 * Query params:
 * - limit: Max number of trades (default: 50, max: 100)
 * - ticker: Filter by specific ticker
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '50', 10),
      100
    );
    const tickerFilter = searchParams.get('ticker');

    // Get trades without thesis
    const trades = await prisma.thesisTrade.findMany({
      where: {
        userId: user.id,
        thesisId: null, // Unassigned
        ticker: tickerFilter ? tickerFilter.toUpperCase() : { not: null },
      },
      select: {
        id: true,
        ticker: true,
        outcome: true,
        realizedPL: true,
        strategyType: true,
        description: true,
        status: true,
        sourceType: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Group by ticker for summary
    const tickerGroups = new Map<
      string,
      {
        ticker: string;
        count: number;
        wins: number;
        losses: number;
        breakevens: number;
        totalPnL: number;
      }
    >();

    for (const trade of trades) {
      if (!trade.ticker) continue;

      const existing = tickerGroups.get(trade.ticker);
      if (existing) {
        existing.count++;
        if (trade.outcome === 'WIN') existing.wins++;
        if (trade.outcome === 'LOSS') existing.losses++;
        if (trade.outcome === 'BREAKEVEN') existing.breakevens++;
        if (trade.realizedPL) existing.totalPnL += trade.realizedPL;
      } else {
        tickerGroups.set(trade.ticker, {
          ticker: trade.ticker,
          count: 1,
          wins: trade.outcome === 'WIN' ? 1 : 0,
          losses: trade.outcome === 'LOSS' ? 1 : 0,
          breakevens: trade.outcome === 'BREAKEVEN' ? 1 : 0,
          totalPnL: trade.realizedPL || 0,
        });
      }
    }

    // Convert to array and sort by count
    const summary = Array.from(tickerGroups.values()).sort(
      (a, b) => b.count - a.count
    );

    return NextResponse.json({
      trades,
      summary,
      totalUnassigned: trades.length,
    });
  } catch (error) {
    console.error('Error fetching unassigned trades:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trades' },
      { status: 500 }
    );
  }
}
