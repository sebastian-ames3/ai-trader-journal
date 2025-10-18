import { logger } from './logger';

export interface PriceData {
  closes: number[];
  dates: string[];
}

export interface DataResponse {
  success: boolean;
  data?: PriceData;
  error?: string;
}

/**
 * Fetch daily closing prices for a ticker
 * TODO: Replace with actual yfinance integration
 */
export async function fetchDailyCloses(
  ticker: string,
  lookbackDays: number
): Promise<DataResponse> {
  logger.debug('fetchDailyCloses', { ticker, lookbackDays });

  try {
    // Validate inputs
    if (!ticker || ticker.length === 0) {
      return { success: false, error: 'Invalid ticker symbol' };
    }

    if (lookbackDays < 1 || lookbackDays > 365) {
      return { success: false, error: 'Lookback days must be between 1 and 365' };
    }

    // TODO: Replace with actual API call
    // Mock data for testing
    const mockData = generateMockPrices(ticker, lookbackDays);
    
    logger.debug('fetchDailyCloses result', { 
      ticker, 
      dataPoints: mockData.closes.length 
    });

    return {
      success: true,
      data: mockData
    };
  } catch (error) {
    logger.error('fetchDailyCloses error', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
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