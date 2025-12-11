/**
 * Thesis Pattern Learning Service
 *
 * Analyzes closed theses to identify patterns and provides reminders
 * when entering similar trades. Uses historical data to surface relevant
 * lessons learned and win rate analysis.
 *
 * Features:
 * - Pattern analysis from closed theses
 * - Trade reminders based on ticker and strategy
 * - Historical IV/HV performance analysis
 * - Similar thesis detection
 */

import { prisma } from '@/lib/prisma';
import {
  StrategyType,
  ThesisOutcome,
  ThesisStatus,
  ThesisDirection,
} from '@prisma/client';
import { ExtractedTradeData } from '@/lib/tradeExtraction';

/**
 * Pattern types that can be detected
 */
export type ThesisPatternType =
  | 'TICKER_PATTERN'
  | 'STRATEGY_PATTERN'
  | 'DIRECTION_PATTERN'
  | 'IV_HV_PATTERN'
  | 'TIMING_PATTERN'
  | 'SIZE_PATTERN';

/**
 * A detected pattern from historical thesis analysis
 */
export interface ThesisPattern {
  type: ThesisPatternType;
  name: string;
  description: string;
  occurrences: number;
  winRate: number;
  avgPL: number;
  confidence: number;
  relatedThesisIds: string[];
  insights: string[];
}

/**
 * Reminder to show when entering a new trade
 */
export interface TradeReminder {
  type: 'WARNING' | 'INFO' | 'SUCCESS' | 'LESSON';
  title: string;
  message: string;
  source?: {
    thesisId: string;
    thesisName: string;
  };
  priority: number;
}

/**
 * Lesson learned from a closed thesis
 */
export interface ThesisLesson {
  thesisId: string;
  thesisName: string;
  ticker: string;
  outcome: ThesisOutcome;
  lessonsLearned: string | null;
  realizedPL: number;
  strategyType?: StrategyType;
  closedAt: Date;
}

/**
 * Performance metrics for a specific IV/HV range
 */
export interface IvHvPerformance {
  ivHvRangeMin: number;
  ivHvRangeMax: number;
  totalTrades: number;
  winRate: number;
  avgPL: number;
  avgDaysHeld: number;
  bestOutcome: {
    thesisId: string;
    thesisName: string;
    pl: number;
  } | null;
  worstOutcome: {
    thesisId: string;
    thesisName: string;
    pl: number;
  } | null;
}

/**
 * Similar thesis match result
 */
export interface SimilarThesis {
  id: string;
  name: string;
  ticker: string;
  direction: ThesisDirection;
  strategyType?: StrategyType;
  outcome?: ThesisOutcome;
  totalRealizedPL: number;
  lessonsLearned?: string | null;
  startedAt: Date;
  closedAt?: Date | null;
  similarityScore: number;
  matchReasons: string[];
}

/**
 * Overall pattern analysis results
 */
export interface PatternAnalysisResult {
  totalTheses: number;
  closedTheses: number;
  overallWinRate: number;
  avgPLPerThesis: number;
  patterns: ThesisPattern[];
  topPerformingTickers: {
    ticker: string;
    winRate: number;
    avgPL: number;
    count: number;
  }[];
  topPerformingStrategies: {
    strategyType: StrategyType;
    winRate: number;
    avgPL: number;
    count: number;
  }[];
  recentInsights: string[];
}

/**
 * Analyzes all closed theses to identify patterns
 *
 * @returns Pattern analysis results
 */
