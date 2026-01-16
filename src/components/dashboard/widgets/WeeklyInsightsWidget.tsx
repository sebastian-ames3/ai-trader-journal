'use client';

import * as React from 'react';
import Link from 'next/link';
import { Brain, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface WeeklyInsightsWidgetProps {
  totalEntries?: number;
  tradeIdeas?: number;
  dominantSentiment?: 'positive' | 'negative' | 'neutral' | null;
  insights?: string[];
  weekStart?: string;
  weekEnd?: string;
  className?: string;
}

const SENTIMENT_CONFIG = {
  positive: {
    icon: TrendingUp,
    label: 'Positive',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  negative: {
    icon: TrendingDown,
    label: 'Negative',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    borderColor: 'border-red-200 dark:border-red-800',
  },
  neutral: {
    icon: Minus,
    label: 'Neutral',
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    borderColor: 'border-slate-200 dark:border-slate-700',
  },
};

export function WeeklyInsightsWidget({
  totalEntries = 0,
  tradeIdeas = 0,
  dominantSentiment,
  insights = [],
  weekStart,
  weekEnd,
  className,
}: WeeklyInsightsWidgetProps) {
  const sentimentConfig = dominantSentiment
    ? SENTIMENT_CONFIG[dominantSentiment]
    : null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className={cn('h-full flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            This Week
          </h3>
        </div>
        <Link href="/insights">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-amber-600 dark:text-amber-400"
          >
            View All
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Date Range */}
      {weekStart && weekEnd && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          {formatDate(weekStart)} - {formatDate(weekEnd)}
        </p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {totalEntries}
          </p>
          <p className="text-xs text-slate-500">Entries</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {tradeIdeas}
          </p>
          <p className="text-xs text-slate-500">Ideas</p>
        </div>
        <div className="text-center flex flex-col items-center">
          {sentimentConfig ? (
            <Badge
              variant="outline"
              className={cn(
                'text-xs px-2 py-0.5 mb-1',
                sentimentConfig.bgColor,
                sentimentConfig.borderColor,
                sentimentConfig.color
              )}
            >
              {sentimentConfig.label}
            </Badge>
          ) : (
            <span className="text-2xl text-slate-400">-</span>
          )}
          <p className="text-xs text-slate-500">Mindset</p>
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="flex-1 overflow-hidden">
          <ul className="space-y-1.5">
            {insights.slice(0, 2).map((insight, index) => (
              <li
                key={index}
                className="flex items-start text-xs text-slate-600 dark:text-slate-300"
              >
                <span className="text-amber-500 mr-2 font-bold flex-shrink-0">
                  &#8226;
                </span>
                <span className="line-clamp-2">{insight}</span>
              </li>
            ))}
          </ul>
          {insights.length > 2 && (
            <Link
              href="/insights"
              className="text-xs text-amber-600 dark:text-amber-400 mt-2 inline-block hover:underline"
            >
              +{insights.length - 2} more insights
            </Link>
          )}
        </div>
      )}

      {/* Empty state */}
      {totalEntries === 0 && (
        <div className="flex-1 flex items-center justify-center text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No entries this week yet. Start journaling to see insights!
          </p>
        </div>
      )}
    </div>
  );
}

// Skeleton for loading
export function WeeklyInsightsWidgetSkeleton() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="h-5 w-24 skeleton rounded" />
        <div className="h-6 w-16 skeleton rounded" />
      </div>
      <div className="h-3 w-32 skeleton rounded mb-3" />
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="text-center">
            <div className="h-7 w-10 skeleton rounded mx-auto mb-1" />
            <div className="h-3 w-12 skeleton rounded mx-auto" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full skeleton rounded" />
        <div className="h-3 w-4/5 skeleton rounded" />
      </div>
    </div>
  );
}
