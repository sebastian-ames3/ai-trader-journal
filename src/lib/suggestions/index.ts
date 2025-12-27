import { StrategyType, ThesisDirection } from '@prisma/client';

// ============================================
// Types
// ============================================

export interface TradeForSuggestion {
  id: string;
  ticker: string;
  strategyType: StrategyType | null;
  openedAt: string;
  closedAt?: string;
  debitCredit: number;
  realizedPL?: number;
  status: string;
  legs?: string;
}

export interface LinkSuggestion {
  id: string;
  confidence: number;
  tradeIds: string[];
  pattern: SuggestionPattern;
  reason: string;
  suggestedName: string;
  suggestedDirection: ThesisDirection;
  suggestedActions?: { tradeId: string; action: TradeAction }[];
}

export type SuggestionPattern =
  | 'SAME_TICKER'
  | 'ROLL'
  | 'SCALING'
  | 'ADJUSTMENT'
  | 'POSITION_LIFECYCLE'
  | 'MULTI_LEG'
  | 'AI_INFERRED';

export type TradeAction =
  | 'INITIAL'
  | 'ADD'
  | 'REDUCE'
  | 'ROLL'
  | 'CONVERT'
  | 'CLOSE'
  | 'ASSIGNED'
  | 'EXERCISED';

interface TradeGroup {
  trades: TradeForSuggestion[];
  ticker: string;
}

// ============================================
// Utility Functions
// ============================================

function groupBy<T>(array: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of array) {
    const key = keyFn(item);
    const group = map.get(key) || [];
    group.push(item);
    map.set(key, group);
  }
  return map;
}