export async function analyzeThesisPatterns(): Promise<PatternAnalysisResult> {
  const theses = await prisma.tradingThesis.findMany({
    where: {
      status: ThesisStatus.CLOSED,
    },
    include: {
      thesisTrades: {
        select: {
          strategyType: true,
          debitCredit: true,
          realizedPL: true,
          openedAt: true,
          closedAt: true,
          extractedData: true,
        },
      },
    },
    orderBy: {
      closedAt: 'desc',
    },
  });

  const totalTheses = await prisma.tradingThesis.count();
  const closedTheses = theses.length;

  if (closedTheses === 0) {
    return {
      totalTheses,
      closedTheses: 0,
      overallWinRate: 0,
      avgPLPerThesis: 0,
      patterns: [],
      topPerformingTickers: [],
      topPerformingStrategies: [],
      recentInsights: [],
    };
  }

  const wins = theses.filter((t) => t.outcome === ThesisOutcome.WIN).length;
  const overallWinRate = wins / closedTheses;
  const totalPL = theses.reduce((sum, t) => sum + t.totalRealizedPL, 0);
  const avgPLPerThesis = totalPL / closedTheses;

  const patterns: ThesisPattern[] = [];

  // Analyze ticker patterns
  const tickerStats = analyzeByTicker(theses);
  patterns.push(...tickerStats.patterns);

  // Analyze strategy patterns
  const strategyStats = analyzeByStrategy(theses);
  patterns.push(...strategyStats.patterns);

  // Analyze direction patterns
  const directionStats = analyzeByDirection(theses);
  patterns.push(...directionStats.patterns);

  // Generate insights from recent closures
  const recentInsights = generateRecentInsights(theses.slice(0, 10));

  return {
    totalTheses,
    closedTheses,
    overallWinRate,
    avgPLPerThesis,
    patterns,
    topPerformingTickers: tickerStats.topPerformers,
    topPerformingStrategies: strategyStats.topPerformers,
    recentInsights,
  };
}

/**
 * Analyzes thesis performance by ticker
 */
function analyzeByTicker(
  theses: {
    id: string;
    ticker: string;
    outcome: ThesisOutcome | null;
    totalRealizedPL: number;
  }[]
) {
  const tickerMap = new Map<
    string,
    { wins: number; losses: number; totalPL: number; ids: string[] }
  >();

  for (const thesis of theses) {
    const existing = tickerMap.get(thesis.ticker) || {
      wins: 0,
      losses: 0,
      totalPL: 0,
      ids: [],
    };

    if (thesis.outcome === ThesisOutcome.WIN) existing.wins++;
    else if (thesis.outcome === ThesisOutcome.LOSS) existing.losses++;

    existing.totalPL += thesis.totalRealizedPL;
    existing.ids.push(thesis.id);
    tickerMap.set(thesis.ticker, existing);
  }

  const patterns: ThesisPattern[] = [];
  const topPerformers: {
    ticker: string;
    winRate: number;
    avgPL: number;
    count: number;
  }[] = [];

  const tickerEntries = Array.from(tickerMap.entries());
  for (const [ticker, stats] of tickerEntries) {
    const total = stats.wins + stats.losses;
    if (total < 2) continue;

    const winRate = stats.wins / total;
    const avgPL = stats.totalPL / total;

    topPerformers.push({
      ticker,
      winRate,
      avgPL,
      count: total,
    });

    if (winRate >= 0.7 && total >= 3) {
      patterns.push({
        type: 'TICKER_PATTERN',
        name: `Strong ${ticker} Performance`,
        description: `${ticker} has a ${(winRate * 100).toFixed(0)}% win rate across ${total} theses`,
        occurrences: total,
        winRate,
        avgPL,
        confidence: Math.min(0.9, 0.5 + total * 0.1),
        relatedThesisIds: stats.ids,
        insights: [
          `Consider ${ticker} for similar setups`,
          `Average P/L: $${avgPL.toFixed(2)}`,
        ],
      });
    } else if (winRate <= 0.3 && total >= 3) {
      patterns.push({
        type: 'TICKER_PATTERN',
        name: `Weak ${ticker} Performance`,
        description: `${ticker} has only a ${(winRate * 100).toFixed(0)}% win rate across ${total} theses`,
        occurrences: total,
        winRate,
        avgPL,
        confidence: Math.min(0.9, 0.5 + total * 0.1),
        relatedThesisIds: stats.ids,
        insights: [
          `Review your edge in ${ticker}`,
          `Consider smaller position sizes`,
        ],
      });
    }
  }

  topPerformers.sort((a, b) => b.winRate - a.winRate || b.avgPL - a.avgPL);

  return { patterns, topPerformers: topPerformers.slice(0, 5) };
}

