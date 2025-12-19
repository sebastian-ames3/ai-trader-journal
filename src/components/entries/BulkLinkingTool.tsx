'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link2, Loader2, CheckCircle2, X, AlertTriangle, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface UnlinkedEntry {
  id: string;
  content: string;
  ticker: string | null;
  type: string;
  createdAt: string;
}

interface BulkLinkResult {
  linked: number;
  skipped: number;
  errors: Array<{ entryId: string; error: string }>;
}

interface BulkLinkingToolProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export default function BulkLinkingTool({
  isOpen,
  onClose,
  onComplete,
}: BulkLinkingToolProps) {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<UnlinkedEntry[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [linking, setLinking] = useState(false);
  const [result, setResult] = useState<BulkLinkResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Fetch unlinked entries
  const fetchUnlinkedEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/entries?unlinked=true&limit=100');
      if (!response.ok) throw new Error('Failed to fetch entries');
      const data = await response.json();
      setEntries(data.entries || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchUnlinkedEntries();
      setSelectedIds(new Set());
      setResult(null);
      setShowResults(false);
    }
  }, [isOpen, fetchUnlinkedEntries]);

  // Toggle selection
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select all
  const selectAll = () => {
    setSelectedIds(new Set(entries.map((e) => e.id)));
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  // Perform bulk linking
  const handleBulkLink = async () => {
    if (selectedIds.size === 0) return;

    setLinking(true);
    setError(null);
    try {
      const response = await fetch('/api/entries/batch-link', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryIds: Array.from(selectedIds),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to link entries');
      }

      const data = await response.json();
      setResult(data.data);
      setShowResults(true);

      // Refresh entries list
      await fetchUnlinkedEntries();
      setSelectedIds(new Set());

      // Notify parent if linking was successful
      if (data.data?.linked > 0 && onComplete) {
        onComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link entries');
    } finally {
      setLinking(false);
    }
  };

  // Group entries by ticker
  const entriesByTicker = entries.reduce(
    (acc, entry) => {
      const ticker = entry.ticker || 'No Ticker';
      if (!acc[ticker]) acc[ticker] = [];
      acc[ticker].push(entry);
      return acc;
    },
    {} as Record<string, UnlinkedEntry[]>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Bulk Link Entries</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-destructive">{error}</p>
              <Button variant="outline" onClick={fetchUnlinkedEntries} className="mt-4">
                Retry
              </Button>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-lg font-medium">All entries are linked!</p>
              <p className="text-sm text-muted-foreground mt-1">
                No unlinked entries found
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Results banner */}
              {showResults && result && (
                <div
                  className={cn(
                    'p-4 rounded-lg flex items-center justify-between',
                    result.linked > 0
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : 'bg-slate-50 dark:bg-slate-800 border'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      className={cn(
                        'h-5 w-5',
                        result.linked > 0 ? 'text-green-500' : 'text-slate-400'
                      )}
                    />
                    <span>
                      <strong>{result.linked}</strong> linked,{' '}
                      <span className="text-muted-foreground">
                        {result.skipped} skipped
                      </span>
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowResults(false)}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Selection controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {selectedIds.size} of {entries.length} selected
                  </span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={selectAll}>
                      Select All
                    </Button>
                    <Button variant="ghost" size="sm" onClick={deselectAll}>
                      Clear
                    </Button>
                  </div>
                </div>
              </div>

              {/* Entries grouped by ticker */}
              {Object.entries(entriesByTicker).map(([ticker, tickerEntries]) => (
                <div key={ticker} className="space-y-2">
                  <div className="flex items-center gap-2 sticky top-0 bg-white dark:bg-slate-800 py-2">
                    <Badge variant="secondary" className="font-mono">
                      {ticker}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {tickerEntries.length} entries
                    </span>
                  </div>
                  <div className="space-y-1 pl-2">
                    {tickerEntries.map((entry) => (
                      <label
                        key={entry.id}
                        className={cn(
                          'flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                          selectedIds.has(entry.id)
                            ? 'bg-primary/5 border border-primary/20'
                            : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                        )}
                      >
                        <Checkbox
                          checked={selectedIds.has(entry.id)}
                          onCheckedChange={() => toggleSelection(entry.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm line-clamp-2">{entry.content}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>
                              {format(new Date(entry.createdAt), 'MMM d, yyyy')}
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              {entry.type.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {entries.length > 0 && (
          <div className="p-4 border-t dark:border-slate-700 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Auto-links entries to trades with 70%+ confidence
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleBulkLink}
                disabled={selectedIds.size === 0 || linking}
                className="gap-2"
              >
                {linking ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Linking...
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4" />
                    Link {selectedIds.size} Entries
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
