'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus, ArrowRight, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface WeeklyPulseData {
  weekStart: string;
  weekEnd: string;
  stats: {
    totalEntries: number;
    tradeIdeas: number;
    reflections: number;
  };
  emotional: {
    dominantSentiment: 'positive' | 'negative' | 'neutral' | null;
    sentimentBreakdown: { positive: number; negative: number; neutral: number };
    topEmotions: Array<{ emotion: string; count: number }>;
  };
  patterns: {
    detectedBiases: Array<{ bias: string; count: number }>;
  };
  insights: string[];
  comparison?: {
    entriesChange: number;
    sentimentChange: 'improving' | 'declining' | 'stable';
  };
}

interface HomeWeeklyPulseProps {
  data: WeeklyPulseData | null;
  loading?: boolean;
}

const SENTIMENT_CONFIG = {
  positive: {
    label: 'Positive',
    color: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
    border: 'border-green-200 dark:border-green-800',
  },
  negative: {
    label: 'Negative',
    color: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
    border: 'border-red-200 dark:border-red-800',
  },
  neutral: {
    label: 'Neutral',
    color: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-100 dark:bg-slate-800',
    border: 'border-slate-200 dark:border-slate-700',
  },
};

const COMPARISON_CONFIG = {
  improving: { icon: TrendingUp,   label: 'improving vs last week', color: 'text-green-600 dark:text-green-400' },
  declining: { icon: TrendingDown, label: 'declining vs last week',  color: 'text-red-500 dark:text-red-400' },
  stable:    { icon: Minus,        label: 'stable vs last week',     color: 'text-slate-400' },
};

export function HomeWeeklyPulse({ data, loading }: HomeWeeklyPulseProps) {
  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-28 skeleton rounded" />
          <div className="h-4 w-16 skeleton rounded" />
        </div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-6 w-20 skeleton rounded-full" />
            <div className="h-4 w-32 skeleton rounded" />
          </div>
          <div className="space-y-2 mb-3">
            <div className="h-3 w-full skeleton rounded" />
            <div className="h-2 w-full skeleton rounded-full" />
            <div className="h-3 w-4/5 skeleton rounded" />
            <div className="h-2 w-4/5 skeleton rounded-full" />
          </div>
          <div className="h-3 w-full skeleton rounded mb-1" />
          <div className="h-3 w-3/4 skeleton rounded" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { stats, emotional, patterns, insights, comparison } = data;
  const topBiases = patterns.detectedBiases.slice(0, 3);
  const maxBiasCount = topBiases.length > 0 ? topBiases[0].count : 1;
  const sentimentCfg = emotional.dominantSentiment ? SENTIMENT_CONFIG[emotional.dominantSentiment] : null;
  const comparisonCfg = comparison ? COMPARISON_CONFIG[comparison.sentimentChange] : null;
  const CompIcon = comparisonCfg?.icon;

  // Not enough data state
  if (stats.totalEntries < 3) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
              This Week
            </h2>
          </div>
        </div>
        <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {stats.totalEntries === 0
              ? 'No entries yet this week'
              : `${stats.totalEntries} of 3 entries needed`}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Log {3 - stats.totalEntries} more to unlock your weekly pulse
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
            This Week
          </h2>
        </div>
        <Link
          href="/insights"
          className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:underline"
        >
          Full insights <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 space-y-4">

        {/* Sentiment + comparison */}
        <div className="flex items-center gap-3 flex-wrap">
          {sentimentCfg && (
            <Badge
              variant="outline"
              className={cn('text-sm px-3 py-1', sentimentCfg.bg, sentimentCfg.border, sentimentCfg.color)}
            >
              {sentimentCfg.label} mindset
            </Badge>
          )}
          {comparisonCfg && CompIcon && (
            <span className={cn('flex items-center gap-1 text-xs', comparisonCfg.color)}>
              <CompIcon className="h-3.5 w-3.5" />
              {comparisonCfg.label}
            </span>
          )}
          <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">
            {stats.totalEntries} entries
          </span>
        </div>

        {/* Top biases */}
        {topBiases.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              Detected biases
            </p>
            <div className="space-y-2">
              {topBiases.map((b) => (
                <div key={b.bias}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-700 dark:text-slate-300 capitalize">
                      {b.bias.replace(/_/g, ' ').toLowerCase()}
                    </span>
                    <span className="text-slate-400">{b.count}×</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-300"
                      style={{ width: `${(b.count / maxBiasCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Personalized insights */}
        {insights.length > 0 && (
          <div className="border-t border-slate-100 dark:border-slate-700 pt-3 space-y-1.5">
            {insights.slice(0, 2).map((insight, i) => (
              <p key={i} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                <span className="text-amber-500 font-bold shrink-0">•</span>
                {insight}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