/**
 * Analyzes thesis performance by strategy type
 */
function analyzeByStrategy(
  theses: {
    id: string;
    outcome: ThesisOutcome | null;
    totalRealizedPL: number;
    thesisTrades: { strategyType: StrategyType | null }[];
  }[]
) {
  const strategyMap = new Map<
    StrategyType,
    { wins: number; losses: number; totalPL: number; ids: string[] }
  >();

  for (const thesis of theses) {
    const strategies = thesis.thesisTrades
      .map((t) => t.strategyType)
      .filter((s): s is StrategyType => s !== null);

    // Get unique strategies using filter instead of Set for compatibility
    const uniqueStrategies = strategies.filter(
      (s, i, arr) => arr.indexOf(s) === i
    );

    for (const strategy of uniqueStrategies) {
      const existing = strategyMap.get(strategy) || {
        wins: 0,
        losses: 0,
        totalPL: 0,
        ids: [],
      };

      if (thesis.outcome === ThesisOutcome.WIN) existing.wins++;
      else if (thesis.outcome === ThesisOutcome.LOSS) existing.losses++;

      existing.totalPL += thesis.totalRealizedPL / uniqueStrategies.length;
      existing.ids.push(thesis.id);
      strategyMap.set(strategy, existing);
    }
  }

  const patterns: ThesisPattern[] = [];
  const topPerformers: {
    strategyType: StrategyType;
    winRate: number;
    avgPL: number;
    count: number;
  }[] = [];

  const strategyEntries = Array.from(strategyMap.entries());
  for (const [strategy, stats] of strategyEntries) {
    const total = stats.wins + stats.losses;
    if (total < 2) continue;

    const winRate = stats.wins / total;
    const avgPL = stats.totalPL / total;

    topPerformers.push({
      strategyType: strategy,
      winRate,
      avgPL,
      count: total,
    });

    if (winRate >= 0.7 && total >= 3) {
      patterns.push({
        type: 'STRATEGY_PATTERN',
        name: `Strong ${formatStrategyType(strategy)} Performance`,
        description: `${formatStrategyType(strategy)} has a ${(winRate * 100).toFixed(0)}% win rate`,
        occurrences: total,
        winRate,
        avgPL,
        confidence: Math.min(0.9, 0.5 + total * 0.1),
        relatedThesisIds: stats.ids,
        insights: [
          `${formatStrategyType(strategy)} is working well`,
          `Consider using this strategy more`,
        ],
      });
    }
  }

  topPerformers.sort((a, b) => b.winRate - a.winRate || b.avgPL - a.avgPL);

  return { patterns, topPerformers: topPerformers.slice(0, 5) };
}

/**
 * Analyzes thesis performance by direction
 */
