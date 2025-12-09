/**
 * Pattern Recognition Engine
 *
 * Analyzes journal entries over time to identify recurring behavioral patterns.
 *
 * Uses Claude models:
 * - Opus for complex pattern detection (deep analysis)
 * - Haiku for real-time similarity checks and quick insights
 */

import { prisma } from '@/lib/prisma';
import { PatternType, Trend } from '@prisma/client';
import {
  getClaude,
  CLAUDE_MODELS,
  parseJsonResponse,
  extractTextContent,
  isClaudeConfigured,
} from '@/lib/claude';

// Types for pattern analysis
export interface PatternDetectionResult {
  patternType: PatternType;
  patternName: string;
  description: string;
  occurrences: number;
  evidence: string[];
  trend: Trend;
  confidence: number;
  relatedEntryIds: string[];
  outcomeData?: {
    winRate?: number;
    avgReturn?: number;
    sampleSize?: number;
  };
}

export interface PatternAlert {
  message: string;
  similarEntries: Array<{
    id: string;
    content: string;
    createdAt: Date;
    sentiment?: string | null;
  }>;
  patternType?: string;
}

export interface MonthlyReport {
  month: string;
  entryCount: number;
  biasDistribution: Record<string, number>;
  convictionDistribution: Record<string, number>;
  moodDistribution: Record<string, number>;
  marketConditionBehavior: {
    upDays: { entryCount: number; avgSentiment: string };
    downDays: { entryCount: number; avgSentiment: string };
  };
  topPatterns: PatternDetectionResult[];
  keyInsight: string;
}

// Minimum entries required for pattern detection
const MIN_ENTRIES_FOR_PATTERNS = 20;
const MIN_OCCURRENCES_FOR_PATTERN = 3;

/**
 * Run full pattern analysis on recent entries
 */
export async function analyzePatterns(): Promise<PatternDetectionResult[]> {
  // Fetch entries from last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const entries = await prisma.entry.findMany({
    where: {
      createdAt: { gte: ninetyDaysAgo },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      trade: {
        select: {
          realizedPL: true,
          currentPLPercent: true,
        },
      },
    },
  });

  if (entries.length < MIN_ENTRIES_FOR_PATTERNS) {
    console.log(`Not enough entries for pattern analysis (${entries.length}/${MIN_ENTRIES_FOR_PATTERNS})`);
    return [];
  }

  // Get market conditions for correlation
  const marketConditions = await prisma.marketCondition.findMany({
    where: {
      date: { gte: ninetyDaysAgo },
    },
    orderBy: { date: 'desc' },
  });

  // Run Claude analysis
  const patterns = await detectPatternsWithClaude(entries, marketConditions);

  // Filter patterns with sufficient occurrences
  const validPatterns = patterns.filter(
    (p) => p.occurrences >= MIN_OCCURRENCES_FOR_PATTERN
  );

  // Store patterns in database
  for (const pattern of validPatterns) {
    await upsertPattern(pattern);
  }

  return validPatterns;
}

/**
 * Use Claude Opus to detect patterns in entries
 */
