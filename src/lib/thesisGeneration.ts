/**
 * Thesis Generation Service
 *
 * PRD-B Feature 5: Thesis as Emergent (AI-Generated)
 *
 * Analyzes unassigned trades and related journal entries to suggest
 * thesis groupings. Enables trade-first workflow where theses emerge
 * from accumulated trading patterns.
 */

import { getClaude, CLAUDE_MODELS, parseJsonResponse, isClaudeConfigured } from '@/lib/claude';
import { z } from 'zod';

/**
 * Trade data for thesis analysis
 */
export interface TradeForAnalysis {
  id: string;
  ticker: string;
  outcome: 'WIN' | 'LOSS' | 'BREAKEVEN' | null;
  realizedPL: number | null;
  strategyType: string | null;
  description: string | null;
  createdAt: Date;
}

/**
 * Entry data for thesis analysis
 */
export interface EntryForAnalysis {
  id: string;
  content: string;
  ticker: string | null;
  entryType: string;
  mood: string | null;
  sentiment: string | null;
  createdAt: Date;
}

/**
 * Grouped trades by ticker for thesis suggestion
 */
export interface TickerTradeGroup {
  ticker: string;
  trades: TradeForAnalysis[];
  relatedEntries: EntryForAnalysis[];
  stats: {
    totalTrades: number;
    wins: number;
    losses: number;
    breakevens: number;
    totalPnL: number | null;
    avgPnL: number | null;
    dateRange: { first: Date; last: Date };
  };
}

/**
 * AI-generated thesis suggestion
 */
export interface ThesisSuggestion {
  ticker: string;
  suggestedName: string;
  thesisText: string;
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'VOLATILE';
  confidence: number;
  reasoning: string;
  sourcedFrom: {
    tradeIds: string[];
    entryIds: string[];
  };
  stats: TickerTradeGroup['stats'];
}

/**
 * Zod schema for AI response validation
 */
const thesisSuggestionSchema = z.object({
  suggestedName: z.string().min(1).max(100),
  thesisText: z.string().min(10).max(1000),
  direction: z.enum(['BULLISH', 'BEARISH', 'NEUTRAL', 'VOLATILE']),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().min(1).max(500),
});

/**
 * Groups unassigned trades by ticker
 */
export function groupTradesByTicker(
  trades: TradeForAnalysis[],
  entries: EntryForAnalysis[]
): TickerTradeGroup[] {
  const tickerMap = new Map<string, TickerTradeGroup>();

  // Group trades by ticker
  for (const trade of trades) {
    if (!trade.ticker) continue;

    const ticker = trade.ticker.toUpperCase();

    if (!tickerMap.has(ticker)) {
      tickerMap.set(ticker, {
        ticker,
        trades: [],
        relatedEntries: [],
        stats: {
          totalTrades: 0,
          wins: 0,
          losses: 0,
          breakevens: 0,
          totalPnL: 0,
          avgPnL: null,
          dateRange: { first: trade.createdAt, last: trade.createdAt },
        },
      });
    }

    const group = tickerMap.get(ticker)!;
    group.trades.push(trade);
    group.stats.totalTrades++;

    if (trade.outcome === 'WIN') group.stats.wins++;
    else if (trade.outcome === 'LOSS') group.stats.losses++;
    else if (trade.outcome === 'BREAKEVEN') group.stats.breakevens++;

    if (trade.realizedPL !== null) {
      group.stats.totalPnL = (group.stats.totalPnL || 0) + trade.realizedPL;
    }

    // Update date range
    if (trade.createdAt < group.stats.dateRange.first) {
      group.stats.dateRange.first = trade.createdAt;
    }
    if (trade.createdAt > group.stats.dateRange.last) {
      group.stats.dateRange.last = trade.createdAt;
    }
  }

  // Add related entries to groups
  for (const entry of entries) {
    if (!entry.ticker) continue;

    const ticker = entry.ticker.toUpperCase();
    const group = tickerMap.get(ticker);

    if (group) {
      group.relatedEntries.push(entry);
    }
  }

  // Calculate average P/L
  for (const group of Array.from(tickerMap.values())) {
    const tradesWithPnL = group.trades.filter((t: TradeForAnalysis) => t.realizedPL !== null);
    if (tradesWithPnL.length > 0 && group.stats.totalPnL !== null) {
      group.stats.avgPnL = group.stats.totalPnL / tradesWithPnL.length;
    }
  }

  // Filter to groups with at least 2 trades (meaningful pattern)
  const groups = Array.from(tickerMap.values()).filter(
    (g) => g.trades.length >= 2
  );

  // Sort by trade count descending
  groups.sort((a, b) => b.stats.totalTrades - a.stats.totalTrades);

  return groups;
}

