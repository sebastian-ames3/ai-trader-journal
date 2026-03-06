'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  Check,
  X,
  CalendarDays,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { TradeOutcome } from '@/lib/constants/taxonomy';

type TradeStatus = 'OPEN' | 'CLOSED' | 'EXPIRED' | 'ASSIGNED';

const STRATEGY_TYPES = [
  'LONG_CALL', 'LONG_PUT', 'SHORT_CALL', 'SHORT_PUT',
  'CALL_SPREAD', 'PUT_SPREAD', 'IRON_CONDOR', 'IRON_BUTTERFLY',
  'STRADDLE', 'STRANGLE', 'CALENDAR', 'DIAGONAL',
  'RATIO', 'BUTTERFLY', 'STOCK', 'COVERED_CALL',
  'CASH_SECURED_PUT', 'CUSTOM',
] as const;

function formatStrategyLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatPL(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}$${Math.abs(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

interface TradeDetail {
  id: string;
  ticker: string | null;
  description: string;
  strategyType: string | null;
  expiration: string | null;
  debitCredit: number;
  quantity: number;
  realizedPL: number | null;
  outcome: TradeOutcome | null;
  status: TradeStatus;
  reasoningNote: string | null;
  openedAt: string;
  closedAt: string | null;
  createdAt: string;
  action: string;
  thesis: { id: string; name: string; ticker: string } | null;
}

interface EditForm {
  ticker: string;
  description: string;
  strategyType: string;
  expiration: string;
  realizedPL: string;
  outcome: TradeOutcome | '';
  status: TradeStatus;
  reasoningNote: string;
}

export default function TradePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [trade, setTrade] = useState<TradeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);

  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm'>('idle');
  const [isDeleting, setIsDeleting] = useState(false);

  // For closing an open trade inline
  const [closeOutcome, setCloseOutcome] = useState<TradeOutcome | null>(null);
  const [closePnl, setClosePnl] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrade() {
      try {
        const res = await fetch(`/api/trades/${id}`);
        if (res.status === 404) { setNotFound(true); return; }
        if (!res.ok) throw new Error('Failed to fetch trade');
        const data: TradeDetail = await res.json();
        setTrade(data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchTrade();
  }, [id]);

  function enterEdit() {
    if (!trade) return;
    setForm({
      ticker: trade.ticker ?? '',
      description: trade.description,
      strategyType: trade.strategyType ?? '',
      expiration: trade.expiration ? format(new Date(trade.expiration), 'yyyy-MM-dd') : '',
      realizedPL: trade.realizedPL !== null ? String(trade.realizedPL) : '',
      outcome: trade.outcome ?? '',
      status: trade.status,
      reasoningNote: trade.reasoningNote ?? '',
    });
    setSaveError(null);
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setForm(null);
    setSaveError(null);
  }

  async function saveEdit() {
    if (!form || !trade) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const body: Record<string, unknown> = {
        ticker: form.ticker.trim().toUpperCase() || null,
        description: form.description,
        strategyType: form.strategyType || null,
        expiration: form.expiration || null,
        realizedPL: form.realizedPL !== '' ? parseFloat(form.realizedPL) : null,
        outcome: form.outcome || null,
        status: form.status,
        reasoningNote: form.reasoningNote || null,
      };
      const res = await fetch(`/api/trades/${trade.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }
      const updated: TradeDetail = await res.json();
      setTrade(updated);
      setIsEditing(false);
      setForm(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!trade) return;
    if (deleteStep === 'idle') { setDeleteStep('confirm'); return; }
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/trades/${trade.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      router.push('/trades');
    } catch {
      setDeleteStep('idle');
      setIsDeleting(false);
    }
  }

  async function handleClose() {
    if (!trade || !closeOutcome) return;
    setIsClosing(true);
    setCloseError(null);
    try {
      const res = await fetch(`/api/trades/${trade.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outcome: closeOutcome,
          status: 'CLOSED',
          closedAt: new Date().toISOString(),
          realizedPL: closePnl ? parseFloat(closePnl) : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to close trade');
      }
      const updated: TradeDetail = await res.json();
      setTrade(updated);
      setCloseOutcome(null);
      setClosePnl('');
    } catch (err) {
      setCloseError(err instanceof Error ? err.message : 'Failed to close trade');
    } finally {
      setIsClosing(false);
    }
  }

  // ── Loading / not found ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (notFound || !trade) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center gap-4">
        <p className="text-slate-500 dark:text-slate-400">Trade not found.</p>
        <Button variant="outline" onClick={() => router.push('/trades')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Trades
        </Button>
      </div>
    );
  }

  const displayTicker = trade.ticker ?? trade.thesis?.ticker ?? '—';

  // ── View mode ────────────────────────────────────────────────────────────

  if (!isEditing) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <button
              onClick={() => router.push('/trades')}
              className="flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Trades</span>
            </button>
            <button
              onClick={enterEdit}
              className="flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          {/* Hero card */}
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'inline-block w-2.5 h-2.5 rounded-full flex-shrink-0',
                      trade.status === 'OPEN' ? 'bg-blue-500' : 'bg-slate-400'
                    )}
                  />
                  <h1 className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                    ${displayTicker}
                  </h1>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className={cn(
                    'text-xs',
                    trade.status === 'OPEN' && 'text-blue-600 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-900/20',
                  )}>
                    {trade.status}
                  </Badge>
                  {trade.outcome && (
                    <Badge variant="outline" className={cn(
                      'text-xs',
                      trade.outcome === 'WIN' && 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
                      trade.outcome === 'LOSS' && 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
                      trade.outcome === 'BREAKEVEN' && 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400',
                    )}>
                      {trade.outcome === 'WIN' && <TrendingUp className="h-3 w-3 mr-1 inline" />}
                      {trade.outcome === 'LOSS' && <TrendingDown className="h-3 w-3 mr-1 inline" />}
                      {trade.outcome === 'BREAKEVEN' && <Minus className="h-3 w-3 mr-1 inline" />}
                      {trade.outcome}
                    </Badge>
                  )}
                  {trade.strategyType && (
                    <Badge variant="outline" className="text-xs">
                      {formatStrategyLabel(trade.strategyType)}
                    </Badge>
                  )}
                </div>
              </div>
              {trade.realizedPL !== null && (
                <span className={cn(
                  'text-2xl font-bold flex-shrink-0',
                  trade.realizedPL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                )}>
                  {formatPL(trade.realizedPL)}
                </span>
              )}
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
              <span>Opened {format(new Date(trade.openedAt || trade.createdAt), 'MMM d, yyyy')}</span>
              {trade.closedAt && <span>Closed {format(new Date(trade.closedAt), 'MMM d, yyyy')}</span>}
              {trade.expiration && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  Exp {format(new Date(trade.expiration), 'MMM d, yyyy')}
                </span>
              )}
              {trade.thesis && (
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {trade.thesis.name}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {trade.description && (
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-700/50">
              <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Notes</h2>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{trade.description}</p>
            </div>
          )}

          {/* Reasoning note */}
          {trade.reasoningNote && (
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-700/50">
              <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Reasoning</h2>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{trade.reasoningNote}</p>
            </div>
          )}

          {/* Close Trade section (only for open trades) */}
          {trade.status === 'OPEN' && (
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-700/50">
              <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Close Trade</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {(['WIN', 'LOSS', 'BREAKEVEN'] as TradeOutcome[]).map((o) => (
                    <Button
                      key={o}
                      type="button"
                      variant={closeOutcome === o ? 'default' : 'outline'}
                      className={cn(
                        'h-14 flex-col gap-1',
                        closeOutcome === o && o === 'WIN' && 'bg-green-600 hover:bg-green-700 text-white',
                        closeOutcome === o && o === 'LOSS' && 'bg-red-600 hover:bg-red-700 text-white',
                        closeOutcome === o && o === 'BREAKEVEN' && 'bg-gray-600 hover:bg-gray-700 text-white',
                      )}
                      onClick={() => setCloseOutcome(closeOutcome === o ? null : o)}
                      disabled={isClosing}
                    >
                      {o === 'WIN' && <TrendingUp className="h-5 w-5" />}
                      {o === 'LOSS' && <TrendingDown className="h-5 w-5" />}
                      {o === 'BREAKEVEN' && <Minus className="h-5 w-5" />}
                      <span className="text-xs">{o === 'BREAKEVEN' ? 'Even' : o.charAt(0) + o.slice(1).toLowerCase()}</span>
                    </Button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={closePnl}
                    onChange={(e) => setClosePnl(e.target.value)}
                    placeholder="P/L (optional, negative for loss)"
                    className="pl-7 h-10"
                  />
                </div>
                {closeError && <p className="text-sm text-destructive">{closeError}</p>}
                <Button
                  onClick={handleClose}
                  disabled={!closeOutcome || isClosing}
                  className="w-full h-11"
                >
                  {isClosing ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Closing...</> : 'Close Trade'}
                </Button>
              </div>
            </div>
          )}

          {/* Delete */}
          <div className="pt-2 pb-8">
            {deleteStep === 'idle' ? (
              <Button
                variant="outline"
                className="w-full h-11 text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Trade
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-center text-sm text-slate-500 dark:text-slate-400">This cannot be undone.</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-11"
                    onClick={() => setDeleteStep('idle')}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 h-11"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yes, Delete'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Edit mode ────────────────────────────────────────────────────────────

  if (!form) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={cancelEdit}
            className="flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
            <span className="text-sm font-medium">Cancel</span>
          </button>
          <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">Edit Trade</h1>
          <button
            onClick={saveEdit}
            disabled={isSaving}
            className="flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-12">
        {saveError && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
            {saveError}
          </div>
        )}

        {/* Ticker */}
        <div className="space-y-1.5">
          <Label htmlFor="edit-ticker">Ticker</Label>
          <Input
            id="edit-ticker"
            value={form.ticker}
            onChange={(e) => setForm({ ...form, ticker: e.target.value.toUpperCase() })}
            placeholder="e.g., AAPL"
            className="h-12 text-lg font-mono"
            maxLength={5}
          />
        </div>

        {/* Strategy type */}
        <div className="space-y-1.5">
          <Label>Strategy</Label>
          <Select
            value={form.strategyType || 'none'}
            onValueChange={(v) => setForm({ ...form, strategyType: v === 'none' ? '' : v })}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select strategy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {STRATEGY_TYPES.map((s) => (
                <SelectItem key={s} value={s}>{formatStrategyLabel(s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select
            value={form.status}
            onValueChange={(v) => setForm({ ...form, status: v as TradeStatus })}
          >
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
              <SelectItem value="ASSIGNED">Assigned</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Outcome */}
        <div className="space-y-1.5">
          <Label>Outcome</Label>
          <div className="grid grid-cols-3 gap-2">
            {(['WIN', 'LOSS', 'BREAKEVEN'] as TradeOutcome[]).map((o) => (
              <Button
                key={o}
                type="button"
                variant={form.outcome === o ? 'default' : 'outline'}
                className={cn(
                  'h-14 flex-col gap-1',
                  form.outcome === o && o === 'WIN' && 'bg-green-600 hover:bg-green-700 text-white',
                  form.outcome === o && o === 'LOSS' && 'bg-red-600 hover:bg-red-700 text-white',
                  form.outcome === o && o === 'BREAKEVEN' && 'bg-gray-600 hover:bg-gray-700 text-white',
                )}
                onClick={() => setForm({ ...form, outcome: form.outcome === o ? '' : o })}
              >
                {o === 'WIN' && <TrendingUp className="h-5 w-5" />}
                {o === 'LOSS' && <TrendingDown className="h-5 w-5" />}
                {o === 'BREAKEVEN' && <Minus className="h-5 w-5" />}
                <span className="text-xs">{o === 'BREAKEVEN' ? 'Even' : o.charAt(0) + o.slice(1).toLowerCase()}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* P/L */}
        <div className="space-y-1.5">
          <Label htmlFor="edit-pl">Realized P/L</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="edit-pl"
              type="text"
              inputMode="decimal"
              value={form.realizedPL}
              onChange={(e) => setForm({ ...form, realizedPL: e.target.value })}
              placeholder="0"
              className="pl-7 h-11"
            />
          </div>
          <p className="text-xs text-muted-foreground">Use negative for a loss</p>
        </div>

        {/* Expiration */}
        <div className="space-y-1.5">
          <Label htmlFor="edit-exp">Expiration Date</Label>
          <Input
            id="edit-exp"
            type="date"
            value={form.expiration}
            onChange={(e) => setForm({ ...form, expiration: e.target.value })}
            className="h-11"
          />
        </div>

        {/* Description / Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="edit-desc">Notes</Label>
          <Textarea
            id="edit-desc"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Trade notes..."
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Reasoning note */}
        <div className="space-y-1.5">
          <Label htmlFor="edit-reason">Reasoning</Label>
          <Textarea
            id="edit-reason"
            value={form.reasoningNote}
            onChange={(e) => setForm({ ...form, reasoningNote: e.target.value })}
            placeholder="Why did you take this trade?"
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Save button (bottom shortcut) */}
        <Button onClick={saveEdit} disabled={isSaving} className="w-full h-12">
          {isSaving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