function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function parseLegs(legs?: string): string[] {
  if (!legs) return [];
  return legs
    .split(/[\/,]/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function getMonth(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', { month: 'short' });
}

function getYear(dateStr: string): string {
  return new Date(dateStr).getFullYear().toString();
}

// ============================================
// Layer 1: Basic Grouping
// ============================================

export function basicGrouping(trades: TradeForSuggestion[]): TradeGroup[] {
  // Group by ticker
  const byTicker = groupBy(trades, (t) => t.ticker);
  const groups: TradeGroup[] = [];

  for (const [ticker, tickerTrades] of Array.from(byTicker.entries())) {
    // Sort by date
    const sorted = [...tickerTrades].sort(
      (a, b) => new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime()
    );

    // Split into sub-groups based on date proximity (14-day window)
    let currentGroup: TradeForSuggestion[] = [];

    for (const trade of sorted) {
      if (currentGroup.length === 0) {
        currentGroup.push(trade);
      } else {
        const lastTrade = currentGroup[currentGroup.length - 1];
        const daysDiff = daysBetween(lastTrade.openedAt, trade.openedAt);

        if (daysDiff <= 14) {
          currentGroup.push(trade);
        } else {
          // Start new group
          if (currentGroup.length >= 2) {
            groups.push({ trades: currentGroup, ticker });
          }
          currentGroup = [trade];
        }
      }
    }

    // Don't forget the last group
    if (currentGroup.length >= 2) {
      groups.push({ trades: currentGroup, ticker });
    }
  }

  return groups;
}

// ============================================
// Layer 2: Pattern Detection
// ============================================

interface PatternResult {
  pattern: SuggestionPattern;
  confidenceBonus: number;
  reason: string;
  suggestedActions?: { tradeId: string; action: TradeAction }[];
}

function detectRollPattern(trades: TradeForSuggestion[]): PatternResult | null {
  if (trades.length < 2) return null;

  // Look for same ticker, same type of strategy, different implied expirations
  const sorted = [...trades].sort(
    (a, b) => new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime()
  );

  // Check legs for expiration patterns
  const legsArr = sorted.map((t) => parseLegs(t.legs));

  // Simple heuristic: if legs contain similar strikes but different dates mentioned
  // this might be a roll
  let rollDetected = false;
  for (let i = 1; i < sorted.length; i++) {
    const prevTrade = sorted[i - 1];
    const currTrade = sorted[i];

    // Same strategy type suggests roll
    if (
      prevTrade.strategyType === currTrade.strategyType &&
      prevTrade.status === 'CLOSED' &&
      currTrade.status !== 'CLOSED'
    ) {
      rollDetected = true;
      break;
    }
  }

  if (rollDetected) {
    const suggestedActions = sorted.map((t, idx) => ({
      tradeId: t.id,
      action: (idx === 0 ? 'INITIAL' : 'ROLL') as TradeAction,
    }));

    return {
      pattern: 'ROLL',
      confidenceBonus: 20,
      reason: `Detected roll pattern: same strategy type rolled to new expiration`,
      suggestedActions,
    };
  }

  return null;
}

function detectScalingPattern(trades: TradeForSuggestion[]): PatternResult | null {
  if (trades.length < 2) return null;

  const sorted = [...trades].sort(
    (a, b) => new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime()
  );

  // Check if all same strategy type and all open/adding
  const strategyTypes = new Set(sorted.map((t) => t.strategyType));
  if (strategyTypes.size === 1 && sorted.every((t) => t.status !== 'CLOSED')) {
    const suggestedActions = sorted.map((t, idx) => ({
      tradeId: t.id,
      action: (idx === 0 ? 'INITIAL' : 'ADD') as TradeAction,
    }));

    return {
      pattern: 'SCALING',
      confidenceBonus: 15,
      reason: `Multiple ${sorted[0].strategyType} trades opened - appears to be scaling into position`,
      suggestedActions,
    };
  }

  return null;
}

function detectPositionLifecycle(trades: TradeForSuggestion[]): PatternResult | null {
  if (trades.length < 2) return null;

  const sorted = [...trades].sort(
    (a, b) => new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime()
  );

  // Look for open followed by close
  const hasOpen = sorted.some((t) => t.status !== 'CLOSED');
  const hasClosed = sorted.some((t) => t.status === 'CLOSED');

  if (hasOpen && hasClosed) {
    const suggestedActions = sorted.map((t, idx) => {
      if (idx === 0) return { tradeId: t.id, action: 'INITIAL' as TradeAction };
      if (t.status === 'CLOSED') return { tradeId: t.id, action: 'CLOSE' as TradeAction };
      return { tradeId: t.id, action: 'ADD' as TradeAction };
    });

    return {
      pattern: 'POSITION_LIFECYCLE',
      confidenceBonus: 25,
      reason: `Position lifecycle detected: opened and closed within the time window`,
      suggestedActions,
    };
  }

  return null;
}

function detectPatterns(group: TradeGroup): PatternResult {
  // Try each pattern detector in order of specificity
  const rollPattern = detectRollPattern(group.trades);
  if (rollPattern) return rollPattern;

  const lifecyclePattern = detectPositionLifecycle(group.trades);
  if (lifecyclePattern) return lifecyclePattern;

  const scalingPattern = detectScalingPattern(group.trades);
  if (scalingPattern) return scalingPattern;

  // Default: same ticker grouping
  return {
    pattern: 'SAME_TICKER',
    confidenceBonus: 0,
    reason: `${group.trades.length} ${group.ticker} trades within 2 weeks`,
    suggestedActions: group.trades.map((t, idx) => ({
      tradeId: t.id,
      action: (idx === 0 ? 'INITIAL' : 'ADD') as TradeAction,
    })),
  };
}

// ============================================
// Confidence Scoring
// ============================================

function calculateConfidence(group: TradeGroup, pattern: PatternResult): number {
  let confidence = 30; // Base: same ticker

  // Date proximity bonus
  const firstDate = group.trades[0].openedAt;
  const lastDate = group.trades[group.trades.length - 1].openedAt;
  const daySpan = daysBetween(firstDate, lastDate);

  if (daySpan <= 7) {
    confidence += 20; // Very close together
  } else if (daySpan <= 14) {
    confidence += 10;
  }

  // Pattern bonus
  confidence += pattern.confidenceBonus;

  // Same strategy bonus
  const strategyTypes = new Set(group.trades.map((t) => t.strategyType));
  if (strategyTypes.size === 1) {
    confidence += 15;
  }

  // Cap at 100
  return Math.min(100, confidence);
}

// ============================================
// Name Generation
// ============================================

function generateThesisName(group: TradeGroup, pattern: PatternResult): string {
  const { ticker, trades } = group;
  const firstTrade = trades[0];
  const month = getMonth(firstTrade.openedAt);
  const year = getYear(firstTrade.openedAt);

  // Infer direction
  const direction = inferDirection(trades);

  switch (pattern.pattern) {
    case 'ROLL':
      return `${ticker} ${month} ${year} Roll`;
    case 'SCALING':
      return `${ticker} ${month} ${year} ${direction}`;
    case 'POSITION_LIFECYCLE':
      return `${ticker} ${month} ${year} Trade`;
    default:
      return `${ticker} ${month} ${year} ${direction}`;
  }
}

function inferDirection(trades: TradeForSuggestion[]): ThesisDirection {
  // Simple heuristic based on strategy types
  const strategies = trades.map((t) => t.strategyType).filter(Boolean);

  const bullishStrategies = [
    'LONG_CALL',
    'BULL_CALL_SPREAD',
    'CASH_SECURED_PUT',
    'COVERED_CALL',
  ];
  const bearishStrategies = ['LONG_PUT', 'BEAR_PUT_SPREAD', 'PUT_SPREAD'];
  const neutralStrategies = ['IRON_CONDOR', 'IRON_BUTTERFLY', 'STRADDLE', 'STRANGLE'];

  let bullishCount = 0;
  let bearishCount = 0;
  let neutralCount = 0;

  for (const strategy of strategies) {
    if (bullishStrategies.includes(strategy as string)) bullishCount++;
    else if (bearishStrategies.includes(strategy as string)) bearishCount++;
    else if (neutralStrategies.includes(strategy as string)) neutralCount++;
  }

  if (neutralCount > bullishCount && neutralCount > bearishCount) {
    return 'NEUTRAL';
  }
  if (bearishCount > bullishCount) {
    return 'BEARISH';
  }
  return 'BULLISH';
}

// ============================================
// Main Export
// ============================================

export interface SuggestLinksOptions {
  minConfidence?: number;
  includeExisting?: boolean;
  useAi?: boolean;
}

export function suggestLinks(
  trades: TradeForSuggestion[],
  options: SuggestLinksOptions = {}
): LinkSuggestion[] {
  const { minConfidence = 40 } = options;

  if (trades.length < 2) return [];

  // Layer 1: Basic grouping
  const groups = basicGrouping(trades);

  // Layer 2: Pattern detection and scoring
  const suggestions: LinkSuggestion[] = [];

  for (const group of groups) {
    const pattern = detectPatterns(group);
    const confidence = calculateConfidence(group, pattern);

    if (confidence >= minConfidence) {
      suggestions.push({
        id: `suggestion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        confidence,
        tradeIds: group.trades.map((t) => t.id),
        pattern: pattern.pattern,
        reason: pattern.reason,
        suggestedName: generateThesisName(group, pattern),
        suggestedDirection: inferDirection(group.trades),
        suggestedActions: pattern.suggestedActions,
      });
    }
  }

  // Sort by confidence descending
  suggestions.sort((a, b) => b.confidence - a.confidence);

  return suggestions;
}

// Re-export types for convenience
export type { ThesisDirection };
