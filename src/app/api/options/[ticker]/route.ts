import { NextRequest, NextResponse } from 'next/server';
import { getOptionsExpirations, getOptionsChain } from '@/lib/yahooFinance';
import { logger } from '@/lib/logger';

/**
 * GET /api/options/[ticker]
 *
 * Fetch options data for a specific ticker
 *
 * Query params:
 * - action: 'expirations' | 'chain' (default: 'expirations')
 * - expiration: ISO date string (YYYY-MM-DD) for chain data (optional - uses nearest if not provided)
 *
 * Examples:
 * - GET /api/options/AAPL - Returns all expiration dates
 * - GET /api/options/AAPL?action=chain - Returns chain for nearest expiration
 * - GET /api/options/AAPL?action=chain&expiration=2025-12-19 - Returns chain for specific expiration
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
      let expirationDate: Date | undefined;

      if (expirationParam) {
        expirationDate = new Date(expirationParam);
        if (isNaN(expirationDate.getTime())) {
          return NextResponse.json(
            { error: 'Invalid expiration date format. Use YYYY-MM-DD.' },
            { status: 400 }
          );
        }
      }

      const chain = await getOptionsChain(ticker, expirationDate);

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