function analyzeByDirection(
  theses: {
    id: string;
    direction: ThesisDirection;
    outcome: ThesisOutcome | null;
    totalRealizedPL: number;
  }[]
) {
  const directionMap = new Map<
    ThesisDirection,
    { wins: number; losses: number; totalPL: number; ids: string[] }
  >();

  for (const thesis of theses) {
    const existing = directionMap.get(thesis.direction) || {
      wins: 0,
      losses: 0,
      totalPL: 0,
      ids: [],
    };

    if (thesis.outcome === ThesisOutcome.WIN) existing.wins++;
    else if (thesis.outcome === ThesisOutcome.LOSS) existing.losses++;

    existing.totalPL += thesis.totalRealizedPL;
    existing.ids.push(thesis.id);
    directionMap.set(thesis.direction, existing);
  }

  const patterns: ThesisPattern[] = [];

  const directionEntries = Array.from(directionMap.entries());
  for (const [direction, stats] of directionEntries) {
    const total = stats.wins + stats.losses;
    if (total < 3) continue;

    const winRate = stats.wins / total;
    const avgPL = stats.totalPL / total;

    if (winRate >= 0.7) {
      patterns.push({
        type: 'DIRECTION_PATTERN',
        name: `Strong ${direction} Bias`,
        description: `${direction} theses have a ${(winRate * 100).toFixed(0)}% win rate`,
        occurrences: total,
        winRate,
        avgPL,
        confidence: Math.min(0.85, 0.5 + total * 0.08),
        relatedThesisIds: stats.ids,
        insights: [`Your ${direction.toLowerCase()} trades are performing well`],
      });
    } else if (winRate <= 0.3) {
      patterns.push({
        type: 'DIRECTION_PATTERN',
        name: `Weak ${direction} Performance`,
        description: `${direction} theses have only a ${(winRate * 100).toFixed(0)}% win rate`,
        occurrences: total,
        winRate,
        avgPL,
        confidence: Math.min(0.85, 0.5 + total * 0.08),
        relatedThesisIds: stats.ids,
        insights: [
          `Consider being more selective with ${direction.toLowerCase()} trades`,
        ],
      });
    }
  }

  return { patterns };
}

/**
 * Generates insights from recent thesis closures
 */
function generateRecentInsights(
  recentTheses: {
    name: string;
    ticker: string;
    outcome: ThesisOutcome | null;
    lessonsLearned: string | null;
  }[]
): string[] {
  const insights: string[] = [];

  const recentWins = recentTheses.filter(
    (t) => t.outcome === ThesisOutcome.WIN
  );
  const recentLosses = recentTheses.filter(
    (t) => t.outcome === ThesisOutcome.LOSS
  );

  if (recentWins.length > recentLosses.length * 2) {
    insights.push('Strong recent performance - maintain discipline');
  } else if (recentLosses.length > recentWins.length * 2) {
    insights.push(
      'Recent losing streak - consider reducing position sizes and reviewing edge'
    );
  }

  const lessonsWithContent = recentTheses
    .filter((t) => t.lessonsLearned && t.lessonsLearned.length > 10)
    .slice(0, 3);

  for (const thesis of lessonsWithContent) {
    if (thesis.lessonsLearned) {
      const truncated =
        thesis.lessonsLearned.length > 100
          ? thesis.lessonsLearned.slice(0, 100) + '...'
          : thesis.lessonsLearned;
      insights.push(`From ${thesis.ticker}: ${truncated}`);
    }
  }

  return insights;
}

/**
 * Gets reminders when entering a trade with similar characteristics
 *
 * @param ticker - Ticker symbol
 * @param strategyType - Strategy type (optional)
 * @param extractedData - Data extracted from screenshot (optional)
 * @returns Array of reminders and lessons
 */
