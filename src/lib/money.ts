/**
 * Money Utilities
 *
 * Provides precise decimal arithmetic for financial calculations.
 * Avoids floating point precision issues with currency values.
 */

/**
 * Round a number to specified decimal places
 * Uses banker's rounding (round half to even) for financial accuracy
 */
export function round(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  // Use toFixed to avoid floating point issues, then parse back
  return Number((Math.round(value * factor) / factor).toFixed(decimals));
}

/**
 * Add two monetary values with precision handling
 */
export function addMoney(a: number, b: number): number {
  return round(a + b, 2);
}

/**
 * Subtract two monetary values with precision handling
 */
export function subtractMoney(a: number, b: number): number {
  return round(a - b, 2);
}

/**
 * Sum an array of monetary values with precision handling
 */
export function sumMoney(values: (number | null | undefined)[]): number {
  const total = values.reduce<number>((sum, value) => {
    if (value === null || value === undefined) return sum;
    return sum + value;
  }, 0);
  return round(total, 2);
}

/**
 * Calculate percentage with precision handling
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return round((value / total) * 100, 2);
}

/**
 * Format money for display with proper sign
 */
export function formatMoney(
  value: number,
  options: {
    currency?: string;
    showSign?: boolean;
    compact?: boolean;
  } = {}
): string {
  const { currency = 'USD', showSign = false, compact = false } = options;

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(Math.abs(value));

  if (value === 0) {
    return formatted;
  }

  if (showSign) {
    return value > 0 ? `+${formatted}` : `-${formatted}`;
  }

  return value < 0 ? `-${formatted}` : formatted;
}

/**
 * Format percentage for display
 */
export function formatPercent(
  value: number,
  options: {
    showSign?: boolean;
    decimals?: number;
  } = {}
): string {
  const { showSign = false, decimals = 2 } = options;
  const formatted = `${Math.abs(value).toFixed(decimals)}%`;

  if (value === 0) {
    return formatted;
  }

  if (showSign) {
    return value > 0 ? `+${formatted}` : `-${formatted}`;
  }

  return value < 0 ? `-${formatted}` : formatted;
}

/**
 * Parse a money string to number
 * Handles formats like "$1,234.56", "-$100", "+$50.00"
 */
export function parseMoney(value: string): number | null {
  if (!value || typeof value !== 'string') return null;

  // Remove currency symbols, commas, and whitespace
  const cleaned = value.replace(/[$,\s]/g, '').trim();

  if (!cleaned) return null;

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : round(parsed, 2);
}

/**
 * Compare two money values for equality
 * (accounts for floating point precision)
 */
export function moneyEquals(a: number, b: number, epsilon: number = 0.005): boolean {
  return Math.abs(a - b) < epsilon;
}

/**
 * Calculate P/L from trades
 * Uses precise summing to avoid floating point errors
 */
export function calculateTotalPL(
  trades: Array<{ realizedPL: number | null }>
): number {
  return sumMoney(trades.map((t) => t.realizedPL));
}

/**
 * Calculate total capital deployed (sum of debits)
 * Debits are represented as negative debitCredit values
 */
export function calculateCapitalDeployed(
  trades: Array<{ debitCredit: number }>
): number {
  const debits = trades
    .filter((t) => t.debitCredit < 0)
    .map((t) => Math.abs(t.debitCredit));
  return sumMoney(debits);
}
