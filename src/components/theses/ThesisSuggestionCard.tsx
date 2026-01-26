'use client';

import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Sparkles,
  Check,
  Edit2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { ThesisSuggestion } from '@/lib/thesisGeneration';

interface ThesisSuggestionCardProps {
  suggestion: ThesisSuggestion;
  onAccept: (
    suggestion: ThesisSuggestion,
    customizations?: {
      name?: string;
      direction?: string;
      thesisText?: string;
    }
  ) => Promise<void>;
  onDismiss?: () => void;
}

const DIRECTION_CONFIG = {
  BULLISH: {
    icon: TrendingUp,
    color: 'text-green-600',
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
  },
  BEARISH: {
    icon: TrendingDown,
    color: 'text-red-600',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
  },
  NEUTRAL: {
    icon: Minus,
    color: 'text-slate-600',
    bg: 'bg-slate-50 dark:bg-slate-900/20',
    border: 'border-slate-200 dark:border-slate-800',
  },
  VOLATILE: {
    icon: Activity,
    color: 'text-purple-600',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
  },
};

/**
 * Card component for displaying an AI-generated thesis suggestion.
 * Allows customization before accepting.
 */
export function ThesisSuggestionCard({
  suggestion,
  onAccept,
  onDismiss,
}: ThesisSuggestionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [editedName, setEditedName] = useState(suggestion.suggestedName);
  const [editedThesis, setEditedThesis] = useState(suggestion.thesisText);
  const [error, setError] = useState<string | null>(null);

  const config = DIRECTION_CONFIG[suggestion.direction];
  const DirectionIcon = config.icon;

  const handleAccept = async () => {
    setIsAccepting(true);
    setError(null);

    try {
      const customizations =
        editedName !== suggestion.suggestedName ||
        editedThesis !== suggestion.thesisText
          ? {
              name: editedName,
              thesisText: editedThesis,
            }
          : undefined;

      await onAccept(suggestion, customizations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create thesis');
      setIsAccepting(false);
    }
  };

  const { stats } = suggestion;
  const winRate = stats.totalTrades > 0
    ? Math.round((stats.wins / stats.totalTrades) * 100)
    : 0;

  return (
    <div
      className={cn(
        'rounded-xl border-2 p-4 space-y-4 transition-all',
        config.border,
        config.bg
      )}
      data-testid="thesis-suggestion-card"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              'bg-white dark:bg-slate-800'
            )}
          >
            <span className="text-lg font-bold font-mono">
              ${suggestion.ticker}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <DirectionIcon className={cn('h-4 w-4', config.color)} />
              <Badge variant="secondary" className="capitalize">
                {suggestion.direction.toLowerCase()}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {Math.round(suggestion.confidence * 100)}% confidence
              </Badge>
            </div>
            {!isEditing ? (
              <h3 className="font-semibold mt-1">{editedName}</h3>
            ) : (
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="mt-1 h-8 text-sm"
                placeholder="Thesis name"
              />
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
          className="h-8"
        >
          <Edit2 className="h-3 w-3 mr-1" />
          {isEditing ? 'Done' : 'Edit'}
        </Button>
      </div>

      {/* Thesis text */}
      {!isEditing ? (
        <p className="text-sm text-muted-foreground">{editedThesis}</p>
      ) : (
        <Textarea
          value={editedThesis}
          onChange={(e) => setEditedThesis(e.target.value)}
          className="text-sm min-h-[80px]"
          placeholder="Your thesis..."
        />
      )}

      {/* Stats */}
      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="outline">
          {stats.totalTrades} trades
        </Badge>
        <Badge
          variant="outline"
          className={cn(
            winRate >= 50 ? 'text-green-600' : 'text-red-600'
          )}
        >
          {winRate}% win rate
        </Badge>
        {stats.totalPnL !== null && (
          <Badge
            variant="outline"
            className={cn(
              stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
            )}
          >
            {stats.totalPnL >= 0 ? '+' : ''}${stats.totalPnL.toFixed(2)}
          </Badge>
        )}
        <Badge variant="outline">
          {suggestion.sourcedFrom.entryIds.length} entries
        </Badge>
      </div>

      {/* Reasoning */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-white/50 dark:bg-slate-800/50 p-2 rounded-lg">
        <Sparkles className="h-3 w-3 mt-0.5 flex-shrink-0" />
        <p>{suggestion.reasoning}</p>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        {onDismiss && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDismiss}
            disabled={isAccepting}
            className="flex-1"
          >
            Dismiss
          </Button>
        )}
        <Button
          size="sm"
          onClick={handleAccept}
          disabled={isAccepting || !editedName.trim()}
          className="flex-1"
        >
          {isAccepting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
              Creating...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-1" />
              Create Thesis
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default ThesisSuggestionCard;
