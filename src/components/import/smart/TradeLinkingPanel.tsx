'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link2,
  Plus,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  X,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type {
  ParsedTrade,
  LinkGroup,
  LinkSuggestion,
  ExistingTrade,
  TradeAction,
} from '@/stores/smartImportStore';
import { ThesisDirection } from '@prisma/client';

// ============================================
// Types
// ============================================

interface TradeLinkingPanelProps {
  approvedTrades: ParsedTrade[];
  linkGroups: LinkGroup[];
  suggestions: LinkSuggestion[];
  suggestionsLoading: boolean;
  onAcceptSuggestion: (suggestionId: string) => void;
  onDismissSuggestion: (suggestionId: string) => void;
  onCreateGroup: (group: Omit<LinkGroup, 'id' | 'isNew'>) => void;
  onUpdateGroup: (groupId: string, updates: Partial<LinkGroup>) => void;
  onDeleteGroup: (groupId: string) => void;
  onAddTradeToGroup: (groupId: string, tradeId: string, action?: TradeAction) => void;
  onRemoveTradeFromGroup: (groupId: string, tradeId: string) => void;
  onSearchExisting?: (ticker: string) => Promise<ExistingTrade[]>;
  onSkip: () => void;
  onContinue: () => void;
}

// ============================================
// Constants
// ============================================

const DIRECTION_OPTIONS: { value: ThesisDirection; label: string; icon: string }[] = [
  { value: 'BULLISH', label: 'Bullish', icon: '📈' },
  { value: 'BEARISH', label: 'Bearish', icon: '📉' },
  { value: 'NEUTRAL', label: 'Neutral', icon: '↔️' },
  { value: 'VOLATILE', label: 'Volatile', icon: '📊' },
];

// ============================================
// Sub-components
// ============================================

interface SuggestionCardProps {
  suggestion: LinkSuggestion;
  trades: ParsedTrade[];
  onAccept: () => void;
  onDismiss: () => void;
}

