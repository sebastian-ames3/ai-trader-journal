import { NextRequest, NextResponse } from 'next/server';
import { getTickerInfo } from '@/lib/yahooFinance';
import { logger } from '@/lib/logger';

// Environment variable to enable mock data for testing
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true';

/**
 * Get detailed ticker information
 * GET /api/ticker/[symbol]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  const { symbol } = params;

  try {
    logger.debug('Ticker info request', { symbol, useMock: USE_MOCK_DATA });

    // Use mock data if explicitly enabled
    if (USE_MOCK_DATA) {
      const mockData = generateMockTickerInfo(symbol);
      return NextResponse.json(mockData);
    }

    // Fetch real ticker info from Yahoo Finance
    const tickerInfo = await getTickerInfo(symbol);

    if (!tickerInfo) {
      logger.warn('Ticker not found, returning mock data', { symbol });
      const mockData = generateMockTickerInfo(symbol);
      return NextResponse.json(mockData);
    }

    // Transform to API response format
    const response = {
      symbol: tickerInfo.symbol,
      companyName: tickerInfo.companyName,
      exchange: tickerInfo.exchange,
      currency: tickerInfo.currency,
      currentPrice: tickerInfo.regularMarketPrice,
      previousClose: tickerInfo.regularMarketPreviousClose,
      dayChange: tickerInfo.regularMarketChange,
      dayChangePercent: tickerInfo.regularMarketChangePercent,
      volume: tickerInfo.regularMarketVolume,
      avgVolume: tickerInfo.averageDailyVolume10Day,
      marketCap: tickerInfo.marketCap,
      fiftyTwoWeekHigh: tickerInfo.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: tickerInfo.fiftyTwoWeekLow,
    };

    logger.info('Ticker info fetched', {
      symbol,
      companyName: response.companyName,
      price: response.currentPrice,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error in ticker info endpoint', error, { symbol });

    // Return mock data as fallback
    const mockData = generateMockTickerInfo(symbol);
    return NextResponse.json(mockData);
  }
}

/**
 * Generate mock ticker info for testing/fallback
 */
function generateMockTickerInfo(symbol: string) {
  const symbolUpper = symbol.toUpperCase();

  // Base prices for common tickers
  const basePrices: { [key: string]: number } = {
    'AAPL': 150.25,
    'GOOGL': 140.50,
    'MSFT': 350.75,
    'AMZN': 145.60,
    'SPY': 450.25,
    'TSLA': 220.40,
    'NVDA': 480.90,
    'META': 320.15,
  };

  const currentPrice = basePrices[symbolUpper] || 100.00;
  const previousClose = currentPrice * 0.99; // 1% gain
  const dayChange = currentPrice - previousClose;
  const dayChangePercent = (dayChange / previousClose) * 100;

  return {
    symbol: symbolUpper,
    companyName: `${symbolUpper} Inc.`,
    exchange: 'NASDAQ',
    currency: 'USD',
    currentPrice: parseFloat(currentPrice.toFixed(2)),
    previousClose: parseFloat(previousClose.toFixed(2)),
    dayChange: parseFloat(dayChange.toFixed(2)),
    dayChangePercent: parseFloat(dayChangePercent.toFixed(2)),
    volume: 45_234_123,
    avgVolume: 50_123_456,
    marketCap: 2_500_000_000_000,
    fiftyTwoWeekHigh: currentPrice * 1.15,
    fiftyTwoWeekLow: currentPrice * 0.75,
  };
}