import { logger } from './logger';

const MIN_IV_PCT = 0.1;
const MAX_IV_PCT = 400;
const DEFAULT_TERM_DAYS = 30;

/**
 * Parse IV input string to percentage number
 * Accepts: "28", "28.5", "28.5%"
 * Returns: 28.5
 */
export function parseIvInput(input: string): number | null {
  const cleaned = input.trim().replace('%', '');
  const num = parseFloat(cleaned);
  
  if (isNaN(num)) {
    logger.debug('Invalid IV input', { input, cleaned });
    return null;
  }
  
  // Round to 2 decimals
  return Math.round(num * 100) / 100;
}

/**
 * Validate IV percentage is within acceptable range
 */
export function validateIvPct(ivPct: number): { valid: boolean; error?: string } {
  if (ivPct < MIN_IV_PCT || ivPct > MAX_IV_PCT) {
    return { 
      valid: false, 
      error: `IV must be between ${MIN_IV_PCT}% and ${MAX_IV_PCT}%` 
    };
  }
  return { valid: true };
}

/**
 * Convert percentage to decimal (28.5% -> 0.285)
 */
export function pctToDecimal(pct: number): number {
  return pct / 100;
}

/**
 * Convert decimal to percentage (0.285 -> 28.5%)
 */
export function decimalToPct(decimal: number): number {
  return Math.round(decimal * 10000) / 100;
}

/**
 * Normalize IV term days with default
 */
export function normalizeTermDays(days?: number): number {
  return days && days > 0 ? days : DEFAULT_TERM_DAYS;
}

/**
 * Format IV for display
 */
export function formatIvDisplay(ivPct: number, termDays?: number): string {
  const term = termDays && termDays !== DEFAULT_TERM_DAYS ? ` (${termDays}d)` : '';
  return `${ivPct.toFixed(1)}%${term}`;
}
