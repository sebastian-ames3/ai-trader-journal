'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Brain,
  Clock,
  Target,
  Activity,
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PatternInsight {
  id: string;
  patternType: string;
  patternName: string;
  description: string;
  occurrences: number;
  trend: 'INCREASING' | 'STABLE' | 'DECREASING';
  confidence: number;
  relatedEntryIds: string[];
  evidence: string[];
  outcomeData?: {
    winRate?: number;
    avgReturn?: number;
    sampleSize?: number;
  };
  firstDetected: string;
  lastUpdated: string;
  isActive: boolean;
  isDismissed: boolean;
}

interface MonthlyReport {
  month: string;
  entryCount: number;
  biasDistribution: Record<string, number>;
  convictionDistribution: Record<string, number>;
  moodDistribution: Record<string, number>;
  marketConditionBehavior: {
    upDays: { entryCount: number; avgSentiment: string };
    downDays: { entryCount: number; avgSentiment: string };
  };
  topPatterns: PatternInsight[];
  keyInsight: string;
}

const PATTERN_TYPE_ICONS: Record<string, typeof Brain> = {
  TIMING: Clock,
  CONVICTION: Target,
  EMOTIONAL: AlertCircle,
  MARKET_CONDITION: Activity,
  STRATEGY: BarChart3,
  BIAS_FREQUENCY: Brain,
};

const PATTERN_TYPE_COLORS: Record<string, string> = {
  TIMING: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30',
  CONVICTION: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30',
  EMOTIONAL: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30',
  MARKET_CONDITION: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
  STRATEGY: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30',
  BIAS_FREQUENCY: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30',
};

const TREND_ICONS = {
  INCREASING: TrendingUp,
  STABLE: Minus,
  DECREASING: TrendingDown,
};

