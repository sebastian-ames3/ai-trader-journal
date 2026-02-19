'use client';

import Link from 'next/link';
import {
  Brain,
  Clock,
  Target,
  AlertCircle,
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
} from 'lucide-react';
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
  evidence: string[];
  outcomeData?: {
    winRate?: number;
    avgReturn?: number;
    sampleSize?: number;
  };
}

interface HomePatternsCardProps {
  patterns: PatternInsight[];
  loading?: boolean;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  TIMING:           { icon: Clock,         color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-500/10' },
  CONVICTION:       { icon: Target,        color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10' },
  EMOTIONAL:        { icon: AlertCircle,   color: 'text-red-600 dark:text-red-400',     bg: 'bg-red-500/10' },
  MARKET_CONDITION: { icon: Activity,      color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/10' },
  STRATEGY:         { icon: BarChart3,     color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10' },
  BIAS_FREQUENCY:   { icon: Brain,         color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10' },
};

const TREND_CONFIG = {
  INCREASING: { icon: TrendingUp,   label: 'increasing', color: 'text-red-500 dark:text-red-400' },
  STABLE:     { icon: Minus,        label: 'stable',     color: 'text-slate-400' },
  DECREASING: { icon: TrendingDown, label: 'improving',  color: 'text-green-500 dark:text-green-400' },
};

function formatPatternName(name: string) {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function PatternCard({ pattern }: { pattern: PatternInsight }) {
  const typeConfig = TYPE_CONFIG[pattern.patternType] ?? TYPE_CONFIG.BIAS_FREQUENCY;
  const trendConfig = TREND_CONFIG[pattern.trend];
  const TrendIcon = trendConfig.icon;
  const TypeIcon = typeConfig.icon;

  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className={cn('p-2 rounded-lg', typeConfig.bg)}>
            <TypeIcon className={cn('h-4 w-4', typeConfig.color)} />
          </div>
          <div>
            <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 leading-tight">
              {formatPatternName(pattern.patternName)}
            </p>
            <Badge variant="outline" className="text-[10px] mt-0.5 px-1.5 py-0">
              {pattern.patternType.replace(/_/g, ' ')}
            </Badge>
          </div>
        </div>

        <div className={cn('flex items-center gap-1 text-xs font-medium shrink-0', trendConfig.color)}>
          <TrendIcon className="h-3.5 w-3.5" />
          {trendConfig.label}
        </div>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 leading-snug">
        {pattern.description}
      </p>

      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-3">
        <span>{pattern.occurrences} occurrences</span>
        <span>{Math.round(pattern.confidence * 100)}% confidence</span>
        {pattern.outcomeData?.winRate !== undefined && (
          <span className={cn(
            'font-semibold',
            pattern.outcomeData.winRate < 0.5
              ? 'text-red-600 dark:text-red-400'
              : 'text-green-600 dark:text-green-400'
          )}>
            {Math.round(pattern.outcomeData.winRate * 100)}% win rate
          </span>
        )}
      </div>

      {pattern.evidence.length > 0 && (
        <p className="text-xs italic text-slate-400 dark:text-slate-500 line-clamp-2 border-t border-slate-100 dark:border-slate-700 pt-2">
          &ldquo;{pattern.evidence[0]}&rdquo;
        </p>
      )}
    </div>
  );
}

function PatternCardSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 skeleton rounded-lg" />
          <div>
            <div className="h-4 w-32 skeleton rounded mb-1" />
            <div className="h-3 w-20 skeleton rounded" />
          </div>
        </div>
        <div className="h-3 w-16 skeleton rounded" />
      </div>
      <div className="h-3 w-full skeleton rounded mb-1.5" />
      <div className="h-3 w-4/5 skeleton rounded mb-3" />
      <div className="flex gap-4">
        <div className="h-3 w-24 skeleton rounded" />
        <div className="h-3 w-20 skeleton rounded" />
      </div>
    </div>
  );
}

export function HomePatternsCard({ patterns, loading }: HomePatternsCardProps) {
  const displayed = patterns.slice(0, 3);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
            Active Patterns
          </h2>
        </div>
        <Link
          href="/insights/patterns"
          className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:underline"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          <PatternCardSkeleton />
          <PatternCardSkeleton />
        </div>
      ) : displayed.length === 0 ? (
        <div className="p-5 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
          <Brain className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No patterns detected yet</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Keep journaling — patterns emerge after consistent entries
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((pattern) => (
            <PatternCard key={pattern.id} pattern={pattern} />
          ))}
          {patterns.length > 3 && (
            <Link
              href="/insights/patterns"
              className="block text-center text-xs text-amber-600 dark:text-amber-400 hover:underline py-1"
            >
              +{patterns.length - 3} more patterns →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
