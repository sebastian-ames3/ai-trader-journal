import yahooFinance from 'yahoo-finance2';
import { logger } from './logger';
import cache, { CacheKeys, CacheTTL, getPriceCacheTTL } from './cache';

/**
 * Yahoo Finance API Integration
 *
 * This module provides real market data from Yahoo Finance with:
 * - Intelligent caching (1 hour during market hours, 24 hours outside)
 * - Error handling and retries
 * - Rate limiting protection
 * - Graceful fallbacks
 */

export interface HistoricalPrice {
  date: Date;
  close: number;
}

export interface TickerInfo {
  symbol: string;
  companyName: string;
  exchange?: string;
  currency?: string;
  regularMarketPrice?: number;
  regularMarketPreviousClose?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketVolume?: number;
  averageDailyVolume10Day?: number;
  marketCap?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
}

export interface SearchResult {
  symbol: string;
  name: string;
  exchange?: string;
  type?: string;
}

export interface OptionsContract {
  strike: number;
  lastPrice: number;
  bid: number;
  ask: number;
  change: number;
  percentChange: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  inTheMoney: boolean;
  contractSymbol: string;
  lastTradeDate: Date;
}

export interface OptionsChain {
  ticker: string;
  expirationDate: Date;
  underlyingPrice: number;
  calls: OptionsContract[];
  puts: OptionsContract[];
  fetchedAt: Date;
}

/**
 * Fetch historical daily closing prices from Yahoo Finance
 *
 * @param ticker Stock symbol (e.g., 'AAPL', 'SPY')
 * @param days Number of days to look back (default: 30)
 * @returns Array of closing prices (oldest to newest) or null on error
 */
export async function fetchHistoricalPrices(
  ticker: string,
  days: number = 30
): Promise<HistoricalPrice[] | null> {
  const cacheKey = CacheKeys.priceHistory(ticker, days);

  // Check cache first
  const cached = cache.get<HistoricalPrice[]>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    logger.debug('Fetching historical prices from Yahoo Finance', { ticker, days });

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days - 10); // Fetch extra days to account for weekends/holidays

    // Fetch historical data
    // @ts-expect-error - yahoo-finance2 has complex type overloads that conflict
    const result = await yahooFinance.historical(ticker, {
      period1: startDate,
      period2: endDate,
      interval: '1d' as const, // Daily data
    });

    if (!result || result.length === 0) {
      logger.warn('No historical data returned', { ticker, days });
      return null;
    }

    // Extract closing prices
    interface YahooHistoricalData {
      date: Date;
      close: number;
    }

    const prices: HistoricalPrice[] = (result as YahooHistoricalData[])
      .map((item) => ({
        date: item.date,
        close: item.close,
      }))
      .filter((item) => item.close > 0) // Filter out invalid prices
      .sort((a, b) => a.date.getTime() - b.date.getTime()); // Ensure oldest to newest

    // Only return the requested number of days (most recent)
    const trimmedPrices = prices.slice(-days);

    if (trimmedPrices.length < Math.min(days, 20)) {
      logger.warn('Insufficient historical data', {
        ticker,
        requested: days,
        received: trimmedPrices.length,
      });
      return null;
    }

    // Cache the result
    const ttl = getPriceCacheTTL();
    cache.set(cacheKey, trimmedPrices, ttl);

    logger.info('Historical prices fetched successfully', {
      ticker,
      dataPoints: trimmedPrices.length,
      dateRange: {
        from: trimmedPrices[0].date.toISOString().split('T')[0],
        to: trimmedPrices[trimmedPrices.length - 1].date.toISOString().split('T')[0],
      },
    });

    return trimmedPrices;
  } catch (error) {
    logger.error('Error fetching historical prices', error, { ticker, days });

    // Check if we have stale cached data to return as fallback
    const staleData = cache.get<HistoricalPrice[]>(cacheKey);
    if (staleData) {
      logger.info('Returning stale cached data as fallback', { ticker });
      return staleData;
    }

    return null;
  }
}

/**
 * Get detailed ticker/quote information
 *
 * @param ticker Stock symbol
 * @returns Ticker information or null on error
 */