export async function getThesisReminders(
  ticker: string,
  strategyType?: StrategyType,
  extractedData?: ExtractedTradeData
): Promise<{
  reminders: TradeReminder[];
  lessons: ThesisLesson[];
}> {
  const normalizedTicker = ticker.toUpperCase();

  // Find related closed theses
  const closedTheses = await prisma.tradingThesis.findMany({
    where: {
      status: ThesisStatus.CLOSED,
      OR: [
        { ticker: normalizedTicker },
        ...(strategyType
          ? [
              {
                thesisTrades: {
                  some: {
                    strategyType,
                  },
                },
              },
            ]
          : []),
      ],
    },
    include: {
      thesisTrades: {
        select: {
          strategyType: true,
          extractedData: true,
        },
      },
    },
    orderBy: {
      closedAt: 'desc',
    },
    take: 20,
  });

  const reminders: TradeReminder[] = [];
  const lessons: ThesisLesson[] = [];

  // Ticker-specific analysis
  const tickerTheses = closedTheses.filter(
    (t) => t.ticker === normalizedTicker
  );

  if (tickerTheses.length > 0) {
    const wins = tickerTheses.filter(
      (t) => t.outcome === ThesisOutcome.WIN
    ).length;
    const winRate = wins / tickerTheses.length;
    const totalPL = tickerTheses.reduce(
      (sum, t) => sum + t.totalRealizedPL,
      0
    );

    if (winRate >= 0.7 && tickerTheses.length >= 3) {
      reminders.push({
        type: 'SUCCESS',
        title: `Strong ${normalizedTicker} Track Record`,
        message: `You have a ${(winRate * 100).toFixed(0)}% win rate on ${normalizedTicker} across ${tickerTheses.length} theses`,
        priority: 2,
      });
    } else if (winRate <= 0.3 && tickerTheses.length >= 3) {
      reminders.push({
        type: 'WARNING',
        title: `Historically Weak on ${normalizedTicker}`,
        message: `Only ${(winRate * 100).toFixed(0)}% win rate on ${normalizedTicker}. Total P/L: $${totalPL.toFixed(2)}`,
        priority: 5,
      });
    }

    // Add recent lessons from this ticker
    for (const thesis of tickerTheses.slice(0, 3)) {
      if (thesis.lessonsLearned) {
        reminders.push({
          type: 'LESSON',
          title: `Lesson from ${thesis.name}`,
          message: thesis.lessonsLearned,
          source: {
            thesisId: thesis.id,
            thesisName: thesis.name,
          },
          priority: 3,
        });
      }

      lessons.push({
        thesisId: thesis.id,
        thesisName: thesis.name,
        ticker: thesis.ticker,
        outcome: thesis.outcome!,
        lessonsLearned: thesis.lessonsLearned,
        realizedPL: thesis.totalRealizedPL,
        strategyType: thesis.thesisTrades[0]?.strategyType || undefined,
        closedAt: thesis.closedAt!,
      });
    }
  }

  // Strategy-specific analysis
  if (strategyType) {
    const strategyTheses = closedTheses.filter((t) =>
      t.thesisTrades.some((trade) => trade.strategyType === strategyType)
    );

    if (strategyTheses.length >= 3) {
      const wins = strategyTheses.filter(
        (t) => t.outcome === ThesisOutcome.WIN
      ).length;
      const winRate = wins / strategyTheses.length;

      if (winRate <= 0.4) {
        reminders.push({
          type: 'WARNING',
          title: `Low Win Rate with ${formatStrategyType(strategyType)}`,
          message: `Your ${formatStrategyType(strategyType)} trades have a ${(winRate * 100).toFixed(0)}% win rate`,
          priority: 4,
        });
      } else if (winRate >= 0.7) {
        reminders.push({
          type: 'INFO',
          title: `${formatStrategyType(strategyType)} Is Working Well`,
          message: `${(winRate * 100).toFixed(0)}% win rate with this strategy`,
          priority: 1,
        });
      }
    }
  }

  // IV/HV analysis if extracted data is provided
  if (extractedData?.iv && extractedData?.hv) {
    const ivHvRatio = extractedData.iv / extractedData.hv;
    const performance = await calculateHistoricalIvHvPerformance(
      strategyType,
      ivHvRatio
    );

    if (performance && performance.totalTrades >= 3) {
      if (ivHvRatio > 1.3 && performance.winRate >= 0.6) {
        reminders.push({
          type: 'INFO',
          title: 'High IV/HV Historically Favorable',
          message: `IV/HV ratio of ${ivHvRatio.toFixed(2)} similar to past winners (${(performance.winRate * 100).toFixed(0)}% win rate)`,
          priority: 2,
        });
      } else if (ivHvRatio < 0.8 && performance.winRate <= 0.4) {
        reminders.push({
          type: 'WARNING',
          title: 'Low IV/HV Warning',
          message: `IV/HV ratio of ${ivHvRatio.toFixed(2)} similar to past losers (${(performance.winRate * 100).toFixed(0)}% win rate)`,
          priority: 4,
        });
      }
    }
  }

  // Sort reminders by priority (higher = more important)
  reminders.sort((a, b) => b.priority - a.priority);

  return { reminders, lessons };
}

