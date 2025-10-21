import { logger } from './logger';

/**
 * Calculate Historical Volatility using close-to-close log returns
 * Formula: HV = stdev(ln(P_t/P_{t-1})) * sqrt(252) * 100
 * 
 * @param closes Array of closing prices (oldest to newest)
 * @returns HV as percentage, or null if insufficient data
 */
export function calculateHV(closes: number[]): number | null {
  logger.debug('calculateHV input', { priceCount: closes.length });

  // Need at least 2 prices to calculate returns
  if (!closes || closes.length < 2) {
    logger.warn('calculateHV: insufficient data', { count: closes.length });
    return null;
  }

  // Validate all prices are positive numbers
  const invalidPrices = closes.filter(p => !isFinite(p) || p <= 0);
  if (invalidPrices.length > 0) {
    logger.error('calculateHV: invalid prices detected', { invalidPrices });
    return null;
  }

  // Calculate log returns: ln(P_t / P_{t-1})
  const logReturns: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const logReturn = Math.log(closes[i] / closes[i - 1]);
    logReturns.push(logReturn);
  }

  logger.debug('calculateHV log returns', { 
    count: logReturns.length,
    sample: logReturns.slice(0, 3).map(r => r.toFixed(6))
  });

  // Calculate standard deviation
  const mean = logReturns.reduce((sum, r) => sum + r, 0) / logReturns.length;
  const squaredDiffs = logReturns.map(r => Math.pow(r - mean, 2));
  const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / (logReturns.length - 1);
  const stdev = Math.sqrt(variance);

  // Annualize: multiply by sqrt(252) for trading days
  const annualizedVol = stdev * Math.sqrt(252);
  
  // Convert to percentage
  const hvPercent = annualizedVol * 100;

  logger.debug('calculateHV result', {
    mean: mean.toFixed(6),
    stdev: stdev.toFixed(6),
    annualized: annualizedVol.toFixed(4),
    hvPercent: hvPercent.toFixed(2)
  });

  return hvPercent;
}

/**
 * Calculate both HV20 and HV30 from price data
 */
export interface HVResult {
  hv20: number | null;
  hv30: number | null;
  dataPoints: number;
  calculatedAt: Date;
}

export function calculateHVMetrics(closes: number[]): HVResult {
  const result: HVResult = {
    hv20: null,
    hv30: null,
    dataPoints: closes.length,
    calculatedAt: new Date()
  };

  // Calculate HV20 (last 20 days)
  if (closes.length >= 20) {
    const last20 = closes.slice(-20);
    result.hv20 = calculateHV(last20);
  }

  // Calculate HV30 (last 30 days)
  if (closes.length >= 30) {
    const last30 = closes.slice(-30);
    result.hv30 = calculateHV(last30);
  }

  logger.debug('calculateHVMetrics result', result);
  return result;
}