/**
 * Simple in-memory cache with TTL support
 * Used for caching market data from Yahoo Finance
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class Cache {
  private store: Map<string, CacheEntry<unknown>> = new Map();

  /**
   * Get a value from the cache
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to store
   * @param ttl Time to live in milliseconds
   */
  set<T>(key: string, value: T, ttl: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  /**
   * Clear a specific key from the cache
   */
  clear(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clear all entries from the cache
   */
  clearAll(): void {
    this.store.clear();
  }

  /**
   * Get the number of entries in the cache
   */
  size(): number {
    return this.store.size;
  }
}

// Singleton cache instance
const cache = new Cache();
export default cache;
export { cache };

/**
 * Cache TTL constants (in milliseconds)
 */
export const CacheTTL = {
  ONE_MINUTE: 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  FIFTEEN_MINUTES: 15 * 60 * 1000,
  THIRTY_MINUTES: 30 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
} as const;

/**
 * Cache key generators for consistent key formatting
 */
export const CacheKeys = {
  // Market data
  priceHistory: (ticker: string, days: number) => `price_history_${ticker}_${days}`,
  tickerInfo: (ticker: string) => `ticker_info_${ticker}`,
  tickerSearch: (query: string) => `ticker_search_${query.toLowerCase()}`,
  quote: (ticker: string) => `quote_${ticker}`,
  optionsExpirations: (ticker: string) => `options_expirations_${ticker}`,
  optionsChain: (ticker: string, expiration: string) => `options_chain_${ticker}_${expiration}`,

  // OCR & Import (PRD-digitization-import)
  ocrResult: (imageHash: string) => `ocr_result_${imageHash}`,
  importPreview: (importToken: string) => `import_preview_${importToken}`,
} as const;

/**
 * Get the appropriate cache TTL for price data based on market hours
 * During market hours: 5 minutes
 * Outside market hours: 1 hour
 * Weekends: 24 hours
 */
export function getPriceCacheTTL(): number {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const time = hour * 60 + minute;

  // Weekend (Saturday = 6, Sunday = 0)
  if (day === 0 || day === 6) {
    return CacheTTL.ONE_DAY;
  }

  // Market hours: 9:30 AM - 4:00 PM ET (assuming local time is ET)
  const marketOpen = 9 * 60 + 30; // 9:30 AM
  const marketClose = 16 * 60; // 4:00 PM

  if (time >= marketOpen && time <= marketClose) {
    return CacheTTL.FIVE_MINUTES;
  }

  // Outside market hours
  return CacheTTL.ONE_HOUR;
}
