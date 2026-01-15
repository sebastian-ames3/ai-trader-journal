/**
 * Client-Side Error Handling
 *
 * Provides user-friendly error messages for common API errors.
 * Used by frontend components to display appropriate error messages.
 */

/**
 * Common error types with user-friendly messages
 */
export const ErrorMessages = {
  // Network errors
  NETWORK_ERROR: 'Connection lost. Please check your internet and try again.',
  TIMEOUT: 'Request timed out. Please try again.',
  OFFLINE: 'You appear to be offline. Please check your connection.',

  // HTTP errors
  BAD_REQUEST: 'Invalid request. Please check your input.',
  UNAUTHORIZED: 'Please sign in to continue.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested item was not found.',
  RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
  PAYLOAD_TOO_LARGE: 'The file is too large. Please try a smaller file.',
  UNPROCESSABLE: 'Unable to process the request. Please check your input.',
  SERVER_ERROR: 'Something went wrong. Please try again.',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable. Please try again later.',

  // AI-specific errors
  AI_TIMEOUT: 'AI is taking longer than usual. Your data was saved.',
  AI_UNAVAILABLE: 'AI features are temporarily unavailable.',
  AI_RATE_LIMITED: 'AI request limit reached. Please wait a moment.',

  // File errors
  FILE_TOO_LARGE: 'File is too large. Maximum size is 5MB.',
  INVALID_FILE_TYPE: 'Invalid file type. Please upload a supported format.',
  UPLOAD_FAILED: 'Failed to upload file. Please try again.',

  // Generic
  UNKNOWN: 'An unexpected error occurred. Please try again.',
} as const;

/**
 * Map HTTP status codes to error messages
 */
const STATUS_CODE_MAP: Record<number, keyof typeof ErrorMessages> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  408: 'TIMEOUT',
  413: 'PAYLOAD_TOO_LARGE',
  422: 'UNPROCESSABLE',
  429: 'RATE_LIMITED',
  500: 'SERVER_ERROR',
  502: 'SERVER_ERROR',
  503: 'SERVICE_UNAVAILABLE',
  504: 'TIMEOUT',
};

/**
 * Parse an error and return a user-friendly message
 */
export function getErrorMessage(error: unknown): string {
  // Handle Response objects
  if (error instanceof Response) {
    const key = STATUS_CODE_MAP[error.status];
    return key ? ErrorMessages[key] : ErrorMessages.UNKNOWN;
  }

  // Handle error objects with status
  if (isErrorWithStatus(error)) {
    const key = STATUS_CODE_MAP[error.status];
    return key ? ErrorMessages[key] : ErrorMessages.UNKNOWN;
  }

  // Handle Error instances
  if (error instanceof Error) {
    // Network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return ErrorMessages.NETWORK_ERROR;
    }

    if (error.name === 'AbortError') {
      return ErrorMessages.TIMEOUT;
    }

    // Check for specific error messages
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('offline')) {
      return ErrorMessages.NETWORK_ERROR;
    }

    if (message.includes('timeout') || message.includes('etimedout')) {
      return ErrorMessages.TIMEOUT;
    }

    if (message.includes('rate') && message.includes('limit')) {
      return ErrorMessages.RATE_LIMITED;
    }

    // Return the error message if it's user-friendly (short and clean)
    if (error.message.length < 100 && !error.message.includes('Error:')) {
      return error.message;
    }
  }

  // Handle objects with error/message properties
  if (isObjectWithMessage(error)) {
    const message = error.error || error.message;
    if (typeof message === 'string' && message.length < 200) {
      return message;
    }
  }

  return ErrorMessages.UNKNOWN;
}

/**
 * Get error message with retry suggestion
 */
export function getErrorMessageWithRetry(error: unknown): {
  message: string;
  canRetry: boolean;
} {
  const message = getErrorMessage(error);

  // Determine if the error is retryable
  let canRetry = false;

  if (error instanceof Response) {
    canRetry = [408, 429, 500, 502, 503, 504].includes(error.status);
  } else if (isErrorWithStatus(error)) {
    canRetry = [408, 429, 500, 502, 503, 504].includes(error.status);
  } else if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    canRetry =
      msg.includes('network') ||
      msg.includes('timeout') ||
      msg.includes('unavailable');
  }

  return { message, canRetry };
}

/**
 * Format an API error response into a user-friendly message
 */
export async function formatApiError(response: Response): Promise<string> {
  try {
    const data = await response.json();

    // Use error message from response if available
    if (data.error && typeof data.error === 'string') {
      return data.error;
    }

    if (data.message && typeof data.message === 'string') {
      return data.message;
    }
  } catch {
    // JSON parsing failed, fall back to status-based message
  }

  const key = STATUS_CODE_MAP[response.status];
  return key ? ErrorMessages[key] : ErrorMessages.UNKNOWN;
}

// Type guards
function isErrorWithStatus(error: unknown): error is { status: number } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as { status: unknown }).status === 'number'
  );
}

function isObjectWithMessage(
  error: unknown
): error is { error?: string; message?: string } {
  return typeof error === 'object' && error !== null;
}
