/**
 * Fetch With Retry
 *
 * Provides a fetch wrapper with automatic retry on transient failures.
 * Implements exponential backoff for retries.
 */

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial backoff delay in ms (default: 1000) */
  backoffMs?: number;
  /** HTTP status codes to retry on (default: [500, 502, 503, 504, 429]) */
  retryOn?: number[];
  /** Callback when retrying (optional) */
  onRetry?: (attempt: number, error: Error | Response, delayMs: number) => void;
  /** AbortSignal for cancellation (optional) */
  signal?: AbortSignal;
}

const DEFAULT_RETRY_OPTIONS: Required<Omit<RetryOptions, 'onRetry' | 'signal'>> = {
  maxRetries: 3,
  backoffMs: 1000,
  retryOn: [500, 502, 503, 504, 429],
};

/**
 * Fetch with automatic retry on transient failures
 *
 * @example
 * const response = await fetchWithRetry('/api/coach/chat', {
 *   method: 'POST',
 *   body: JSON.stringify({ message }),
 *   headers: { 'Content-Type': 'application/json' },
 * }, {
 *   maxRetries: 3,
 *   onRetry: (attempt, error, delayMs) => {
 *     console.log(`Retry ${attempt} in ${delayMs}ms...`);
 *   }
 * });
 */
export async function fetchWithRetry(
  url: string | URL | Request,
  init?: RequestInit,
  options?: RetryOptions
): Promise<Response> {
  const {
    maxRetries,
    backoffMs,
    retryOn,
  } = { ...DEFAULT_RETRY_OPTIONS, ...options };

  const { onRetry, signal } = options || {};

  let lastError: Error | null = null;
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Check if cancelled
    if (signal?.aborted) {
      throw new DOMException('Request aborted', 'AbortError');
    }

    try {
      const response = await fetch(url, {
        ...init,
        signal,
      });

      // Check if we should retry based on status code
      if (retryOn.includes(response.status) && attempt < maxRetries) {
        lastResponse = response;

        // Calculate delay with exponential backoff
        // For 429, respect Retry-After header if present
        let delayMs = backoffMs * Math.pow(2, attempt);

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          if (retryAfter) {
            const retryAfterSeconds = parseInt(retryAfter, 10);
            if (!isNaN(retryAfterSeconds)) {
              delayMs = Math.max(delayMs, retryAfterSeconds * 1000);
            }
          }
        }

        // Add jitter to prevent thundering herd
        delayMs = delayMs + Math.random() * 500;

        // Notify of retry
        onRetry?.(attempt + 1, response, Math.round(delayMs));

        // Wait before retry
        await sleep(delayMs);
        continue;
      }

      return response;
    } catch (error) {
      // Don't retry on abort
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error;
      }

      lastError = error instanceof Error ? error : new Error(String(error));

      // Retry on network errors
      if (attempt < maxRetries) {
        const delayMs = backoffMs * Math.pow(2, attempt) + Math.random() * 500;
        onRetry?.(attempt + 1, lastError, Math.round(delayMs));
        await sleep(delayMs);
        continue;
      }
    }
  }

  // All retries exhausted
  if (lastResponse) {
    return lastResponse;
  }

  throw lastError || new Error('Fetch failed after all retries');
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a fetch function with default retry options
 */
export function createRetryingFetch(defaultOptions: RetryOptions) {
  return (url: string | URL | Request, init?: RequestInit, options?: RetryOptions) =>
    fetchWithRetry(url, init, { ...defaultOptions, ...options });
}

/**
 * Pre-configured fetch for AI endpoints (more retries, longer backoff)
 */
export const fetchAI = createRetryingFetch({
  maxRetries: 3,
  backoffMs: 2000,
  retryOn: [500, 502, 503, 504, 529], // 529 is Cloudflare's "Site is overloaded"
});

/**
 * Pre-configured fetch for standard API calls
 */
export const fetchAPI = createRetryingFetch({
  maxRetries: 2,
  backoffMs: 1000,
  retryOn: [500, 502, 503, 504],
});