export async function getTickerInfo(ticker: string): Promise<TickerInfo | null> {
  const cacheKey = CacheKeys.tickerInfo(ticker);

  // Check cache
  const cached = cache.get<TickerInfo>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    logger.debug('Fetching ticker info from Yahoo Finance', { ticker });

    // @ts-expect-error - yahoo-finance2 has complex type overloads that conflict
    const result = await yahooFinance.quote(ticker);

    if (!result) {
      logger.warn('No quote data returned', { ticker });
      return null;
    }

    const info: TickerInfo = {
      symbol: result.symbol,
      companyName: result.longName || result.shortName || ticker,
      exchange: result.fullExchangeName || result.exchange,
      currency: result.currency,
      regularMarketPrice: result.regularMarketPrice,
      regularMarketPreviousClose: result.regularMarketPreviousClose,
      regularMarketChange: result.regularMarketChange,
      regularMarketChangePercent: result.regularMarketChangePercent,
      regularMarketVolume: result.regularMarketVolume,
      averageDailyVolume10Day: result.averageDailyVolume10Day,
      marketCap: result.marketCap,
      fiftyTwoWeekHigh: result.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: result.fiftyTwoWeekLow,
    };

    // Cache for 24 hours
    cache.set(cacheKey, info, CacheTTL.ONE_DAY);

    logger.info('Ticker info fetched successfully', {
      ticker,
      companyName: info.companyName,
      price: info.regularMarketPrice,
    });

    return info;
  } catch (error) {
    logger.error('Error fetching ticker info', error, { ticker });

    // Try to return stale cached data
    const staleData = cache.get<TickerInfo>(cacheKey);
    if (staleData) {
      logger.info('Returning stale cached ticker info', { ticker });
      return staleData;
    }

    return null;
  }
}

/**
 * Search for ticker symbols
 *
 * @param query Search query (partial symbol or company name)
 * @returns Array of search results, limited to 10 matches
 */
export async function searchTickers(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 1) {
    return [];
  }

  const cacheKey = CacheKeys.tickerSearch(query);

  // Check cache
  const cached = cache.get<SearchResult[]>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    logger.debug('Searching tickers on Yahoo Finance', { query });

    // @ts-expect-error - yahoo-finance2 has complex type overloads that conflict
    const result = await yahooFinance.search(query);

    if (!result || !result.quotes || result.quotes.length === 0) {
      logger.debug('No search results', { query });
      return [];
    }

    // Filter and transform results
    interface YahooSearchQuote {
      symbol: string;
      longname?: string;
      shortname?: string;
      exchange?: string;
      quoteType?: string;
    }

    const searchResults: SearchResult[] = (result.quotes as YahooSearchQuote[])
      .filter(
        (quote) =>
          quote.symbol &&
          (quote.quoteType === 'EQUITY' ||
            quote.quoteType === 'ETF' ||
            quote.quoteType === 'INDEX')
      )
      .slice(0, 10) // Limit to 10 results
      .map((quote) => ({
        symbol: quote.symbol,
        name: quote.longname || quote.shortname || quote.symbol,
        exchange: quote.exchange,
        type: quote.quoteType,
      }));

    // Cache for 1 hour
    cache.set(cacheKey, searchResults, CacheTTL.ONE_HOUR);

    logger.info('Ticker search completed', {
      query,
      resultsCount: searchResults.length,
    });

    return searchResults;
  } catch (error) {
    logger.error('Error searching tickers', error, { query });

    // Try to return stale cached data
    const staleData = cache.get<SearchResult[]>(cacheKey);
    if (staleData) {
      logger.info('Returning stale cached search results', { query });
      return staleData;
    }

    return [];
  }
}

/**
 * Validate if a ticker symbol exists
 *
 * @param ticker Stock symbol
 * @returns true if ticker exists, false otherwise
 */
export async function validateTicker(ticker: string): Promise<boolean> {
  try {
    const info = await getTickerInfo(ticker);
    return info !== null;
  } catch (error) {
    logger.error('Error validating ticker', error, { ticker });
    return false;
  }
}

/**
 * Get available expiration dates for options on a ticker
 *
 * @param ticker Stock symbol (e.g., 'AAPL', 'SPY')
 * @returns Array of expiration dates or null on error
 */
export async function getOptionsExpirations(ticker: string): Promise<Date[] | null> {
  const cacheKey = `options_expirations_${ticker}`;

  // Check cache
  const cached = cache.get<Date[]>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    logger.debug('Fetching options expirations from Yahoo Finance', { ticker });

    // @ts-expect-error - yahoo-finance2 has complex type overloads that conflict
    const result = await yahooFinance.options(ticker);

    if (!result || !result.expirationDates || result.expirationDates.length === 0) {
      logger.warn('No expiration dates found', { ticker });
      return null;
    }

    // Convert timestamps to Date objects
    // External Yahoo Finance API response type is untyped - explicit any needed for type assertion
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const expirations = (result.expirationDates as any[]).map((timestamp: number) => new Date(timestamp * 1000));

    // Cache for 1 hour (expirations don't change frequently)
    cache.set(cacheKey, expirations, CacheTTL.ONE_HOUR);

    logger.info('Options expirations fetched successfully', {
      ticker,
      count: expirations.length,
      nearest: expirations[0]?.toISOString().split('T')[0],
    });

    return expirations;
  } catch (error) {
    logger.error('Error fetching options expirations', error, { ticker });

    // Try to return stale cached data
    const staleData = cache.get<Date[]>(cacheKey);
    if (staleData) {
      logger.info('Returning stale cached expirations', { ticker });
      return staleData;
    }

    return null;
  }
}

