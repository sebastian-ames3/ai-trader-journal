import { logger } from './logger';

/**
 * Simple in-memory cache with TTL (Time To Live)
 *
 * Cache Strategy:
 * - Price data: 1 hour during market hours, 24 hours outside market hours
 * - Ticker info: 24 hours
 * - Search results: 1 hour
 */

interface CacheEntry<T> {
  data: T;
  expiry: number;
  createdAt: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private maxSize = 1000; // Prevent memory overflow

  /**
   * Get cached data if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      logger.debug('Cache miss', { key });
      return null;
    }

    const now = Date.now();
    if (now > entry.expiry) {
      logger.debug('Cache expired', { key, age: now - entry.createdAt });
      this.cache.delete(key);
      return null;
    }

    logger.debug('Cache hit', { key, age: now - entry.createdAt });
    return entry.data as T;
  }

  /**
   * Set cached data with TTL in milliseconds
   */
  set<T>(key: string, data: T, ttlMs: number): void {
    // Enforce max cache size (simple LRU: delete oldest)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
        logger.debug('Cache eviction', { evictedKey: firstKey });
      }
    }

    const now = Date.now();
    this.cache.set(key, {
      data,
      expiry: now + ttlMs,
      createdAt: now
    });

    logger.debug('Cache set', { key, ttlMs, expiresAt: new Date(now + ttlMs).toISOString() });
  }

  /**
   * Clear specific key or entire cache
   */
  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
      logger.debug('Cache cleared', { key });
    } else {
      this.cache.clear();
      logger.debug('Cache cleared', { all: true });
    }
  }

  /**
   * Get cache statistics
   */
  stats() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    const expired = entries.filter(([, entry]) => now > entry.expiry).length;

    return {
      size: this.cache.size,
      expired,
      valid: this.cache.size - expired
    };
  }
}

// Singleton instance
const cache = new SimpleCache();

/**
 * Cache TTL helpers
 */
export const CacheTTL = {
  ONE_MINUTE: 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  SIX_HOURS: 6 * 60 * 60 * 1000,
  TWELVE_HOURS: 12 * 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
};

/**
 * Check if current time is during US market hours
 * Market hours: 9:30 AM - 4:00 PM ET, Monday-Friday
 */
export function isDuringMarketHours(): boolean {
  const now = new Date();

  // Convert to ET (UTC-5 or UTC-4 for DST)
  // Simple approximation: use UTC-5
  const etHours = (now.getUTCHours() - 5 + 24) % 24;
  const etMinutes = now.getUTCMinutes();
  const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 6 = Saturday

  // Check if weekend
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }

  // Check if within 9:30 AM - 4:00 PM ET
  const currentMinutes = etHours * 60 + etMinutes;
  const marketOpen = 9 * 60 + 30; // 9:30 AM
  const marketClose = 16 * 60; // 4:00 PM

  return currentMinutes >= marketOpen && currentMinutes < marketClose;
}

/**
 * Get appropriate TTL for price data based on market hours
 */
export function getPriceCacheTTL(): number {
  if (isDuringMarketHours()) {
    return CacheTTL.ONE_HOUR;
  } else {
    return CacheTTL.ONE_DAY;
  }
}

/**
 * Cache key generators
 */
export const CacheKeys = {
  priceHistory: (ticker: string, days: number) => `price:${ticker}:${days}`,
  tickerInfo: (ticker: string) => `ticker:${ticker}`,
  tickerSearch: (query: string) => `search:${query.toLowerCase()}`,
  quote: (ticker: string) => `quote:${ticker}`,
};

export default cache;