function SuggestionCard({ suggestion, trades, onAccept, onDismiss }: SuggestionCardProps) {
  const suggestionTrades = trades.filter((t) => suggestion.tradeIds.includes(t.id));
  const confidenceColor =
    suggestion.confidence >= 85
      ? 'text-green-600'
      : suggestion.confidence >= 60
        ? 'text-amber-600'
        : 'text-gray-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-3 rounded-lg border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-600" />
          <span className="font-medium text-sm">{suggestion.suggestedName}</span>
        </div>
        <span className={cn('text-xs font-medium', confidenceColor)}>
          {suggestion.confidence}%
        </span>
      </div>

      <p className="text-xs text-muted-foreground mb-2">{suggestion.reason}</p>

      <div className="space-y-1 mb-3">
        {suggestionTrades.slice(0, 3).map((trade) => (
          <div key={trade.id} className="flex items-center gap-2 text-xs">
            <Badge variant="outline" className="text-[10px] px-1">
              {trade.ticker}
            </Badge>
            <span className="text-muted-foreground">
              {format(new Date(trade.openedAt), 'MMM d')} - {trade.strategyDisplay}
            </span>
          </div>
        ))}
        {suggestionTrades.length > 3 && (
          <span className="text-xs text-muted-foreground">
            +{suggestionTrades.length - 3} more
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="h-7 text-xs"
        >
          Dismiss
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={onAccept}
          className="h-7 text-xs bg-amber-600 hover:bg-amber-700"
        >
          <Check className="h-3 w-3 mr-1" />
          Accept
        </Button>
      </div>
    </motion.div>
  );
}

interface LinkGroupCardProps {
  group: LinkGroup;
  trades: ParsedTrade[];
  onUpdate: (updates: Partial<LinkGroup>) => void;
  onDelete: () => void;
  onRemoveTrade: (tradeId: string) => void;
}

function LinkGroupCard({
  group,
  trades,
  onUpdate,
  onDelete,
  onRemoveTrade,
}: LinkGroupCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const groupTrades = trades.filter((t) => group.tradeIds.includes(t.id));
  const totalPL = groupTrades.reduce((sum, t) => sum + (t.realizedPL ?? 0), 0);

  return (
    <div className="rounded-lg border bg-card">
      <div
        className="p-3 flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-primary" />
          <Input
            value={group.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            className="h-7 text-sm font-medium border-none p-0 focus-visible:ring-0"
            placeholder="Group name..."
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {group.tradeIds.length} trades
          </Badge>
          <span
            className={cn(
              'text-xs font-medium',
              totalPL >= 0 ? 'text-green-600' : 'text-red-600'
            )}
          >
            {totalPL >= 0 ? '+' : ''}${totalPL.toFixed(0)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t"
          >
            <div className="p-3 space-y-3">
              {/* Direction selector */}
              <div className="flex items-center gap-2">
                <Label className="text-xs w-16">Direction:</Label>
                <Select
                  value={group.direction}
                  onValueChange={(value) =>
                    onUpdate({ direction: value as ThesisDirection })
                  }
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIRECTION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.icon} {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Trades list */}
              <div className="space-y-1">
                {groupTrades.map((trade) => (
                  <div
                    key={trade.id}
                    className="flex items-center justify-between p-2 rounded bg-muted/50"
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">
                        {format(new Date(trade.openedAt), 'MMM d')}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {trade.ticker}
                      </Badge>
                      <span>{trade.strategyDisplay}</span>
                      <span
                        className={cn(
                          'font-medium',
                          (trade.realizedPL ?? 0) >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        )}
                      >
                        {(trade.realizedPL ?? 0) >= 0 ? '+' : ''}$
                        {(trade.realizedPL ?? 0).toFixed(0)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => onRemoveTrade(trade.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export default function TradeLinkingPanel({
  approvedTrades,
  linkGroups,
  suggestions,
  suggestionsLoading,
  onAcceptSuggestion,
  onDismissSuggestion,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onRemoveTradeFromGroup,
  onSkip,
  onContinue,
}: TradeLinkingPanelProps) {
  // State
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDirection, setNewGroupDirection] = useState<ThesisDirection>('BULLISH');
  const [selectedTradeIds, setSelectedTradeIds] = useState<Set<string>>(new Set());

  // Computed
  const linkedTradeIds = new Set(linkGroups.flatMap((g) => g.tradeIds));
  const unlinkedTrades = approvedTrades.filter((t) => !linkedTradeIds.has(t.id));

  // Handlers
  const toggleTradeSelection = (tradeId: string) => {
    setSelectedTradeIds((prev) => {
      const next = new Set(prev);
      if (next.has(tradeId)) {
        next.delete(tradeId);
      } else {
        next.add(tradeId);
      }
      return next;
    });
  };

  const handleCreateGroup = useCallback(() => {
    if (selectedTradeIds.size < 2) return;

    const selectedTrades = approvedTrades.filter((t) => selectedTradeIds.has(t.id));
    const ticker = selectedTrades[0]?.ticker || '';

    onCreateGroup({
      name: newGroupName || `${ticker} Trade Group`,
      ticker,
      direction: newGroupDirection,
      tradeIds: Array.from(selectedTradeIds),
    });

    // Reset
    setNewGroupName('');
    setNewGroupDirection('BULLISH');
    setSelectedTradeIds(new Set());
    setIsCreating(false);
  }, [selectedTradeIds, newGroupName, newGroupDirection, approvedTrades, onCreateGroup]);

  const hasEnoughForGroup = selectedTradeIds.size >= 2;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Link Related Trades
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Group related trades into theses for better tracking
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* AI Suggestions */}
        {(suggestions.length > 0 || suggestionsLoading) && (
          <div className="space-y-2">
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="flex items-center justify-between w-full text-sm font-medium"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <span>Suggestions ({suggestions.length})</span>
              </div>
              {showSuggestions ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            <AnimatePresence>
              {showSuggestions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2"
                >
                  {suggestionsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground">
                        Analyzing trades...
                      </span>
                    </div>
                  ) : (
                    suggestions.map((suggestion) => (
                      <SuggestionCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        trades={approvedTrades}
                        onAccept={() => onAcceptSuggestion(suggestion.id)}
                        onDismiss={() => onDismissSuggestion(suggestion.id)}
                      />
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Link Groups */}
        {linkGroups.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Your Link Groups ({linkGroups.length})</h3>
            {linkGroups.map((group) => (
              <LinkGroupCard
                key={group.id}
                group={group}
                trades={approvedTrades}
                onUpdate={(updates) => onUpdateGroup(group.id, updates)}
                onDelete={() => onDeleteGroup(group.id)}
                onRemoveTrade={(tradeId) => onRemoveTradeFromGroup(group.id, tradeId)}
              />
            ))}
          </div>
        )}

        {/* Unlinked Trades */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              Unlinked Trades ({unlinkedTrades.length})
            </h3>
            {unlinkedTrades.length >= 2 && !isCreating && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreating(true)}
                className="h-7 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Create Group
              </Button>
            )}
          </div>

          {/* Create group form */}
          <AnimatePresence>
            {isCreating && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="p-3 rounded-lg border bg-muted/30 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Group name..."
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Select
                    value={newGroupDirection}
                    onValueChange={(value) =>
                      setNewGroupDirection(value as ThesisDirection)
                    }
                  >
                    <SelectTrigger className="h-8 w-32 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIRECTION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.icon} {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <p className="text-xs text-muted-foreground">
                  Select at least 2 trades to create a group
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsCreating(false);
                      setSelectedTradeIds(new Set());
                    }}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleCreateGroup}
                    disabled={!hasEnoughForGroup}
                    className="h-7 text-xs"
                  >
                    Create Group ({selectedTradeIds.size} selected)
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Trade list */}
          <div className="space-y-1">
            {unlinkedTrades.map((trade) => {
              const isSelected = selectedTradeIds.has(trade.id);
              return (
                <div
                  key={trade.id}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors',
                    isCreating && 'hover:bg-muted/50',
                    isSelected && 'bg-primary/10 border-primary'
                  )}
                  onClick={() => isCreating && toggleTradeSelection(trade.id)}
                >
                  {isCreating && (
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleTradeSelection(trade.id)}
                    />
                  )}
                  <div className="flex-1 flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">
                      {format(new Date(trade.openedAt), 'MMM d')}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {trade.ticker}
                    </Badge>
                    <span className="truncate">{trade.strategyDisplay}</span>
                  </div>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      (trade.realizedPL ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {(trade.realizedPL ?? 0) >= 0 ? '+' : ''}$
                    {(trade.realizedPL ?? 0).toFixed(0)}
                  </span>
                </div>
              );
            })}

            {unlinkedTrades.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                All trades have been linked to groups
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t flex items-center justify-between">
        <Button variant="ghost" onClick={onSkip}>
          Skip Linking
        </Button>
        <Button onClick={onContinue} className="gap-2">
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
