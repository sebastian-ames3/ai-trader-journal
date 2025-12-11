import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  isValidWidgetType,
  getWidgetDefinition,
  getDefaultWidgetConfig,
  WidgetType,
} from '@/lib/dashboard';
import { startOfWeek, endOfWeek, subDays } from 'date-fns';

interface RouteParams {
  params: { type: string };
}

/**
 * GET /api/dashboard/widgets/[type]
 * Get widget data for a specific widget type
 *
 * Query parameters:
 * - Various configuration options depending on widget type
 *
 * Returns widget-specific data based on type
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { type } = params;

    // Validate widget type
    if (!isValidWidgetType(type)) {
      return NextResponse.json(
        { error: `Invalid widget type: ${type}` },
        { status: 400 }
      );
    }

    const widgetType = type as WidgetType;
    const definition = getWidgetDefinition(widgetType);

    if (!definition) {
      return NextResponse.json(
        { error: 'Widget definition not found' },
        { status: 404 }
      );
    }

    // Get widget config from database or use defaults
    const storedConfig = await prisma.widgetConfig.findUnique({
      where: { widgetType: type },
    });

    const config = (storedConfig?.config as Record<string, unknown>) || getDefaultWidgetConfig(widgetType);

    // Parse query parameters for dynamic config
    const { searchParams } = new URL(request.url);

    // Fetch widget-specific data
    const data = await fetchWidgetData(widgetType, config as Record<string, unknown>, searchParams);

    return NextResponse.json({
      type: widgetType,
      definition,
      config,
      data,
    });
  } catch (error) {
    console.error('Error fetching widget data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch widget data' },
      { status: 500 }
    );
  }
}

/**
 * Fetch data specific to each widget type
 */
async function fetchWidgetData(
  type: WidgetType,
  config: Record<string, unknown>,
  searchParams: URLSearchParams
): Promise<unknown> {
  switch (type) {
    case 'STREAK':
      return fetchStreakData();

    case 'WEEKLY_INSIGHTS':
      return fetchWeeklyInsightsData(config, searchParams);

    case 'RECENT_ENTRIES':
      return fetchRecentEntriesData(config, searchParams);

    case 'MOOD_TREND':
      return fetchMoodTrendData(config, searchParams);

    case 'BIAS_TRACKER':
      return fetchBiasTrackerData(config, searchParams);

    case 'CONVICTION_ANALYSIS':
      return fetchConvictionAnalysisData(config);

    case 'OPEN_POSITIONS':
      return fetchOpenPositionsData(config, searchParams);

    case 'MARKET_CONDITIONS':
      return fetchMarketConditionsData();

    case 'GOALS_PROGRESS':
      return fetchGoalsProgressData(config);

    case 'TAG_CLOUD':
      return fetchTagCloudData(config, searchParams);

    case 'CALENDAR_HEATMAP':
      return fetchCalendarHeatmapData(config, searchParams);

    case 'COACH_PROMPT':
      return fetchCoachPromptData(config);

    case 'ACCOUNTABILITY':
      return fetchAccountabilityData();

    case 'QUICK_CAPTURE':
      // Quick capture doesn't need pre-fetched data
      return { ready: true };

    default:
      return null;
  }
}

async function fetchStreakData() {
  const settings = await prisma.settings.findUnique({
    where: { id: 'default' },
    select: {
      currentStreak: true,
      longestStreak: true,
      totalEntries: true,
      lastEntryDate: true,
    },
  });

  return settings || {
    currentStreak: 0,
    longestStreak: 0,
    totalEntries: 0,
    lastEntryDate: null,
  };
}