async function detectPatternsWithClaude(
  entries: Array<{
    id: string;
    type: string;
    content: string;
    mood: string | null;
    conviction: string | null;
    sentiment: string | null;
    detectedBiases: string[];
    emotionalKeywords: string[];
    createdAt: Date;
    trade?: { realizedPL: number | null; currentPLPercent: number | null } | null;
  }>,
  marketConditions: Array<{
    date: Date;
    spyChange: number;
    vixLevel: number;
    marketState: string;
  }>
): Promise<PatternDetectionResult[]> {
  if (!isClaudeConfigured()) {
    console.warn('ANTHROPIC_API_KEY not configured, skipping pattern detection');
    return [];
  }

  // Build market condition map by date
  const marketByDate = new Map<string, (typeof marketConditions)[0]>();
  for (const mc of marketConditions) {
    const dateKey = mc.date.toISOString().split('T')[0];
    marketByDate.set(dateKey, mc);
  }

  // Prepare entry summaries with market context
  const entrySummaries = entries.map((e) => {
    const dateKey = e.createdAt.toISOString().split('T')[0];
    const market = marketByDate.get(dateKey);

    return {
      id: e.id,
      date: e.createdAt.toISOString(),
      type: e.type,
      mood: e.mood,
      conviction: e.conviction,
      sentiment: e.sentiment,
      biases: e.detectedBiases,
      keywords: e.emotionalKeywords,
      content: e.content.substring(0, 500), // Truncate for token efficiency
      marketState: market?.marketState || 'UNKNOWN',
      spyChange: market?.spyChange || 0,
      vixLevel: market?.vixLevel || 0,
      outcome: e.trade?.realizedPL,
    };
  });

  try {
    const claude = getClaude();

    const response = await claude.messages.create({
      model: CLAUDE_MODELS.DEEP, // Opus for complex pattern analysis
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `Analyze these ${entries.length} journal entries for behavioral patterns:

${JSON.stringify(entrySummaries, null, 2)}

Return JSON in this exact format:
{
  "patterns": [
    {
      "patternType": "TIMING|CONVICTION|EMOTIONAL|MARKET_CONDITION|BIAS_FREQUENCY",
      "patternName": "snake_case_name",
      "description": "Clear description of the pattern",
      "occurrences": number,
      "evidence": ["Quote 1", "Quote 2"],
      "trend": "INCREASING|STABLE|DECREASING",
      "confidence": 0.0-1.0,
      "relatedEntryIds": ["id1", "id2"],
      "outcomeData": { "winRate": 0.35, "avgReturn": -2.1, "sampleSize": 10 }
    }
  ]
}`,
        },
      ],
      system: `You are analyzing a trader's journal entries to identify behavioral patterns.

Look for these specific pattern categories:
1. TIMING - Early profit taking, late loss cutting, FOMO entries, panic exits, revenge trading
2. CONVICTION - Low conviction leading to early exits, conviction decay over time
3. EMOTIONAL - Anxious during drawdowns, euphoric during rallies, frustrated leading to revenge trades
4. MARKET_CONDITION - Different behavior during corrections vs rallies, volatility response
5. BIAS_FREQUENCY - Recurring cognitive biases (loss aversion, confirmation bias, anchoring, etc.)

For each pattern:
- Provide specific evidence from entries
- Calculate confidence (0-1) based on consistency
- Note if pattern is INCREASING, STABLE, or DECREASING
- Include outcome data if trades are present

Respond with valid JSON only, no markdown formatting.`,
    });

    const result = parseJsonResponse<{ patterns: PatternDetectionResult[] }>(response);

    if (!result?.patterns) {
      console.error('No patterns in Claude response');
      return [];
    }

    return result.patterns.map((p) => ({
      ...p,
      patternType: p.patternType as PatternType,
      trend: p.trend as Trend,
    }));
  } catch (error) {
    console.error('Failed to detect patterns with Claude:', error);
    return [];
  }
}

/**
 * Upsert a pattern in the database
 */
async function upsertPattern(pattern: PatternDetectionResult): Promise<void> {
  const existing = await prisma.patternInsight.findFirst({
    where: {
      patternName: pattern.patternName,
      isActive: true,
    },
  });

  if (existing) {
    await prisma.patternInsight.update({
      where: { id: existing.id },
      data: {
        description: pattern.description,
        occurrences: pattern.occurrences,
        trend: pattern.trend,
        confidence: pattern.confidence,
        relatedEntryIds: pattern.relatedEntryIds,
        evidence: pattern.evidence,
        outcomeData: pattern.outcomeData
          ? JSON.parse(JSON.stringify(pattern.outcomeData))
          : undefined,
        lastUpdated: new Date(),
      },
    });
  } else {
    await prisma.patternInsight.create({
      data: {
        patternType: pattern.patternType,
        patternName: pattern.patternName,
        description: pattern.description,
        occurrences: pattern.occurrences,
        trend: pattern.trend,
        confidence: pattern.confidence,
        relatedEntryIds: pattern.relatedEntryIds,
        evidence: pattern.evidence,
        outcomeData: pattern.outcomeData
          ? JSON.parse(JSON.stringify(pattern.outcomeData))
          : undefined,
      },
    });
  }
}

/**
 * Check draft content for pattern matches (real-time)
 */
