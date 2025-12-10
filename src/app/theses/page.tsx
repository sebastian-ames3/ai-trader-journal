'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, TrendingUp, TrendingDown, Minus, Activity, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Thesis {
  id: string;
  name: string;
  ticker: string;
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'VOLATILE';
  status: 'ACTIVE' | 'CLOSED' | 'EXPIRED';
  originalThesis: string;
  startedAt: string;
  closedAt: string | null;
  totalRealizedPL: number;
  totalUnrealizedPL: number;
  totalCapitalDeployed: number;
  outcome: 'WIN' | 'LOSS' | 'BREAKEVEN' | null;
  _count: {
    thesisTrades: number;
    updates: number;
  };
  thesisTrades: Array<{
    id: string;
    action: string;
    status: string;
    debitCredit: number;
    realizedPL: number | null;
    openedAt: string;
  }>;
}

const DIRECTION_CONFIG = {
  BULLISH: { icon: TrendingUp, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  BEARISH: { icon: TrendingDown, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  NEUTRAL: { icon: Minus, color: 'text-slate-600 dark:text-slate-400', bgColor: 'bg-slate-100 dark:bg-slate-800' },
  VOLATILE: { icon: Activity, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
};

function formatPL(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function calculateROC(realizedPL: number, capitalDeployed: number): string {
  if (capitalDeployed === 0) return '0%';
  const roc = (realizedPL / capitalDeployed) * 100;
  const sign = roc >= 0 ? '+' : '';
  return `${sign}${roc.toFixed(0)}% ROC`;
}

function getDaysActive(startedAt: string, closedAt: string | null): number {
  const start = new Date(startedAt);
  const end = closedAt ? new Date(closedAt) : new Date();
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function ThesisCard({ thesis }: { thesis: Thesis }) {
  const DirectionIcon = DIRECTION_CONFIG[thesis.direction].icon;
  const directionColors = DIRECTION_CONFIG[thesis.direction];
  const daysActive = getDaysActive(thesis.startedAt, thesis.closedAt);
  const roc = calculateROC(thesis.totalRealizedPL, thesis.totalCapitalDeployed);
  const lastTrade = thesis.thesisTrades[0];

  return (
    <Link href={`/theses/${thesis.id}`}>
      <div
        className={cn(
          'group relative',
          'bg-white dark:bg-slate-800/50',
          'rounded-2xl p-4',
          'border border-slate-200/50 dark:border-slate-700/50',
          'transition-all duration-200',
          'hover:shadow-md hover:border-slate-300/50 dark:hover:border-slate-600/50',
          'active:scale-[0.98]'
        )}
      >
        {/* Direction indicator line */}
        <div
          className={cn(
            'absolute left-0 top-4 bottom-4 w-1 rounded-full',
            thesis.direction === 'BULLISH' && 'bg-green-500',
            thesis.direction === 'BEARISH' && 'bg-red-500',
            thesis.direction === 'NEUTRAL' && 'bg-slate-400',
            thesis.direction === 'VOLATILE' && 'bg-amber-500'
          )}
        />

        <div className="pl-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className="font-mono text-xs bg-slate-50 dark:bg-slate-800"
              >
                ${thesis.ticker}
              </Badge>
              <Badge
                variant="secondary"
                className={cn('text-xs font-medium', directionColors.bgColor, directionColors.color)}
              >
                <DirectionIcon className="h-3 w-3 mr-1" />
                {thesis.direction.charAt(0) + thesis.direction.slice(1).toLowerCase()}
              </Badge>
              {thesis.status === 'CLOSED' && (
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    thesis.outcome === 'WIN' && 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
                    thesis.outcome === 'LOSS' && 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
                    thesis.outcome === 'BREAKEVEN' && 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                  )}
                >
                  {thesis.outcome}
                </Badge>
              )}
            </div>
            <span
              className={cn(
                'text-lg font-semibold',
                thesis.totalRealizedPL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              )}
            >
              {formatPL(thesis.totalRealizedPL)}
            </span>
          </div>

          {/* Name */}
          <h3 className="text-base font-medium text-slate-900 dark:text-slate-100 mb-1">
            {thesis.name}
          </h3>

          {/* Stats row */}
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            {thesis._count.thesisTrades} trade{thesis._count.thesisTrades !== 1 ? 's' : ''} • {daysActive} day{daysActive !== 1 ? 's' : ''} • {roc}
          </p>

          {/* Last trade info */}
          {lastTrade && (
            <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-1">
              Last: {lastTrade.action.charAt(0) + lastTrade.action.slice(1).toLowerCase().replace('_', ' ')} ({formatDistanceToNow(new Date(lastTrade.openedAt), { addSuffix: true })})
            </p>
          )}

          {/* Chevron indicator */}
          <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </Link>
  );
}

function ThesisCardSkeleton() {
  return (
    <div
      className={cn(
        'relative',
        'bg-white dark:bg-slate-800/50',
        'rounded-2xl p-4',
        'border border-slate-200/50 dark:border-slate-700/50'
      )}
    >
      <div className="absolute left-0 top-4 bottom-4 w-1 rounded-full skeleton" />
      <div className="pl-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-14 skeleton rounded" />
          <div className="h-5 w-20 skeleton rounded" />
        </div>
        <div className="h-5 w-48 skeleton rounded" />
        <div className="h-4 w-32 skeleton rounded" />
        <div className="h-4 w-40 skeleton rounded" />
      </div>
    </div>
  );
}

export default function ThesesPage() {
  const router = useRouter();
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ACTIVE' | 'CLOSED' | 'all'>('ACTIVE');

  const fetchTheses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.set('status', filter);
      }
      const response = await fetch(`/api/theses?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch theses');
      const data = await response.json();
      setTheses(data.theses);
    } catch (error) {
      console.error('Error fetching theses:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchTheses();
  }, [fetchTheses]);

  const activeTheses = theses.filter(t => t.status === 'ACTIVE');
  const closedTheses = theses.filter(t => t.status === 'CLOSED');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Trading Theses
            </h1>
            <Button
              onClick={() => router.push('/theses/new')}
              className="min-h-[44px]"
            >
              <Plus className="h-5 w-5 mr-1" />
              New Thesis
            </Button>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mt-4">
            {(['ACTIVE', 'CLOSED', 'all'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-[40px]',
                  filter === f
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                )}
              >
                {f === 'all' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <ThesisCardSkeleton key={i} />
            ))}
          </div>
        ) : theses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📈</div>
            <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">
              {filter === 'ACTIVE' ? 'No active theses' : filter === 'CLOSED' ? 'No closed theses' : 'No theses yet'}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {filter === 'ACTIVE'
                ? 'Start a new thesis to track your trading ideas'
                : filter === 'CLOSED'
                ? 'Your closed theses will appear here'
                : 'Create your first thesis to group related trades'}
            </p>
            <Button
              size="lg"
              onClick={() => router.push('/theses/new')}
              className="min-h-[48px]"
            >
              <Plus className="mr-2 h-5 w-5" />
              Create First Thesis
            </Button>
          </div>
        ) : filter === 'all' ? (
          <div className="space-y-6">
            {activeTheses.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                  Active ({activeTheses.length})
                </h2>
                <div className="space-y-3">
                  {activeTheses.map((thesis) => (
                    <ThesisCard key={thesis.id} thesis={thesis} />
                  ))}
                </div>
              </section>
            )}
            {closedTheses.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                  Recently Closed ({closedTheses.length})
                </h2>
                <div className="space-y-3">
                  {closedTheses.map((thesis) => (
                    <ThesisCard key={thesis.id} thesis={thesis} />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {theses.map((thesis) => (
              <ThesisCard key={thesis.id} thesis={thesis} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
