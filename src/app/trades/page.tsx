'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Mic,
  Camera,
  Keyboard,
  Loader2,
  Plus,
  X,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import QuickTradeCapture from '@/components/trades/QuickTradeCapture';
import type { TradeOutcome } from '@/lib/constants/taxonomy';

type TradeStatus = 'OPEN' | 'CLOSED' | 'EXPIRED' | 'ASSIGNED';
type TradeFilter = 'all' | 'OPEN' | 'CLOSED';

interface Trade {
  id: string;
  ticker: string;
  outcome: TradeOutcome | null;
  realizedPL: number | null;
  status: TradeStatus;
  sourceType: string;
  description: string | null;
  createdAt: string;
  openedAt: string;
  closedAt: string | null;
  action: string;
  thesis: { id: string; name: string; ticker: string } | null;
}

const SOURCE_ICONS: Record<string, typeof Mic> = {
  VOICE: Mic,
  AI_DETECTED: Mic,
  SCREENSHOT: Camera,
};

function formatPL(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}$${Math.abs(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function TradeCard({
  trade,
  onClose,
  onEdit,
}: {
  trade: Trade;
  onClose: (trade: Trade) => void;
  onEdit: (trade: Trade) => void;
}) {
  const SourceIcon = SOURCE_ICONS[trade.sourceType] ?? Keyboard;
  const date = new Date(trade.openedAt || trade.createdAt);

  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-800/50',
        'rounded-2xl p-4',
        'border border-slate-200/50 dark:border-slate-700/50',
        'transition-all duration-200',
        trade.status !== 'OPEN' && 'cursor-pointer hover:shadow-md hover:border-slate-300/50 dark:hover:border-slate-600/50 active:scale-[0.98]'
      )}
      onClick={() => trade.status !== 'OPEN' && onEdit(trade)}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: ticker + status */}
        <div
          className={cn(
            'flex items-center gap-2 flex-wrap min-w-0',
            trade.status === 'OPEN' && 'cursor-pointer'
          )}
          onClick={(e) => {
            if (trade.status === 'OPEN') {
              e.stopPropagation();
              onClose(trade);
            }
          }}
        >
          {/* Status dot */}
          <span
            className={cn(
              'inline-block w-2 h-2 rounded-full flex-shrink-0',
              trade.status === 'OPEN' ? 'bg-blue-500' : 'bg-slate-400'
            )}
          />
          <Badge variant="outline" className="font-mono text-sm font-semibold bg-slate-50 dark:bg-slate-800">
            ${trade.ticker}
          </Badge>

          {/* Outcome badge */}
          {trade.status === 'CLOSED' && trade.outcome && (
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                trade.outcome === 'WIN' && 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
                trade.outcome === 'LOSS' && 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
                trade.outcome === 'BREAKEVEN' && 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
              )}
            >
              {trade.outcome === 'WIN' && <TrendingUp className="h-3 w-3 mr-1 inline" />}
              {trade.outcome === 'LOSS' && <TrendingDown className="h-3 w-3 mr-1 inline" />}
              {trade.outcome === 'BREAKEVEN' && <Minus className="h-3 w-3 mr-1 inline" />}
              {trade.outcome}
            </Badge>
          )}

          {trade.status === 'OPEN' && (
            <Badge variant="outline" className="text-xs text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
              OPEN · tap to close
            </Badge>
          )}
        </div>

        {/* Right: P/L + edit button */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {trade.realizedPL !== null && (
            <span
              className={cn(
                'text-base font-semibold',
                trade.realizedPL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              )}
            >
              {formatPL(trade.realizedPL)}
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(trade); }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Edit trade"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Secondary line: thesis + date + source */}
      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
        <SourceIcon className="h-3 w-3 flex-shrink-0" />
        <span>{formatDistanceToNow(date, { addSuffix: true })}</span>
        {trade.thesis && (
          <>
            <span>·</span>
            <span className="truncate">{trade.thesis.name}</span>
          </>
        )}
      </div>
    </div>
  );
}

