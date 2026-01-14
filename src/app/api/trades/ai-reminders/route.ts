/**
 * AI Reminders API
 *
 * Returns warnings, historical lessons, and pattern insights for a trade
 * based on the user's historical performance with similar trades.
 *
 * GET /api/trades/ai-reminders
 * Query params:
 *   - ticker (required): Ticker symbol
 *   - thesisId (required): Current thesis ID
 *   - strategyType (optional): Strategy type
 *   - direction (optional): Trade direction
 *   - debitCredit (optional): Debit/credit amount
 */

import { NextRequest, NextResponse } from 'next/server';
import { StrategyType, ThesisOutcome } from '@prisma/client';
import {
  getThesisReminders,
  analyzeThesisPatterns,
  TradeReminder,
  ThesisLesson,
  ThesisPattern,
} from '@/lib/thesisPatterns';

// Map TradeReminder types to RiskWarning types expected by the component
type RiskWarningType =
  | 'IV_RATIO'
  | 'POSITION_SIZE'
  | 'CORRELATION'
  | 'TIMING'
  | 'STREAK'
  | 'CUSTOM';

type RiskWarningSeverity = 'high' | 'medium' | 'low';

interface RiskWarning {
  id: string;
  type: RiskWarningType;
  severity: RiskWarningSeverity;
  title: string;
  description: string;
  metric?: {
    label: string;
    value: string | number;
    threshold?: string | number;
  };
  action?: string;
}

interface HistoricalLesson {
  id: string;
  date: string;
  ticker: string;
  outcome: 'WIN' | 'LOSS' | 'BREAKEVEN';
  lesson: string;
  pnl?: number;
  similarity: number;
}

interface PatternInsight {
  id: string;
  pattern: string;
  description: string;
  trend: 'up' | 'down' | 'neutral';
  frequency: string;
}

/**
 * Maps TradeReminder to RiskWarning for the frontend component
 */
function mapReminderToWarning(reminder: TradeReminder, index: number): RiskWarning {
  // Determine warning type based on the reminder content
  let type: RiskWarningType = 'CUSTOM';
  if (reminder.title.toLowerCase().includes('iv') || reminder.message.toLowerCase().includes('iv/hv')) {
    type = 'IV_RATIO';
  } else if (reminder.title.toLowerCase().includes('position') || reminder.title.toLowerCase().includes('size')) {
    type = 'POSITION_SIZE';
  } else if (reminder.title.toLowerCase().includes('streak')) {
    type = 'STREAK';
  } else if (reminder.title.toLowerCase().includes('timing') || reminder.title.toLowerCase().includes('time')) {
    type = 'TIMING';
  }

  // Determine severity based on reminder type and priority
  let severity: RiskWarningSeverity = 'low';
  if (reminder.type === 'WARNING') {
    severity = reminder.priority >= 4 ? 'high' : 'medium';
  } else if (reminder.type === 'INFO') {
    severity = 'low';
  } else if (reminder.type === 'SUCCESS') {
    severity = 'low';
  } else if (reminder.type === 'LESSON') {
    severity = 'medium';
  }

  return {
    id: `warning-${index}`,
    type,
    severity,
    title: reminder.title,
    description: reminder.message,
    action: reminder.type === 'WARNING' ? 'Review your trading rules before proceeding' : undefined,
  };
}

/**
 * Maps ThesisLesson to HistoricalLesson for the frontend component
 */
