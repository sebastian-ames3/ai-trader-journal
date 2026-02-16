/**
 * Rate Limiting Utility
 *
 * Uses Upstash Redis in production (when UPSTASH_REDIS_REST_URL is set),
 * falls back to in-memory storage for local development.
 *
 * Usage:
 *   const limiter = createRateLimiter({ maxRequests: 10, windowMs: 60000 });
 *   const result = await limiter.check(identifier);
 *   if (!result.allowed) {
 *     return rateLimitResponse(result);
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

// ---------------------------------------------------------------------------
// In-memory fallback (local dev / missing env vars)
// ---------------------------------------------------------------------------

interface WindowEntry {
  timestamps: number[];
  windowStart: number;
}

const rateLimitStore = new Map<string, WindowEntry>();
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredEntries(windowMs: number): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  const cutoff = now - windowMs * 2;
  Array.from(rateLimitStore.entries()).forEach(([key, entry]) => {
    if (entry.windowStart < cutoff) rateLimitStore.delete(key);
  });
}

function inMemoryCheck(key: string, maxRequests: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  cleanupExpiredEntries(windowMs);

  let entry = rateLimitStore.get(key);
  if (!entry) {
    entry = { timestamps: [], windowStart: now };
    rateLimitStore.set(key, entry);
  }

  const windowStart = now - windowMs;
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);
  entry.windowStart = Math.max(entry.windowStart, windowStart);

  const currentCount = entry.timestamps.length;
  const remaining = Math.max(0, maxRequests - currentCount);
  const allowed = currentCount < maxRequests;

  if (allowed) entry.timestamps.push(now);

  const oldestTimestamp = entry.timestamps[0] || now;
  const resetAt = new Date(oldestTimestamp + windowMs);
  const retryAfterMs = allowed ? 0 : Math.ceil(oldestTimestamp + windowMs - now);

  return { allowed, remaining: allowed ? remaining - 1 : 0, resetAt, retryAfterMs };
}

// ---------------------------------------------------------------------------
// Upstash Redis adapter (production)
// ---------------------------------------------------------------------------

let upstashLimiters: Map<string, InstanceType<typeof import('@upstash/ratelimit').Ratelimit>> | null = null;

function isUpstashConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

async function getUpstashLimiter(
  keyPrefix: string,
  maxRequests: number,
  windowMs: number
): Promise<InstanceType<typeof import('@upstash/ratelimit').Ratelimit>> {
  if (!upstashLimiters) upstashLimiters = new Map();

  const existing = upstashLimiters.get(keyPrefix);
  if (existing) return existing;

  // Dynamic import to avoid errors when packages aren't available
  const { Ratelimit } = await import('@upstash/ratelimit');
  const { Redis } = await import('@upstash/redis');

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  const windowSeconds = Math.ceil(windowMs / 1000);
  const duration = `${windowSeconds} s` as Parameters<typeof Ratelimit.slidingWindow>[1];

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(maxRequests, duration),
    prefix: `rl:${keyPrefix}`,
  });

  upstashLimiters.set(keyPrefix, limiter);
  return limiter;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Creates a rate limiter with the specified configuration.
 * Uses Upstash Redis when configured, in-memory otherwise.
 */
export function createRateLimiter(config: RateLimitConfig) {
  const { maxRequests, windowMs, keyPrefix = '' } = config;

  return {
    async check(identifier: string): Promise<RateLimitResult> {
      const key = keyPrefix ? `${keyPrefix}:${identifier}` : identifier;

      if (isUpstashConfigured()) {
        try {
          const limiter = await getUpstashLimiter(keyPrefix || 'default', maxRequests, windowMs);
          const result = await limiter.limit(key);

          return {
            allowed: result.success,
            remaining: result.remaining,
            resetAt: new Date(result.reset),
            retryAfterMs: result.success ? 0 : Math.max(0, result.reset - Date.now()),
          };
        } catch (error) {
          // Fall back to in-memory if Upstash fails
          console.warn('[RateLimit] Upstash error, falling back to in-memory:', error);
          return inMemoryCheck(key, maxRequests, windowMs);
        }
      }

      return inMemoryCheck(key, maxRequests, windowMs);
    },

    reset(identifier: string): void {
      const key = keyPrefix ? `${keyPrefix}:${identifier}` : identifier;
      rateLimitStore.delete(key);
    },
  };
}

// Pre-configured rate limiters for different endpoints
export const rateLimiters = {
  coachChat: createRateLimiter({ maxRequests: 10, windowMs: 60 * 1000, keyPrefix: 'coach-chat' }),
  ocr: createRateLimiter({ maxRequests: 5, windowMs: 60 * 1000, keyPrefix: 'ocr' }),
  csvImport: createRateLimiter({ maxRequests: 3, windowMs: 60 * 1000, keyPrefix: 'csv-import' }),
  aiAnalysis: createRateLimiter({ maxRequests: 10, windowMs: 60 * 1000, keyPrefix: 'ai-analysis' }),
  tradeExtraction: createRateLimiter({ maxRequests: 5, windowMs: 60 * 1000, keyPrefix: 'trade-extraction' }),
  entryCreate: createRateLimiter({ maxRequests: 30, windowMs: 60 * 1000, keyPrefix: 'entry-create' }),
  imageUpload: createRateLimiter({ maxRequests: 10, windowMs: 60 * 1000, keyPrefix: 'image-upload' }),
  audioUpload: createRateLimiter({ maxRequests: 5, windowMs: 60 * 1000, keyPrefix: 'audio-upload' }),
  transcribe: createRateLimiter({ maxRequests: 5, windowMs: 60 * 1000, keyPrefix: 'transcribe' }),
  imageAnalysis: createRateLimiter({ maxRequests: 5, windowMs: 60 * 1000, keyPrefix: 'image-analysis' }),
  search: createRateLimiter({ maxRequests: 20, windowMs: 60 * 1000, keyPrefix: 'search' }),
  shareCreate: createRateLimiter({ maxRequests: 10, windowMs: 60 * 1000, keyPrefix: 'share-create' }),
  export: createRateLimiter({ maxRequests: 5, windowMs: 60 * 1000, keyPrefix: 'export' }),
  infer: createRateLimiter({ maxRequests: 15, windowMs: 60 * 1000, keyPrefix: 'infer' }),
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
 * Middleware helper to apply rate limiting to an API route.
 * Now async — all call sites must use `await`.
 */
export async function checkRateLimit(
  limiter: ReturnType<typeof createRateLimiter>,
  identifier: string
): Promise<NextResponse | null> {
  const result = await limiter.check(identifier);

  if (!result.allowed) {
    return rateLimitResponse(result);
  }

  return null;
}
