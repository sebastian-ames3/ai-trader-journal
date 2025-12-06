/**
 * Market Data Service
 *
 * Fetches market data (SPY, VIX) for proactive engagement triggers.
 * Uses yfinance Python microservice or falls back to Yahoo Finance API.
 */

import { prisma } from '@/lib/prisma';
import { MarketState } from '@prisma/client';

// Market data types
export interface MarketQuote {
  ticker: string;
  price: number;
  change: number; // Percentage change
  volume?: number;
}

export interface MarketSnapshot {
  spy: MarketQuote;
  vix: MarketQuote;
  qqq?: MarketQuote;
  timestamp: Date;
}

// Thresholds for market condition triggers
export const MARKET_THRESHOLDS = {
  // SPY thresholds
  SPY_SIGNIFICANT_DOWN: -2.0, // -2% or more
  SPY_BIG_DOWN: -3.0, // -3% or more
  SPY_SIGNIFICANT_UP: 2.0, // +2% or more
  SPY_FLAT_LOW: -1.0, // -1% to +1% is flat
  SPY_FLAT_HIGH: 1.0,

  // VIX thresholds
  VIX_ELEVATED: 20,
  VIX_SPIKE: 25,
  VIX_EXTREME: 30,
  VIX_CHANGE_SPIKE: 20, // +20% day-over-day

  // User ticker thresholds
  TICKER_SIGNIFICANT_MOVE: 5, // ±5%
};

/**
 * Fetch quote from yfinance service
 */
async function fetchQuoteFromYFinance(ticker: string): Promise<MarketQuote | null> {
  const serviceUrl = process.env.OPTIONS_SERVICE_URL;

  if (!serviceUrl) {
    console.warn('OPTIONS_SERVICE_URL not configured');
    return null;
  }

  try {
    const response = await fetch(`${serviceUrl}/api/quote?ticker=${ticker}`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`yfinance service error: ${response.status}`);
    }

    const data = await response.json();

    return {
      ticker,
      price: data.price || data.regularMarketPrice,
      change: data.change || data.regularMarketChangePercent || 0,
      volume: data.volume || data.regularMarketVolume,
    };
  } catch (error) {
    console.error(`Failed to fetch ${ticker} from yfinance:`, error);
    return null;
  }
}

/**
 * Fetch quote from Yahoo Finance API directly (fallback)
 */
