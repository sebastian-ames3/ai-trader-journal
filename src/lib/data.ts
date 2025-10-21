import { logger } from './logger';
import { fetchHistoricalPrices } from './yahooFinance';

export interface PriceData {
  closes: number[];
  dates: string[];
}

export interface DataResponse {
  success: boolean;
  data?: PriceData;
  error?: string;
}

// Environment variable to enable mock data for testing
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true';

/**
 * Fetch daily closing prices for a ticker
 * Now uses real Yahoo Finance API with mock data fallback
 */
export async function fetchDailyCloses(
  ticker: string,
  lookbackDays: number
): Promise<DataResponse> {
  logger.debug('fetchDailyCloses', { ticker, lookbackDays, useMock: USE_MOCK_DATA });

  try {
    // Validate inputs
    if (!ticker || ticker.length === 0) {
      return { success: false, error: 'Invalid ticker symbol' };
    }

    if (lookbackDays < 1 || lookbackDays > 365) {
      return { success: false, error: 'Lookback days must be between 1 and 365' };
    }

    // Use mock data if explicitly enabled
    if (USE_MOCK_DATA) {
      logger.info('Using mock data (USE_MOCK_DATA=true)', { ticker });
      const mockData = generateMockPrices(ticker, lookbackDays);
      return {
        success: true,
        data: mockData
      };
    }

    // Fetch real data from Yahoo Finance
    const historicalPrices = await fetchHistoricalPrices(ticker, lookbackDays);

    if (!historicalPrices || historicalPrices.length === 0) {
      logger.warn('Yahoo Finance returned no data, falling back to mock', { ticker });
      const mockData = generateMockPrices(ticker, lookbackDays);
      return {
        success: true,
        data: mockData
      };
    }

    // Transform to expected format
    const priceData: PriceData = {
      closes: historicalPrices.map(p => p.close),
      dates: historicalPrices.map(p => p.date.toISOString().split('T')[0])
    };

    logger.debug('fetchDailyCloses result (real data)', {
      ticker,
      dataPoints: priceData.closes.length
    });

    return {
      success: true,
      data: priceData
    };
  } catch (error) {
    logger.error('fetchDailyCloses error, falling back to mock data', error);

    // Fallback to mock data on error
    const mockData = generateMockPrices(ticker, lookbackDays);
    return {
      success: true,
      data: mockData
    };
  }
}

/**
 * Generate mock price data for testing
 * Creates realistic-looking price movements
 */
function generateMockPrices(ticker: string, days: number): PriceData {
  const closes: number[] = [];
  const dates: string[] = [];
  
  // Start with a base price based on ticker
  let basePrice = 100;
  if (ticker === 'AAPL') basePrice = 150;
  if (ticker === 'GOOGL') basePrice = 140;
  if (ticker === 'SPY') basePrice = 450;

  // Generate prices with some volatility
  let currentPrice = basePrice;
  const volatility = 0.02; // 2% daily volatility
  
  for (let i = days - 1; i >= 0; i--) {
    // Random walk with slight upward bias
    const change = (Math.random() - 0.48) * volatility;
    currentPrice = currentPrice * (1 + change);
    
    closes.unshift(currentPrice);
    
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.unshift(date.toISOString().split('T')[0]);
  }

  return { closes, dates };
}