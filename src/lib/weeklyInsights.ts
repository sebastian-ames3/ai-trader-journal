/**
 * Weekly Insights Analytics Service
 *
 * Aggregates and analyzes journal data to generate personalized weekly insights:
 * - Entry/trade statistics
 * - Emotional trends
 * - Pattern detection
 * - Personalized feedback
 * - Week-over-week comparisons
 * - Behavioral patterns (Phase 2)
 */

import { prisma } from './prisma';
import { Entry, PatternType, Trend } from '@prisma/client';
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';

// Type for entries with optional trade relation
type EntryWithTrade = Entry & {
  trade?: {
    id: string;
    status: string;
    entryPrice: number | null;
    exitPrice: number | null;
  } | null;
};

export interface WeeklyInsights {
  weekStart: string;
  weekEnd: string;

  // Basic statistics
  stats: {
    totalEntries: number;
    totalTrades: number;
    tradeIdeas: number;
    reflections: number;
    observations: number;
  };

  // Emotional analysis
  emotional: {
    dominantSentiment: 'positive' | 'negative' | 'neutral' | null;
    sentimentBreakdown: {
      positive: number;
      negative: number;
      neutral: number;
    };
    topEmotions: Array<{ emotion: string; count: number }>;
    moodFrequency: Array<{ mood: string; count: number }>;
  };

  // Cognitive patterns
  patterns: {
    detectedBiases: Array<{ bias: string; count: number }>;
    convictionDistribution: {
      high: number;
      medium: number;
      low: number;
    };
  };

  // Personalized insights
  insights: string[];

  // Week-over-week comparison
  comparison?: {
    entriesChange: number; // % change
    sentimentChange: 'improving' | 'declining' | 'stable';
    newBiases: string[];
  };

  // Behavioral patterns (Phase 2)
  behavioralPatterns?: {
    activePatterns: Array<{
      id: string;
      patternType: PatternType;
      patternName: string;
      description: string;
      occurrences: number;
      trend: Trend;
      confidence: number;
    }>;
    patternBreakingMessage?: string;
  };
}

/**
 * Generate weekly insights for a specific week
 * @param weekOffset - 0 for current week, -1 for last week, etc.
 */
