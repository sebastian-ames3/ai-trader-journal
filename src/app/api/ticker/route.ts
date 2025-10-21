import { NextRequest, NextResponse } from 'next/server';
import { searchTickers } from '@/lib/yahooFinance';
import { logger } from '@/lib/logger';

// Environment variable to enable mock data for testing
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true';

// Mock data for fallback
const mockResults = [
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ' },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', exchange: 'NYSE' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', exchange: 'NASDAQ' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ' },
  { symbol: 'TSLA', name: 'Tesla, Inc.', exchange: 'NASDAQ' },
  { symbol: 'META', name: 'Meta Platforms, Inc.', exchange: 'NASDAQ' },
  { symbol: 'NFLX', name: 'Netflix, Inc.', exchange: 'NASDAQ' },
];

/**
 * Ticker search endpoint
 * GET /api/ticker?q={query}
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q') || '';

  try {
    logger.debug('Ticker search request', { query: q, useMock: USE_MOCK_DATA });

    // Return empty results for empty query
    if (!q || q.trim().length === 0) {
      return NextResponse.json({ results: [] });
    }

    // Use mock data if explicitly enabled
    if (USE_MOCK_DATA) {
      const filtered = mockResults.filter(item =>
        item.symbol.toLowerCase().includes(q.toLowerCase()) ||
        item.name.toLowerCase().includes(q.toLowerCase())
      );
      return NextResponse.json({ results: filtered });
    }

    // Use real Yahoo Finance search
    const results = await searchTickers(q);

    // If no results from real API, fall back to mock data
    if (!results || results.length === 0) {
      logger.warn('No results from Yahoo Finance, using mock data', { query: q });
      const filtered = mockResults.filter(item =>
        item.symbol.toLowerCase().includes(q.toLowerCase()) ||
        item.name.toLowerCase().includes(q.toLowerCase())
      );
      return NextResponse.json({ results: filtered });
    }

    logger.info('Ticker search completed', { query: q, count: results.length });
    return NextResponse.json({ results });
  } catch (error) {
    logger.error('Error in ticker search endpoint', error, { query: q });

    // Return mock data as fallback on error
    const filtered = mockResults.filter(item =>
      item.symbol.toLowerCase().includes(q.toLowerCase()) ||
      item.name.toLowerCase().includes(q.toLowerCase())
    );
    return NextResponse.json({ results: filtered });
  }
}