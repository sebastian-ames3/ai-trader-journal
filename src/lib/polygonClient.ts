import { restClient } from '@polygon.io/client-js';
import { logger } from './logger';
import cache, { CacheTTL } from './cache';

/**
 * Polygon.io Options Data Integration
 *
 * This module provides production-quality options data from Polygon.io:
 * - Official OPRA data from all 17 US options exchanges
 * - Real-time options chains with Greeks
 * - Historical IV data for IV Rank calculations
 * - Intelligent caching (5 min for chains, 1 hour for expirations)
 *
 * Rate Limits:
 * - Free tier: 5 API calls/minute
 * - Options Starter ($99/mo): Unlimited calls
 */

// Initialize Polygon client
const polygon = restClient(process.env.POLYGON_API_KEY);

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
  // Greeks from Polygon
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
}

export interface OptionsChain {
  ticker: string;
  expirationDate: Date;
  underlyingPrice: number;
  calls: OptionsContract[];
  puts: OptionsContract[];
  fetchedAt: Date;
}

export interface ContractDetails {
  ticker: string;
  contractType: 'call' | 'put';
  expirationDate: string;
  strikePrice: number;
  underlyingTicker: string;
}

/**
 * Get all available expiration dates for a ticker
 *
 * @param ticker Underlying ticker symbol (e.g., 'AAPL')
 * @returns Array of expiration dates or null on error
 */
