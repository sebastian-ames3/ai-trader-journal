'use client';

import { useState } from 'react';
import { Link2, X, Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export interface LinkSuggestion {
  tradeId: string;
  thesisId: string;
  thesisName: string;
  ticker: string;
  openedAt: string;
  strategyType: string | null;
  description: string;
  matchScore: number;
  matchReasons: string[];
}

interface TradeLinkSuggestionsProps {
  suggestions: LinkSuggestion[];
  onLink: (tradeId: string) => void;
  onDismiss: () => void;
  mode?: 'inline' | 'modal';
  className?: string;
}

export default function TradeLinkSuggestions({
  suggestions,
  onLink,
  onDismiss,
  mode = 'inline',
  className,
}: TradeLinkSuggestionsProps) {
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(
    suggestions.length === 1 ? suggestions[0].tradeId : null
  );
  const [isExpanded, setIsExpanded] = useState(mode === 'modal');

  if (suggestions.length === 0) {
    return null;
  }

  const handleConfirmLink = () => {
    if (selectedTradeId) {
      onLink(selectedTradeId);
    }
  };

  // Format strategy type for display
  const formatStrategy = (type: string | null): string => {
    if (!type) return 'Trade';
    return type
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Get confidence badge variant
  const getConfidenceBadge = (score: number) => {
    if (score >= 0.8) return { variant: 'default' as const, label: 'High' };
    if (score >= 0.6) return { variant: 'secondary' as const, label: 'Medium' };
    return { variant: 'outline' as const, label: 'Low' };
  };

  // Inline mode - collapsible card
  if (mode === 'inline' && !isExpanded) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        className={cn(
          'w-full p-3 rounded-lg border border-primary/20 bg-primary/5',
          'flex items-center gap-3 text-left hover:bg-primary/10 transition-colors',
          className
        )}
      >
        <div className="p-2 rounded-full bg-primary/10">
          <Link2 className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            Link to {suggestions[0].ticker} trade?
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {suggestions.length === 1
              ? suggestions[0].description
              : `${suggestions.length} matching trades found`}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-primary/20 bg-background',
        mode === 'inline' && 'shadow-sm',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {suggestions.length === 1
              ? 'Link to trade?'
              : `${suggestions.length} trades match`}
          </span>
        </div>
        {mode === 'inline' && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsExpanded(false)}
            aria-label="Collapse suggestions"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Suggestions list */}
      <div className="p-2 space-y-1 max-h-[200px] overflow-y-auto">
        {suggestions.slice(0, 3).map((suggestion) => {
          const isSelected = selectedTradeId === suggestion.tradeId;
          const confidence = getConfidenceBadge(suggestion.matchScore);

          return (
            <button
              key={suggestion.tradeId}
              type="button"
              onClick={() => setSelectedTradeId(suggestion.tradeId)}
              className={cn(
                'w-full p-3 rounded-md text-left transition-colors',
                isSelected
                  ? 'bg-primary/10 border border-primary'
                  : 'hover:bg-muted/50 border border-transparent'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {suggestion.ticker}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatStrategy(suggestion.strategyType)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {suggestion.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(suggestion.openedAt), 'MMM d @ h:mm a')}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={confidence.variant} className="text-[10px]">
                    {Math.round(suggestion.matchScore * 100)}%
                  </Badge>
                  {isSelected && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              </div>
              {/* Match reasons */}
              <div className="flex flex-wrap gap-1 mt-2">
                {suggestion.matchReasons.slice(0, 2).map((reason, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                  >
                    {reason}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 p-3 border-t">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="flex-1"
        >
          Skip Linking
        </Button>
        <Button
          size="sm"
          onClick={handleConfirmLink}
          disabled={!selectedTradeId}
          className="flex-1 gap-1"
        >
          <Link2 className="h-3 w-3" />
          Link
        </Button>
      </div>
    </div>
  );
}