async function fetchWeeklyInsightsData(
  config: Record<string, unknown>,
  searchParams: URLSearchParams
) {
  const weekOffset = parseInt(
    searchParams.get('weekOffset') || String(config.weekOffset || 0),
    10
  );

  const now = new Date();
  const targetWeekStart = startOfWeek(subDays(now, Math.abs(weekOffset) * 7), {
    weekStartsOn: 1,
  });
  const targetWeekEnd = endOfWeek(targetWeekStart, { weekStartsOn: 1 });

  const entries = await prisma.entry.findMany({
    where: {
      createdAt: {
        gte: targetWeekStart,
        lte: targetWeekEnd,
      },
    },
    select: {
      type: true,
      sentiment: true,
      mood: true,
      emotionalKeywords: true,
      detectedBiases: true,
      conviction: true,
    },
  });

  // Calculate stats
  const stats = {
    totalEntries: entries.length,
    tradeIdeas: entries.filter((e) => e.type === 'TRADE_IDEA').length,
    trades: entries.filter((e) => e.type === 'TRADE').length,
    reflections: entries.filter((e) => e.type === 'REFLECTION').length,
    observations: entries.filter((e) => e.type === 'OBSERVATION').length,
  };

  // Sentiment breakdown
  const sentimentBreakdown = {
    positive: entries.filter((e) => e.sentiment === 'positive').length,
    negative: entries.filter((e) => e.sentiment === 'negative').length,
    neutral: entries.filter((e) => e.sentiment === 'neutral').length,
  };

  return {
    weekStart: targetWeekStart.toISOString(),
    weekEnd: targetWeekEnd.toISOString(),
    stats,
    sentimentBreakdown,
  };
}

async function fetchRecentEntriesData(
  config: Record<string, unknown>,
  searchParams: URLSearchParams
) {
  const limit = parseInt(
    searchParams.get('limit') || String(config.limit || 5),
    10
  );
  const filterType = searchParams.get('filterType') || config.filterType;

  const where: Record<string, unknown> = {};
  if (filterType && filterType !== 'ALL') {
    where.type = filterType;
  }

  const entries = await prisma.entry.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: Math.min(limit, 20),
    select: {
      id: true,
      type: true,
      content: true,
      mood: true,
      ticker: true,
      sentiment: true,
      createdAt: true,
    },
  });

  return { entries };
}

