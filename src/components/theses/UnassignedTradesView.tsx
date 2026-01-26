'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import ThesisSuggestionCard from './ThesisSuggestionCard';
import type { ThesisSuggestion } from '@/lib/thesisGeneration';

interface UnassignedTrade {
  id: string;
  ticker: string;
  outcome: 'WIN' | 'LOSS' | 'BREAKEVEN' | null;
  realizedPL: number | null;
  strategyType: string | null;
  description: string | null;
  status: string;
  sourceType: string;
  createdAt: string;
}

interface TickerSummary {
  ticker: string;
  count: number;
  wins: number;
  losses: number;
  breakevens: number;
  totalPnL: number;
}

interface UnassignedTradesViewProps {
  className?: string;
  collapsible?: boolean;
  initiallyExpanded?: boolean;
}

/**
 * Component showing unassigned trades and AI thesis suggestions.
 * PRD-B Feature 5: Thesis as Emergent
 */
export function UnassignedTradesView({
  className,
  collapsible = true,
  initiallyExpanded = true,
}: UnassignedTradesViewProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [trades, setTrades] = useState<UnassignedTrade[]>([]);
  const [summary, setSummary] = useState<TickerSummary[]>([]);
  const [suggestions, setSuggestions] = useState<ThesisSuggestion[]>([]);

  // Fetch unassigned trades
  const fetchTrades = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/trades/unassigned');
      if (!response.ok) throw new Error('Failed to fetch trades');

      const data = await response.json();
      setTrades(data.trades || []);
      setSummary(data.summary || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trades');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch thesis suggestions
  const fetchSuggestions = useCallback(async () => {
    setIsFetchingSuggestions(true);

    try {
      const response = await fetch('/api/theses/suggestions');
      if (!response.ok) throw new Error('Failed to generate suggestions');

      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      // Don't show error for suggestions - they're optional
    } finally {
      setIsFetchingSuggestions(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  // Fetch suggestions when we have trades
  useEffect(() => {
    if (trades.length > 0 && suggestions.length === 0 && !isFetchingSuggestions) {
      fetchSuggestions();
    }
  }, [trades.length, suggestions.length, isFetchingSuggestions, fetchSuggestions]);

  // Handle accepting a suggestion
  const handleAcceptSuggestion = async (
    suggestion: ThesisSuggestion,
    customizations?: { name?: string; thesisText?: string }
  ) => {
    const response = await fetch('/api/theses/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suggestion, customize: customizations }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to create thesis');
    }

    const data = await response.json();

    toast({
      title: 'Thesis created',
      description: data.message,
    });

    // Refresh data
    await fetchTrades();
    // Remove the accepted suggestion
    setSuggestions((prev) =>
      prev.filter((s) => s.ticker !== suggestion.ticker)
    );

    // Navigate to the new thesis
    router.push(`/theses/${data.thesis.id}`);
  };

  // Handle dismissing a suggestion
  const handleDismissSuggestion = (ticker: string) => {
    setSuggestions((prev) => prev.filter((s) => s.ticker !== ticker));
  };

  // If no unassigned trades, don't show anything
  if (!isLoading && trades.length === 0) {
    return null;
  }

  const content = (
    <div className="space-y-4">
      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 text-destructive p-4 rounded-lg bg-destructive/10">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm">{error}</p>
          <Button variant="ghost" size="sm" onClick={fetchTrades}>
            Retry
          </Button>
        </div>
      )}

      {/* Suggestions */}
      {!isLoading && suggestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <h4 className="text-sm font-medium">AI Suggestions</h4>
            {isFetchingSuggestions && (
              <Loader2 className="h-3 w-3 animate-spin" />
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {suggestions.slice(0, 4).map((suggestion) => (
              <ThesisSuggestionCard
                key={suggestion.ticker}
                suggestion={suggestion}
                onAccept={handleAcceptSuggestion}
                onDismiss={() => handleDismissSuggestion(suggestion.ticker)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Trade summary by ticker */}
      {!isLoading && summary.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            {trades.length} unassigned trades
          </h4>
          <div className="flex flex-wrap gap-2">
            {summary.slice(0, 10).map((item) => (
              <div
                key={item.ticker}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border"
              >
                <span className="font-mono font-semibold text-sm">
                  ${item.ticker}
                </span>
                <span className="text-xs text-muted-foreground">
                  {item.count} trades
                </span>
                <div className="flex items-center gap-1 text-xs">
                  {item.wins > 0 && (
                    <Badge variant="outline" className="text-green-600 px-1.5 py-0">
                      <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                      {item.wins}
                    </Badge>
                  )}
                  {item.losses > 0 && (
                    <Badge variant="outline" className="text-red-600 px-1.5 py-0">
                      <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
                      {item.losses}
                    </Badge>
                  )}
                  {item.breakevens > 0 && (
                    <Badge variant="outline" className="text-slate-600 px-1.5 py-0">
                      <Minus className="h-2.5 w-2.5 mr-0.5" />
                      {item.breakevens}
                    </Badge>
                  )}
                </div>
                {item.totalPnL !== 0 && (
                  <span
                    className={cn(
                      'text-xs font-medium',
                      item.totalPnL > 0 ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {item.totalPnL > 0 ? '+' : ''}${item.totalPnL.toFixed(0)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate suggestions button */}
      {!isLoading && trades.length >= 2 && suggestions.length === 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSuggestions}
          disabled={isFetchingSuggestions}
          className="gap-2"
        >
          {isFetchingSuggestions ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Thesis Suggestions
            </>
          )}
        </Button>
      )}
    </div>
  );

  if (!collapsible) {
    return <div className={className}>{content}</div>;
  }

  return (
    <div
      className={cn(
        'rounded-xl border bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20',
        className
      )}
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <span className="font-medium">
            {trades.length} Trades Without Thesis
          </span>
          {suggestions.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              {suggestions.length} suggestions
            </Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && <div className="px-4 pb-4">{content}</div>}
    </div>
  );
}

export default UnassignedTradesView;
