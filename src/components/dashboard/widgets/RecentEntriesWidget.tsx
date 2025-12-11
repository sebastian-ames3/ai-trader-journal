'use client';

import * as React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type EntryType = 'TRADE_IDEA' | 'TRADE' | 'REFLECTION' | 'OBSERVATION';

interface RecentEntry {
  id: string;
  type: EntryType;
  content: string;
  ticker?: string | null;
  mood?: string | null;
  createdAt: string | Date;
}

interface RecentEntriesWidgetProps {
  entries?: RecentEntry[];
  maxEntries?: number;
  className?: string;
}

const TYPE_CONFIG: Record<EntryType, { label: string; color: string }> = {
  TRADE_IDEA: {
    label: 'Idea',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  },
  TRADE: {
    label: 'Trade',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  },
  REFLECTION: {
    label: 'Reflect',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  },
  OBSERVATION: {
    label: 'Observe',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  },
};

function formatTimeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function RecentEntriesWidget({
  entries = [],
  maxEntries = 3,
  className,
}: RecentEntriesWidgetProps) {
  const displayEntries = entries.slice(0, maxEntries);

  return (
    <div className={cn('h-full flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-slate-500" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            Recent Entries
          </h3>
        </div>
        <Link href="/journal">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-amber-600 dark:text-amber-400"
          >
            View All
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Entries List */}
      {displayEntries.length > 0 ? (
        <div className="flex-1 space-y-2 overflow-hidden">
          {displayEntries.map((entry) => {
            const typeConfig = TYPE_CONFIG[entry.type];
            return (
              <Link
                key={entry.id}
                href={`/journal/${entry.id}`}
                className={cn(
                  'block p-2 rounded-lg',
                  'bg-slate-50 dark:bg-slate-800/50',
                  'hover:bg-slate-100 dark:hover:bg-slate-700/50',
                  'transition-colors'
                )}
              >
                <div className="flex items-start gap-2">
                  <Badge
                    variant="secondary"
                    className={cn('text-xs flex-shrink-0', typeConfig.color)}
                  >
                    {typeConfig.label}
                  </Badge>
                  {entry.ticker && (
                    <Badge
                      variant="outline"
                      className="text-xs font-mono bg-slate-100 dark:bg-slate-700"
                    >
                      ${entry.ticker}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-1 mt-1">
                  {entry.content}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {formatTimeAgo(entry.createdAt)}
                </p>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center">
          <div>
            <div className="text-3xl mb-2">
              <span role="img" aria-label="Notebook">
                &#128221;
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No entries yet. Start journaling!
            </p>
            <Link href="/journal/new">
              <Button variant="link" size="sm" className="mt-2 text-amber-600">
                Create your first entry
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// Skeleton for loading
export function RecentEntriesWidgetSkeleton() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="h-5 w-28 skeleton rounded" />
        <div className="h-6 w-16 skeleton rounded" />
      </div>
      <div className="flex-1 space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-4 w-12 skeleton rounded" />
              <div className="h-4 w-10 skeleton rounded" />
            </div>
            <div className="h-4 w-full skeleton rounded mb-1" />
            <div className="h-3 w-20 skeleton rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
