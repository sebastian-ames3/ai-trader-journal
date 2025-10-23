import { NextRequest, NextResponse } from 'next/server';
import { getOptionsExpirations, getOptionsChain } from '@/lib/polygonClient';
import { logger } from '@/lib/logger';

/**
 * GET /api/options/[ticker]
 *
 * Fetch options data from Polygon.io for a specific ticker
 * Uses official OPRA data with Greeks and real-time pricing
 *
 * Query params:
 * - action: 'expirations' | 'chain' (default: 'expirations')
 * - expiration: ISO date string (YYYY-MM-DD) - REQUIRED for chain action
 * - minStrike: Minimum strike price (optional, for filtering)
 * - maxStrike: Maximum strike price (optional, for filtering)
 *
 * Examples:
 * - GET /api/options/AAPL
 *   → Returns all expiration dates
 *
 * - GET /api/options/AAPL?action=chain&expiration=2025-11-21
 *   → Returns chain for Nov 21, 2025 (contract list only, no pricing/Greeks)
 *
 * - GET /api/options/AAPL?action=chain&expiration=2025-11-21&minStrike=165&maxStrike=175
 *   → Returns filtered chain (strikes 165-175 only)
 *
 * Note: Chain endpoint returns contract metadata only (no pricing/Greeks).
 * Use /api/options/contract/[symbol] for detailed pricing and Greeks.
 *
 * Rate Limits (Free Tier): 5 calls/minute
 * Rate Limits (Paid Tier): Unlimited
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  try {
    const ticker = params.ticker?.toUpperCase();
    if (!ticker) {
      return NextResponse.json(
        { error: 'Ticker symbol is required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'expirations';
    const expirationParam = searchParams.get('expiration');

    logger.debug('Options API request', { ticker, action, expiration: expirationParam });

    // Handle expirations request
    if (action === 'expirations') {
      const expirations = await getOptionsExpirations(ticker);

      if (!expirations) {
        return NextResponse.json(
          { error: 'Failed to fetch options expirations. Ticker may not have options or data unavailable.' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        ticker,
        expirations: expirations.map((date) => date.toISOString()),
        count: expirations.length,
      });
    }

    // Handle chain request
    if (action === 'chain') {
      // Expiration is now REQUIRED for chain requests
      if (!expirationParam) {
        return NextResponse.json(
          { error: 'Expiration date is required for chain requests. Use YYYY-MM-DD format.' },
          { status: 400 }
        );
      }

      const expirationDate = new Date(expirationParam);
      if (isNaN(expirationDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid expiration date format. Use YYYY-MM-DD.' },
          { status: 400 }
        );
      }

      // Optional strike range filtering
      const minStrike = searchParams.get('minStrike');
      const maxStrike = searchParams.get('maxStrike');
      let strikeRange: { min: number; max: number } | undefined;

      if (minStrike && maxStrike) {
        strikeRange = {
          min: parseFloat(minStrike),
          max: parseFloat(maxStrike),
        };
      }

      const chain = await getOptionsChain(ticker, expirationDate, strikeRange);

      if (!chain) {
        return NextResponse.json(
          { error: 'Failed to fetch options chain data.' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        ticker: chain.ticker,
        expirationDate: chain.expirationDate.toISOString(),
        underlyingPrice: chain.underlyingPrice,
        calls: chain.calls,
        puts: chain.puts,
        fetchedAt: chain.fetchedAt.toISOString(),
        note: 'Pricing and Greeks are zeros - use /contract endpoint for detailed data',
      });
    }

    // Invalid action
    return NextResponse.json(
      { error: 'Invalid action. Use "expirations" or "chain".' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Options API error', error, { ticker: params.ticker });

    return NextResponse.json(
      { error: 'Internal server error fetching options data' },
      { status: 500 }
    );
  }
}
