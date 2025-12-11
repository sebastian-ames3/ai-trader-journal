'use client';

import * as React from 'react';
import Link from 'next/link';
import { FileText, ArrowRight, TrendingUp, TrendingDown, Minus, Activity, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Direction = 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'VOLATILE';

interface ActiveThesis {
  id: string;
  name: string;
  ticker: string;
  direction: Direction;
  totalRealizedPL: number;
  tradeCount: number;
  status?: 'ACTIVE' | 'CLOSED' | 'PAUSED';
}

interface ActiveThesesWidgetProps {
  theses?: ActiveThesis[];
  maxTheses?: number;
  className?: string;
}

const DIRECTION_CONFIG: Record<Direction, { icon: React.ElementType; color: string }> = {
  BULLISH: {
    icon: TrendingUp,
    color: 'text-green-600 dark:text-green-400',
  },
  BEARISH: {
    icon: TrendingDown,
    color: 'text-red-600 dark:text-red-400',
  },
  NEUTRAL: {
    icon: Minus,
    color: 'text-slate-600 dark:text-slate-400',
  },
  VOLATILE: {
    icon: Activity,
    color: 'text-amber-600 dark:text-amber-400',
  },
};

export function ActiveThesesWidget({
  theses = [],
  maxTheses = 3,
  className,
}: ActiveThesesWidgetProps) {
  const activeTheses = theses
    .filter((t) => t.status !== 'CLOSED')
    .slice(0, maxTheses);

  const totalPL = theses.reduce((sum, t) => sum + t.totalRealizedPL, 0);

  return (
    <div className={cn('h-full flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-slate-500" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            Trading Theses
          </h3>
        </div>
        <Link href="/theses">
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

      {/* Summary */}
      {theses.length > 0 && (
        <div className="flex items-center gap-4 mb-3 pb-3 border-b border-slate-100 dark:border-slate-700">
          <div>
            <p className="text-xs text-slate-500">Active</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {activeTheses.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Total P/L</p>
            <p
              className={cn(
                'text-lg font-semibold',
                totalPL >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              )}
            >
              {totalPL >= 0 ? '+' : ''}${Math.abs(totalPL).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Theses List */}
      {activeTheses.length > 0 ? (
        <div className="flex-1 space-y-2 overflow-hidden">
          {activeTheses.map((thesis) => {
            const DirectionIcon = DIRECTION_CONFIG[thesis.direction].icon;
            const directionColor = DIRECTION_CONFIG[thesis.direction].color;

            return (
              <Link
                key={thesis.id}
                href={`/theses/${thesis.id}`}
                className={cn(
                  'block p-2 rounded-lg',
                  'bg-slate-50 dark:bg-slate-800/50',
                  'hover:bg-slate-100 dark:hover:bg-slate-700/50',
                  'transition-colors'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'p-1.5 rounded-md bg-slate-100 dark:bg-slate-800',
                        directionColor
                      )}
                    >
                      <DirectionIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {thesis.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-xs font-mono bg-slate-100 dark:bg-slate-700"
                        >
                          ${thesis.ticker}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        {thesis.tradeCount} trade{thesis.tradeCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      thesis.totalRealizedPL >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    )}
                  >
                    {thesis.totalRealizedPL >= 0 ? '+' : ''}
                    ${Math.abs(thesis.totalRealizedPL).toLocaleString()}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center">
          <div>
            <div className="text-3xl mb-2">
              <span role="img" aria-label="Document">
                &#128196;
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No active theses
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Group related trades under a thesis
            </p>
            <Link href="/theses/new">
              <Button variant="link" size="sm" className="mt-2 text-amber-600">
                <Plus className="h-3 w-3 mr-1" />
                Create thesis
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// Sample data for demo/testing
export const SAMPLE_THESES: ActiveThesis[] = [
  {
    id: '1',
    name: 'NVDA AI Play',
    ticker: 'NVDA',
    direction: 'BULLISH',
    totalRealizedPL: 2450,
    tradeCount: 5,
    status: 'ACTIVE',
  },
  {
    id: '2',
    name: 'Rate Cut Hedge',
    ticker: 'TLT',
    direction: 'BULLISH',
    totalRealizedPL: -320,
    tradeCount: 2,
    status: 'ACTIVE',
  },
  {
    id: '3',
    name: 'Tech Volatility',
    ticker: 'QQQ',
    direction: 'VOLATILE',
    totalRealizedPL: 890,
    tradeCount: 8,
    status: 'ACTIVE',
  },
];

// Skeleton for loading
export function ActiveThesesWidgetSkeleton() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="h-5 w-28 skeleton rounded" />
        <div className="h-6 w-16 skeleton rounded" />
      </div>
      <div className="flex items-center gap-4 mb-3 pb-3 border-b border-slate-100 dark:border-slate-700">
        <div>
          <div className="h-3 w-10 skeleton rounded mb-1" />
          <div className="h-6 w-8 skeleton rounded" />
        </div>
        <div>
          <div className="h-3 w-14 skeleton rounded mb-1" />
          <div className="h-6 w-16 skeleton rounded" />
        </div>
      </div>
      <div className="flex-1 space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 skeleton rounded-md" />
                <div>
                  <div className="h-4 w-24 skeleton rounded mb-1" />
                  <div className="h-3 w-16 skeleton rounded" />
                </div>
              </div>
              <div className="h-4 w-16 skeleton rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