export async function generateWeeklyInsights(
  weekOffset: number = 0,
  userId?: string
): Promise<WeeklyInsights> {

  // Calculate date range for the target week
  const now = new Date();
  const targetDate = subWeeks(now, Math.abs(weekOffset));
  const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 }); // Sunday

  // Fetch all entries for the week (filtered by user if provided)
  const entries = await prisma.entry.findMany({
    where: {
      createdAt: {
        gte: weekStart,
        lte: weekEnd
      },
      ...(userId && { userId })
    },
    include: {
      trade: {
        select: {
          id: true,
          status: true,
          entryPrice: true,
          exitPrice: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Calculate basic statistics
  const stats = {
    totalEntries: entries.length,
    totalTrades: entries.filter(e => e.type === 'DECISION').length,
    tradeIdeas: entries.filter(e => e.type === 'IDEA').length,
    reflections: entries.filter(e => e.type === 'REFLECTION').length,
    observations: entries.filter(e => e.type === 'OBSERVATION').length
  };

  // Analyze emotional data
  const emotional = analyzeEmotionalTrends(entries);

  // Analyze cognitive patterns
  const patterns = analyzeCognitivePatterns(entries);

  // Generate personalized insights
  const insights = generatePersonalizedInsights(entries, emotional, patterns);

  // Get comparison with previous week if requested for current week
  let comparison;
  if (weekOffset === 0) {
    comparison = await generateWeekComparison(entries, weekStart, userId);
  }

  // Get behavioral patterns (Phase 2)
  const behavioralPatterns = await getBehavioralPatterns();

  return {
    weekStart: format(weekStart, 'yyyy-MM-dd'),
    weekEnd: format(weekEnd, 'yyyy-MM-dd'),
    stats,
    emotional,
    patterns,
    insights,
    comparison,
    behavioralPatterns
  };
}

/**
 * Analyzes emotional trends from entries
 */
function analyzeEmotionalTrends(entries: EntryWithTrade[]): WeeklyInsights['emotional'] {
  // Count sentiment distribution
  const sentimentCounts = {
    positive: entries.filter(e => e.sentiment === 'positive').length,
    negative: entries.filter(e => e.sentiment === 'negative').length,
    neutral: entries.filter(e => e.sentiment === 'neutral').length
  };

  // Determine dominant sentiment
  let dominantSentiment: 'positive' | 'negative' | 'neutral' | null = null;
  if (entries.length > 0) {
    const max = Math.max(sentimentCounts.positive, sentimentCounts.negative, sentimentCounts.neutral);
    if (max === sentimentCounts.positive) dominantSentiment = 'positive';
    else if (max === sentimentCounts.negative) dominantSentiment = 'negative';
    else dominantSentiment = 'neutral';
  }

  // Aggregate emotional keywords
  const emotionFrequency = new Map<string, number>();
  entries.forEach(entry => {
    if (entry.emotionalKeywords && Array.isArray(entry.emotionalKeywords)) {
      entry.emotionalKeywords.forEach((emotion: string) => {
        emotionFrequency.set(emotion, (emotionFrequency.get(emotion) || 0) + 1);
      });
    }
  });

  const topEmotions = Array.from(emotionFrequency.entries())
    .map(([emotion, count]) => ({ emotion, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5 emotions

  // Count mood frequency
  const moodFrequency = new Map<string, number>();
  entries.forEach(entry => {
    if (entry.mood) {
      moodFrequency.set(entry.mood, (moodFrequency.get(entry.mood) || 0) + 1);
    }
  });

  const moodFrequencyArray = Array.from(moodFrequency.entries())
    .map(([mood, count]) => ({ mood, count }))
    .sort((a, b) => b.count - a.count);

  return {
    dominantSentiment,
    sentimentBreakdown: sentimentCounts,
    topEmotions,
    moodFrequency: moodFrequencyArray
  };
}

/**
 * Analyzes cognitive patterns and biases
 */
function analyzeCognitivePatterns(entries: EntryWithTrade[]): WeeklyInsights['patterns'] {
  // Aggregate detected biases
  const biasFrequency = new Map<string, number>();
  entries.forEach(entry => {
    if (entry.detectedBiases && Array.isArray(entry.detectedBiases)) {
      entry.detectedBiases.forEach((bias: string) => {
        biasFrequency.set(bias, (biasFrequency.get(bias) || 0) + 1);
      });
    }
  });

  const detectedBiases = Array.from(biasFrequency.entries())
    .map(([bias, count]) => ({ bias, count }))
    .sort((a, b) => b.count - a.count);

  // Count conviction distribution
  const convictionDistribution = {
    high: entries.filter(e => e.conviction === 'HIGH' || e.convictionInferred === 'HIGH').length,
    medium: entries.filter(e => e.conviction === 'MEDIUM' || e.convictionInferred === 'MEDIUM').length,
    low: entries.filter(e => e.conviction === 'LOW' || e.convictionInferred === 'LOW').length
  };

  return {
    detectedBiases,
    convictionDistribution
  };
}

/**
 * Generates personalized insights based on patterns
 */
function generatePersonalizedInsights(
  entries: EntryWithTrade[],
  emotional: WeeklyInsights['emotional'],
  patterns: WeeklyInsights['patterns']
): string[] {
  const insights: string[] = [];

  if (entries.length === 0) {
    insights.push("No journal entries this week. Start journaling to see personalized insights!");
    return insights;
  }

  // Insight: Dominant sentiment
  if (emotional.dominantSentiment === 'positive') {
    insights.push(`Your mindset was predominantly positive this week (${emotional.sentimentBreakdown.positive} positive entries).`);
  } else if (emotional.dominantSentiment === 'negative') {
    insights.push(`You experienced more negative emotions this week (${emotional.sentimentBreakdown.negative} negative entries). Consider what triggered these feelings.`);
  }

  // Insight: Top emotion
  if (emotional.topEmotions.length > 0) {
    const topEmotion = emotional.topEmotions[0];
    insights.push(`"${topEmotion.emotion}" appeared ${topEmotion.count} times in your entries this week.`);
  }

  // Insight: Most common bias
  if (patterns.detectedBiases.length > 0) {
    const topBias = patterns.detectedBiases[0];
    const biasName = topBias.bias.replace(/_/g, ' ');
    insights.push(`Watch out for ${biasName} - detected ${topBias.count} times this week.`);
  }

  // Insight: Conviction patterns
  const totalConviction = patterns.convictionDistribution.high +
                         patterns.convictionDistribution.medium +
                         patterns.convictionDistribution.low;

  if (totalConviction > 0) {
    const highPercent = Math.round((patterns.convictionDistribution.high / totalConviction) * 100);
    if (highPercent > 60) {
      insights.push(`You had high conviction on ${highPercent}% of your entries. Track how these trades perform!`);
    } else if (highPercent < 20) {
      insights.push(`Only ${highPercent}% of entries showed high conviction. Are you waiting for better setups?`);
    }
  }

  // Insight: Journaling consistency
  if (entries.length >= 5) {
    insights.push(`Great consistency! You made ${entries.length} journal entries this week.`);
  } else if (entries.length < 3) {
    insights.push(`Only ${entries.length} entries this week. More frequent journaling reveals better patterns.`);
  }

  return insights;
}

/**
 * Generates week-over-week comparison
 */
async function generateWeekComparison(
  currentEntries: EntryWithTrade[],
  currentWeekStart: Date,
  userId?: string
): Promise<WeeklyInsights['comparison']> {

  // Get previous week's data
  const prevWeekStart = subWeeks(currentWeekStart, 1);
  const prevWeekEnd = endOfWeek(prevWeekStart, { weekStartsOn: 1 });

  const prevEntries = await prisma.entry.findMany({
    where: {
      createdAt: {
        gte: prevWeekStart,
        lte: prevWeekEnd
      },
      ...(userId && { userId })
    }
  });

  // Calculate entry change percentage
  const entriesChange = prevEntries.length === 0
    ? 100
    : Math.round(((currentEntries.length - prevEntries.length) / prevEntries.length) * 100);

  // Compare sentiment
  const currentPositive = currentEntries.filter(e => e.sentiment === 'positive').length;
  const currentNegative = currentEntries.filter(e => e.sentiment === 'negative').length;
  const prevPositive = prevEntries.filter(e => e.sentiment === 'positive').length;
  const prevNegative = prevEntries.filter(e => e.sentiment === 'negative').length;

  let sentimentChange: 'improving' | 'declining' | 'stable' = 'stable';
  if (currentPositive > prevPositive && currentNegative < prevNegative) {
    sentimentChange = 'improving';
  } else if (currentPositive < prevPositive && currentNegative > prevNegative) {
    sentimentChange = 'declining';
  }

  // Find new biases not present last week
  const currentBiases = new Set<string>();
  currentEntries.forEach(e => {
    if (e.detectedBiases) {
      e.detectedBiases.forEach((b: string) => currentBiases.add(b));
    }
  });

  const prevBiases = new Set<string>();
  prevEntries.forEach(e => {
    if (e.detectedBiases) {
      e.detectedBiases.forEach((b: string) => prevBiases.add(b));
    }
  });

  const newBiases = Array.from(currentBiases).filter(b => !prevBiases.has(b));

  return {
    entriesChange,
    sentimentChange,
    newBiases
  };
}

/**
 * Gets active behavioral patterns for weekly insights (Phase 2)
 */
async function getBehavioralPatterns(): Promise<WeeklyInsights['behavioralPatterns']> {
  // Get active patterns
  const activePatterns = await prisma.patternInsight.findMany({
    where: {
      isActive: true,
      isDismissed: false,
    },
    orderBy: [
      { confidence: 'desc' },
      { occurrences: 'desc' }
    ],
    take: 5  // Top 5 patterns
  });

  if (activePatterns.length === 0) {
    return undefined;
  }

  // Check for pattern-breaking behavior
  let patternBreakingMessage: string | undefined;

  // Check if there's a recent entry during a market downturn
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayEntry = await prisma.entry.findFirst({
    where: {
      createdAt: { gte: today }
    }
  });

  const marketCondition = await prisma.marketCondition.findFirst({
    where: {
      date: { gte: today }
    }
  });

  // Check for drawdown_silence pattern breaking
  const hasDrawdownSilencePattern = activePatterns.some(
    p => p.patternName === 'drawdown_silence'
  );

  if (
    hasDrawdownSilencePattern &&
    todayEntry &&
    marketCondition &&
    marketCondition.spyChange <= -2
  ) {
    patternBreakingMessage = `Market down ${Math.abs(marketCondition.spyChange).toFixed(1)}% today, but you journaled anyway! This is how habits change.`;
  }

  return {
    activePatterns: activePatterns.map(p => ({
      id: p.id,
      patternType: p.patternType,
      patternName: p.patternName,
      description: p.description,
      occurrences: p.occurrences,
      trend: p.trend,
      confidence: p.confidence
    })),
    patternBreakingMessage
  };
}
