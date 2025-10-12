// lib/logger.ts
// Fixed version with proper TypeScript types

const isDebug = process.env.DEBUG === '1' || process.env.NODE_ENV === 'development';

export const logger = {
  debug: (message: string, data?: unknown) => {
    if (isDebug) {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, data);
    }
  },
  
  info: (message: string, data?: unknown) => {
    console.log(`[INFO] ${message}`, data);
  },
  
  warn: (message: string, data?: unknown) => {
    console.warn(`[WARN] ${message}`, data);
  },
  
  error: (message: string, error?: Error | unknown, data?: unknown) => {
    if (error instanceof Error) {
      console.error(`[ERROR] ${message}`, error.stack, data);
    } else {
      console.error(`[ERROR] ${message}`, error, data);
    }
  },
};

// Usage examples:
// logger.debug('Calculating HV for ticker', { ticker, days: 20 });
// logger.error('Failed to fetch market data', error);