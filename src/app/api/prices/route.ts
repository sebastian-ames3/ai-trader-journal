import { NextRequest, NextResponse } from 'next/server';
import { fetchDailyCloses } from '@/lib/data';
import { logger } from '@/lib/logger';

/**
 * Get historical closing prices for a ticker
 * GET /api/prices?ticker={symbol}&days={number}
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const ticker = searchParams.get('ticker');
  const daysParam = searchParams.get('days');

  try {
    // Validate ticker
    if (!ticker || ticker.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Ticker parameter is required' },
        { status: 400 }
      );
    }

    // Parse and validate days parameter
    const days = daysParam ? parseInt(daysParam, 10) : 30;
    if (isNaN(days) || days < 1 || days > 365) {
      return NextResponse.json(
        { success: false, error: 'Days must be between 1 and 365' },
        { status: 400 }
      );
    }

    logger.debug('Prices API request', { ticker, days });

    // Fetch price data
    const response = await fetchDailyCloses(ticker.toUpperCase(), days);

    if (!response.success) {
      return NextResponse.json(response, { status: 404 });
    }

    logger.info('Prices API response', {
      ticker,
      days,
      dataPoints: response.data?.closes.length || 0,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error in prices API endpoint', error, { ticker });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch price data',
      },
      { status: 500 }
    );
  }
}
