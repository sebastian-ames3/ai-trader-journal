'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SearchFilters, { FilterState } from '@/components/SearchFilters';

interface Entry {
  id: string;
  type: 'TRADE_IDEA' | 'TRADE' | 'REFLECTION' | 'OBSERVATION';
  content: string;
  mood: 'CONFIDENT' | 'NERVOUS' | 'EXCITED' | 'UNCERTAIN' | 'NEUTRAL' | null;
  conviction: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  ticker: string | null;
  sentiment: string | null;
  detectedBiases: string[];
  aiTags: string[];
  createdAt: string;
}

const moodEmojis = {
  CONFIDENT: '😊',
  NERVOUS: '😰',
  EXCITED: '🚀',
  UNCERTAIN: '🤔',
  NEUTRAL: '😐',
};

const typeColors = {
  TRADE_IDEA: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  TRADE: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
  REFLECTION: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
  OBSERVATION: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
};

const convictionColors = {
  LOW: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800',
  HIGH: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
};

function JournalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<FilterState>({
    search: searchParams.get('search') || '',
    type: searchParams.get('type') || '',
    ticker: searchParams.get('ticker') || '',
    mood: searchParams.get('mood') || '',
    conviction: searchParams.get('conviction') || '',
    sentiment: searchParams.get('sentiment') || '',
    biases: searchParams.get('bias')?.split(',').filter(Boolean) || [],
    tags: searchParams.get('tag')?.split(',').filter(Boolean) || [],
    dateFrom: searchParams.get('dateFrom') || '',
    dateTo: searchParams.get('dateTo') || '',
  });

  useEffect(() => {
    fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      // Build query string from filters
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.type) params.set('type', filters.type);
      if (filters.ticker) params.set('ticker', filters.ticker);
      if (filters.mood) params.set('mood', filters.mood);
      if (filters.conviction) params.set('conviction', filters.conviction);
      if (filters.sentiment) params.set('sentiment', filters.sentiment);
      if (filters.biases.length > 0) params.set('bias', filters.biases.join(','));
      if (filters.tags.length > 0) params.set('tag', filters.tags.join(','));
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);

      const queryString = params.toString();
      const url = `/api/entries${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch entries');
      const data = await response.json();

      setEntries(data.entries);
      setTotalCount(data.pagination.total);
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return !!(
      filters.search ||
      filters.type ||
      filters.ticker ||
      filters.mood ||
      filters.conviction ||
      filters.sentiment ||
      filters.biases.length > 0 ||
      filters.tags.length > 0 ||
      filters.dateFrom ||
      filters.dateTo
    );
  };

  const handleClearFilters = () => {
    const clearedFilters: FilterState = {
      search: '',
      type: '',
      ticker: '',
      mood: '',
      conviction: '',
      sentiment: '',
      biases: [],
      tags: [],
      dateFrom: '',
      dateTo: '',
    };
    setFilters(clearedFilters);
    router.push('/journal');
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleSearch = () => {
    // Update URL query params
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.type) params.set('type', filters.type);
    if (filters.ticker) params.set('ticker', filters.ticker);
    if (filters.mood) params.set('mood', filters.mood);
    if (filters.conviction) params.set('conviction', filters.conviction);
    if (filters.sentiment) params.set('sentiment', filters.sentiment);
    if (filters.biases.length > 0) params.set('bias', filters.biases.join(','));
    if (filters.tags.length > 0) params.set('tag', filters.tags.join(','));
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);

    const queryString = params.toString();
    router.push(`/journal${queryString ? `?${queryString}` : ''}`);
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;

    return date.toLocaleDateString();
  };

  const formatEntryType = (type: string) => {
    return type.split('_').map(word =>
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader className="animate-spin h-8 w-8 text-gray-400 dark:text-gray-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Search & Filters */}
      <SearchFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onSearch={handleSearch}
      />

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Results Count */}
        {!loading && totalCount > 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Showing {entries.length} of {totalCount} entries
          </p>
        )}
        {entries.length === 0 ? (
          hasActiveFilters() ? (
            // Empty State - No search results
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-xl font-semibold mb-2">No entries found</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Try adjusting your filters or search terms
              </p>
              <Button size="lg" onClick={handleClearFilters} className="min-h-[48px]">
                Clear All Filters
              </Button>
            </div>
          ) : (
            // Empty State - No entries at all
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-xl font-semibold mb-2">No entries yet</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start journaling to track your trading psychology
              </p>
              <Link href="/journal/new">
                <Button size="lg" className="min-h-[48px]">
                  <Plus className="mr-2 h-5 w-5" />
                  Create First Entry
                </Button>
              </Link>
            </div>
          )
        ) : (
          // Entry List
          <div className="space-y-4">
            {entries.map((entry) => (
              <Link key={entry.id} href={`/journal/${entry.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`${typeColors[entry.type]} font-medium`}
                        >
                          {formatEntryType(entry.type)}
                        </Badge>
                        {entry.ticker && (
                          <Badge variant="secondary" className="font-mono">
                            {entry.ticker}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.mood && (
                          <span className="text-2xl" title={entry.mood}>
                            {moodEmojis[entry.mood]}
                          </span>
                        )}
                        {entry.conviction && (
                          <Badge
                            variant="outline"
                            className={`${convictionColors[entry.conviction]} text-xs`}
                          >
                            {entry.conviction}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Content Preview */}
                    <p className="text-gray-700 dark:text-gray-300 line-clamp-3 mb-2">
                      {entry.content}
                    </p>

                    {/* AI Analysis Badges */}
                    {(entry.sentiment || entry.detectedBiases?.length > 0) && (
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        {entry.sentiment && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              entry.sentiment === 'positive'
                                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800'
                                : entry.sentiment === 'negative'
                                ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800'
                                : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                            }`}
                          >
                            {entry.sentiment}
                          </Badge>
                        )}
                        {entry.detectedBiases?.slice(0, 2).map((bias) => (
                          <Badge
                            key={bias}
                            variant="outline"
                            className="text-xs bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800"
                          >
                            {bias.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                        {entry.detectedBiases?.length > 2 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            +{entry.detectedBiases.length - 2} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* AI Tags */}
                    {entry.aiTags?.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        {entry.aiTags.slice(0, 5).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {entry.aiTags.length > 5 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            +{entry.aiTags.length - 5} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Timestamp */}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimeAgo(entry.createdAt)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <Link href="/journal/new">
        <Button
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          aria-label="Create new entry"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </Link>
    </div>
  );
}

export default function JournalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <Loader className="animate-spin h-8 w-8 text-gray-400 dark:text-gray-500" />
        </div>
      }
    >
      <JournalContent />
    </Suspense>
  );
}