function CloseTradeModal({
  trade,
  onDone,
  onCancel,
}: {
  trade: Trade;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [outcome, setOutcome] = useState<TradeOutcome | null>(null);
  const [pnl, setPnl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = async () => {
    if (!outcome) {
      setError('Select an outcome');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/trades/${trade.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outcome,
          status: 'CLOSED',
          closedAt: new Date().toISOString(),
          realizedPL: pnl ? parseFloat(pnl) : undefined,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to close trade');
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close trade');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-background rounded-t-2xl sm:rounded-2xl shadow-xl p-6 space-y-4 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Close <span className="font-mono">${trade.ticker}</span>
          </h3>
          <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Outcome</Label>
          <div className="grid grid-cols-3 gap-2">
            {(['WIN', 'LOSS', 'BREAKEVEN'] as TradeOutcome[]).map((o) => (
              <Button
                key={o}
                type="button"
                variant={outcome === o ? 'default' : 'outline'}
                className={cn(
                  'h-14 flex-col gap-1',
                  outcome === o && o === 'WIN' && 'bg-green-600 hover:bg-green-700 text-white',
                  outcome === o && o === 'LOSS' && 'bg-red-600 hover:bg-red-700 text-white',
                  outcome === o && o === 'BREAKEVEN' && 'bg-gray-600 hover:bg-gray-700 text-white'
                )}
                onClick={() => setOutcome(o)}
                disabled={isSubmitting}
              >
                {o === 'WIN' && <TrendingUp className="h-5 w-5" />}
                {o === 'LOSS' && <TrendingDown className="h-5 w-5" />}
                {o === 'BREAKEVEN' && <Minus className="h-5 w-5" />}
                <span className="text-xs">{o === 'BREAKEVEN' ? 'Even' : o.charAt(0) + o.slice(1).toLowerCase()}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="close-pnl" className="text-sm text-muted-foreground">P/L (optional)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="close-pnl"
              type="text"
              inputMode="decimal"
              value={pnl}
              onChange={(e) => setPnl(e.target.value)}
              placeholder="0"
              className="pl-7 h-10"
            />
          </div>
          <p className="text-xs text-muted-foreground">Use negative for loss</p>
        </div>

        {error && <p className="text-sm text-destructive text-center">{error}</p>}

        <Button onClick={handleClose} disabled={!outcome || isSubmitting} className="w-full h-11">
          {isSubmitting ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" />Closing...</>
          ) : (
            'Close Trade'
          )}
        </Button>
      </div>
    </div>
  );
}

export default function TradesPage() {
  const router = useRouter();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TradeFilter>('all');
  const [showLogTrade, setShowLogTrade] = useState(false);
  const [closingTrade, setClosingTrade] = useState<Trade | null>(null);

  const fetchTrades = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (filter !== 'all') params.set('status', filter);
      const response = await fetch(`/api/trades?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch trades');
      const data = await response.json();
      setTrades(data.trades || []);
    } catch (err) {
      console.error('Error fetching trades:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const handleTradeCreated = () => {
    setShowLogTrade(false);
    fetchTrades();
  };

  const handleCloseDone = () => {
    setClosingTrade(null);
    fetchTrades();
  };

  const handleEditTrade = (trade: Trade) => {
    router.push(`/trades/${trade.id}`);
  };

  const emptyMessage =
    filter === 'OPEN'
      ? 'No open trades. Log one with the button above.'
      : filter === 'CLOSED'
      ? 'No closed trades yet.'
      : 'No trades logged yet. Tap Log Trade to start.';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Trades</h1>
            <Button onClick={() => setShowLogTrade(true)} className="min-h-[44px] gap-1">
              <Plus className="h-4 w-4" />
              Log Trade
            </Button>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mt-4">
            {(['all', 'OPEN', 'CLOSED'] as TradeFilter[]).map((f) => (
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
      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-700/50 h-20 animate-pulse"
              />
            ))}
          </div>
        ) : trades.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📊</div>
            <p className="text-slate-500 dark:text-slate-400 mb-6">{emptyMessage}</p>
            <Button onClick={() => setShowLogTrade(true)} size="lg" className="min-h-[48px]">
              <Plus className="mr-2 h-5 w-5" />
              Log Trade
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {trades.map((trade) => (
              <TradeCard key={trade.id} trade={trade} onClose={setClosingTrade} onEdit={handleEditTrade} />
            ))}
          </div>
        )}
      </div>

      {/* Log Trade modal */}
      {showLogTrade && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowLogTrade(false)} />
          <div className="relative w-full max-w-sm bg-background rounded-t-2xl sm:rounded-2xl shadow-xl p-6 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Log Trade</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowLogTrade(false)} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <QuickTradeCapture
              onTradeCreated={handleTradeCreated}
              onCancel={() => setShowLogTrade(false)}
            />
          </div>
        </div>
      )}

      {/* Close trade modal */}
      {closingTrade && (
        <CloseTradeModal
          trade={closingTrade}
          onDone={handleCloseDone}
          onCancel={() => setClosingTrade(null)}
        />
      )}
    </div>
  );
}