/**
 * Finds theses similar to the current trade parameters
 *
 * @param ticker - Ticker symbol
 * @param strategyType - Strategy type (optional)
 * @returns Array of similar theses
 */
export async function findSimilarTheses(
  ticker: string,
  strategyType?: StrategyType
): Promise<SimilarThesis[]> {
  const normalizedTicker = ticker.toUpperCase();

  const theses = await prisma.tradingThesis.findMany({
    where: {
      OR: [
        { ticker: normalizedTicker },
        ...(strategyType
          ? [
              {
                thesisTrades: {
                  some: {
                    strategyType,
                  },
                },
              },
            ]
          : []),
      ],
    },
    include: {
      thesisTrades: {
        select: {
          strategyType: true,
        },
      },
    },
    orderBy: {
      startedAt: 'desc',
    },
    take: 20,
  });

  const results: SimilarThesis[] = [];

  for (const thesis of theses) {
    const matchReasons: string[] = [];
    let similarityScore = 0;

    // Ticker match
    if (thesis.ticker === normalizedTicker) {
      matchReasons.push('Same ticker');
      similarityScore += 50;
    }

    // Strategy match
    const thesisStrategies = thesis.thesisTrades
      .map((t) => t.strategyType)
      .filter((s): s is StrategyType => s !== null);

    if (strategyType && thesisStrategies.includes(strategyType)) {
      matchReasons.push('Same strategy');
      similarityScore += 30;
    }

    // Outcome bonus (closed theses are more valuable)
    if (thesis.status === ThesisStatus.CLOSED) {
      similarityScore += 10;
      if (thesis.lessonsLearned) {
        matchReasons.push('Has lessons learned');
        similarityScore += 10;
      }
    }

    results.push({
      id: thesis.id,
      name: thesis.name,
      ticker: thesis.ticker,
      direction: thesis.direction,
      strategyType: thesisStrategies[0],
      outcome: thesis.outcome || undefined,
      totalRealizedPL: thesis.totalRealizedPL,
      lessonsLearned: thesis.lessonsLearned,
      startedAt: thesis.startedAt,
      closedAt: thesis.closedAt,
      similarityScore,
      matchReasons,
    });
  }

  // Sort by similarity score
  results.sort((a, b) => b.similarityScore - a.similarityScore);

  return results.slice(0, 10);
}

/**
 * Calculates historical win rates by IV/HV ratio
 *
 * @param strategyType - Strategy type (optional)
 * @param ivHvRatio - Current IV/HV ratio
 * @returns Performance metrics for the IV/HV range
 */
