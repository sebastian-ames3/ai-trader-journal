/**
 * Rate Limiting Utility
 *
 * Implements a sliding window rate limiter for API endpoints.
 * Uses in-memory storage (suitable for single-instance deployments).
 *
 * Usage:
 *   const limiter = createRateLimiter({ maxRequests: 10, windowMs: 60000 });
 *   const result = await limiter.check(identifier);
 *   if (!result.allowed) {
 *     return new Response('Too many requests', { status: 429 });
 *   }
 */

import { NextResponse } from 'next/server';

interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Window size in milliseconds */
  windowMs: number;
  /** Optional custom key prefix for namespacing */
  keyPrefix?: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfterMs: number;
}

interface WindowEntry {
  timestamps: number[];
  windowStart: number;
}

// In-memory storage for rate limit data
// In production with multiple instances, this would need Redis
const rateLimitStore = new Map<string, WindowEntry>();

// Cleanup old entries periodically (every 5 minutes)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredEntries(windowMs: number): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;

  lastCleanup = now;
  const cutoff = now - windowMs * 2; // Keep entries for 2x window for safety

  Array.from(rateLimitStore.entries()).forEach(([key, entry]) => {
    if (entry.windowStart < cutoff) {
      rateLimitStore.delete(key);
    }
  });
}

/**
 * Creates a rate limiter with the specified configuration
 */
export function createRateLimiter(config: RateLimitConfig) {
  const { maxRequests, windowMs, keyPrefix = '' } = config;

  return {
    /**
     * Check if a request is allowed for the given identifier
     * @param identifier - Unique identifier (usually user ID or IP)
     */
    check(identifier: string): RateLimitResult {
      const key = keyPrefix ? `${keyPrefix}:${identifier}` : identifier;
      const now = Date.now();

      // Cleanup periodically
      cleanupExpiredEntries(windowMs);

      // Get or create window entry
      let entry = rateLimitStore.get(key);
      if (!entry) {
        entry = { timestamps: [], windowStart: now };
        rateLimitStore.set(key, entry);
      }

      // Remove timestamps outside the current window
      const windowStart = now - windowMs;
      entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);
      entry.windowStart = Math.max(entry.windowStart, windowStart);

      // Check if request is allowed
      const currentCount = entry.timestamps.length;
      const remaining = Math.max(0, maxRequests - currentCount);
      const allowed = currentCount < maxRequests;

      if (allowed) {
        // Record this request
        entry.timestamps.push(now);
      }

      // Calculate reset time (when oldest request in window expires)
      const oldestTimestamp = entry.timestamps[0] || now;
      const resetAt = new Date(oldestTimestamp + windowMs);
      const retryAfterMs = allowed ? 0 : Math.ceil(oldestTimestamp + windowMs - now);

      return {
        allowed,
        remaining: allowed ? remaining - 1 : 0,
        resetAt,
        retryAfterMs,
      };
    },

    /**
     * Reset rate limit for an identifier (useful for testing)
     */
    reset(identifier: string): void {
      const key = keyPrefix ? `${keyPrefix}:${identifier}` : identifier;
      rateLimitStore.delete(key);
    },
  };
}

// Pre-configured rate limiters for different endpoints
export const rateLimiters = {
  /** Coach chat: 10 requests per minute */
  coachChat: createRateLimiter({
    maxRequests: 10,
    windowMs: 60 * 1000,
    keyPrefix: 'coach-chat',
  }),

  /** OCR processing: 5 requests per minute */
  ocr: createRateLimiter({
    maxRequests: 5,
    windowMs: 60 * 1000,
    keyPrefix: 'ocr',
  }),

  /** CSV import: 3 requests per minute */
  csvImport: createRateLimiter({
    maxRequests: 3,
    windowMs: 60 * 1000,
    keyPrefix: 'csv-import',
  }),

  /** AI analysis: 10 requests per minute */
  aiAnalysis: createRateLimiter({
    maxRequests: 10,
    windowMs: 60 * 1000,
    keyPrefix: 'ai-analysis',
  }),

  /** Trade extraction: 5 requests per minute */
  tradeExtraction: createRateLimiter({
    maxRequests: 5,
    windowMs: 60 * 1000,
    keyPrefix: 'trade-extraction',
  }),
};

/**
 * Helper to create a 429 response with proper headers
 */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  const retryAfterSeconds = Math.ceil(result.retryAfterMs / 1000);

  return NextResponse.json(
    {
      error: 'Too many requests',
      message: `Rate limit exceeded. Please wait ${retryAfterSeconds} seconds before trying again.`,
      retryAfter: retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSeconds),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': result.resetAt.toISOString(),
      },
    }
  );
}

/**
 * Middleware helper to apply rate limiting to an API route
 * Returns null if allowed, or a 429 response if rate limited
 */
export function checkRateLimit(
  limiter: ReturnType<typeof createRateLimiter>,
  identifier: string
): NextResponse | null {
  const result = limiter.check(identifier);

  if (!result.allowed) {
    return rateLimitResponse(result);
  }

  return null;
}