export async function checkForPatternMatch(
  draftContent: string
): Promise<PatternAlert | null> {
  if (draftContent.length < 20) {
    return null;
  }

  if (!isClaudeConfigured()) {
    return null;
  }

  // Find entries with negative outcomes or sentiment
  const negativeEntries = await prisma.entry.findMany({
    where: {
      OR: [
        { sentiment: 'negative' },
        { detectedBiases: { hasSome: ['fomo', 'confirmation_bias', 'overconfidence'] } },
      ],
    },
    select: {
      id: true,
      content: true,
      createdAt: true,
      sentiment: true,
      detectedBiases: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  if (negativeEntries.length === 0) {
    return null;
  }

  try {
    const claude = getClaude();

    // Use Haiku for fast similarity check
    const response = await claude.messages.create({
      model: CLAUDE_MODELS.FAST, // Haiku for fast checks
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `Current draft: "${draftContent}"

Past entries with negative outcomes:
${negativeEntries
  .map(
    (e) =>
      `ID: ${e.id} | Date: ${e.createdAt.toISOString().split('T')[0]} | Biases: ${e.detectedBiases.join(', ')} | Content: "${e.content.substring(0, 200)}..."`
  )
  .join('\n')}

Return JSON: { "alert": "Your message here" or null, "matchingEntryIds": ["id1", "id2"] }`,
        },
      ],
      system: `You help traders recognize when they might be repeating past mistakes.
Compare the current draft to past entries that had negative outcomes.
If there are concerning similarities, provide a brief, empathetic alert.
Return JSON with "alert" (string or null) and "matchingEntryIds" (array of IDs).
Respond with valid JSON only, no markdown.`,
    });

    const result = parseJsonResponse<{
      alert: string | null;
      matchingEntryIds: string[];
    }>(response);

    if (!result?.alert || !result?.matchingEntryIds?.length) {
      return null;
    }

    const matchingEntries = negativeEntries.filter((e) =>
      result.matchingEntryIds.includes(e.id)
    );

    return {
      message: result.alert,
      similarEntries: matchingEntries.map((e) => ({
        id: e.id,
        content: e.content,
        createdAt: e.createdAt,
        sentiment: e.sentiment,
      })),
      patternType: 'HISTORICAL_MATCH',
    };
  } catch (error) {
    console.error('Pattern match check failed:', error);
    return null;
  }
}

/**
 * Get all active patterns
 */
export async function getActivePatterns() {
  return prisma.patternInsight.findMany({
    where: {
      isActive: true,
      isDismissed: false,
    },
    orderBy: [{ confidence: 'desc' }, { occurrences: 'desc' }],
  });
}

/**
 * Get pattern by ID with related entries
 */
export async function getPatternWithEntries(patternId: string) {
  const pattern = await prisma.patternInsight.findUnique({
    where: { id: patternId },
  });

  if (!pattern) {
    return null;
  }

  const relatedEntries = await prisma.entry.findMany({
    where: {
      id: { in: pattern.relatedEntryIds },
    },
    orderBy: { createdAt: 'desc' },
  });

  return {
    ...pattern,
    entries: relatedEntries,
  };
}

/**
 * Dismiss a pattern
 */
export async function dismissPattern(patternId: string): Promise<void> {
  await prisma.patternInsight.update({
    where: { id: patternId },
    data: { isDismissed: true },
  });
}

/**
 * Generate monthly behavioral report
 */
export async function generateMonthlyReport(
  year: number,
  month: number
): Promise<MonthlyReport> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // Fetch entries for the month
  const entries = await prisma.entry.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // Fetch market conditions for the month
  const marketConditions = await prisma.marketCondition.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // Calculate distributions
  const biasDistribution: Record<string, number> = {};
  const convictionDistribution: Record<string, number> = {};
  const moodDistribution: Record<string, number> = {};

  for (const entry of entries) {
    // Bias distribution
    for (const bias of entry.detectedBiases) {
      biasDistribution[bias] = (biasDistribution[bias] || 0) + 1;
    }

    // Conviction distribution
    if (entry.conviction) {
      convictionDistribution[entry.conviction] =
        (convictionDistribution[entry.conviction] || 0) + 1;
    }

    // Mood distribution
    if (entry.mood) {
      moodDistribution[entry.mood] = (moodDistribution[entry.mood] || 0) + 1;
    }
  }

  // Calculate market condition behavior
  const marketByDate = new Map<string, (typeof marketConditions)[0]>();
  for (const mc of marketConditions) {
    const dateKey = mc.date.toISOString().split('T')[0];
    marketByDate.set(dateKey, mc);
  }

  let upDayEntries = 0;
  let downDayEntries = 0;
  let upDayPositive = 0;
  let downDayNegative = 0;

  for (const entry of entries) {
    const dateKey = entry.createdAt.toISOString().split('T')[0];
    const market = marketByDate.get(dateKey);

    if (market?.marketState === 'UP') {
      upDayEntries++;
      if (entry.sentiment === 'positive') upDayPositive++;
    } else if (market?.marketState === 'DOWN') {
      downDayEntries++;
      if (entry.sentiment === 'negative') downDayNegative++;
    }
  }

  // Get patterns for this period
  const patterns = await prisma.patternInsight.findMany({
    where: {
      isActive: true,
      lastUpdated: {
        gte: startDate,
      },
    },
    orderBy: { confidence: 'desc' },
    take: 5,
  });

  // Generate key insight with Claude Haiku
  const keyInsight = await generateKeyInsight(entries, biasDistribution, patterns);

  const monthName = startDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  return {
    month: monthName,
    entryCount: entries.length,
    biasDistribution,
    convictionDistribution,
    moodDistribution,
    marketConditionBehavior: {
      upDays: {
        entryCount: upDayEntries,
        avgSentiment:
          upDayEntries > 0
            ? upDayPositive / upDayEntries > 0.5
              ? 'positive'
              : 'neutral'
            : 'unknown',
      },
      downDays: {
        entryCount: downDayEntries,
        avgSentiment:
          downDayEntries > 0
            ? downDayNegative / downDayEntries > 0.5
              ? 'negative'
              : 'neutral'
            : 'unknown',
      },
    },
    topPatterns: patterns.map((p) => ({
      patternType: p.patternType,
      patternName: p.patternName,
      description: p.description,
      occurrences: p.occurrences,
      evidence: p.evidence,
      trend: p.trend,
      confidence: p.confidence,
      relatedEntryIds: p.relatedEntryIds,
      outcomeData: p.outcomeData as PatternDetectionResult['outcomeData'],
    })),
    keyInsight,
  };
}

