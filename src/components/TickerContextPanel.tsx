'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, History, Lightbulb, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TickerContext {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  high52w?: number;
  low52w?: number;
  iv?: number;
  hv20?: number;
  ivRank?: number;
  ivPremium?: number;
}

interface TickerHistory {
  ticker: string;
  entryCount: number;
  firstMentioned: string | null;
  lastMentioned: string | null;
  sentimentTrend: 'bullish' | 'bearish' | 'neutral' | 'mixed';
  commonBiases: Array<{ bias: string; count: number }>;
  convictionDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  recentEntries: Array<{
    id: string;
    content: string;
    createdAt: string;
    sentiment: string | null;
    conviction: string | null;
  }>;
}

interface FullTickerContext {
  market: TickerContext | null;
  history: TickerHistory;
  insight: string | null;
}

interface TickerContextPanelProps {
  ticker: string;
  className?: string;
  defaultExpanded?: boolean;
}

export default function TickerContextPanel({
  ticker,
  className,
  defaultExpanded = true,
}: TickerContextPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState<FullTickerContext | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch ticker context
  const fetchContext = useCallback(async () => {
    if (!ticker || ticker.length < 1) {
      setContext(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/context/ticker?ticker=${encodeURIComponent(ticker)}`);

      if (!response.ok) {
        throw new Error('Failed to fetch context');
      }

      const data: FullTickerContext = await response.json();
      setContext(data);
    } catch (err) {
      console.error('Failed to fetch ticker context:', err);
      setError('Could not load context');
    } finally {
      setIsLoading(false);
    }
  }, [ticker]);

  // Fetch context when ticker changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContext();
    }, 500); // Debounce

    return () => clearTimeout(timer);
  }, [fetchContext]);

  if (!ticker) {
    return null;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    }
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  const getSentimentColor = (trend: string) => {
    switch (trend) {
      case 'bullish':
        return 'text-green-600 dark:text-green-400';
      case 'bearish':
        return 'text-red-600 dark:text-red-400';
      case 'mixed':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold">{ticker}</span>
          <span className="text-sm text-muted-foreground">Context</span>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-3 pt-0 space-y-4 border-t">
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {isLoading && !context && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {context && (
            <>
              {/* Market Data */}
              {context.market && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">
                      {formatPrice(context.market.price)}
                    </span>
                    <span
                      className={cn(
                        'flex items-center text-sm font-medium',
                        context.market.changePercent >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      )}
                    >
                      {context.market.changePercent >= 0 ? (
                        <TrendingUp className="h-4 w-4 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 mr-1" />
                      )}
                      {formatPercent(context.market.changePercent)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {context.market.high52w && context.market.low52w && (
                      <div>
                        <span className="text-muted-foreground">52W Range:</span>
                        <span className="ml-1">
                          {formatPrice(context.market.low52w)} - {formatPrice(context.market.high52w)}
                        </span>
                      </div>
                    )}
                    {context.market.volume && (
                      <div>
                        <span className="text-muted-foreground">Volume:</span>
                        <span className="ml-1">{formatVolume(context.market.volume)}</span>
                      </div>
                    )}
                  </div>

                  {/* Options Context */}
                  {(context.market.iv || context.market.ivRank !== undefined) && (
                    <div className="p-2 bg-muted/30 rounded text-sm space-y-1">
                      <div className="font-medium">Options Context</div>
                      <div className="grid grid-cols-2 gap-2">
                        {context.market.ivRank !== undefined && (
                          <div>
                            <span className="text-muted-foreground">IV Rank:</span>
                            <span className="ml-1">{context.market.ivRank.toFixed(0)}%</span>
                          </div>
                        )}
                        {context.market.iv && context.market.hv20 && (
                          <>
                            <div>
                              <span className="text-muted-foreground">IV:</span>
                              <span className="ml-1">{(context.market.iv * 100).toFixed(0)}%</span>
                              <span className="text-muted-foreground"> | HV20:</span>
                              <span className="ml-1">{(context.market.hv20 * 100).toFixed(0)}%</span>
                            </div>
                            {context.market.ivPremium !== undefined && (
                              <div>
                                <span className="text-muted-foreground">IV Premium:</span>
                                <span
                                  className={cn(
                                    'ml-1',
                                    context.market.ivPremium > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                  )}
                                >
                                  {context.market.ivPremium > 0 ? '+' : ''}
                                  {(context.market.ivPremium * 100).toFixed(0)}%
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* History */}
              {context.history.entryCount > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <History className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Your History</span>
                    <Badge variant="secondary" className="text-xs">
                      {context.history.entryCount} {context.history.entryCount === 1 ? 'entry' : 'entries'}
                    </Badge>
                  </div>

                  <div className="text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Sentiment trend:</span>
                      <span className={cn('font-medium capitalize', getSentimentColor(context.history.sentimentTrend))}>
                        {context.history.sentimentTrend}
                      </span>
                    </div>

                    {context.history.lastMentioned && (
                      <div>
                        <span className="text-muted-foreground">Last entry:</span>
                        <span className="ml-1">
                          {new Date(context.history.lastMentioned).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {context.history.commonBiases.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {context.history.commonBiases.slice(0, 3).map(({ bias, count }) => (
                          <Badge key={bias} variant="outline" className="text-xs">
                            {bias.replace(/_/g, ' ')} ({count})
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent entries preview */}
                  {context.history.recentEntries.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs text-muted-foreground">Recent entries:</span>
                      {context.history.recentEntries.slice(0, 2).map((entry) => (
                        <div
                          key={entry.id}
                          className="p-2 bg-muted/30 rounded text-xs"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-muted-foreground">
                              {new Date(entry.createdAt).toLocaleDateString()}
                            </span>
                            {entry.sentiment && (
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-[10px]',
                                  entry.sentiment === 'positive' && 'text-green-600 dark:text-green-400 border-green-500/30',
                                  entry.sentiment === 'negative' && 'text-red-600 dark:text-red-400 border-red-500/30'
                                )}
                              >
                                {entry.sentiment}
                              </Badge>
                            )}
                          </div>
                          <p className="line-clamp-2">{entry.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* AI Insight */}
              {context.insight && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{context.insight}</p>
                  </div>
                </div>
              )}

              {/* No history message */}
              {context.history.entryCount === 0 && !context.market && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  First time journaling about {ticker}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
