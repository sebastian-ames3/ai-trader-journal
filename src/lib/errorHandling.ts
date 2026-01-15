/**
 * Error Handling Utilities
 *
 * Provides error sanitization for production environments.
 * In production: logs full error server-side, returns generic message to client.
 * In development: returns full error for debugging.
 */

import { NextResponse } from 'next/server';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Standard API error response format
 */
export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: string;
}

/**
 * Error codes for common scenarios
 */
export const ErrorCodes = {
  // Client errors (4xx)
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // Server errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  AI_ERROR: 'AI_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * User-friendly error messages for production
 */
const productionMessages: Record<ErrorCode, string> = {
  [ErrorCodes.BAD_REQUEST]: 'Invalid request. Please check your input.',
  [ErrorCodes.UNAUTHORIZED]: 'Please sign in to continue.',
  [ErrorCodes.FORBIDDEN]: 'You do not have permission to perform this action.',
  [ErrorCodes.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorCodes.RATE_LIMITED]: 'Too many requests. Please wait a moment.',
  [ErrorCodes.PAYLOAD_TOO_LARGE]: 'The uploaded file is too large.',
  [ErrorCodes.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ErrorCodes.INTERNAL_ERROR]: 'Something went wrong. Please try again.',
  [ErrorCodes.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable. Please try again later.',
  [ErrorCodes.AI_ERROR]: 'AI service is temporarily unavailable. Please try again.',
  [ErrorCodes.DATABASE_ERROR]: 'Unable to save data. Please try again.',
};

/**
 * Sanitize an error for client response
 * In production: returns generic message, logs full error
 * In development: returns full error details
 */
export function sanitizeError(
  error: unknown,
  code: ErrorCode = ErrorCodes.INTERNAL_ERROR,
  context?: string
): ApiErrorResponse {
  // Extract error message
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Always log full error server-side
  console.error(`[${code}]${context ? ` ${context}:` : ''}`, {
    message: errorMessage,
    stack: isProduction ? undefined : errorStack,
  });

  // In production, return sanitized message
  if (isProduction) {
    return {
      error: productionMessages[code] || productionMessages[ErrorCodes.INTERNAL_ERROR],
      code,
    };
  }

  // In development, return full error for debugging
  return {
    error: errorMessage,
    code,
    details: errorStack?.split('\n').slice(0, 5).join('\n'),
  };
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: unknown,
  status: number = 500,
  code: ErrorCode = ErrorCodes.INTERNAL_ERROR,
  context?: string
): NextResponse {
  const sanitized = sanitizeError(error, code, context);
  return NextResponse.json(sanitized, { status });
}

/**
 * Handle common error patterns and return appropriate response
 */
export function handleApiError(error: unknown, context?: string): NextResponse {
  // Prisma errors
  if (isPrismaError(error)) {
    const prismaError = error as { code: string; meta?: Record<string, unknown> };

    switch (prismaError.code) {
      case 'P2002':
        return createErrorResponse(error, 409, ErrorCodes.VALIDATION_ERROR, context);
      case 'P2025':
        return createErrorResponse(error, 404, ErrorCodes.NOT_FOUND, context);
      default:
        return createErrorResponse(error, 500, ErrorCodes.DATABASE_ERROR, context);
    }
  }

  // Generic error handling
  if (error instanceof Error) {
    // Network/timeout errors
    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      return createErrorResponse(error, 504, ErrorCodes.SERVICE_UNAVAILABLE, context);
    }

    // Rate limit errors
    if (error.message.includes('rate') && error.message.includes('limit')) {
      return createErrorResponse(error, 429, ErrorCodes.RATE_LIMITED, context);
    }
  }

  // Default internal error
  return createErrorResponse(error, 500, ErrorCodes.INTERNAL_ERROR, context);
}

/**
 * Check if error is a Prisma error
 */
function isPrismaError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string' &&
    (error as { code: string }).code.startsWith('P')
  );
}

/**
 * Safe JSON stringify that handles circular references
 */
export function safeStringify(obj: unknown, maxLength: number = 1000): string {
  try {
    const seen = new WeakSet();
    const result = JSON.stringify(obj, (key, value) => {
      // Skip sensitive fields
      if (['password', 'token', 'apiKey', 'secret', 'authorization'].includes(key.toLowerCase())) {
        return '[REDACTED]';
      }

      // Handle circular references
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }

      return value;
    });

    // Truncate if too long
    if (result.length > maxLength) {
      return result.slice(0, maxLength) + '...[truncated]';
    }

    return result;
  } catch {
    return '[Unable to stringify]';
  }
}
