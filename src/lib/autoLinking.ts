import { prisma } from '@/lib/prisma';
import { StrategyType, ThesisTrade, TradingThesis } from '@prisma/client';
import { differenceInDays, subDays, addDays } from 'date-fns';

export interface LinkSuggestion {
  tradeId: string;
  thesisId: string;
  thesisName: string;
  ticker: string;
  openedAt: string;
  strategyType: StrategyType | null;
  description: string;
  matchScore: number; // 0-1
  matchReasons: string[];
  breakdown: {
    tickerMatch: number;
    dateProximity: number;
    strategyMention: number;
    tradeStatus: number;
  };
}

interface MatchInput {
  tickers: string[];
  date: Date;
  content?: string;
}

/**
 * Get trade link suggestions for a journal entry
 * @param userId - User ID
 * @param input - Entry data (tickers, date, content)
 * @param maxSuggestions - Maximum number of suggestions to return
 * @returns Array of link suggestions sorted by match score
 */
export async function getLinkSuggestions(
  userId: string,
  input: MatchInput,
  maxSuggestions: number = 5
): Promise<LinkSuggestion[]> {
  const { tickers, date } = input;

  if (tickers.length === 0) {
    return [];
  }

  // Normalize tickers to uppercase
  const normalizedTickers = tickers.map((t) => t.toUpperCase());

  // Query candidate trades within ±3 day window
  const candidates = await prisma.thesisTrade.findMany({
    where: {
      userId,
      thesis: {
        ticker: {
          in: normalizedTickers,
        },
      },
      openedAt: {
        gte: subDays(date, 3),
        lte: addDays(date, 3),
      },
    },
    include: {
      thesis: {
        select: {
          id: true,
          name: true,
          ticker: true,
          direction: true,
        },
      },
    },
    orderBy: { openedAt: 'desc' },
    take: 20, // Limit candidates for performance
  });

  // Calculate match scores for each candidate
  const suggestions = candidates.map((trade) => {
    const { score, breakdown, reasons } = calculateMatchScore(trade, input);

    return {
      tradeId: trade.id,
      thesisId: trade.thesis!.id,
      thesisName: trade.thesis!.name,
      ticker: trade.thesis!.ticker,
      openedAt: trade.openedAt.toISOString(),
      strategyType: trade.strategyType,
      description: trade.description,
      matchScore: score,
      matchReasons: reasons,
      breakdown,
    };
  });

  // Filter by minimum confidence (30%) and sort by score
  return suggestions
    .filter((s) => s.matchScore >= 0.3)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, maxSuggestions);
}

/**
 * Calculate match score between a trade and entry data
 */
function calculateMatchScore(
  trade: ThesisTrade & { thesis: Pick<TradingThesis, 'ticker' | 'direction'> | null },
  entry: MatchInput
): {
  score: number;
  breakdown: LinkSuggestion['breakdown'];
  reasons: string[];
} {
  const breakdown = {
    tickerMatch: 0,
    dateProximity: 0,
    strategyMention: 0,
    tradeStatus: 0,
  };
  const reasons: string[] = [];

  // 1. Ticker match (40% weight)
  if (trade.thesis) {
    const tickerMatch = entry.tickers.some(
      (t) => t.toUpperCase() === trade.thesis!.ticker.toUpperCase()
    );
    if (tickerMatch) {
      breakdown.tickerMatch = 0.4;
      reasons.push('Exact ticker match');
    }
  }

  // 2. Date proximity (30% weight)
  const daysDiff = Math.abs(differenceInDays(entry.date, trade.openedAt));
  if (daysDiff === 0) {
    breakdown.dateProximity = 0.3;
    reasons.push('Same day');
  } else if (daysDiff === 1) {
    breakdown.dateProximity = 0.2;
    reasons.push('Within 1 day');
  } else if (daysDiff <= 3) {
    breakdown.dateProximity = 0.1;
    reasons.push(`Within ${daysDiff} days`);
  }

  // 3. Strategy mention in content (20% weight)
  if (entry.content && trade.strategyType) {
    const mentioned = isStrategyMentioned(entry.content, trade.strategyType);
    if (mentioned) {
      breakdown.strategyMention = 0.2;
      reasons.push(`Strategy "${formatStrategyType(trade.strategyType)}" mentioned`);
    }
  }

  // 4. Trade status (10% weight) - prefer OPEN trades
  if (trade.status === 'OPEN') {
    breakdown.tradeStatus = 0.1;
    reasons.push('Trade still open');
  } else if (trade.status === 'CLOSED') {
    breakdown.tradeStatus = 0.05;
  }

  const score =
    breakdown.tickerMatch +
    breakdown.dateProximity +
    breakdown.strategyMention +
    breakdown.tradeStatus;

  return { score, breakdown, reasons };
}

