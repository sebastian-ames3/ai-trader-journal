/**
 * Standardized error response helpers.
 *
 * Provides consistent error shapes across all API routes:
 *   { error: string, message?: string, retryAfter?: number }
 *
 * Debug details are logged server-side but never leaked to clients
 * in production.
 */

import { NextResponse } from 'next/server';

interface ErrorResponseOptions {
  /** HTTP status code (default 500) */
  status?: number;
  /** Optional human-readable message (included in response) */
  message?: string;
  /** Internal details for server-side logging only */
  debugContext?: Record<string, unknown>;
}

/**
 * Create a standardized JSON error response.
 * Logs debug context server-side; only returns safe fields to client.
 */
export function errorResponse(
  error: string,
  options: ErrorResponseOptions = {}
): NextResponse {
  const { status = 500, message, debugContext } = options;

  if (debugContext) {
    console.error(`[API Error] ${error}:`, JSON.stringify(debugContext, null, 2));
  }

  const body: Record<string, unknown> = { error };
  if (message) body.message = message;

  return NextResponse.json(body, { status });
}

/**
 * Shorthand for 400 validation errors.
 */
export function validationError(error: string): NextResponse {
  return errorResponse(error, { status: 400 });
}
