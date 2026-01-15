import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/export
 * Export user data in JSON or CSV format
 *
 * Query params:
 * - format: 'json' (default) | 'csv'
 * - type: 'all' (default) | 'entries' | 'theses' | 'trades' | 'goals'
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'json';
    const type = searchParams.get('type') || 'all';

    // Validate format
    if (!['json', 'csv'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Use "json" or "csv"' },
        { status: 400 }
      );
    }

    // Fetch data based on type
    const data: ExportData = {
      exportedAt: new Date().toISOString(),
      userId: user.id,
    };

    if (type === 'all' || type === 'entries') {
      data.entries = await prisma.entry.findMany({
        where: { userId: user.id, deletedAt: null },
        select: {
          id: true,
          type: true,
          content: true,
          mood: true,
          conviction: true,
          ticker: true,
          sentiment: true,
          emotionalKeywords: true,
          detectedBiases: true,
          aiTags: true,
          convictionInferred: true,
          captureMethod: true,
          isOcrScanned: true,
          audioUrl: true,
          audioDuration: true,
          transcription: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (type === 'all' || type === 'theses') {
      data.theses = await prisma.tradingThesis.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          name: true,
          ticker: true,
          direction: true,
          originalThesis: true,
          status: true,
          outcome: true,
          lessonsLearned: true,
          totalRealizedPL: true,
          totalUnrealizedPL: true,
          totalCapitalDeployed: true,
          startedAt: true,
          closedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (type === 'all' || type === 'trades') {
      data.trades = await prisma.thesisTrade.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          action: true,
          description: true,
          strategyType: true,
          debitCredit: true,
          quantity: true,
          realizedPL: true,
          status: true,
          openedAt: true,
          closedAt: true,
          expiration: true,
          thesis: {
            select: {
              name: true,
              ticker: true,
            },
          },
        },
        orderBy: { openedAt: 'desc' },
      });
    }

    if (type === 'all' || type === 'goals') {
      data.goals = await prisma.coachGoal.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          goal: true,
          description: true,
          metricType: true,
          metricName: true,
          targetValue: true,
          currentValue: true,
          timeframe: true,
          status: true,
          progress: true,
          startDate: true,
          endDate: true,
          completedAt: true,
          reflection: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Return based on format
    if (format === 'json') {
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="trader-journal-export-${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    }

    // CSV format - flatten and convert to CSV
    const csvContent = convertToCSV(data, type);
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="trader-journal-${type}-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    );
  }
}

interface ExportData {
  exportedAt: string;
  userId: string;
  entries?: EntryExport[];
  theses?: ThesisExport[];
  trades?: TradeExport[];
  goals?: GoalExport[];
}

interface EntryExport {
  id: string;
  type: string;
  content: string;
  mood: string | null;
  conviction: string | null;
  ticker: string | null;
  sentiment: string | null;
  emotionalKeywords: string[];
  detectedBiases: string[];
  aiTags: string[];
  convictionInferred: string | null;
  captureMethod: string;
  isOcrScanned: boolean;
  audioUrl: string | null;
  audioDuration: number | null;
  transcription: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ThesisExport {
  id: string;
  name: string;
  ticker: string;
  direction: string;
  originalThesis: string;
  status: string;
  outcome: string | null;
  lessonsLearned: string | null;
  totalRealizedPL: number;
  totalUnrealizedPL: number;
  totalCapitalDeployed: number;
  startedAt: Date;
  closedAt: Date | null;
  createdAt: Date;
}

interface TradeExport {
  id: string;
  action: string;
  description: string;
  strategyType: string | null;
  debitCredit: number;
  quantity: number;
  realizedPL: number | null;
  status: string;
  openedAt: Date;
  closedAt: Date | null;
  expiration: Date | null;
  thesis: { name: string; ticker: string } | null;
}

interface GoalExport {
  id: string;
  goal: string;
  description: string | null;
  metricType: string | null;
  metricName: string | null;
  targetValue: number | null;
  currentValue: number | null;
  timeframe: string;
  status: string;
  progress: number;
  startDate: Date;
  endDate: Date | null;
  completedAt: Date | null;
  reflection: string | null;
}

/**
 * Convert export data to CSV format
 */
function convertToCSV(data: ExportData, type: string): string {
  if (type === 'entries' || (type === 'all' && data.entries)) {
    return entriesToCSV(data.entries || []);
  }
  if (type === 'theses' || (type === 'all' && data.theses && !data.entries)) {
    return thesesToCSV(data.theses || []);
  }
  if (type === 'trades' || (type === 'all' && data.trades && !data.entries && !data.theses)) {
    return tradesToCSV(data.trades || []);
  }
  if (type === 'goals') {
    return goalsToCSV(data.goals || []);
  }

  // For 'all' with CSV, default to entries (most common use case)
  return entriesToCSV(data.entries || []);
}

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function entriesToCSV(entries: EntryExport[]): string {
  const headers = [
    'id', 'type', 'content', 'mood', 'conviction', 'ticker',
    'sentiment', 'emotionalKeywords', 'detectedBiases', 'aiTags',
    'captureMethod', 'createdAt', 'updatedAt'
  ];

  const rows = entries.map(entry => [
    entry.id,
    entry.type,
    escapeCSV(entry.content),
    entry.mood || '',
    entry.conviction || '',
    entry.ticker || '',
    entry.sentiment || '',
    entry.emotionalKeywords.join('; '),
    entry.detectedBiases.join('; '),
    entry.aiTags.join('; '),
    entry.captureMethod,
    new Date(entry.createdAt).toISOString(),
    new Date(entry.updatedAt).toISOString(),
  ].map(escapeCSV).join(','));

  return [headers.join(','), ...rows].join('\n');
}

function thesesToCSV(theses: ThesisExport[]): string {
  const headers = [
    'id', 'name', 'ticker', 'direction', 'originalThesis', 'status',
    'outcome', 'lessonsLearned', 'totalRealizedPL', 'totalUnrealizedPL',
    'totalCapitalDeployed', 'startedAt', 'closedAt'
  ];

  const rows = theses.map(thesis => [
    thesis.id,
    thesis.name,
    thesis.ticker,
    thesis.direction,
    escapeCSV(thesis.originalThesis),
    thesis.status,
    thesis.outcome || '',
    escapeCSV(thesis.lessonsLearned || ''),
    thesis.totalRealizedPL,
    thesis.totalUnrealizedPL,
    thesis.totalCapitalDeployed,
    new Date(thesis.startedAt).toISOString(),
    thesis.closedAt ? new Date(thesis.closedAt).toISOString() : '',
  ].map(escapeCSV).join(','));

  return [headers.join(','), ...rows].join('\n');
}

function tradesToCSV(trades: TradeExport[]): string {
  const headers = [
    'id', 'thesisTicker', 'thesisName', 'action', 'description',
    'strategyType', 'debitCredit', 'quantity', 'realizedPL',
    'status', 'openedAt', 'closedAt', 'expiration'
  ];

  const rows = trades.map(trade => [
    trade.id,
    trade.thesis?.ticker || '',
    trade.thesis?.name || '',
    trade.action,
    escapeCSV(trade.description),
    trade.strategyType || '',
    trade.debitCredit,
    trade.quantity,
    trade.realizedPL ?? '',
    trade.status,
    new Date(trade.openedAt).toISOString(),
    trade.closedAt ? new Date(trade.closedAt).toISOString() : '',
    trade.expiration ? new Date(trade.expiration).toISOString() : '',
  ].map(escapeCSV).join(','));

  return [headers.join(','), ...rows].join('\n');
}

function goalsToCSV(goals: GoalExport[]): string {
  const headers = [
    'id', 'goal', 'description', 'metricType', 'metricName',
    'targetValue', 'currentValue', 'timeframe', 'status',
    'progress', 'startDate', 'endDate', 'completedAt', 'reflection'
  ];

  const rows = goals.map(goal => [
    goal.id,
    escapeCSV(goal.goal),
    escapeCSV(goal.description || ''),
    goal.metricType || '',
    goal.metricName || '',
    goal.targetValue ?? '',
    goal.currentValue ?? '',
    goal.timeframe,
    goal.status,
    goal.progress,
    new Date(goal.startDate).toISOString(),
    goal.endDate ? new Date(goal.endDate).toISOString() : '',
    goal.completedAt ? new Date(goal.completedAt).toISOString() : '',
    escapeCSV(goal.reflection || ''),
  ].map(escapeCSV).join(','));

  return [headers.join(','), ...rows].join('\n');
}
