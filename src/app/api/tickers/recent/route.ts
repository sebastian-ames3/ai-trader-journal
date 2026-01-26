import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/tickers/recent
 * Get recent tickers from user's entries and trades for autocomplete.
 *
 * Returns tickers sorted by frequency and recency.
 */
export async function GET() {
  try {
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get tickers from recent entries
    const entryTickers = await prisma.entry.groupBy({
      by: ['ticker'],
      where: {
        userId: user.id,
        ticker: { not: null },
        createdAt: { gte: thirtyDaysAgo },
        deletedAt: null,
      },
      _count: { ticker: true },
      _max: { createdAt: true },
    });

    // Get tickers from recent trades
    const tradeTickers = await prisma.thesisTrade.groupBy({
      by: ['ticker'],
      where: {
        userId: user.id,
        ticker: { not: null },
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: { ticker: true },
      _max: { createdAt: true },
    });

    // Get tickers from active theses
    const thesisTickers = await prisma.tradingThesis.findMany({
      where: {
        userId: user.id,
        status: 'ACTIVE',
      },
      select: {
        ticker: true,
        createdAt: true,
      },
    });

    // Combine and dedupe tickers
    const tickerMap = new Map<string, { count: number; lastUsed: Date }>();

    for (const entry of entryTickers) {
      if (entry.ticker) {
        const existing = tickerMap.get(entry.ticker);
        const count = entry._count.ticker;
        const lastUsed = entry._max.createdAt || new Date();

        if (existing) {
          existing.count += count;
          if (lastUsed > existing.lastUsed) {
            existing.lastUsed = lastUsed;
          }
        } else {
          tickerMap.set(entry.ticker, { count, lastUsed });
        }
      }
    }

    for (const trade of tradeTickers) {
      if (trade.ticker) {
        const existing = tickerMap.get(trade.ticker);
        const count = trade._count.ticker;
        const lastUsed = trade._max.createdAt || new Date();

        if (existing) {
          existing.count += count;
          if (lastUsed > existing.lastUsed) {
            existing.lastUsed = lastUsed;
          }
        } else {
          tickerMap.set(trade.ticker, { count, lastUsed });
        }
      }
    }

    // Add active thesis tickers (boost priority)
    for (const thesis of thesisTickers) {
      const existing = tickerMap.get(thesis.ticker);
      if (existing) {
        existing.count += 5; // Boost active thesis tickers
      } else {
        tickerMap.set(thesis.ticker, { count: 5, lastUsed: thesis.createdAt });
      }
    }

    // Convert to array and sort by count (descending), then by lastUsed (descending)
    const tickers = Array.from(tickerMap.entries())
      .map(([ticker, data]) => ({
        ticker,
        count: data.count,
        lastUsed: data.lastUsed.toISOString(),
      }))
      .sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
      })
      .slice(0, 20); // Limit to top 20

    return NextResponse.json({ tickers });
  } catch (error) {
    console.error('Error fetching recent tickers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickers' },
      { status: 500 }
    );
  }
}
