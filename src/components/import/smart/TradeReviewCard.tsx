'use client';

import { useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import {
  Check,
  X,
  Edit3,
  Link2,
  TrendingUp,
  TrendingDown,
  Calendar,
  ChevronDown,
  ChevronUp,
  Undo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { formatStrategyType, STRATEGY_TYPE_OPTIONS } from '@/lib/csvImport';
import type {
  ParsedTrade,
  TradeEdits,
  ThesisTradeStatus,
} from '@/stores/smartImportStore';
import { StrategyType } from '@prisma/client';

// ============================================
// Types
// ============================================

interface TradeReviewCardProps {
  trade: ParsedTrade;
  position: number;
  total: number;
  suggestedLinks?: {
    count: number;
    preview: string;
  };
  onApprove: (tradeId: string, edits?: TradeEdits, notes?: string) => void;
  onSkip: (tradeId: string) => void;
  onUndo?: () => void;
  onLinkRequest?: (tradeId: string) => void;
  swipeThreshold?: number;
  canUndo?: boolean;
}

// ============================================
// Constants
// ============================================

const SWIPE_THRESHOLD = 100;
const SWIPE_VELOCITY_THRESHOLD = 500;

const STATUS_OPTIONS: { value: ThesisTradeStatus; label: string }[] = [
  { value: 'OPEN', label: 'Open' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'ASSIGNED', label: 'Assigned' },
];

// ============================================
// Component
// ============================================

export default function TradeReviewCard({
  trade,
  position,
  total,
  suggestedLinks,
  onApprove,
  onSkip,
  onUndo,
  onLinkRequest,
  swipeThreshold = SWIPE_THRESHOLD,
  canUndo = false,
}: TradeReviewCardProps) {
  // State
  const [isExpanded, setIsExpanded] = useState(false);
  const [notes, setNotes] = useState('');
  const [edits, setEdits] = useState<TradeEdits>({});
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);

  // Motion values
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-10, 0, 10]);
  const approveOpacity = useTransform(x, [0, swipeThreshold], [0, 1]);
  const skipOpacity = useTransform(x, [-swipeThreshold, 0], [1, 0]);

  // Computed
  const displayTrade = {
    ...trade,
    ...edits,
    ticker: edits.ticker || trade.ticker,
    strategyType: edits.strategyType ?? trade.strategyType,
    openedAt: edits.openedAt || trade.openedAt,
    closedAt: edits.closedAt ?? trade.closedAt,
    debitCredit: edits.debitCredit ?? trade.debitCredit,
    realizedPL: edits.realizedPL ?? trade.realizedPL,
    status: edits.status || trade.status,
    description: edits.description ?? trade.description,
  };

  const isProfit = (displayTrade.realizedPL ?? 0) >= 0;

  // Handlers
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset, velocity } = info;

      // Check if swipe exceeds threshold
      const swipedRight =
        offset.x > swipeThreshold || velocity.x > SWIPE_VELOCITY_THRESHOLD;
      const swipedLeft =
        offset.x < -swipeThreshold || velocity.x < -SWIPE_VELOCITY_THRESHOLD;

      if (swipedRight) {
        setExitDirection('right');
        setIsAnimatingOut(true);
      } else if (swipedLeft) {
        setExitDirection('left');
        setIsAnimatingOut(true);
      }
    },
    [swipeThreshold]
  );

  const handleAnimationComplete = useCallback(() => {
    if (isAnimatingOut) {
      if (exitDirection === 'right') {
        onApprove(trade.id, Object.keys(edits).length > 0 ? edits : undefined, notes || undefined);
      } else if (exitDirection === 'left') {
        onSkip(trade.id);
      }
      // Reset state for next card
      setIsAnimatingOut(false);
      setExitDirection(null);
      setNotes('');
      setEdits({});
      setIsExpanded(false);
    }
  }, [isAnimatingOut, exitDirection, trade.id, edits, notes, onApprove, onSkip]);

  const handleApproveClick = () => {
    setExitDirection('right');
    setIsAnimatingOut(true);
  };

  const handleSkipClick = () => {
    setExitDirection('left');
    setIsAnimatingOut(true);
  };

  const handleEditChange = <K extends keyof TradeEdits>(
    key: K,
    value: TradeEdits[K]
  ) => {
    setEdits((prev) => ({ ...prev, [key]: value }));
  };

  // Animation variants
  const cardVariants = {
    initial: { scale: 0.95, opacity: 0, y: 20 },
    animate: { scale: 1, opacity: 1, y: 0 },
    exit: {
      x: exitDirection === 'right' ? 500 : -500,
      opacity: 0,
      rotate: exitDirection === 'right' ? 15 : -15,
      transition: { duration: 0.3 },
    },
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Swipe indicators (background) */}
      <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
        <motion.div
          className="flex items-center gap-2 text-destructive"
          style={{ opacity: skipOpacity }}
        >
          <X className="h-8 w-8" />
          <span className="font-semibold">Skip</span>
        </motion.div>
        <motion.div
          className="flex items-center gap-2 text-green-600"
          style={{ opacity: approveOpacity }}
        >
          <span className="font-semibold">Approve</span>
          <Check className="h-8 w-8" />
        </motion.div>
      </div>

      {/* Card */}
      <motion.div
        className={cn(
          'relative bg-background rounded-2xl shadow-lg border overflow-hidden',
          'touch-none select-none'
        )}
        style={{ x, rotate }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        variants={cardVariants}
        initial="initial"
        animate={isAnimatingOut ? 'exit' : 'animate'}
        onAnimationComplete={handleAnimationComplete}
        whileTap={{ cursor: 'grabbing' }}
      >
        {/* Swipe overlays */}
        <motion.div
          className="absolute inset-0 bg-green-500/20 pointer-events-none"
          style={{ opacity: approveOpacity }}
        />
        <motion.div
          className="absolute inset-0 bg-red-500/20 pointer-events-none"
          style={{ opacity: skipOpacity }}
        />

        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-sm font-semibold bg-primary/10 border-primary/20"
              >
                {displayTrade.ticker}
              </Badge>
              {displayTrade.strategyType && (
                <Badge variant="secondary" className="text-xs">
                  {formatStrategyType(displayTrade.strategyType)}
                </Badge>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {position} / {total}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Dates */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Opened: {format(new Date(displayTrade.openedAt), 'MMM d, yyyy')}</span>
            </div>
            {displayTrade.closedAt && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span>Closed: {format(new Date(displayTrade.closedAt), 'MMM d, yyyy')}</span>
              </div>
            )}
          </div>

          {/* P/L and Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isProfit ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
              <span
                className={cn(
                  'text-lg font-semibold',
                  isProfit ? 'text-green-600' : 'text-red-600'
                )}
              >
                {isProfit ? '+' : ''}${(displayTrade.realizedPL ?? 0).toFixed(2)}
              </span>
            </div>
            <Badge
              variant={displayTrade.status === 'CLOSED' ? 'default' : 'outline'}
            >
              {displayTrade.status}
            </Badge>
          </div>

          {/* Legs */}
          {displayTrade.legs && (
            <div className="text-sm">
              <span className="text-muted-foreground">Legs: </span>
              <span className="font-mono">{displayTrade.legs}</span>
            </div>
          )}

          {/* Notes input (always visible) */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Notes</Label>
            <Textarea
              placeholder="Add notes about this trade..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[60px] text-sm resize-none"
            />
          </div>

          {/* Link suggestion */}
          {suggestedLinks && suggestedLinks.count > 0 && (
            <button
              onClick={() => onLinkRequest?.(trade.id)}
              className={cn(
                'w-full p-2 rounded-lg text-left text-sm',
                'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800',
                'hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors'
              )}
            >
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-amber-600" />
                <span className="text-amber-700 dark:text-amber-400">
                  {suggestedLinks.preview}
                </span>
              </div>
            </button>
          )}

          {/* Expand/Collapse Edit */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Edit3 className="h-4 w-4 mr-2" />
            {isExpanded ? 'Hide Details' : 'Edit Details'}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 ml-auto" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-auto" />
            )}
          </Button>

          {/* Expanded Edit Form */}
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-3 pt-2 border-t"
            >
              {/* Ticker */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Ticker</Label>
                  <Input
                    value={edits.ticker ?? trade.ticker}
                    onChange={(e) =>
                      handleEditChange('ticker', e.target.value.toUpperCase())
                    }
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Strategy</Label>
                  <Select
                    value={edits.strategyType ?? trade.strategyType ?? ''}
                    onValueChange={(value) =>
                      handleEditChange('strategyType', value as StrategyType)
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {STRATEGY_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Open Date</Label>
                  <Input
                    type="date"
                    value={
                      edits.openedAt
                        ? edits.openedAt.split('T')[0]
                        : trade.openedAt.split('T')[0]
                    }
                    onChange={(e) =>
                      handleEditChange('openedAt', e.target.value)
                    }
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Close Date</Label>
                  <Input
                    type="date"
                    value={
                      edits.closedAt
                        ? edits.closedAt.split('T')[0]
                        : (trade.closedAt?.split('T')[0] ?? '')
                    }
                    onChange={(e) =>
                      handleEditChange('closedAt', e.target.value || undefined)
                    }
                    className="h-9"
                  />
                </div>
              </div>

              {/* P/L and Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Realized P/L</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={edits.realizedPL ?? trade.realizedPL ?? ''}
                    onChange={(e) =>
                      handleEditChange(
                        'realizedPL',
                        e.target.value ? parseFloat(e.target.value) : undefined
                      )
                    }
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Status</Label>
                  <Select
                    value={edits.status ?? trade.status}
                    onValueChange={(value) =>
                      handleEditChange('status', value as ThesisTradeStatus)
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <Label className="text-xs">Description</Label>
                <Input
                  value={edits.description ?? trade.description ?? ''}
                  onChange={(e) =>
                    handleEditChange('description', e.target.value)
                  }
                  placeholder="Trade description..."
                  className="h-9"
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer with buttons */}
        <div className="p-4 border-t bg-muted/30">
          <div className="flex items-center justify-between gap-2">
            {canUndo && (
              <Button variant="ghost" size="sm" onClick={onUndo}>
                <Undo2 className="h-4 w-4 mr-1" />
                Undo
              </Button>
            )}
            <div className="flex-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSkipClick}
              className="gap-1"
            >
              <X className="h-4 w-4" />
              Skip
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleApproveClick}
              className="gap-1 bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4" />
              Approve
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-2">
            ← Swipe to Skip &nbsp;&nbsp;&nbsp; Swipe to Approve →
          </p>
        </div>
      </motion.div>
    </div>
  );
}
