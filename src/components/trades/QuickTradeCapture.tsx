'use client';

import { useState, useCallback, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { TradeOutcome } from '@/lib/constants/taxonomy';

interface RecentTicker {
  ticker: string;
  count: number;
  lastUsed: string;
}

interface QuickTradeCaptureProps {
  onTradeCreated: (trade: {
    id: string;
    ticker: string;
    outcome: TradeOutcome;
    thesisId?: string | null;
  }) => void;
  onCancel: () => void;
  defaultTicker?: string;
}

/**
 * Ultra-simple 2-tap trade logging component.
 * Allows logging a trade with just ticker + outcome.
 */
export function QuickTradeCapture({
  onTradeCreated,
  onCancel,
  defaultTicker,
}: QuickTradeCaptureProps) {
  const [ticker, setTicker] = useState(defaultTicker?.toUpperCase() || '');
  const [outcome, setOutcome] = useState<TradeOutcome | null>(null);
  const [pnl, setPnl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkedThesis, setLinkedThesis] = useState<string | null>(null);

  // Recent tickers for autocomplete
  const [recentTickers, setRecentTickers] = useState<RecentTicker[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch recent tickers on mount
  useEffect(() => {
    const fetchRecentTickers = async () => {
      try {
        const response = await fetch('/api/tickers/recent');
        if (response.ok) {
          const data = await response.json();
          setRecentTickers(data.tickers || []);
        }
      } catch (err) {
        console.error('Failed to fetch recent tickers:', err);
      }
    };

    fetchRecentTickers();
  }, []);

  // Filter suggestions based on input
  const filteredSuggestions = recentTickers.filter(
    (t) =>
      t.ticker.toLowerCase().startsWith(ticker.toLowerCase()) &&
      t.ticker.toLowerCase() !== ticker.toLowerCase()
  );

  const handleSubmit = useCallback(async () => {
    if (!ticker.trim()) {
      setError('Ticker is required');
      return;
    }

    if (!outcome) {
      setError('Select an outcome');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/trades/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: ticker.toUpperCase(),
          outcome,
          approximatePnL: pnl ? parseFloat(pnl) : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create trade');
      }

      const data = await response.json();

      // Show linked thesis info
      if (data.autoLinkedThesis) {
        setLinkedThesis(data.autoLinkedThesis.name);
      }

      onTradeCreated({
        id: data.trade.id,
        ticker: data.trade.ticker,
        outcome: data.trade.outcome,
        thesisId: data.trade.thesisId,
      });
    } catch (err) {
      console.error('Quick trade error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create trade');
      setIsSubmitting(false);
    }
  }, [ticker, outcome, pnl, onTradeCreated]);

  // Auto-submit when outcome is selected and ticker is filled
  const handleOutcomeSelect = (selected: TradeOutcome) => {
    setOutcome(selected);
    // If ticker is already filled, submit automatically for faster UX
    if (ticker.trim() && !error) {
      // Small delay to show selection feedback
      setTimeout(() => {
        if (ticker.trim()) {
          handleSubmit();
        }
      }, 150);
    }
  };

  return (
    <div className="space-y-4" data-testid="quick-trade-capture">
      {/* Ticker input */}
      <div className="space-y-2">
        <Label htmlFor="quick-ticker">Ticker</Label>
        <div className="relative">
          <Input
            id="quick-ticker"
            type="text"
            value={ticker}
            onChange={(e) => {
              setTicker(e.target.value.toUpperCase());
              setShowSuggestions(true);
              setError(null);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              // Delay to allow click on suggestion
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            placeholder="e.g., AAPL"
            className="text-lg h-12"
            maxLength={5}
            autoComplete="off"
            data-testid="ticker-input"
          />

          {/* Autocomplete suggestions */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-auto">
              {filteredSuggestions.slice(0, 5).map((t) => (
                <button
                  key={t.ticker}
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-muted flex items-center justify-between"
                  onClick={() => {
                    setTicker(t.ticker);
                    setShowSuggestions(false);
                  }}
                  role="option"
                  aria-selected={ticker === t.ticker}
                >
                  <span className="font-medium">{t.ticker}</span>
                  <span className="text-xs text-muted-foreground">
                    {t.count} trade{t.count !== 1 ? 's' : ''}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Outcome buttons */}
      <div className="space-y-2">
        <Label>Outcome</Label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant={outcome === 'WIN' ? 'default' : 'outline'}
            className={cn(
              'h-14 flex-col gap-1',
              outcome === 'WIN' && 'bg-green-600 hover:bg-green-700 text-white'
            )}
            onClick={() => handleOutcomeSelect('WIN')}
            disabled={isSubmitting}
            data-testid="outcome-win"
          >
            <TrendingUp className="h-5 w-5" />
            <span className="text-xs">Win</span>
          </Button>

          <Button
            type="button"
            variant={outcome === 'LOSS' ? 'default' : 'outline'}
            className={cn(
              'h-14 flex-col gap-1',
              outcome === 'LOSS' && 'bg-red-600 hover:bg-red-700 text-white'
            )}
            onClick={() => handleOutcomeSelect('LOSS')}
            disabled={isSubmitting}
            data-testid="outcome-loss"
          >
            <TrendingDown className="h-5 w-5" />
            <span className="text-xs">Loss</span>
          </Button>

          <Button
            type="button"
            variant={outcome === 'BREAKEVEN' ? 'default' : 'outline'}
            className={cn(
              'h-14 flex-col gap-1',
              outcome === 'BREAKEVEN' && 'bg-gray-600 hover:bg-gray-700 text-white'
            )}
            onClick={() => handleOutcomeSelect('BREAKEVEN')}
            disabled={isSubmitting}
            data-testid="outcome-breakeven"
          >
            <Minus className="h-5 w-5" />
            <span className="text-xs">Even</span>
          </Button>
        </div>
      </div>

      {/* Optional P/L input */}
      <div className="space-y-2">
        <Label htmlFor="quick-pnl" className="text-sm text-muted-foreground">
          P/L (optional)
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            $
          </span>
          <Input
            id="quick-pnl"
            type="number"
            value={pnl}
            onChange={(e) => setPnl(e.target.value)}
            placeholder="0"
            className="pl-7 h-10"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Use negative for loss
        </p>
      </div>

      {/* Linked thesis indicator */}
      {linkedThesis && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-primary/20 bg-primary/5">
          <Check className="h-4 w-4 text-primary" />
          <span className="text-sm">
            Linked to <strong>{linkedThesis}</strong>
          </span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          className="flex-1 h-11"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>

        <Button
          className="flex-1 h-11"
          onClick={handleSubmit}
          disabled={!ticker.trim() || !outcome || isSubmitting}
          data-testid="save-quick-trade"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            'Save Trade'
          )}
        </Button>
      </div>
    </div>
  );
}

export default QuickTradeCapture;