export async function calculateHistoricalIvHvPerformance(
  strategyType?: StrategyType,
  ivHvRatio?: number
): Promise<IvHvPerformance | null> {
  const theses = await prisma.tradingThesis.findMany({
    where: {
      status: ThesisStatus.CLOSED,
      ...(strategyType
        ? {
            thesisTrades: {
              some: {
                strategyType,
              },
            },
          }
        : {}),
    },
    include: {
      thesisTrades: {
        select: {
          extractedData: true,
          openedAt: true,
          closedAt: true,
        },
      },
    },
  });

  // Filter theses that have IV/HV data in extracted data
  const thesesWithIvHv: {
    id: string;
    name: string;
    outcome: ThesisOutcome | null;
    totalRealizedPL: number;
    ivHvRatio: number;
    daysHeld: number;
  }[] = [];

  for (const thesis of theses) {
    for (const trade of thesis.thesisTrades) {
      const extracted = trade.extractedData as Record<string, unknown> | null;
      if (
        extracted &&
        typeof extracted.iv === 'number' &&
        typeof extracted.hv === 'number' &&
        extracted.hv > 0
      ) {
        const ratio = extracted.iv / extracted.hv;
        const daysHeld = trade.closedAt && trade.openedAt
          ? Math.ceil(
              (trade.closedAt.getTime() - trade.openedAt.getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 0;

        thesesWithIvHv.push({
          id: thesis.id,
          name: thesis.name,
          outcome: thesis.outcome,
          totalRealizedPL: thesis.totalRealizedPL,
          ivHvRatio: ratio,
          daysHeld,
        });
        break;
      }
    }
  }

  if (thesesWithIvHv.length < 3) {
    return null;
  }

  // If a specific ratio is provided, filter to similar range
  let filtered = thesesWithIvHv;
  let rangeMin = 0;
  let rangeMax = Infinity;

  if (ivHvRatio !== undefined) {
    rangeMin = ivHvRatio * 0.8;
    rangeMax = ivHvRatio * 1.2;
    filtered = thesesWithIvHv.filter(
      (t) => t.ivHvRatio >= rangeMin && t.ivHvRatio <= rangeMax
    );

    if (filtered.length < 3) {
      rangeMin = ivHvRatio * 0.6;
      rangeMax = ivHvRatio * 1.4;
      filtered = thesesWithIvHv.filter(
        (t) => t.ivHvRatio >= rangeMin && t.ivHvRatio <= rangeMax
      );
    }
  }

  if (filtered.length < 2) {
    return null;
  }

  const wins = filtered.filter((t) => t.outcome === ThesisOutcome.WIN).length;
  const winRate = wins / filtered.length;
  const avgPL =
    filtered.reduce((sum, t) => sum + t.totalRealizedPL, 0) / filtered.length;
  const avgDaysHeld =
    filtered.reduce((sum, t) => sum + t.daysHeld, 0) / filtered.length;

  const sorted = [...filtered].sort(
    (a, b) => b.totalRealizedPL - a.totalRealizedPL
  );
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  const maxRatio = filtered.reduce((max, t) => Math.max(max, t.ivHvRatio), 0);

  return {
    ivHvRangeMin: rangeMin,
    ivHvRangeMax: rangeMax === Infinity ? maxRatio : rangeMax,
    totalTrades: filtered.length,
    winRate,
    avgPL,
    avgDaysHeld,
    bestOutcome: best
      ? {
          thesisId: best.id,
          thesisName: best.name,
          pl: best.totalRealizedPL,
        }
      : null,
    worstOutcome: worst
      ? {
          thesisId: worst.id,
          thesisName: worst.name,
          pl: worst.totalRealizedPL,
        }
      : null,
  };
}

/**
 * Formats strategy type for display
 */
function formatStrategyType(strategy: StrategyType): string {
  const formatMap: Record<StrategyType, string> = {
    LONG_CALL: 'Long Call',
    LONG_PUT: 'Long Put',
    SHORT_CALL: 'Short Call',
    SHORT_PUT: 'Short Put',
    CALL_SPREAD: 'Call Spread',
    PUT_SPREAD: 'Put Spread',
    IRON_CONDOR: 'Iron Condor',
    IRON_BUTTERFLY: 'Iron Butterfly',
    STRADDLE: 'Straddle',
    STRANGLE: 'Strangle',
    CALENDAR: 'Calendar Spread',
    DIAGONAL: 'Diagonal Spread',
    RATIO: 'Ratio Spread',
    BUTTERFLY: 'Butterfly',
    STOCK: 'Stock',
    COVERED_CALL: 'Covered Call',
    CASH_SECURED_PUT: 'Cash-Secured Put',
    CUSTOM: 'Custom',
  };

  return formatMap[strategy] || strategy;
}