/**
 * Get options chain for a specific expiration date
 *
 * @param ticker Stock symbol
 * @param expirationDate Expiration date (optional - defaults to nearest expiration)
 * @returns Options chain data or null on error
 */
export async function getOptionsChain(
  ticker: string,
  expirationDate?: Date
): Promise<OptionsChain | null> {
  try {
    // If no expiration provided, get the nearest one
    let targetExpiration = expirationDate;
    if (!targetExpiration) {
      const expirations = await getOptionsExpirations(ticker);
      if (!expirations || expirations.length === 0) {
        logger.warn('No expirations available for options chain', { ticker });
        return null;
      }
      targetExpiration = expirations[0]; // Use nearest expiration
    }

    const expirationStr = Math.floor(targetExpiration.getTime() / 1000).toString();
    const cacheKey = `options_chain_${ticker}_${expirationStr}`;

    // Check cache (5-minute TTL for options data)
    const cached = cache.get<OptionsChain>(cacheKey);
    if (cached) {
      return cached;
    }

    logger.debug('Fetching options chain from Yahoo Finance', { ticker, expirationDate: targetExpiration });

    // Fetch options data for specific expiration
    // @ts-expect-error - yahoo-finance2 has complex type overloads that conflict
    const result = await yahooFinance.options(ticker, { date: targetExpiration });

    if (!result || (!result.calls && !result.puts)) {
      logger.warn('No options chain data returned', { ticker, expirationDate: targetExpiration });
      return null;
    }

    // Get current underlying price from quote
    const quote = await getTickerInfo(ticker);
    const underlyingPrice = quote?.regularMarketPrice || 0;

    // Transform calls
    interface YahooOption {
      strike: number;
      lastPrice: number;
      bid: number;
      ask: number;
      change: number;
      percentChange: number;
      volume: number;
      openInterest: number;
      impliedVolatility: number;
      inTheMoney: boolean;
      contractSymbol: string;
      lastTradeDate: Date;
    }

    const calls: OptionsContract[] = (result.calls as YahooOption[] || []).map((call) => ({
      strike: call.strike,
      lastPrice: call.lastPrice,
      bid: call.bid,
      ask: call.ask,
      change: call.change,
      percentChange: call.percentChange,
      volume: call.volume,
      openInterest: call.openInterest,
      impliedVolatility: call.impliedVolatility,
      inTheMoney: call.inTheMoney,
      contractSymbol: call.contractSymbol,
      lastTradeDate: new Date(call.lastTradeDate),
    }));

    // Transform puts
    const puts: OptionsContract[] = (result.puts as YahooOption[] || []).map((put) => ({
      strike: put.strike,
      lastPrice: put.lastPrice,
      bid: put.bid,
      ask: put.ask,
      change: put.change,
      percentChange: put.percentChange,
      volume: put.volume,
      openInterest: put.openInterest,
      impliedVolatility: put.impliedVolatility,
      inTheMoney: put.inTheMoney,
      contractSymbol: put.contractSymbol,
      lastTradeDate: new Date(put.lastTradeDate),
    }));

    const chainData: OptionsChain = {
      ticker,
      expirationDate: targetExpiration,
      underlyingPrice,
      calls,
      puts,
      fetchedAt: new Date(),
    };

    // Cache for 5 minutes (options data changes frequently during market hours)
    cache.set(cacheKey, chainData, 5 * 60 * 1000);

    logger.info('Options chain fetched successfully', {
      ticker,
      expiration: targetExpiration.toISOString().split('T')[0],
      callsCount: calls.length,
      putsCount: puts.length,
      underlyingPrice,
    });

    return chainData;
  } catch (error) {
    logger.error('Error fetching options chain', error, { ticker, expirationDate });

    // Try to return stale cached data
    if (expirationDate) {
      const expirationStr = Math.floor(expirationDate.getTime() / 1000).toString();
      const cacheKey = `options_chain_${ticker}_${expirationStr}`;
      const staleData = cache.get<OptionsChain>(cacheKey);
      if (staleData) {
        logger.info('Returning stale cached options chain', { ticker });
        return staleData;
      }
    }

    return null;
  }
}

/**
 * Clear all cached data for a specific ticker
 */
export function clearTickerCache(ticker: string): void {
  cache.clear(CacheKeys.tickerInfo(ticker));
  cache.clear(CacheKeys.quote(ticker));
  // Clear all price history caches for this ticker
  for (const days of [20, 30, 60, 90, 365]) {
    cache.clear(CacheKeys.priceHistory(ticker, days));
  }
  logger.info('Ticker cache cleared', { ticker });
}