/**
 * Generates a thesis suggestion for a ticker group using AI
 */
export async function generateThesisSuggestion(
  group: TickerTradeGroup
): Promise<ThesisSuggestion | null> {
  if (!isClaudeConfigured()) {
    console.warn('Claude not configured, cannot generate thesis suggestion');
    return null;
  }

  // Build context from trades and entries
  const tradesSummary = group.trades.map((t) => {
    const outcome = t.outcome || 'unknown';
    const pnl = t.realizedPL !== null ? `$${t.realizedPL.toFixed(2)}` : 'N/A';
    return `- ${t.createdAt.toISOString().split('T')[0]}: ${outcome} (P/L: ${pnl}) - ${t.strategyType || 'unknown strategy'}${t.description ? `: ${t.description.slice(0, 100)}` : ''}`;
  }).join('\n');

  const entriesSummary = group.relatedEntries.slice(0, 5).map((e) => {
    const mood = e.mood || 'neutral';
    return `- ${e.createdAt.toISOString().split('T')[0]} (${e.entryType}, mood: ${mood}): "${e.content.slice(0, 200)}${e.content.length > 200 ? '...' : ''}"`;
  }).join('\n');

  const prompt = `Analyze this trader's activity on ${group.ticker} and suggest a trading thesis.

TRADES (${group.stats.totalTrades} total, ${group.stats.wins}W/${group.stats.losses}L/${group.stats.breakevens}BE):
${tradesSummary}

${group.relatedEntries.length > 0 ? `RELATED JOURNAL ENTRIES:\n${entriesSummary}` : 'No related journal entries found.'}

Based on this activity:
1. What appears to be the trader's view/thesis on ${group.ticker}?
2. Is their approach bullish, bearish, neutral (range-bound), or volatile (expecting big moves)?
3. How confident are you in this interpretation?

Return JSON:
{
  "suggestedName": "Short descriptive name for this thesis (max 50 chars)",
  "thesisText": "A 1-2 sentence thesis summarizing the trader's apparent view and strategy",
  "direction": "BULLISH" | "BEARISH" | "NEUTRAL" | "VOLATILE",
  "confidence": 0.0 to 1.0 (how confident you are in this interpretation),
  "reasoning": "Brief explanation of why you interpreted their activity this way"
}

Return ONLY the JSON object, no markdown.`;

  try {
    const claude = getClaude();

    const response = await claude.messages.create({
      model: CLAUDE_MODELS.FAST,
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const parsed = parseJsonResponse<z.infer<typeof thesisSuggestionSchema>>(response);

    if (!parsed) {
      console.error('Failed to parse thesis suggestion response');
      return null;
    }

    // Validate with Zod
    const validated = thesisSuggestionSchema.safeParse(parsed);
    if (!validated.success) {
      console.error('Thesis suggestion validation failed:', validated.error);
      return null;
    }

    return {
      ticker: group.ticker,
      suggestedName: validated.data.suggestedName,
      thesisText: validated.data.thesisText,
      direction: validated.data.direction,
      confidence: validated.data.confidence,
      reasoning: validated.data.reasoning,
      sourcedFrom: {
        tradeIds: group.trades.map((t) => t.id),
        entryIds: group.relatedEntries.map((e) => e.id),
      },
      stats: group.stats,
    };
  } catch (error) {
    console.error('Error generating thesis suggestion:', error);
    return null;
  }
}

/**
 * Generates thesis suggestions for all unassigned trade groups
 */
export async function generateAllThesisSuggestions(
  groups: TickerTradeGroup[],
  maxSuggestions: number = 5
): Promise<ThesisSuggestion[]> {
  const suggestions: ThesisSuggestion[] = [];

  // Limit to top groups by trade count
  const topGroups = groups.slice(0, maxSuggestions);

  // Generate suggestions in parallel (with concurrency limit)
  const results = await Promise.allSettled(
    topGroups.map((group) => generateThesisSuggestion(group))
  );

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      suggestions.push(result.value);
    }
  }

  // Sort by confidence descending
  suggestions.sort((a, b) => b.confidence - a.confidence);

  return suggestions;
}