async function fetchMoodTrendData(
  config: Record<string, unknown>,
  searchParams: URLSearchParams
) {
  const timeRange = searchParams.get('timeRange') || String(config.timeRange || '7d');
  const days = parseInt(timeRange.replace('d', ''), 10);
  const startDate = subDays(new Date(), days);

  const entries = await prisma.entry.findMany({
    where: {
      createdAt: { gte: startDate },
      mood: { not: null },
    },
    select: {
      mood: true,
      sentiment: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Group by mood
  const moodCounts: Record<string, number> = {};
  entries.forEach((entry) => {
    if (entry.mood) {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    }
  });

  return {
    timeRange,
    moodDistribution: moodCounts,
    totalEntries: entries.length,
  };
}

async function fetchBiasTrackerData(
  config: Record<string, unknown>,
  searchParams: URLSearchParams
) {
  const timeRange = searchParams.get('timeRange') || String(config.timeRange || '30d');
  const topCount = parseInt(String(config.topBiasCount || 5), 10);
  const days = parseInt(timeRange.replace('d', ''), 10);
  const startDate = subDays(new Date(), days);

  const entries = await prisma.entry.findMany({
    where: {
      createdAt: { gte: startDate },
    },
    select: {
      detectedBiases: true,
    },
  });

  // Aggregate biases
  const biasCounts: Record<string, number> = {};
  entries.forEach((entry) => {
    if (entry.detectedBiases && Array.isArray(entry.detectedBiases)) {
      entry.detectedBiases.forEach((bias: string) => {
        biasCounts[bias] = (biasCounts[bias] || 0) + 1;
      });
    }
  });

  // Sort and take top N
  const topBiases = Object.entries(biasCounts)
    .map(([bias, count]) => ({ bias, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topCount);

  return {
    timeRange,
    biases: topBiases,
    totalEntries: entries.length,
  };
}

async function fetchConvictionAnalysisData(config: Record<string, unknown>) {
  const entries = await prisma.entry.findMany({
    where: {
      OR: [
        { conviction: { not: null } },
        { convictionInferred: { not: null } },
      ],
    },
    select: {
      conviction: true,
      convictionInferred: true,
    },
  });

  const distribution = {
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };

  entries.forEach((entry) => {
    const level = entry.conviction || entry.convictionInferred;
    if (level && level in distribution) {
      distribution[level as keyof typeof distribution]++;
    }
  });

  return {
    distribution,
    totalEntries: entries.length,
  };
}

async function fetchOpenPositionsData(
  config: Record<string, unknown>,
  searchParams: URLSearchParams
) {
  const sortBy = searchParams.get('sortBy') || config.sortBy || 'recent';

  const orderBy: Record<string, string> = {};
  if (sortBy === 'recent') {
    orderBy.startedAt = 'desc';
  } else if (sortBy === 'ticker') {
    orderBy.ticker = 'asc';
  }

  const theses = await prisma.tradingThesis.findMany({
    where: { status: 'ACTIVE' },
    orderBy,
    take: 10,
    include: {
      _count: {
        select: { thesisTrades: true },
      },
    },
  });

  return {
    theses: theses.map((t) => ({
      id: t.id,
      name: t.name,
      ticker: t.ticker,
      direction: t.direction,
      totalRealizedPL: t.totalRealizedPL,
      totalUnrealizedPL: t.totalUnrealizedPL,
      tradeCount: t._count.thesisTrades,
      startedAt: t.startedAt,
    })),
  };
}

async function fetchMarketConditionsData() {
  const latestCondition = await prisma.marketCondition.findFirst({
    orderBy: { date: 'desc' },
    select: {
      date: true,
      spyPrice: true,
      spyChange: true,
      vixLevel: true,
      vixChange: true,
      marketState: true,
    },
  });

  return latestCondition || null;
}

async function fetchGoalsProgressData(config: Record<string, unknown>) {
  const showCompleted = config.showCompleted === true;
  const limit = parseInt(String(config.limit || 3), 10);

  const where: Record<string, unknown> = showCompleted
    ? {}
    : { status: 'ACTIVE' };

  const goals = await prisma.coachGoal.findMany({
    where,
    orderBy: [
      { status: 'asc' },
      { startDate: 'desc' },
    ],
    take: limit,
    select: {
      id: true,
      goal: true,
      progress: true,
      status: true,
      timeframe: true,
      startDate: true,
      endDate: true,
    },
  });

  return { goals };
}

async function fetchTagCloudData(
  config: Record<string, unknown>,
  searchParams: URLSearchParams
) {
  const timeRange = searchParams.get('timeRange') || String(config.timeRange || '30d');
  const maxTags = parseInt(String(config.maxTags || 15), 10);

  let where: Record<string, unknown> = {};
  if (timeRange !== 'all') {
    const days = parseInt(timeRange.replace('d', ''), 10);
    where = {
      createdAt: { gte: subDays(new Date(), days) },
    };
  }

  const entries = await prisma.entry.findMany({
    where,
    select: {
      aiTags: true,
    },
  });

  // Aggregate tags
  const tagCounts: Record<string, number> = {};
  entries.forEach((entry) => {
    if (entry.aiTags && Array.isArray(entry.aiTags)) {
      entry.aiTags.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });

  // Sort and take top N
  const tags = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, maxTags);

  return { tags };
}

async function fetchCalendarHeatmapData(
  config: Record<string, unknown>,
  searchParams: URLSearchParams
) {
  const months = parseInt(String(config.months || 3), 10);
  const startDate = subDays(new Date(), months * 30);

  const entries = await prisma.entry.groupBy({
    by: ['createdAt'],
    where: {
      createdAt: { gte: startDate },
    },
    _count: true,
  });

  // Group by date (day)
  const dateMap: Record<string, number> = {};
  entries.forEach((e) => {
    const date = e.createdAt.toISOString().split('T')[0];
    dateMap[date] = (dateMap[date] || 0) + e._count;
  });

  const data = Object.entries(dateMap).map(([date, count]) => ({
    date,
    count,
  }));

  return { data };
}

async function fetchCoachPromptData(config: Record<string, unknown>) {
  const promptType = config.promptType || 'all';

  const where: Record<string, unknown> = { status: 'PENDING' };
  if (promptType !== 'all') {
    where.triggerType = promptType;
  }

  const prompts = await prisma.coachPrompt.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: {
      id: true,
      triggerType: true,
      message: true,
      createdAt: true,
    },
  });

  return { prompts };
}

async function fetchAccountabilityData() {
  const pairs = await prisma.accountabilityPair.findMany({
    where: { status: 'ACTIVE' },
    take: 5,
    select: {
      id: true,
      partnerName: true,
      shareStreak: true,
      shareEntryCount: true,
    },
  });

  return { pairs };
}