export async function getOptionsExpirations(ticker: string): Promise<Date[] | null> {
  const cacheKey = `polygon_expirations_${ticker}`;

  // Check cache (1 hour TTL)
  const cached = cache.get<Date[]>(cacheKey);
  if (cached) {
    logger.debug('Returning cached expirations', { ticker });
    return cached;
  }

  try {
    logger.debug('Fetching options expirations from Polygon.io', { ticker });

    // Fetch options contracts to get unique expiration dates
    const response = await polygon.reference.optionsContracts({
      underlying_ticker: ticker.toUpperCase(),
      limit: 1000, // Get up to 1000 contracts to ensure we capture all expirations
    });

    if (!response.results || response.results.length === 0) {
      logger.warn('No options contracts found', { ticker });
      return null;
    }

    // Extract unique expiration dates
    const expirationSet = new Set<string>();
    response.results.forEach((contract: any) => {
      if (contract.expiration_date) {
        expirationSet.add(contract.expiration_date);
      }
    });

    // Convert to Date objects and sort
    const expirations = Array.from(expirationSet)
      .map((dateStr) => new Date(dateStr))
      .sort((a, b) => a.getTime() - b.getTime())
      .filter((date) => date >= new Date()); // Only future expirations

    if (expirations.length === 0) {
      logger.warn('No valid future expirations found', { ticker });
      return null;
    }

    // Cache for 1 hour
    cache.set(cacheKey, expirations, CacheTTL.ONE_HOUR);

    logger.info('Options expirations fetched successfully', {
      ticker,
      count: expirations.length,
      nearest: expirations[0]?.toISOString().split('T')[0],
    });

    return expirations;
  } catch (error) {
    logger.error('Error fetching options expirations from Polygon.io', error, { ticker });

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
 * OPTIMIZED: Only fetches contract metadata, not full snapshots
 * Use getContractSnapshot() for detailed pricing/Greeks on specific strikes
 *
 * @param ticker Underlying ticker symbol
 * @param expirationDate Expiration date (required)
 * @param strikeRange Optional filter: { min: number, max: number }
 * @returns Options chain with basic contract info (no Greeks/pricing by default)
 */
export async function getOptionsChain(
  ticker: string,
  expirationDate: Date,
  strikeRange?: { min: number; max: number }
): Promise<OptionsChain | null> {
  try {
    const expirationStr = expirationDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const cacheKey = `polygon_chain_${ticker}_${expirationStr}_${strikeRange?.min || 'all'}_${strikeRange?.max || 'all'}`;

    // Check cache (5-minute TTL for options data)
    const cached = cache.get<OptionsChain>(cacheKey);
    if (cached) {
      logger.debug('Returning cached options chain', { ticker, expiration: expirationStr });
      return cached;
    }

    logger.debug('Fetching options chain from Polygon.io', {
      ticker,
      expiration: expirationStr,
      strikeRange
    });

    // Fetch all contracts for this expiration
    const response = await polygon.reference.optionsContracts({
      underlying_ticker: ticker.toUpperCase(),
      expiration_date: expirationStr,
      limit: 1000,
    });

    if (!response.results || response.results.length === 0) {
      logger.warn('No options chain data returned', { ticker, expiration: expirationStr });
      return null;
    }

    // Get current underlying price from snapshot
    let underlyingPrice = 0;
    try {
      const snapshot = await polygon.stocks.universalSnapshot({ ticker: ticker.toUpperCase() });
      underlyingPrice = snapshot.results?.[0]?.session?.close || 0;
    } catch (err) {
      logger.warn('Failed to fetch underlying price, using 0', { ticker, error: err });
    }

    // Transform contracts into our format (WITHOUT fetching individual snapshots)
    const calls: OptionsContract[] = [];
    const puts: OptionsContract[] = [];

    for (const contract of response.results) {
      // Apply strike range filter if provided
      if (strikeRange) {
        if (contract.strike_price < strikeRange.min || contract.strike_price > strikeRange.max) {
          continue; // Skip this strike
        }
      }

      // Basic contract data without snapshot (no pricing/Greeks yet)
      const optionData: OptionsContract = {
        strike: contract.strike_price,
        lastPrice: 0, // Will be fetched on-demand
        bid: 0,
        ask: 0,
        change: 0,
        percentChange: 0,
        volume: 0,
        openInterest: 0,
        impliedVolatility: 0,
        inTheMoney: false,
        contractSymbol: contract.ticker,
        lastTradeDate: new Date(),
        // Greeks will be fetched on-demand
        delta: undefined,
        gamma: undefined,
        theta: undefined,
        vega: undefined,
      };

      // Determine if in-the-money
      if (underlyingPrice > 0) {
        if (contract.contract_type === 'call') {
          optionData.inTheMoney = underlyingPrice > contract.strike_price;
        } else {
          optionData.inTheMoney = underlyingPrice < contract.strike_price;
        }
      }

      // Add to appropriate array
      if (contract.contract_type === 'call') {
        calls.push(optionData);
      } else {
        puts.push(optionData);
      }
    }

    // Sort by strike price
    calls.sort((a, b) => a.strike - b.strike);
    puts.sort((a, b) => a.strike - b.strike);

    const chainData: OptionsChain = {
      ticker: ticker.toUpperCase(),
      expirationDate: expirationDate,
      underlyingPrice,
      calls,
      puts,
      fetchedAt: new Date(),
    };

    // Cache for 5 minutes
    cache.set(cacheKey, chainData, 5 * 60 * 1000);

    logger.info('Options chain fetched successfully', {
      ticker,
      expiration: expirationStr,
      callsCount: calls.length,
      putsCount: puts.length,
      underlyingPrice,
      strikeRange,
    });

    return chainData;
  } catch (error) {
    logger.error('Error fetching options chain from Polygon.io', error, { ticker, expirationDate });

    // Try to return stale cached data
    const expirationStr = expirationDate.toISOString().split('T')[0];
    const cacheKey = `polygon_chain_${ticker}_${expirationStr}_${strikeRange?.min || 'all'}_${strikeRange?.max || 'all'}`;
    const staleData = cache.get<OptionsChain>(cacheKey);
    if (staleData) {
      logger.info('Returning stale cached options chain', { ticker });
      return staleData;
    }

    return null;
  }
}

/**
 * Get detailed snapshot for a specific option contract
 * Includes pricing, volume, Greeks, and IV
 *
 * @param contractSymbol Full OCC contract symbol (e.g., 'O:AAPL251121C00170000')
 * @returns Contract details with Greeks or null on error
 */
export async function getContractSnapshot(
  contractSymbol: string
): Promise<OptionsContract | null> {
  const cacheKey = `polygon_contract_${contractSymbol}`;

  // Check cache (1-minute TTL for individual contracts)
  const cached = cache.get<OptionsContract>(cacheKey);
  if (cached) {
    logger.debug('Returning cached contract snapshot', { contractSymbol });
    return cached;
  }

  try {
    logger.debug('Fetching contract snapshot from Polygon.io', { contractSymbol });

    // Extract underlying ticker from contract symbol
    // Format: O:AAPL251121C00170000 -> AAPL
    const underlyingTicker = contractSymbol.split(':')[1]?.match(/^[A-Z]+/)?.[0];
    if (!underlyingTicker) {
      logger.error('Invalid contract symbol format', { contractSymbol });
      return null;
    }

    const snapshot = await polygon.options.snapshotOptionContract(
      underlyingTicker,
      contractSymbol
    );

    if (!snapshot.results) {
      logger.warn('No snapshot data returned', { contractSymbol });
      return null;
    }

    const data = snapshot.results;

    const contractData: OptionsContract = {
      strike: data.details?.strike_price || 0,
      lastPrice: data.day?.close || 0,
      bid: data.last_quote?.bid || 0,
      ask: data.last_quote?.ask || 0,
      change: data.day?.change || 0,
      percentChange: data.day?.change_percent || 0,
      volume: data.day?.volume || 0,
      openInterest: data.open_interest || 0,
      impliedVolatility: data.implied_volatility || 0,
      inTheMoney: data.details?.strike_price
        ? (data.details.contract_type === 'call'
            ? data.underlying_asset?.price > data.details.strike_price
            : data.underlying_asset?.price < data.details.strike_price)
        : false,
      contractSymbol: contractSymbol,
      lastTradeDate: data.day?.last_updated ? new Date(data.day.last_updated) : new Date(),
      // Greeks from Polygon
      delta: data.greeks?.delta,
      gamma: data.greeks?.gamma,
      theta: data.greeks?.theta,
      vega: data.greeks?.vega,
    };

    // Cache for 1 minute (more frequent updates for active trading)
    cache.set(cacheKey, contractData, 60 * 1000);

    logger.info('Contract snapshot fetched successfully', {
      contractSymbol,
      strike: contractData.strike,
      lastPrice: contractData.lastPrice,
      iv: contractData.impliedVolatility,
    });

    return contractData;
  } catch (error) {
    logger.error('Error fetching contract snapshot', error, { contractSymbol });

    // Try to return stale cached data
    const staleData = cache.get<OptionsContract>(cacheKey);
    if (staleData) {
      logger.info('Returning stale cached contract', { contractSymbol });
      return staleData;
    }

    return null;
  }
}

/**
 * Get historical IV data for IV Rank calculation
 * Returns IV values for the past 52 weeks
 *
 * @param ticker Underlying ticker symbol
 * @returns Array of {date, iv} objects or null on error
 */
export async function getHistoricalIV(
  ticker: string
): Promise<Array<{ date: Date; iv: number }> | null> {
  const cacheKey = `polygon_historical_iv_${ticker}`;

  // Check cache (24 hour TTL)
  const cached = cache.get<Array<{ date: Date; iv: number }>>(cacheKey);
  if (cached) {
    logger.debug('Returning cached historical IV', { ticker });
    return cached;
  }

  try {
    logger.debug('Fetching historical IV from Polygon.io', { ticker });

    // Calculate date range (52 weeks ago to today)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 365);

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    // Get ATM options snapshots for the past year
    // Note: This is a simplified approach. In production, you'd want to fetch
    // daily snapshots and calculate weighted average IV across strikes
    const response = await polygon.reference.optionsContracts({
      underlying_ticker: ticker.toUpperCase(),
      limit: 1000,
    });

    if (!response.results || response.results.length === 0) {
      logger.warn('No historical IV data available', { ticker });
      return null;
    }

    // For MVP, we'll use current IV as a placeholder
    // TODO: Implement proper historical IV fetching using aggregates
    logger.warn('Historical IV fetching not fully implemented - using current IV', { ticker });

    return null;
  } catch (error) {
    logger.error('Error fetching historical IV', error, { ticker });
    return null;
  }
}

/**
 * Calculate IV Rank (52-week percentile)
 *
 * @param currentIV Current implied volatility
 * @param historicalIV Array of historical IV values
 * @returns IV Rank as percentage (0-100)
 */
export function calculateIVRank(
  currentIV: number,
  historicalIV: Array<{ date: Date; iv: number }>
): number {
  if (!historicalIV || historicalIV.length === 0) {
    return 50; // Default to middle if no data
  }

  const ivValues = historicalIV.map((d) => d.iv).sort((a, b) => a - b);
  const rank = ivValues.filter((iv) => iv <= currentIV).length;
  return (rank / ivValues.length) * 100;
}

/**
 * Clear all cached data for a specific ticker
 */
export function clearPolygonCache(ticker: string): void {
  cache.clear(`polygon_expirations_${ticker}`);
  cache.clear(`polygon_historical_iv_${ticker}`);
  // Note: Can't clear all chain caches easily without tracking expirations
  logger.info('Polygon cache cleared', { ticker });
}
