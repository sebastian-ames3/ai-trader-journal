'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  History,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Brain,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface SimilarThesis {
  id: string;
  name: string;
  ticker: string;
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'VOLATILE';
  outcome: 'WIN' | 'LOSS' | 'BREAKEVEN' | null;
  totalRealizedPL: number;
  lessonsLearned: string | null;
  similarity: number;
  closedAt: string | null;
}

export interface HistoricalInsight {
  id: string;
  type: 'success_factor' | 'risk_factor' | 'timing' | 'size' | 'general';
  title: string;
  description: string;
  confidence: number;
  source: 'historical_data' | 'pattern_analysis' | 'ai_inference';
}

export interface TickerHistory {
  totalTheses: number;
  winCount: number;
  lossCount: number;
  avgReturn: number;
  bestTrade: { name: string; return: number } | null;
  worstTrade: { name: string; return: number } | null;
}

interface PatternRemindersPanelProps {
  thesisId: string;
  ticker: string;
  strategyType?: string;
  direction?: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'VOLATILE';
  className?: string;
}

export default function PatternRemindersPanel({
  thesisId,
  ticker,
  strategyType,
  direction,
  className,
}: PatternRemindersPanelProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [similarTheses, setSimilarTheses] = useState<SimilarThesis[]>([]);
  const [insights, setInsights] = useState<HistoricalInsight[]>([]);
  const [tickerHistory, setTickerHistory] = useState<TickerHistory | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPatternData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        ticker,
        ...(strategyType && { strategyType }),
        ...(direction && { direction }),
        excludeThesisId: thesisId,
      });

      const response = await fetch(`/api/theses/patterns?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch pattern data');
      }

      const data = await response.json();
      setSimilarTheses(data.similarTheses || []);
      setInsights(data.insights || []);
      setTickerHistory(data.tickerHistory || null);
    } catch (err) {
      console.error('Error fetching pattern data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load pattern data');
    } finally {
      setIsLoading(false);
    }
  }, [thesisId, ticker, strategyType, direction]);

  useEffect(() => {
    fetchPatternData();
  }, [fetchPatternData]);

  const hasContent = similarTheses.length > 0 || insights.length > 0 || tickerHistory;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Brain className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            Pattern Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="space-y-3">
            <div className="h-16 skeleton rounded-lg" />
            <div className="h-20 skeleton rounded-lg" />
            <div className="h-12 skeleton rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <p className="font-medium">Could not load pattern insights</p>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={fetchPatternData}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasContent) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <History className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="font-medium text-slate-600 dark:text-slate-400">No historical data</p>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                This is your first thesis on ${ticker}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Brain className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          Pattern Insights for ${ticker}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 pt-2 space-y-4">
        {/* Ticker History Summary */}
        {tickerHistory && tickerHistory.totalTheses > 0 && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Your ${ticker} History
              </span>
              <Badge variant="outline" className="text-xs">
                {tickerHistory.totalTheses} theses
              </Badge>
            </div>

            {/* Win/Loss Stats */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {tickerHistory.winCount}
                  </span>
                </div>
                <p className="text-xs text-slate-500">Wins</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <XCircle className="h-3.5 w-3.5 text-red-500" />
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {tickerHistory.lossCount}
                  </span>
                </div>
                <p className="text-xs text-slate-500">Losses</p>
              </div>
              <div className="text-center">
                <span
                  className={cn(
                    'font-semibold',
                    tickerHistory.avgReturn >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  )}
                >
                  {tickerHistory.avgReturn >= 0 ? '+' : ''}{tickerHistory.avgReturn.toFixed(1)}%
                </span>
                <p className="text-xs text-slate-500">Avg Return</p>
              </div>
            </div>

            {/* Best/Worst Trade */}
            <div className="grid grid-cols-2 gap-2">
              {tickerHistory.bestTrade && (
                <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-medium text-green-700 dark:text-green-300">
                      Best
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                    {tickerHistory.bestTrade.name}
                  </p>
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                    +{tickerHistory.bestTrade.return.toFixed(1)}%
                  </p>
                </div>
              )}
              {tickerHistory.worstTrade && (
                <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />
                    <span className="text-xs font-medium text-red-700 dark:text-red-300">
                      Worst
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                    {tickerHistory.worstTrade.name}
                  </p>
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                    {tickerHistory.worstTrade.return.toFixed(1)}%
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actionable Insights */}
        {insights.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Key Insights
              </span>
            </div>
            {insights.map((insight) => (
              <InsightItem key={insight.id} insight={insight} />
            ))}
          </div>
        )}

        {/* Similar Theses */}
        {similarTheses.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <History className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Similar Past Theses
              </span>
            </div>
            {similarTheses.slice(0, 3).map((thesis) => (
              <SimilarThesisItem key={thesis.id} thesis={thesis} />
            ))}
            {similarTheses.length > 3 && (
              <Link
                href={`/theses/patterns?ticker=${ticker}`}
                className="flex items-center justify-center gap-1 p-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                View {similarTheses.length - 3} more
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface InsightItemProps {
  insight: HistoricalInsight;
}

function InsightItem({ insight }: InsightItemProps) {
  const getInsightConfig = () => {
    switch (insight.type) {
      case 'success_factor':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          iconColor: 'text-green-600 dark:text-green-400',
        };
      case 'risk_factor':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-amber-50 dark:bg-amber-900/20',
          borderColor: 'border-amber-200 dark:border-amber-800',
          iconColor: 'text-amber-600 dark:text-amber-400',
        };
      default:
        return {
          icon: Lightbulb,
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          iconColor: 'text-blue-600 dark:text-blue-400',
        };
    }
  };

  const config = getInsightConfig();
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'p-3 rounded-lg border',
        config.bgColor,
        config.borderColor
      )}
    >
      <div className="flex items-start gap-2">
        <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', config.iconColor)} />
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {insight.title}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {insight.description}
          </p>
          {insight.confidence > 0.8 && (
            <Badge variant="outline" className="text-xs mt-2">
              High confidence
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

interface SimilarThesisItemProps {
  thesis: SimilarThesis;
}

function SimilarThesisItem({ thesis }: SimilarThesisItemProps) {
  return (
    <Link
      href={`/theses/${thesis.id}`}
      className={cn(
        'block p-3 rounded-lg border',
        'bg-white dark:bg-slate-800/50',
        'border-slate-200 dark:border-slate-700',
        'hover:border-slate-300 dark:hover:border-slate-600',
        'hover:shadow-sm',
        'transition-all'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-mono">
            ${thesis.ticker}
          </Badge>
          <Badge
            variant="secondary"
            className={cn(
              'text-xs',
              thesis.direction === 'BULLISH' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
              thesis.direction === 'BEARISH' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
              thesis.direction === 'NEUTRAL' && 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
              thesis.direction === 'VOLATILE' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
            )}
          >
            {thesis.direction}
          </Badge>
        </div>
        {thesis.outcome && (
          <Badge
            variant={thesis.outcome === 'WIN' ? 'default' : thesis.outcome === 'LOSS' ? 'destructive' : 'secondary'}
            className="text-xs"
          >
            {thesis.outcome}
          </Badge>
        )}
      </div>

      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-1 mb-1">
        {thesis.name}
      </p>

      {thesis.lessonsLearned && (
        <p className="text-xs text-slate-500 dark:text-slate-400 italic line-clamp-2 mb-2">
          &ldquo;{thesis.lessonsLearned}&rdquo;
        </p>
      )}

      <div className="flex items-center justify-between">
        <span
          className={cn(
            'text-sm font-semibold',
            thesis.totalRealizedPL >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          )}
        >
          {thesis.totalRealizedPL >= 0 ? '+' : ''}${Math.abs(thesis.totalRealizedPL).toFixed(0)}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-400">Similarity:</span>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            {Math.round(thesis.similarity * 100)}%
          </span>
        </div>
      </div>
    </Link>
  );
}
