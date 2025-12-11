'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BiasData {
  bias: string;
  count: number;
  trend?: 'increasing' | 'decreasing' | 'stable';
}

interface BiasTrackerWidgetProps {
  biases?: BiasData[];
  totalBiasesDetected?: number;
  mostCommonBias?: string;
  showTips?: boolean;
  className?: string;
}

const BIAS_DESCRIPTIONS: Record<string, string> = {
  CONFIRMATION_BIAS: 'Seeking info that confirms existing beliefs',
  LOSS_AVERSION: 'Fear of losses outweighs potential gains',
  OVERCONFIDENCE: 'Overestimating ability to predict outcomes',
  RECENCY_BIAS: 'Overweighting recent events',
  ANCHORING: 'Fixating on initial price/information',
  FOMO: 'Fear of missing out on opportunities',
  SUNK_COST_FALLACY: 'Continuing due to past investment',
  HINDSIGHT_BIAS: 'Believing events were predictable',
  AVAILABILITY_BIAS: 'Overweighting easily recalled info',
};

const BIAS_TIPS: Record<string, string> = {
  CONFIRMATION_BIAS: 'Actively seek opposing viewpoints before trading',
  LOSS_AVERSION: 'Set stop losses before entering trades',
  OVERCONFIDENCE: 'Track your prediction accuracy over time',
  RECENCY_BIAS: 'Review longer timeframe charts',
  ANCHORING: 'Reassess positions based on current fundamentals',
  FOMO: 'Stick to your trading plan and position sizes',
  SUNK_COST_FALLACY: 'Focus on future potential, not past losses',
  HINDSIGHT_BIAS: 'Journal predictions before outcomes are known',
  AVAILABILITY_BIAS: 'Use systematic research processes',
};

export function BiasTrackerWidget({
  biases = [],
  totalBiasesDetected = 0,
  mostCommonBias,
  showTips = true,
  className,
}: BiasTrackerWidgetProps) {
  const topBiases = biases.slice(0, 4);
  const maxCount = topBiases.length > 0 ? Math.max(...topBiases.map((b) => b.count)) : 1;

  return (
    <div className={cn('h-full flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            Bias Tracker
          </h3>
        </div>
        <Link href="/insights">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-amber-600 dark:text-amber-400"
          >
            Details
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="flex items-center gap-4 mb-4">
        <div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {totalBiasesDetected}
          </p>
          <p className="text-xs text-slate-500">Detected</p>
        </div>
        {mostCommonBias && (
          <div className="flex-1">
            <p className="text-xs text-slate-500">Most common:</p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {mostCommonBias.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
            </p>
          </div>
        )}
      </div>

      {/* Bias Bars */}
      {topBiases.length > 0 ? (
        <div className="flex-1 space-y-2">
          {topBiases.map((biasData) => {
            const percentage = (biasData.count / maxCount) * 100;
            const biasName = biasData.bias.replace(/_/g, ' ').toLowerCase();
            return (
              <div key={biasData.bias}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-300 capitalize truncate">
                    {biasName}
                  </span>
                  <span className="text-slate-500">{biasData.count}</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-300',
                      biasData.count === maxCount
                        ? 'bg-amber-500 dark:bg-amber-400'
                        : 'bg-amber-300 dark:bg-amber-600'
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center">
          <div>
            <div className="text-3xl mb-2">
              <span role="img" aria-label="Checkmark">
                &#9989;
              </span>
            </div>
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              No biases detected
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Keep journaling to track patterns
            </p>
          </div>
        </div>
      )}

      {/* Tip */}
      {showTips && mostCommonBias && BIAS_TIPS[mostCommonBias] && (
        <div className="mt-auto pt-2 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
            <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-300">
              <span className="font-medium">Tip: </span>
              {BIAS_TIPS[mostCommonBias]}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Skeleton for loading
export function BiasTrackerWidgetSkeleton() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="h-5 w-24 skeleton rounded" />
        <div className="h-6 w-16 skeleton rounded" />
      </div>
      <div className="flex items-center gap-4 mb-4">
        <div>
          <div className="h-7 w-10 skeleton rounded mb-1" />
          <div className="h-3 w-16 skeleton rounded" />
        </div>
        <div className="flex-1">
          <div className="h-3 w-20 skeleton rounded mb-1" />
          <div className="h-4 w-28 skeleton rounded" />
        </div>
      </div>
      <div className="flex-1 space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i}>
            <div className="flex justify-between mb-1">
              <div className="h-3 w-24 skeleton rounded" />
              <div className="h-3 w-6 skeleton rounded" />
            </div>
            <div className="h-2 w-full skeleton rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
