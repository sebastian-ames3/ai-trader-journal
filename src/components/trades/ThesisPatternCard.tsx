'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  BarChart3,
  Target,
  Clock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface PatternStats {
  totalOccurrences: number;
  winRate: number;
  avgReturn: number;
  avgHoldingPeriod?: number;
  lastOccurrence?: string;
}

export interface ThesisPattern {
  id: string;
  name: string;
  description: string;
  category: 'strategy' | 'timing' | 'sentiment' | 'technical' | 'behavioral';
  trend: 'increasing' | 'decreasing' | 'stable';
  stats: PatternStats;
  relatedThesesIds?: string[];
  relatedEntriesCount?: number;
}

interface ThesisPatternCardProps {
  pattern: ThesisPattern;
  onViewRelated?: () => void;
  className?: string;
}

function getCategoryConfig(category: ThesisPattern['category']) {
  switch (category) {
    case 'strategy':
      return {
        label: 'Strategy',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        textColor: 'text-blue-700 dark:text-blue-300',
      };
    case 'timing':
      return {
        label: 'Timing',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        textColor: 'text-purple-700 dark:text-purple-300',
      };
    case 'sentiment':
      return {
        label: 'Sentiment',
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
        textColor: 'text-amber-700 dark:text-amber-300',
      };
    case 'technical':
      return {
        label: 'Technical',
        bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
        textColor: 'text-cyan-700 dark:text-cyan-300',
      };
    case 'behavioral':
      return {
        label: 'Behavioral',
        bgColor: 'bg-rose-100 dark:bg-rose-900/30',
        textColor: 'text-rose-700 dark:text-rose-300',
      };
  }
}

function getTrendIcon(trend: ThesisPattern['trend']) {
  switch (trend) {
    case 'increasing':
      return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />;
    case 'decreasing':
      return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />;
    case 'stable':
      return <Minus className="h-4 w-4 text-slate-400" />;
  }
}

function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export default function ThesisPatternCard({
  pattern,
  onViewRelated,
  className,
}: ThesisPatternCardProps) {
  const categoryConfig = useMemo(() => getCategoryConfig(pattern.category), [pattern.category]);
  const trendIcon = useMemo(() => getTrendIcon(pattern.trend), [pattern.trend]);

  const isPositiveWinRate = pattern.stats.winRate >= 50;
  const isPositiveReturn = pattern.stats.avgReturn >= 0;

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-200',
        'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600',
        className
      )}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant="secondary"
                className={cn('text-xs', categoryConfig.bgColor, categoryConfig.textColor)}
              >
                {categoryConfig.label}
              </Badge>
              <div className="flex items-center gap-1">
                {trendIcon}
                <span className="text-xs text-slate-500 capitalize">{pattern.trend}</span>
              </div>
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              {pattern.name}
            </h3>
          </div>

          {/* Win Rate Circle */}
          <div className="flex-shrink-0 text-center">
            <div
              className={cn(
                'w-14 h-14 rounded-full flex items-center justify-center',
                isPositiveWinRate
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : 'bg-red-100 dark:bg-red-900/30'
              )}
            >
              <span
                className={cn(
                  'text-lg font-bold',
                  isPositiveWinRate
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-red-700 dark:text-red-300'
                )}
              >
                {pattern.stats.winRate.toFixed(0)}%
              </span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Win Rate</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
          {pattern.description}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Occurrences */}
          <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
            <div className="flex items-center justify-center gap-1 mb-1">
              <BarChart3 className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {pattern.stats.totalOccurrences}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Occurrences</p>
          </div>

          {/* Avg Return */}
          <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <p
              className={cn(
                'text-lg font-semibold',
                isPositiveReturn
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              )}
            >
              {formatPercentage(pattern.stats.avgReturn)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Avg Return</p>
          </div>

          {/* Holding Period */}
          <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {pattern.stats.avgHoldingPeriod ?? '-'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Avg Days</p>
          </div>
        </div>

        {/* Related Entries Link */}
        {(pattern.relatedEntriesCount ?? 0) > 0 && (
          <Link
            href={`/theses/patterns?pattern=${pattern.id}`}
            className={cn(
              'flex items-center justify-between',
              'p-3 rounded-lg',
              'bg-slate-50 dark:bg-slate-800/50',
              'hover:bg-slate-100 dark:hover:bg-slate-800',
              'transition-colors group',
              'min-h-[44px]'
            )}
            onClick={(e) => {
              if (onViewRelated) {
                e.preventDefault();
                onViewRelated();
              }
            }}
          >
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              View {pattern.relatedEntriesCount} related entries
            </span>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}

        {/* Last Occurrence */}
        {pattern.stats.lastOccurrence && (
          <p className="text-xs text-slate-400 mt-3 text-center">
            Last seen: {new Date(pattern.stats.lastOccurrence).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Compact variant for inline display
interface ThesisPatternCardCompactProps {
  pattern: ThesisPattern;
  onClick?: () => void;
  className?: string;
}

export function ThesisPatternCardCompact({
  pattern,
  onClick,
  className,
}: ThesisPatternCardCompactProps) {
  const categoryConfig = getCategoryConfig(pattern.category);
  const trendIcon = getTrendIcon(pattern.trend);
  const isPositiveWinRate = pattern.stats.winRate >= 50;

  return (
    <button
      type="button"
      className={cn(
        'w-full text-left p-3 rounded-xl',
        'bg-white dark:bg-slate-800/50',
        'border border-slate-200 dark:border-slate-700',
        'hover:border-slate-300 dark:hover:border-slate-600',
        'hover:shadow-sm',
        'transition-all duration-200',
        'min-h-[60px]',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        {/* Win Rate Badge */}
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
            isPositiveWinRate
              ? 'bg-green-100 dark:bg-green-900/30'
              : 'bg-red-100 dark:bg-red-900/30'
          )}
        >
          <span
            className={cn(
              'text-sm font-bold',
              isPositiveWinRate
                ? 'text-green-700 dark:text-green-300'
                : 'text-red-700 dark:text-red-300'
            )}
          >
            {pattern.stats.winRate.toFixed(0)}%
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
              {pattern.name}
            </h4>
            {trendIcon}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant="outline"
              className={cn('text-xs', categoryConfig.bgColor, categoryConfig.textColor)}
            >
              {categoryConfig.label}
            </Badge>
            <span className="text-xs text-slate-500">
              {pattern.stats.totalOccurrences} trades
            </span>
          </div>
        </div>

        <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
      </div>
    </button>
  );
}