/**
 * Generate a key insight for the monthly report
 */
async function generateKeyInsight(
  entries: Array<{ content: string; detectedBiases: string[] }>,
  biasDistribution: Record<string, number>,
  patterns: Array<{ patternName: string; description: string }>
): Promise<string> {
  if (entries.length < 5) {
    return 'Keep journaling to unlock behavioral insights.';
  }

  if (!isClaudeConfigured()) {
    return 'Keep journaling to unlock behavioral insights.';
  }

  const topBias =
    Object.entries(biasDistribution).sort(([, a], [, b]) => b - a)[0]?.[0] || 'none';

  try {
    const claude = getClaude();

    const response = await claude.messages.create({
      model: CLAUDE_MODELS.FAST, // Haiku for quick insight
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: `Generate one key behavioral insight (1-2 sentences) for a trader based on:
- ${entries.length} journal entries this month
- Most common bias: ${topBias} (${biasDistribution[topBias] || 0} occurrences)
- Detected patterns: ${patterns.map((p) => p.patternName).join(', ') || 'none yet'}

Be specific, actionable, and empathetic. Don't be generic.`,
        },
      ],
    });

    return extractTextContent(response) || 'Keep journaling to unlock insights.';
  } catch (error) {
    console.error('Failed to generate key insight:', error);
    return 'Keep journaling to unlock insights.';
  }
}

/**
 * Analyze bias frequency from entries
 */
export async function analyzeBiasFrequency(): Promise<Record<string, number>> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const entries = await prisma.entry.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
    },
    select: {
      detectedBiases: true,
    },
  });

  const biasCount: Record<string, number> = {};

  for (const entry of entries) {
    for (const bias of entry.detectedBiases) {
      biasCount[bias] = (biasCount[bias] || 0) + 1;
    }
  }

  return biasCount;
}

/**
 * Check for pattern-breaking behavior
 */
export async function checkPatternBreaking(): Promise<string | null> {
  // Get active patterns that indicate negative behavior
  const negativePatterns = await prisma.patternInsight.findMany({
    where: {
      isActive: true,
      isDismissed: false,
      patternName: {
        in: ['drawdown_silence', 'fomo_trading', 'panic_selling', 'revenge_trading'],
      },
    },
  });

  if (negativePatterns.length === 0) {
    return null;
  }

  // Check for recent entries that break the pattern
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayEntry = await prisma.entry.findFirst({
    where: {
      createdAt: { gte: today },
    },
  });

  // Get today's market condition
  const marketCondition = await prisma.marketCondition.findFirst({
    where: {
      date: { gte: today },
    },
  });

  // Check for drawdown_silence pattern breaking
  const drawdownPattern = negativePatterns.find((p) => p.patternName === 'drawdown_silence');

  if (
    drawdownPattern &&
    todayEntry &&
    marketCondition &&
    marketCondition.spyChange <= -2
  ) {
    return `Market down ${Math.abs(marketCondition.spyChange).toFixed(1)}% today, but you journaled anyway! In the past, you'd go silent during corrections. Not today. This is how habits change.`;
  }

  return null;
}
