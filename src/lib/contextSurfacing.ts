/**
 * Context Surfacing Service
 *
 * Detects tickers and strategies in entries, fetches relevant market data,
 * and surfaces user's historical entries and insights.
 */

import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Common false positives for ticker detection
const FALSE_POSITIVE_TICKERS = [
  'I', 'A', 'IT', 'AI', 'TV', 'CEO', 'IPO', 'ETF', 'ATH', 'ATL',
  'PM', 'AM', 'THE', 'AND', 'FOR', 'ALL', 'NEW', 'NOW', 'LOW',
  'HIGH', 'UP', 'DOWN', 'BUY', 'SELL', 'PUT', 'CALL', 'IV', 'HV',
  'DTE', 'OTM', 'ITM', 'ATM', 'BE', 'GO', 'ON', 'IN', 'TO', 'BY',
  'US', 'UK', 'EU', 'USD', 'EUR', 'JPY', 'GBP', 'CAD', 'AUD',
];

// Known options strategies for detection
const KNOWN_STRATEGIES = [
  'iron condor', 'iron butterfly', 'vertical spread', 'calendar spread',
  'diagonal spread', 'straddle', 'strangle', 'covered call', 'cash secured put',
  'wheel strategy', 'butterfly', 'ratio spread', 'credit spread', 'debit spread',
  'bull put spread', 'bear call spread', 'bull call spread', 'bear put spread',
  'collar', 'protective put', 'married put', 'poor mans covered call',
];

// Types
export interface TickerContext {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  high52w?: number;
  low52w?: number;
  iv?: number;
  hv20?: number;
  ivRank?: number;
  ivPremium?: number;
}

export interface TickerHistory {
  ticker: string;
  entryCount: number;
  firstMentioned: Date | null;
  lastMentioned: Date | null;
  sentimentTrend: 'bullish' | 'bearish' | 'neutral' | 'mixed';
  commonBiases: Array<{ bias: string; count: number }>;
  convictionDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  recentEntries: Array<{
    id: string;
    content: string;
    createdAt: Date;
    sentiment: string | null;
    conviction: string | null;
  }>;
}

export interface StrategyHistory {
  strategy: string;
  entryCount: number;
  avgConviction: number;
  commonTickers: string[];
  outcomes?: {
    wins: number;
    losses: number;
    winRate: number;
  };
}

export interface FullTickerContext {
  market: TickerContext | null;
  history: TickerHistory;
  insight: string | null;
}

/**
 * Detect ticker symbols in text content
 */
export async function detectTickers(content: string): Promise<string[]> {
  // Regex to match potential tickers ($AAPL or AAPL)
  const regexMatches = content.match(/\$?[A-Z]{1,5}\b/g) || [];
  const potentialTickers = Array.from(new Set(regexMatches.map((t) => t.replace('$', ''))));

  // Filter out common false positives
  const filtered = potentialTickers.filter(
    (t) => !FALSE_POSITIVE_TICKERS.includes(t) && t.length >= 2
  );

  if (filtered.length === 0) {
    return [];
  }

  // Use GPT to validate if these are actual tickers
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `Which of these are valid US stock tickers? Return ONLY the valid tickers as a JSON array.
Candidates: ${filtered.join(', ')}
Context: "${content.substring(0, 300)}"

Return format: { "tickers": ["AAPL", "MSFT"] }`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 100,
      temperature: 0,
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');
    return result.tickers || [];
  } catch (error) {
    console.error('Ticker validation error:', error);
    // Fall back to filtered list
    return filtered.slice(0, 5);
  }
}

/**
 * Detect options strategy in text content
 */
export function detectStrategy(content: string): string | null {
  const lowerContent = content.toLowerCase();

  for (const strategy of KNOWN_STRATEGIES) {
    if (lowerContent.includes(strategy)) {
      return strategy;
    }
  }

  return null;
}

/**
 * Fetch market data for a ticker from yfinance service
 */
export async function getTickerMarketData(ticker: string): Promise<TickerContext | null> {
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
      throw new Error(`Failed to fetch quote: ${response.status}`);
    }

    const data = await response.json();

    return {
      ticker,
      price: data.price || data.regularMarketPrice || 0,
      change: data.change || 0,
      changePercent: data.changePercent || data.regularMarketChangePercent || 0,
      volume: data.volume || data.regularMarketVolume,
      high52w: data.fiftyTwoWeekHigh,
      low52w: data.fiftyTwoWeekLow,
      iv: data.impliedVolatility,
      hv20: data.hv20,
      ivRank: data.ivRank,
      ivPremium: data.impliedVolatility && data.hv20
        ? data.impliedVolatility - data.hv20
        : undefined,
    };
  } catch (error) {
    console.error(`Failed to fetch market data for ${ticker}:`, error);
    return null;
  }
}

/**
 * Get user's historical entries for a ticker
 */