async function fetchQuoteFromYahoo(ticker: string): Promise<MarketQuote | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance error: ${response.status}`);
    }

    const data = await response.json();
    const quote = data.chart?.result?.[0]?.meta;

    if (!quote) {
      throw new Error('Invalid response format');
    }

    const price = quote.regularMarketPrice;
    const previousClose = quote.previousClose || quote.chartPreviousClose;
    const change = previousClose ? ((price - previousClose) / previousClose) * 100 : 0;

    return {
      ticker,
      price,
      change,
      volume: quote.regularMarketVolume,
    };
  } catch (error) {
    console.error(`Failed to fetch ${ticker} from Yahoo:`, error);
    return null;
  }
}

/**
 * Fetch market quote with fallback
 */
export async function fetchQuote(ticker: string): Promise<MarketQuote | null> {
  // Try yfinance service first
  let quote = await fetchQuoteFromYFinance(ticker);

  // Fall back to Yahoo Finance API
  if (!quote) {
    quote = await fetchQuoteFromYahoo(ticker);
  }

  return quote;
}

/**
 * Fetch current market snapshot (SPY, VIX, QQQ)
 */
export async function fetchMarketSnapshot(): Promise<MarketSnapshot | null> {
  const [spy, vix, qqq] = await Promise.all([
    fetchQuote('SPY'),
    fetchQuote('^VIX'),
    fetchQuote('QQQ'),
  ]);

  if (!spy || !vix) {
    console.error('Failed to fetch essential market data');
    return null;
  }

  return {
    spy,
    vix,
    qqq: qqq || undefined,
    timestamp: new Date(),
  };
}

/**
 * Classify market state based on SPY and VIX
 */
export function classifyMarketState(spy: MarketQuote, vix: MarketQuote): MarketState {
  const { SPY_FLAT_LOW, SPY_FLAT_HIGH, SPY_SIGNIFICANT_DOWN, VIX_SPIKE } = MARKET_THRESHOLDS;

  // Volatile if VIX is high or SPY moved significantly
  if (vix.price >= VIX_SPIKE || Math.abs(spy.change) >= Math.abs(SPY_SIGNIFICANT_DOWN)) {
    return 'VOLATILE';
  }

  // Up, down, or flat
  if (spy.change <= SPY_FLAT_LOW) {
    return 'DOWN';
  }

  if (spy.change >= SPY_FLAT_HIGH) {
    return 'UP';
  }

  return 'FLAT';
}

/**
 * Save market condition to database
 */
export async function saveMarketCondition(snapshot: MarketSnapshot): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const marketState = classifyMarketState(snapshot.spy, snapshot.vix);

  await prisma.marketCondition.upsert({
    where: { date: today },
    create: {
      date: today,
      spyPrice: snapshot.spy.price,
      spyChange: snapshot.spy.change,
      qqqPrice: snapshot.qqq?.price,
      qqqChange: snapshot.qqq?.change,
      vixLevel: snapshot.vix.price,
      vixChange: snapshot.vix.change,
      marketState,
    },
    update: {
      spyPrice: snapshot.spy.price,
      spyChange: snapshot.spy.change,
      qqqPrice: snapshot.qqq?.price,
      qqqChange: snapshot.qqq?.change,
      vixLevel: snapshot.vix.price,
      vixChange: snapshot.vix.change,
      marketState,
    },
  });
}

/**
 * Get the most recent market condition
 */
export async function getLatestMarketCondition() {
  return prisma.marketCondition.findFirst({
    orderBy: { date: 'desc' },
  });
}

/**
 * Check if market conditions warrant a notification
 */
export interface MarketTrigger {
  trigger: string;
  type: 'market_down' | 'market_down_big' | 'market_up' | 'vix_spike' | 'vix_elevated';
  spy: MarketQuote;
  vix: MarketQuote;
}

export function checkMarketTriggers(snapshot: MarketSnapshot): MarketTrigger | null {
  const { spy, vix } = snapshot;
  const { SPY_SIGNIFICANT_DOWN, SPY_BIG_DOWN, SPY_SIGNIFICANT_UP, VIX_SPIKE, VIX_ELEVATED } = MARKET_THRESHOLDS;

  // Check for significant market down
  if (spy.change <= SPY_BIG_DOWN) {
    return {
      trigger: `market_down_${Math.abs(spy.change).toFixed(0)}pct`,
      type: 'market_down_big',
      spy,
      vix,
    };
  }

  if (spy.change <= SPY_SIGNIFICANT_DOWN) {
    return {
      trigger: `market_down_${Math.abs(spy.change).toFixed(0)}pct`,
      type: 'market_down',
      spy,
      vix,
    };
  }

  // Check for VIX spike
  if (vix.price >= VIX_SPIKE) {
    return {
      trigger: `vix_spike_${vix.price.toFixed(0)}`,
      type: 'vix_spike',
      spy,
      vix,
    };
  }

  if (vix.price >= VIX_ELEVATED && vix.change >= 10) {
    return {
      trigger: `vix_elevated_${vix.price.toFixed(0)}`,
      type: 'vix_elevated',
      spy,
      vix,
    };
  }

  // Check for significant market up
  if (spy.change >= SPY_SIGNIFICANT_UP) {
    return {
      trigger: `market_up_${spy.change.toFixed(0)}pct`,
      type: 'market_up',
      spy,
      vix,
    };
  }

  return null;
}

/**
 * Check if we've already sent a notification for this trigger today
 */
export async function hasNotificationBeenSent(trigger: string): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.notificationLog.findFirst({
    where: {
      trigger,
      sentAt: { gte: today },
    },
  });

  return !!existing;
}

/**
 * Get days since last journal entry
 */
export async function getDaysSinceLastEntry(): Promise<number> {
  const lastEntry = await prisma.entry.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  if (!lastEntry) {
    return Infinity;
  }

  const now = new Date();
  const diffMs = now.getTime() - lastEntry.createdAt.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Get entries from this week for weekly review
 */
export async function getWeeklyEntryCount(): Promise<number> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  return prisma.entry.count({
    where: { createdAt: { gte: weekAgo } },
  });
}