function mapThesisLessonToHistorical(lesson: ThesisLesson, index: number): HistoricalLesson {
  let outcome: 'WIN' | 'LOSS' | 'BREAKEVEN' = 'BREAKEVEN';
  if (lesson.outcome === ThesisOutcome.WIN) {
    outcome = 'WIN';
  } else if (lesson.outcome === ThesisOutcome.LOSS) {
    outcome = 'LOSS';
  } else if (lesson.outcome === ThesisOutcome.BREAKEVEN) {
    outcome = 'BREAKEVEN';
  }

  // Calculate similarity based on ticker match and recency
  const daysSinceClosure = Math.floor(
    (Date.now() - new Date(lesson.closedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  const recencyFactor = Math.max(0.3, 1 - daysSinceClosure / 365);

  return {
    id: `lesson-${index}`,
    date: lesson.closedAt.toISOString(),
    ticker: lesson.ticker,
    outcome,
    lesson: lesson.lessonsLearned || `${outcome} trade on ${lesson.ticker}`,
    pnl: lesson.realizedPL,
    similarity: recencyFactor,
  };
}

/**
 * Maps ThesisPattern to PatternInsight for the frontend component
 */
function mapPatternToInsight(pattern: ThesisPattern, index: number): PatternInsight {
  // Determine trend based on win rate
  let trend: 'up' | 'down' | 'neutral' = 'neutral';
  if (pattern.winRate >= 0.6) {
    trend = 'up';
  } else if (pattern.winRate <= 0.4) {
    trend = 'down';
  }

  // Format frequency string
  const frequency = `${pattern.occurrences} occurrence${pattern.occurrences !== 1 ? 's' : ''}`;

  return {
    id: `pattern-${index}`,
    pattern: pattern.name,
    description: pattern.description,
    trend,
    frequency,
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ticker = searchParams.get('ticker');
    const thesisId = searchParams.get('thesisId');
    const strategyTypeParam = searchParams.get('strategyType');

    // Validate required parameters
    if (!ticker) {
      return NextResponse.json(
        { error: 'Missing required parameter: ticker' },
        { status: 400 }
      );
    }

    if (!thesisId) {
      return NextResponse.json(
        { error: 'Missing required parameter: thesisId' },
        { status: 400 }
      );
    }

    // Parse strategy type if provided
    let strategyType: StrategyType | undefined;
    if (strategyTypeParam && Object.values(StrategyType).includes(strategyTypeParam as StrategyType)) {
      strategyType = strategyTypeParam as StrategyType;
    }

    // Get reminders and lessons from the pattern service
    const { reminders, lessons } = await getThesisReminders(
      ticker,
      strategyType
    );

    // Get pattern analysis for additional insights
    const patternAnalysis = await analyzeThesisPatterns();

    // Filter patterns relevant to the current ticker or strategy
    const relevantPatterns = patternAnalysis.patterns.filter((pattern) => {
      const isTickerRelevant =
        pattern.type === 'TICKER_PATTERN' &&
        pattern.name.toLowerCase().includes(ticker.toLowerCase());
      const isStrategyRelevant =
        pattern.type === 'STRATEGY_PATTERN' &&
        strategyType &&
        pattern.name.toLowerCase().includes(strategyType.toLowerCase().replace('_', ' '));
      const isDirectionRelevant = pattern.type === 'DIRECTION_PATTERN';
      return isTickerRelevant || isStrategyRelevant || isDirectionRelevant;
    });

    // Transform data for frontend
    const warnings: RiskWarning[] = reminders
      .filter((r) => r.type === 'WARNING' || r.type === 'LESSON')
      .map((reminder, index) => mapReminderToWarning(reminder, index));

    const historicalLessons: HistoricalLesson[] = lessons
      .filter((lesson) => lesson.lessonsLearned)
      .slice(0, 5)
      .map((lesson, index) => mapThesisLessonToHistorical(lesson, index));

    const patternInsights: PatternInsight[] = relevantPatterns
      .slice(0, 5)
      .map((pattern, index) => mapPatternToInsight(pattern, index));

    // Include success reminders as low-severity info
    const successReminders = reminders.filter((r) => r.type === 'SUCCESS' || r.type === 'INFO');
    for (let i = 0; i < successReminders.length; i++) {
      warnings.push(mapReminderToWarning(successReminders[i], warnings.length + i));
    }

    return NextResponse.json({
      warnings,
      lessons: historicalLessons,
      patterns: patternInsights,
    });
  } catch (error) {
    console.error('Error fetching AI reminders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI reminders' },
      { status: 500 }
    );
  }
}
