'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Brain,
  Filter,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Lightbulb,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import ThesisPatternCard, { type ThesisPattern } from '@/components/trades/ThesisPatternCard';

interface PatternSummary {
  totalPatterns: number;
  averageWinRate: number;
  topPerformingCategory: string;
  totalTradesAnalyzed: number;
}

interface PatternRecommendation {
  id: string;
  title: string;
  description: string;
  type: 'exploit' | 'avoid' | 'investigate';
  relatedPatternIds: string[];
}

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: 'strategy', label: 'Strategy' },
  { value: 'timing', label: 'Timing' },
  { value: 'sentiment', label: 'Sentiment' },
  { value: 'technical', label: 'Technical' },
  { value: 'behavioral', label: 'Behavioral' },
];

const SORT_OPTIONS = [
  { value: 'winRate', label: 'Win Rate' },
  { value: 'occurrences', label: 'Occurrences' },
  { value: 'avgReturn', label: 'Avg Return' },
  { value: 'recent', label: 'Most Recent' },
];

function PatternsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [patterns, setPatterns] = useState<ThesisPattern[]>([]);
  const [summary, setSummary] = useState<PatternSummary | null>(null);
  const [recommendations, setRecommendations] = useState<PatternRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'winRate');
  const [tickerFilter, setTickerFilter] = useState(searchParams.get('ticker') || '');

  const fetchPatterns = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') {
        params.set('category', categoryFilter);
      }
      if (sortBy) {
        params.set('sort', sortBy);
      }
      if (tickerFilter) {
        params.set('ticker', tickerFilter);
      }

      const response = await fetch(`/api/theses/patterns/analysis?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch patterns');
      }

      const data = await response.json();
      setPatterns(data.patterns || []);
      setSummary(data.summary || null);
      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error('Error fetching patterns:', err);
      setError(err instanceof Error ? err.message : 'Failed to load patterns');
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, sortBy, tickerFilter]);

  useEffect(() => {
    fetchPatterns();
  }, [fetchPatterns]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (categoryFilter !== 'all') params.set('category', categoryFilter);
    if (sortBy !== 'winRate') params.set('sort', sortBy);
    if (tickerFilter) params.set('ticker', tickerFilter);

    const newUrl = params.toString() ? `?${params.toString()}` : '/theses/patterns';
    window.history.replaceState(null, '', newUrl);
  }, [categoryFilter, sortBy, tickerFilter]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.push('/theses')}
              className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Pattern Analysis
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Insights from your trading history
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {tickerFilter && (
              <Badge
                variant="secondary"
                className="cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
                onClick={() => setTickerFilter('')}
              >
                ${tickerFilter} x
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Error State */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={fetchPatterns}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Retry
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            <div className="h-32 skeleton rounded-2xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-48 skeleton rounded-2xl" />
              ))}
            </div>
          </div>
        )}

        {/* Summary Card */}
        {!isLoading && summary && (
          <div className="card-gradient p-4">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                Your Trading Patterns
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-xl bg-white/50 dark:bg-slate-800/50">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <BarChart3 className="h-4 w-4 text-slate-400" />
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {summary.totalPatterns}
                </p>
                <p className="text-xs text-slate-500">Patterns Found</p>
              </div>

              <div className="text-center p-3 rounded-xl bg-white/50 dark:bg-slate-800/50">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Target className="h-4 w-4 text-slate-400" />
                </div>
                <p
                  className={cn(
                    'text-2xl font-bold',
                    summary.averageWinRate >= 50
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  )}
                >
                  {summary.averageWinRate.toFixed(0)}%
                </p>
                <p className="text-xs text-slate-500">Avg Win Rate</p>
              </div>

              <div className="text-center p-3 rounded-xl bg-white/50 dark:bg-slate-800/50">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="h-4 w-4 text-slate-400" />
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100 capitalize">
                  {summary.topPerformingCategory}
                </p>
                <p className="text-xs text-slate-500">Top Category</p>
              </div>

              <div className="text-center p-3 rounded-xl bg-white/50 dark:bg-slate-800/50">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <BarChart3 className="h-4 w-4 text-slate-400" />
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {summary.totalTradesAnalyzed}
                </p>
                <p className="text-xs text-slate-500">Trades Analyzed</p>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {!isLoading && recommendations.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Recommendations
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className={cn(
                    'p-4 rounded-xl border',
                    rec.type === 'exploit' && 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
                    rec.type === 'avoid' && 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
                    rec.type === 'investigate' && 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  )}
                >
                  <div className="flex items-start gap-2">
                    {rec.type === 'exploit' && (
                      <TrendingUp className="h-4 w-4 mt-0.5 text-green-600 dark:text-green-400" />
                    )}
                    {rec.type === 'avoid' && (
                      <TrendingDown className="h-4 w-4 mt-0.5 text-red-600 dark:text-red-400" />
                    )}
                    {rec.type === 'investigate' && (
                      <Brain className="h-4 w-4 mt-0.5 text-blue-600 dark:text-blue-400" />
                    )}
                    <div>
                      <p className="font-medium text-sm text-slate-900 dark:text-slate-100">
                        {rec.title}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {rec.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pattern Cards */}
        {!isLoading && patterns.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Detected Patterns ({patterns.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {patterns.map((pattern) => (
                <ThesisPatternCard
                  key={pattern.id}
                  pattern={pattern}
                  onViewRelated={() => {
                    router.push(`/theses/patterns?pattern=${pattern.id}`);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && patterns.length === 0 && (
          <div className="text-center py-12">
            <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto mb-4 flex items-center justify-center">
              <Brain className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              No patterns detected yet
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
              Continue logging trades and closing theses. Patterns will be detected as your trading history grows.
            </p>
            <Button onClick={() => router.push('/theses/new')} className="min-h-[44px]">
              Start a New Thesis
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PatternsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <PatternsPageContent />
    </Suspense>
  );
}