/**
 * Quick suggestion based on simple heuristics (no AI)
 * Used when AI is unavailable or for immediate feedback
 */
export function generateQuickSuggestion(
  group: TickerTradeGroup
): ThesisSuggestion {
  const { ticker, stats } = group;

  // Determine direction based on outcomes
  let direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'VOLATILE';
  let confidence: number;

  const winRate = stats.totalTrades > 0 ? stats.wins / stats.totalTrades : 0;
  const lossRate = stats.totalTrades > 0 ? stats.losses / stats.totalTrades : 0;

  // Check entry sentiments
  const sentiments = group.relatedEntries
    .map((e) => e.sentiment)
    .filter(Boolean);
  const bullishEntries = sentiments.filter((s) => s === 'positive').length;
  const bearishEntries = sentiments.filter((s) => s === 'negative').length;

  if (winRate >= 0.6 && bullishEntries > bearishEntries) {
    direction = 'BULLISH';
    confidence = Math.min(0.7, winRate);
  } else if (lossRate >= 0.6 || bearishEntries > bullishEntries * 2) {
    direction = 'BEARISH';
    confidence = Math.min(0.6, lossRate);
  } else if (winRate < 0.4 && lossRate < 0.4) {
    direction = 'NEUTRAL';
    confidence = 0.4;
  } else {
    direction = 'VOLATILE';
    confidence = 0.3;
  }

  // Generate name based on activity
  const daysBetween = Math.ceil(
    (stats.dateRange.last.getTime() - stats.dateRange.first.getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const isShortTerm = daysBetween < 14;

  const suggestedName = `${ticker} ${direction.toLowerCase()} ${isShortTerm ? 'swing' : 'position'}`;

  // Generate thesis text
  const pnlText = stats.totalPnL
    ? ` Total P/L: $${stats.totalPnL.toFixed(2)}.`
    : '';
  const thesisText = `${direction.charAt(0)}${direction.slice(1).toLowerCase()} on ${ticker} based on ${stats.totalTrades} trades (${stats.wins}W/${stats.losses}L).${pnlText}`;

  return {
    ticker,
    suggestedName,
    thesisText,
    direction,
    confidence,
    reasoning: `Based on ${stats.totalTrades} trades with ${Math.round(winRate * 100)}% win rate and ${group.relatedEntries.length} related journal entries.`,
    sourcedFrom: {
      tradeIds: group.trades.map((t) => t.id),
      entryIds: group.relatedEntries.map((e) => e.id),
    },
    stats,
  };
}

/**
 * Gets thesis suggestions with fallback to quick suggestions
 */
export async function getThesisSuggestions(
  trades: TradeForAnalysis[],
  entries: EntryForAnalysis[],
  options: {
    useAI?: boolean;
    maxSuggestions?: number;
  } = {}
): Promise<ThesisSuggestion[]> {
  const { useAI = true, maxSuggestions = 5 } = options;

  // Group trades by ticker
  const groups = groupTradesByTicker(trades, entries);

  if (groups.length === 0) {
    return [];
  }

  // If AI is enabled and configured, use it
  if (useAI && isClaudeConfigured()) {
    const aiSuggestions = await generateAllThesisSuggestions(
      groups,
      maxSuggestions
    );

    // If we got AI suggestions, return them
    if (aiSuggestions.length > 0) {
      return aiSuggestions;
    }
  }

  // Fall back to quick suggestions
  return groups.slice(0, maxSuggestions).map(generateQuickSuggestion);
}