export async function getTickerHistory(ticker: string): Promise<TickerHistory> {
  // Find entries that mention this ticker
  const entries = await prisma.entry.findMany({
    where: {
      OR: [
        { ticker: { equals: ticker, mode: 'insensitive' } },
        { content: { contains: ticker, mode: 'insensitive' } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      content: true,
      createdAt: true,
      sentiment: true,
      conviction: true,
      detectedBiases: true,
    },
  });

  if (entries.length === 0) {
    return {
      ticker,
      entryCount: 0,
      firstMentioned: null,
      lastMentioned: null,
      sentimentTrend: 'neutral',
      commonBiases: [],
      convictionDistribution: { high: 0, medium: 0, low: 0 },
      recentEntries: [],
    };
  }

  // Aggregate sentiment
  const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
  const biasCounts: Record<string, number> = {};
  const convictionCounts = { HIGH: 0, MEDIUM: 0, LOW: 0 };

  for (const entry of entries) {
    if (entry.sentiment) {
      sentimentCounts[entry.sentiment as keyof typeof sentimentCounts]++;
    }
    if (entry.conviction) {
      convictionCounts[entry.conviction as keyof typeof convictionCounts]++;
    }
    for (const bias of entry.detectedBiases || []) {
      biasCounts[bias] = (biasCounts[bias] || 0) + 1;
    }
  }

  // Calculate sentiment trend
  let sentimentTrend: TickerHistory['sentimentTrend'] = 'neutral';
  const totalSentiments = sentimentCounts.positive + sentimentCounts.negative + sentimentCounts.neutral;

  if (totalSentiments > 0) {
    if (sentimentCounts.positive > sentimentCounts.negative * 1.5) {
      sentimentTrend = 'bullish';
    } else if (sentimentCounts.negative > sentimentCounts.positive * 1.5) {
      sentimentTrend = 'bearish';
    } else if (sentimentCounts.positive > 0 && sentimentCounts.negative > 0) {
      sentimentTrend = 'mixed';
    }
  }

  return {
    ticker,
    entryCount: entries.length,
    firstMentioned: entries[entries.length - 1]?.createdAt || null,
    lastMentioned: entries[0]?.createdAt || null,
    sentimentTrend,
    commonBiases: Object.entries(biasCounts)
      .map(([bias, count]) => ({ bias, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    convictionDistribution: {
      high: convictionCounts.HIGH,
      medium: convictionCounts.MEDIUM,
      low: convictionCounts.LOW,
    },
    recentEntries: entries.slice(0, 3).map((e) => ({
      id: e.id,
      content: e.content.substring(0, 200),
      createdAt: e.createdAt,
      sentiment: e.sentiment,
      conviction: e.conviction,
    })),
  };
}

/**
 * Get strategy history
 */
export async function getStrategyHistory(strategy: string): Promise<StrategyHistory> {
  // Find entries mentioning this strategy
  const entries = await prisma.entry.findMany({
    where: {
      content: { contains: strategy, mode: 'insensitive' },
    },
    select: {
      conviction: true,
      ticker: true,
    },
  });

  // Count tickers used with this strategy
  const tickerCounts: Record<string, number> = {};
  let convictionSum = 0;
  let convictionCount = 0;

  for (const entry of entries) {
    if (entry.ticker) {
      tickerCounts[entry.ticker] = (tickerCounts[entry.ticker] || 0) + 1;
    }
    if (entry.conviction) {
      convictionSum += entry.conviction === 'HIGH' ? 3 : entry.conviction === 'MEDIUM' ? 2 : 1;
      convictionCount++;
    }
  }

  const commonTickers = Object.entries(tickerCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([ticker]) => ticker);

  return {
    strategy,
    entryCount: entries.length,
    avgConviction: convictionCount > 0 ? convictionSum / convictionCount : 0,
    commonTickers,
  };
}

/**
 * Generate a smart insight for the ticker based on history
 */
export async function generateTickerInsight(
  ticker: string,
  marketData: TickerContext | null,
  history: TickerHistory
): Promise<string | null> {
  // Need some history to generate insight
  if (history.entryCount < 2) {
    return null;
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Use flagship for nuanced insights
      messages: [
        {
          role: 'system',
          content: `Generate a brief, actionable insight for a trader journaling about a stock.
Be specific and reference their history. Max 2 sentences. Be empathetic but direct.`,
        },
        {
          role: 'user',
          content: `Ticker: ${ticker}
Current price: ${marketData ? `$${marketData.price.toFixed(2)} (${marketData.changePercent >= 0 ? '+' : ''}${marketData.changePercent.toFixed(1)}%)` : 'unknown'}

User's history with this ticker:
- ${history.entryCount} entries
- Sentiment trend: ${history.sentimentTrend}
- Most common bias: ${history.commonBiases[0]?.bias || 'none'}

Recent entries:
${history.recentEntries
  .map(
    (e) =>
      `- ${e.createdAt.toLocaleDateString()}: "${e.content.substring(0, 100)}..." (${e.sentiment || 'no sentiment'})`
  )
  .join('\n')}`,
        },
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || null;
  } catch (error) {
    console.error('Failed to generate ticker insight:', error);
    return null;
  }
}

/**
 * Get full context for a ticker
 */
export async function getFullTickerContext(ticker: string): Promise<FullTickerContext> {
  // Fetch market data and history in parallel
  const [market, history] = await Promise.all([
    getTickerMarketData(ticker),
    getTickerHistory(ticker),
  ]);

  // Generate insight if there's enough history
  const insight = await generateTickerInsight(ticker, market, history);

  return {
    market,
    history,
    insight,
  };
}

/**
 * Track a ticker mention in an entry
 */
export async function trackTickerMention(
  ticker: string,
  entryId: string
): Promise<void> {
  await prisma.tickerMention.upsert({
    where: {
      id: `${ticker}-${entryId}`,
    },
    create: {
      ticker: ticker.toUpperCase(),
      entryId,
    },
    update: {},
  });
}

/**
 * Save a market snapshot for historical context
 */
export async function saveMarketSnapshot(
  ticker: string,
  data: TickerContext
): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.marketSnapshot.upsert({
    where: {
      ticker_date: {
        ticker: ticker.toUpperCase(),
        date: today,
      },
    },
    create: {
      ticker: ticker.toUpperCase(),
      date: today,
      price: data.price,
      change: data.changePercent,
      volume: data.volume,
      iv: data.iv,
      hv20: data.hv20,
      ivRank: data.ivRank,
      high52w: data.high52w,
      low52w: data.low52w,
    },
    update: {
      price: data.price,
      change: data.changePercent,
      volume: data.volume,
      iv: data.iv,
      hv20: data.hv20,
      ivRank: data.ivRank,
      high52w: data.high52w,
      low52w: data.low52w,
    },
  });
}

/**
 * Get historical market data for an entry's ticker
 */
export async function getEntryHistoricalContext(entryId: string) {
  const entry = await prisma.entry.findUnique({
    where: { id: entryId },
    select: {
      ticker: true,
      createdAt: true,
    },
  });

  if (!entry?.ticker) {
    return null;
  }

  const entryDate = new Date(entry.createdAt);
  entryDate.setHours(0, 0, 0, 0);

  // Get market snapshot at time of entry
  const snapshotAtEntry = await prisma.marketSnapshot.findFirst({
    where: {
      ticker: entry.ticker,
      date: { lte: entryDate },
    },
    orderBy: { date: 'desc' },
  });

  // Get snapshot 7 days later
  const sevenDaysLater = new Date(entryDate);
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

  const snapshot7Days = await prisma.marketSnapshot.findFirst({
    where: {
      ticker: entry.ticker,
      date: {
        gte: sevenDaysLater,
        lte: new Date(sevenDaysLater.getTime() + 3 * 24 * 60 * 60 * 1000),
      },
    },
    orderBy: { date: 'asc' },
  });

  // Get snapshot 30 days later
  const thirtyDaysLater = new Date(entryDate);
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

  const snapshot30Days = await prisma.marketSnapshot.findFirst({
    where: {
      ticker: entry.ticker,
      date: {
        gte: thirtyDaysLater,
        lte: new Date(thirtyDaysLater.getTime() + 7 * 24 * 60 * 60 * 1000),
      },
    },
    orderBy: { date: 'asc' },
  });

  // Get next entry about this ticker
  const nextEntry = await prisma.entry.findFirst({
    where: {
      OR: [
        { ticker: entry.ticker },
        { content: { contains: entry.ticker, mode: 'insensitive' } },
      ],
      createdAt: { gt: entry.createdAt },
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      content: true,
      createdAt: true,
      sentiment: true,
    },
  });

  return {
    marketAtEntry: snapshotAtEntry
      ? {
          price: snapshotAtEntry.price,
          change: snapshotAtEntry.change,
        }
      : null,
    whatHappenedAfter: {
      price7Days: snapshot7Days?.price,
      price30Days: snapshot30Days?.price,
      priceChange7Days:
        snapshotAtEntry && snapshot7Days
          ? ((snapshot7Days.price - snapshotAtEntry.price) / snapshotAtEntry.price) * 100
          : null,
      priceChange30Days:
        snapshotAtEntry && snapshot30Days
          ? ((snapshot30Days.price - snapshotAtEntry.price) / snapshotAtEntry.price) * 100
          : null,
      nextEntry: nextEntry
        ? {
            id: nextEntry.id,
            content: nextEntry.content.substring(0, 100),
            createdAt: nextEntry.createdAt,
            sentiment: nextEntry.sentiment,
          }
        : null,
    },
  };
}
