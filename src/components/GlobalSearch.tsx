'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, FileText, TrendingUp, LineChart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface SearchResult {
  type: 'entry' | 'thesis' | 'trade';
  id: string;
  title: string;
  content: string;
  ticker?: string | null;
  entryType?: string;
  status?: string;
  thesisName?: string | null;
  createdAt: string;
}

interface SearchResponse {
  query: string;
  results: SearchResult[];
  counts: {
    entries: number;
    theses: number;
    trades: number;
    total: number;
  };
}

const typeIcons = {
  entry: FileText,
  thesis: TrendingUp,
  trade: LineChart,
};

const typeLabels = {
  entry: 'Entry',
  thesis: 'Thesis',
  trade: 'Trade',
};

const typeColors = {
  entry: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  thesis: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
  trade: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
};

interface GlobalSearchProps {
  externalOpen?: boolean;
  onExternalClose?: () => void;
}

export default function GlobalSearch({ externalOpen, onExternalClose }: GlobalSearchProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [counts, setCounts] = useState({ entries: 0, theses: 0, trades: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const isOpen = externalOpen ?? internalOpen;
  const setIsOpen = useCallback((open: boolean) => {
    if (!open && onExternalClose) {
      onExternalClose();
    }
    setInternalOpen(open);
  }, [onExternalClose]);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      // Defer focus to after animation
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOpen]);

  // Handle click outside (desktop only)
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, setIsOpen]);

  // Handle keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsOpen(true);
      }
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setIsOpen]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setQuery('');
        setResults([]);
        setCounts({ entries: 0, theses: 0, trades: 0, total: 0 });
        setSelectedIndex(0);
      }, 200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOpen]);

  // Search function with debounce
  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setCounts({ entries: 0, theses: 0, trades: 0, total: 0 });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=10`);
      if (response.ok) {
        const data: SearchResponse = await response.json();
        setResults(data.results);
        setCounts(data.counts);
        setSelectedIndex(0);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle input change with debounce
  const handleInputChange = (value: string) => {
    setQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      search(value);
    }, 300);
  };

  // Navigate to result
  const navigateToResult = (result: SearchResult) => {
    setIsOpen(false);

    switch (result.type) {
      case 'entry':
        router.push(`/journal/${result.id}`);
        break;
      case 'thesis':
        router.push(`/theses/${result.id}`);
        break;
      case 'trade':
        router.push(`/theses`);
        break;
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (event.key === 'Enter' && results[selectedIndex]) {
      event.preventDefault();
      navigateToResult(results[selectedIndex]);
    }
  };

  const searchResults = (
    <>
      {query.length < 2 ? (
        <div className="p-6 text-center text-muted-foreground">
          <p className="text-sm">Type at least 2 characters to search</p>
        </div>
      ) : results.length === 0 && !loading ? (
        <div className="p-6 text-center text-muted-foreground">
          <p className="text-sm">No results found for &ldquo;{query}&rdquo;</p>
        </div>
      ) : (
        <div className="py-2">
          {counts.total > 0 && (
            <div className="px-3 py-1 text-xs text-muted-foreground">
              Found {counts.total} result{counts.total !== 1 ? 's' : ''}
              {counts.entries > 0 && ` (${counts.entries} entries`}
              {counts.theses > 0 && `, ${counts.theses} theses`}
              {counts.trades > 0 && `, ${counts.trades} trades`}
              {counts.total > 0 && ')'}
            </div>
          )}

          {results.map((result, index) => {
            const Icon = typeIcons[result.type];
            return (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => navigateToResult(result)}
                className={cn(
                  'w-full px-3 py-3 text-left hover:bg-muted/50 flex items-start gap-3 transition-colors active:bg-muted',
                  index === selectedIndex && 'bg-muted/50'
                )}
              >
                <div className="mt-0.5">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">
                      {result.title}
                    </span>
                    {result.ticker && (
                      <Badge variant="secondary" className="font-mono text-xs shrink-0">
                        {result.ticker}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {result.content}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={cn('text-xs', typeColors[result.type])}>
                      {typeLabels[result.type]}
                      {result.entryType && ` - ${result.entryType.replace('_', ' ')}`}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(result.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </>
  );

  return (
    <div ref={containerRef} className="relative">
      {/* Desktop Search Trigger Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-2 text-muted-foreground hover:text-foreground min-h-[44px]"
        aria-label="Search (Ctrl+K)"
      >
        <Search className="h-5 w-5" />
        <span className="hidden lg:inline text-sm">Search</span>
        <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">&#8984;</span>K
        </kbd>
      </Button>

      {/* Search Modal - Full screen on mobile, dropdown on desktop */}
      {isOpen && (
        <>
          {/* Mobile: full-screen overlay */}
          <div className="fixed inset-0 z-50 bg-background md:hidden animate-fade-in">
            <div className="flex flex-col h-full pt-safe">
              {/* Search Input */}
              <div className="flex items-center gap-2 p-3 border-b">
                <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Search entries, theses, trades..."
                  value={query}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="border-0 focus-visible:ring-0 p-0 h-auto text-base"
                  enterKeyHint="search"
                />
                {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="shrink-0"
                >
                  Cancel
                </Button>
              </div>

              {/* Results */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                {searchResults}
              </div>
            </div>
          </div>

          {/* Desktop: dropdown */}
          <div className="hidden md:block absolute right-0 top-full mt-2 w-[400px] max-w-[calc(100vw-2rem)] bg-background border rounded-lg shadow-lg z-50">
            {/* Search Input */}
            <div className="flex items-center gap-2 p-3 border-b">
              <Search className="h-5 w-5 text-muted-foreground shrink-0" />
              <Input
                type="text"
                placeholder="Search entries, theses, trades..."
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className="border-0 focus-visible:ring-0 p-0 h-auto"
              />
              {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setIsOpen(false)}
                aria-label="Close search"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Results */}
            <div className="max-h-[400px] overflow-y-auto">
              {searchResults}
            </div>

            {/* Footer */}
            <div className="p-2 border-t text-xs text-muted-foreground flex items-center justify-between">
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">&#8593;&#8595;</kbd>
                <span>Navigate</span>
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">&#8629;</kbd>
                <span>Select</span>
              </div>
              <div>
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Esc</kbd>
                <span className="ml-1">Close</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
