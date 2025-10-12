const isDebug = process.env.DEBUG === '1' || process.env.NODE_ENV === 'development';

export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (isDebug) {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
    }
  },
  
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] ${message}`, ...args);
  },
  
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },
  
  error: (message: string, error?: Error, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, error?.stack || error, ...args);
  },
};