export default function PatternsPage() {
  const router = useRouter();

  // State
  const [patterns, setPatterns] = useState<PatternInsight[]>([]);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  // Fetch patterns
  const fetchPatterns = useCallback(async () => {
    try {
      const response = await fetch('/api/patterns');
      if (!response.ok) throw new Error('Failed to fetch patterns');
      const data = await response.json();
      setPatterns(data.patterns || []);
    } catch (err) {
      console.error('Failed to fetch patterns:', err);
    }
  }, []);

  // Fetch monthly report
  const fetchMonthlyReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/insights/monthly?year=${selectedMonth.year}&month=${selectedMonth.month}`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch report');
      }

      const data = await response.json();
      setMonthlyReport(data);
    } catch (err) {
      console.error('Failed to fetch monthly report:', err);
      setError(err instanceof Error ? err.message : 'Failed to load report');
      setMonthlyReport(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth]);

  // Trigger pattern analysis
  const runPatternAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/cron/pattern-analysis', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      // Refresh patterns
      await fetchPatterns();
    } catch (err) {
      console.error('Pattern analysis failed:', err);
      setError('Pattern analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Dismiss a pattern
  const dismissPattern = async (patternId: string) => {
    try {
      const response = await fetch('/api/patterns/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patternId }),
      });

      if (!response.ok) throw new Error('Failed to dismiss pattern');

      // Remove from local state
      setPatterns((prev) => prev.filter((p) => p.id !== patternId));
    } catch (err) {
      console.error('Failed to dismiss pattern:', err);
    }
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setSelectedMonth((prev) => {
      if (prev.month === 1) {
        return { year: prev.year - 1, month: 12 };
      }
      return { ...prev, month: prev.month - 1 };
    });
  };

  const goToNextMonth = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Don't go past current month
    if (selectedMonth.year === currentYear && selectedMonth.month >= currentMonth) {
      return;
    }

    setSelectedMonth((prev) => {
      if (prev.month === 12) {
        return { year: prev.year + 1, month: 1 };
      }
      return { ...prev, month: prev.month + 1 };
    });
  };

  // Initial fetch
  useEffect(() => {
    fetchPatterns();
    fetchMonthlyReport();
  }, [fetchPatterns, fetchMonthlyReport]);

  // Format month name
  const formatMonth = () => {
    return new Date(selectedMonth.year, selectedMonth.month - 1).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  // Check if next month is disabled
  const isNextMonthDisabled = () => {
    const now = new Date();
    return (
      selectedMonth.year === now.getFullYear() &&
      selectedMonth.month >= now.getMonth() + 1
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-10 w-10"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Patterns & Insights</h1>
              <p className="text-sm text-muted-foreground">
                Behavioral analysis of your trading
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={runPatternAnalysis}
            disabled={isAnalyzing}
            className="gap-2"
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Analyze
          </Button>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Active Patterns Section */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Active Patterns</h2>

          {patterns.length === 0 ? (
            <div className="p-6 text-center border rounded-lg bg-muted/20">
              <Brain className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">
                No patterns detected yet
              </p>
              <p className="text-sm text-muted-foreground">
                Keep journaling to unlock behavioral insights
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {patterns.map((pattern) => {
                const Icon = PATTERN_TYPE_ICONS[pattern.patternType] || Brain;
                const TrendIcon = TREND_ICONS[pattern.trend];
                const colorClass = PATTERN_TYPE_COLORS[pattern.patternType] || '';

                return (
                  <div
                    key={pattern.id}
                    className="p-4 border rounded-lg bg-card"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={cn('p-2 rounded-lg', colorClass)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-medium">
                            {pattern.patternName.replace(/_/g, ' ')}
                          </h3>
                          <Badge variant="outline" className="text-xs mt-1">
                            {pattern.patternType.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'flex items-center gap-1 text-xs',
                            pattern.trend === 'INCREASING' && 'text-red-600 dark:text-red-400',
                            pattern.trend === 'DECREASING' && 'text-green-600 dark:text-green-400',
                            pattern.trend === 'STABLE' && 'text-muted-foreground'
                          )}
                        >
                          <TrendIcon className="h-3 w-3" />
                          {pattern.trend.toLowerCase()}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => dismissPattern(pattern.id)}
                          aria-label="Dismiss pattern"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">
                      {pattern.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{pattern.occurrences} occurrences</span>
                      <span>{Math.round(pattern.confidence * 100)}% confidence</span>
                      {pattern.outcomeData?.winRate !== undefined && (
                        <span
                          className={cn(
                            pattern.outcomeData.winRate < 0.5
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-green-600 dark:text-green-400'
                          )}
                        >
                          {Math.round(pattern.outcomeData.winRate * 100)}% win rate
                        </span>
                      )}
                    </div>

                    {/* Evidence quotes */}
                    {pattern.evidence.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Evidence:</p>
                        <div className="space-y-1">
                          {pattern.evidence.slice(0, 2).map((quote, idx) => (
                            <p
                              key={idx}
                              className="text-xs italic text-muted-foreground line-clamp-1"
                            >
                              &ldquo;{quote}&rdquo;
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Monthly Report Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Monthly Report</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={goToPreviousMonth}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {formatMonth()}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={goToNextMonth}
                disabled={isNextMonthDisabled()}
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="p-6 text-center border rounded-lg bg-muted/20">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">{error}</p>
            </div>
          ) : monthlyReport ? (
            <div className="space-y-4">
              {/* Key Insight */}
              {monthlyReport.keyInsight && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Brain className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{monthlyReport.keyInsight}</p>
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 border rounded-lg">
                  <Calendar className="h-5 w-5 mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">{monthlyReport.entryCount}</p>
                  <p className="text-xs text-muted-foreground">Entries</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <Activity className="h-5 w-5 mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">
                    {Object.keys(monthlyReport.biasDistribution).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Unique Biases</p>
                </div>
              </div>

              {/* Market Behavior */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-3">Market Condition Behavior</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm">Up Days</span>
                    </div>
                    <p className="text-lg font-semibold">
                      {monthlyReport.marketConditionBehavior.upDays.entryCount} entries
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      Avg sentiment: {monthlyReport.marketConditionBehavior.upDays.avgSentiment}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="text-sm">Down Days</span>
                    </div>
                    <p className="text-lg font-semibold">
                      {monthlyReport.marketConditionBehavior.downDays.entryCount} entries
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      Avg sentiment: {monthlyReport.marketConditionBehavior.downDays.avgSentiment}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bias Distribution */}
              {Object.keys(monthlyReport.biasDistribution).length > 0 && (
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-3">Top Biases</h3>
                  <div className="space-y-2">
                    {Object.entries(monthlyReport.biasDistribution)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([bias, count]) => (
                        <div key={bias} className="flex items-center justify-between">
                          <span className="text-sm capitalize">
                            {bias.replace(/_/g, ' ')}
                          </span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Conviction Distribution */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-3">Conviction Levels</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">High</span>
                      <span className="text-xs">
                        {monthlyReport.convictionDistribution.HIGH || 0}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{
                          width: `${
                            monthlyReport.entryCount > 0
                              ? ((monthlyReport.convictionDistribution.HIGH || 0) /
                                  monthlyReport.entryCount) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Medium</span>
                      <span className="text-xs">
                        {monthlyReport.convictionDistribution.MEDIUM || 0}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500 rounded-full"
                        style={{
                          width: `${
                            monthlyReport.entryCount > 0
                              ? ((monthlyReport.convictionDistribution.MEDIUM || 0) /
                                  monthlyReport.entryCount) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Low</span>
                      <span className="text-xs">
                        {monthlyReport.convictionDistribution.LOW || 0}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{
                          width: `${
                            monthlyReport.entryCount > 0
                              ? ((monthlyReport.convictionDistribution.LOW || 0) /
                                  monthlyReport.entryCount) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center border rounded-lg bg-muted/20">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No data for this month</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