/**
 * Check if a strategy type is mentioned in content
 */
function isStrategyMentioned(content: string, strategyType: StrategyType): boolean {
  const lowerContent = content.toLowerCase();

  const strategyKeywords: Record<StrategyType, string[]> = {
    IRON_CONDOR: ['condor', 'ic', 'iron condor'],
    IRON_BUTTERFLY: ['iron butterfly', 'iron fly', 'ifly'],
    CALL_SPREAD: ['call spread', 'bull call', 'bear call', 'vertical call'],
    PUT_SPREAD: ['put spread', 'bull put', 'bear put', 'protective put', 'vertical put'],
    COVERED_CALL: ['covered call', 'cc', 'buy-write'],
    CASH_SECURED_PUT: ['cash secured put', 'csp', 'naked put'],
    LONG_CALL: ['long call', 'call option', 'bought call'],
    LONG_PUT: ['long put', 'put option', 'bought put', 'protective put'],
    SHORT_CALL: ['short call', 'sold call', 'naked call'],
    SHORT_PUT: ['short put', 'sold put'],
    STRADDLE: ['straddle', 'long straddle', 'short straddle'],
    STRANGLE: ['strangle', 'long strangle', 'short strangle'],
    CALENDAR: ['calendar', 'calendar spread', 'time spread'],
    DIAGONAL: ['diagonal', 'diagonal spread'],
    RATIO: ['ratio', 'ratio spread'],
    BUTTERFLY: ['butterfly', 'fly', 'long butterfly'],
    STOCK: ['stock', 'shares', 'equity'],
    CUSTOM: [], // No keywords for custom
  };

  const keywords = strategyKeywords[strategyType] || [];
  return keywords.some((keyword) => lowerContent.includes(keyword.toLowerCase()));
}

/**
 * Format strategy type for display
 */
function formatStrategyType(type: StrategyType): string {
  return type
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Bulk link entries to trades
 * @param userId - User ID
 * @param entryIds - Entry IDs to link
 * @param ticker - Filter trades by ticker
 * @returns Result summary
 */
export async function bulkLinkEntries(
  userId: string,
  entryIds: string[],
  ticker?: string
): Promise<{
  linked: number;
  skipped: number;
  errors: { entryId: string; error: string }[];
}> {
  const result = {
    linked: 0,
    skipped: 0,
    errors: [] as { entryId: string; error: string }[],
  };

  for (const entryId of entryIds) {
    try {
      // Get entry data
      const entry = await prisma.entry.findUnique({
        where: { id: entryId, userId },
        include: { tickerMentions: true },
      });

      if (!entry) {
        result.errors.push({ entryId, error: 'Entry not found' });
        continue;
      }

      // Skip if already linked
      if (entry.thesisTradeId) {
        result.skipped++;
        continue;
      }

      // Extract tickers from mentions
      const tickers = entry.tickerMentions.map((m) => m.ticker);
      if (ticker) {
        // Filter by specific ticker if provided
        if (!tickers.some((t) => t.toUpperCase() === ticker.toUpperCase())) {
          result.skipped++;
          continue;
        }
      }

      if (tickers.length === 0) {
        result.skipped++;
        continue;
      }

      // Get suggestions
      const suggestions = await getLinkSuggestions(
        userId,
        {
          tickers,
          date: entry.createdAt,
          content: entry.content,
        },
        1
      );

      if (suggestions.length === 0 || suggestions[0].matchScore < 0.7) {
        // Only auto-link if confidence > 70%
        result.skipped++;
        continue;
      }

      // Update entry with link
      await prisma.entry.update({
        where: { id: entryId },
        data: { thesisTradeId: suggestions[0].tradeId },
      });

      result.linked++;
    } catch (error) {
      result.errors.push({
        entryId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return result;
}
