'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { TradeDetectionResult } from '@/lib/tradeDetection';
import type { TradeOutcome } from '@/lib/constants/taxonomy';

interface TradeDetectionPromptProps {
  detection: TradeDetectionResult;
  entryId: string;
  onLogTrade: (
    outcome: TradeOutcome,
    options?: { ticker?: string; pnl?: number }
  ) => Promise<void>;
  onDismiss: () => void;
}

/**
 * Inline prompt shown after saving a journal entry when a trade is detected.
 * Allows user to quickly log the trade with one or two taps.
 */
export function TradeDetectionPrompt({
  detection,
  // entryId is required in props but may be used for future features like linking
  entryId: _,
  onLogTrade,
  onDismiss,
}: TradeDetectionPromptProps) {
  // Suppress unused warning - entryId may be needed for future trade linking
  void _;
  const [isLogging, setIsLogging] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<TradeOutcome | null>(
    detection.signals.outcome
  );
  const [showPnlInput, setShowPnlInput] = useState(false);
  const [pnlValue, setPnlValue] = useState<string>(
    detection.signals.approximatePnL?.toString() || ''
  );
  const [ticker, setTicker] = useState<string>(
    detection.signals.ticker || ''
  );
  const [error, setError] = useState<string | null>(null);

  const handleLogTrade = async (outcome: TradeOutcome) => {
    setIsLogging(true);
    setError(null);

    try {
      const pnl = pnlValue ? parseFloat(pnlValue) : undefined;
      await onLogTrade(outcome, {
        ticker: ticker || undefined,
        pnl: pnl !== undefined && !isNaN(pnl) ? pnl : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log trade');
      setIsLogging(false);
    }
  };

  const { signals } = detection;

  // Format the detected info summary
  const summaryParts: string[] = [];
  if (signals.ticker) summaryParts.push(signals.ticker);
  if (signals.action) {
    summaryParts.push(
      signals.action.charAt(0) + signals.action.slice(1).toLowerCase()
    );
  }
  if (signals.outcome) summaryParts.push(signals.outcome);

  return (
    <div
      className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3"
      role="region"
      aria-label="Trade detected"
      data-testid="trade-detection-prompt"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-primary/10">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">Trade detected in your entry</p>
            {summaryParts.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {summaryParts.join(' · ')}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 -mr-1 -mt-1"
          onClick={onDismiss}
          aria-label="Dismiss trade detection"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Ticker input (if not detected or user wants to change) */}
      {(!signals.ticker || showPnlInput) && (
        <div className="space-y-1">
          <Label htmlFor="trade-ticker" className="text-xs">
            Ticker
          </Label>
          <Input
            id="trade-ticker"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="e.g., AAPL"
            className="h-9"
            maxLength={5}
          />
        </div>
      )}

      {/* Optional P/L input */}
      {showPnlInput && (
        <div className="space-y-1">
          <Label htmlFor="trade-pnl" className="text-xs">
            P/L (optional)
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              $
            </span>
            <Input
              id="trade-pnl"
              type="number"
              value={pnlValue}
              onChange={(e) => setPnlValue(e.target.value)}
              placeholder="0"
              className="h-9 pl-7"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Use negative for loss (e.g., -150)
          </p>
        </div>
      )}

      {/* Outcome buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedOutcome === 'WIN' ? 'default' : 'outline'}
          size="sm"
          className={cn(
            'flex-1 min-w-[80px] h-11 gap-1.5',
            selectedOutcome === 'WIN' && 'bg-green-600 hover:bg-green-700'
          )}
          onClick={() => {
            if (showPnlInput) {
              handleLogTrade('WIN');
            } else {
              setSelectedOutcome('WIN');
              handleLogTrade('WIN');
            }
          }}
          disabled={isLogging}
          data-testid="log-as-win-button"
        >
          <TrendingUp className="h-4 w-4" />
          Log as Win
        </Button>

        <Button
          variant={selectedOutcome === 'LOSS' ? 'default' : 'outline'}
          size="sm"
          className={cn(
            'flex-1 min-w-[80px] h-11 gap-1.5',
            selectedOutcome === 'LOSS' && 'bg-red-600 hover:bg-red-700'
          )}
          onClick={() => {
            if (showPnlInput) {
              handleLogTrade('LOSS');
            } else {
              setSelectedOutcome('LOSS');
              handleLogTrade('LOSS');
            }
          }}
          disabled={isLogging}
          data-testid="log-as-loss-button"
        >
          <TrendingDown className="h-4 w-4" />
          Log as Loss
        </Button>

        <Button
          variant={selectedOutcome === 'BREAKEVEN' ? 'default' : 'outline'}
          size="sm"
          className={cn(
            'flex-1 min-w-[80px] h-11 gap-1.5',
            selectedOutcome === 'BREAKEVEN' && 'bg-gray-600 hover:bg-gray-700'
          )}
          onClick={() => {
            if (showPnlInput) {
              handleLogTrade('BREAKEVEN');
            } else {
              setSelectedOutcome('BREAKEVEN');
              handleLogTrade('BREAKEVEN');
            }
          }}
          disabled={isLogging}
          data-testid="log-as-breakeven-button"
        >
          <Minus className="h-4 w-4" />
          Breakeven
        </Button>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-1">
        {!showPnlInput ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-8"
            onClick={() => setShowPnlInput(true)}
          >
            + Add P/L details
          </Button>
        ) : (
          <div />
        )}

        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-8 text-muted-foreground"
          onClick={onDismiss}
          disabled={isLogging}
          data-testid="just-journal-button"
        >
          Just Journal
        </Button>
      </div>

      {/* Loading state */}
      {isLogging && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Logging trade...
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
    </div>
  );
}

export default TradeDetectionPrompt;
