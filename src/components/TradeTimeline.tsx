'use client';

import { formatDistanceToNow, format } from 'date-fns';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  CircleDot,
  RefreshCw,
  XCircle,
  Shuffle,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Paperclip,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface TradeAttachment {
  id: string;
  type: string;
  filename: string;
  url: string;
}

interface TimelineTrade {
  id: string;
  action: string;
  description: string;
  strategyType: string | null;
  openedAt: string;
  closedAt: string | null;
  debitCredit: number;
  quantity: number;
  realizedPL: number | null;
  status: string;
  reasoningNote: string | null;
  attachments?: TradeAttachment[];
}

interface TradeTimelineProps {
  trades: TimelineTrade[];
  onTradeClick?: (tradeId: string) => void;
  onEditTrade?: (trade: TimelineTrade) => void;
  onDeleteTrade?: (tradeId: string) => void;
  className?: string;
}

const ACTION_CONFIG = {
  INITIAL: {
    icon: CircleDot,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-500',
    label: 'Initial Position',
  },
  ADD: {
    icon: ArrowUpCircle,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-500',
    label: 'Added',
  },
  REDUCE: {
    icon: ArrowDownCircle,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    borderColor: 'border-amber-500',
    label: 'Reduced',
  },
  ROLL: {
    icon: RefreshCw,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    borderColor: 'border-purple-500',
    label: 'Rolled',
  },
  CONVERT: {
    icon: Shuffle,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    borderColor: 'border-indigo-500',
    label: 'Converted',
  },
  CLOSE: {
    icon: XCircle,
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    borderColor: 'border-slate-500',
    label: 'Closed',
  },
  ASSIGNED: {
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    borderColor: 'border-red-500',
    label: 'Assigned',
  },
  EXERCISED: {
    icon: CheckCircle,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
    borderColor: 'border-teal-500',
    label: 'Exercised',
  },
} as const;

function formatCurrency(value: number): string {
  const sign = value >= 0 ? '+' : '-';
  return `${sign}$${Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function TradeTimeline({
  trades,
  onTradeClick,
  onEditTrade,
  onDeleteTrade,
  className,
}: TradeTimelineProps) {
  const showActions = Boolean(onEditTrade || onDeleteTrade);
  // Sort trades by date (oldest first for timeline)
  const sortedTrades = [...trades].sort(
    (a, b) => new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime()
  );

  if (trades.length === 0) {
    return (
      <div className="text-center py-8">
        <DollarSign className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
        <p className="text-slate-500 dark:text-slate-400">No trades logged yet</p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
          Add your first trade to start tracking
        </p>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Timeline line */}
      <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-slate-200 dark:bg-slate-700" />

      {/* Timeline entries */}
      <div className="space-y-4">
        {sortedTrades.map((trade, index) => {
          const config = ACTION_CONFIG[trade.action as keyof typeof ACTION_CONFIG] || ACTION_CONFIG.INITIAL;
          const Icon = config.icon;
          const isLast = index === sortedTrades.length - 1;
          const hasAttachments = trade.attachments && trade.attachments.length > 0;

          return (
            <div
              key={trade.id}
              className={cn(
                'relative flex gap-4 group',
                onTradeClick && 'cursor-pointer'
              )}
              onClick={() => onTradeClick?.(trade.id)}
              role={onTradeClick ? 'button' : undefined}
              tabIndex={onTradeClick ? 0 : undefined}
            >
              {/* Timeline node */}
              <div
                className={cn(
                  'relative z-10 flex-shrink-0',
                  'w-10 h-10 rounded-full',
                  'flex items-center justify-center',
                  'border-2 bg-white dark:bg-slate-900',
                  config.borderColor,
                  'transition-transform group-hover:scale-110'
                )}
              >
                <Icon className={cn('h-5 w-5', config.color)} />
              </div>

              {/* Content card */}
              <div
                className={cn(
                  'flex-1 pb-4',
                  !isLast && 'border-b border-slate-100 dark:border-slate-800'
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="secondary"
                      className={cn('text-xs font-medium', config.bgColor, config.color)}
                    >
                      {config.label}
                    </Badge>
                    {trade.strategyType && (
                      <Badge variant="outline" className="text-xs">
                        {trade.strategyType.replace(/_/g, ' ')}
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        trade.status === 'OPEN' && 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400',
                        trade.status === 'CLOSED' && 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                      )}
                    >
                      {trade.status}
                    </Badge>
                  </div>

                  {/* Actions and P/L */}
                  <div className="flex items-start gap-2 flex-shrink-0">
                    {/* P/L */}
                    <div className="text-right">
                      <p
                        className={cn(
                          'font-semibold',
                          trade.debitCredit >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        )}
                      >
                        {formatCurrency(trade.debitCredit)}
                      </p>
                      {trade.realizedPL !== null && (
                        <p
                          className={cn(
                            'text-sm',
                            trade.realizedPL >= 0
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          )}
                        >
                          P/L: {formatCurrency(trade.realizedPL)}
                        </p>
                      )}
                    </div>

                    {/* Actions dropdown */}
                    {showActions && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="p-1.5 -mr-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Trade actions"
                          >
                            <MoreVertical className="h-4 w-4 text-slate-400" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          {onEditTrade && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditTrade(trade);
                              }}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {onEditTrade && onDeleteTrade && <DropdownMenuSeparator />}
                          {onDeleteTrade && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteTrade(trade.id);
                              }}
                              className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-slate-700 dark:text-slate-300 mb-2">
                  {trade.description}
                </p>

                {/* Quantity */}
                {trade.quantity > 1 && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                    Quantity: {trade.quantity} contracts
                  </p>
                )}

                {/* Reasoning note */}
                {trade.reasoningNote && (
                  <div className="mt-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                      &ldquo;{trade.reasoningNote}&rdquo;
                    </p>
                  </div>
                )}

                {/* Attachments indicator */}
                {hasAttachments && (
                  <div className="flex items-center gap-2 mt-2">
                    <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs text-slate-500">
                      {trade.attachments!.length} attachment{trade.attachments!.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                {/* Timestamp */}
                <p className="text-xs text-slate-400 mt-2">
                  {format(new Date(trade.openedAt), 'MMM d, yyyy • h:mm a')}
                  {' • '}
                  {formatDistanceToNow(new Date(trade.openedAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
