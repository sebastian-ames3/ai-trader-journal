'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SearchFilters, { FilterState } from '@/components/SearchFilters';
import { EntryCard, EntryCardList, EntryCardSkeleton } from '@/components/ui/entry-card';
import { CalendarWeekStrip } from '@/components/ui/calendar-week-strip';
import { format } from 'date-fns';

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


function JournalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [entryCounts] = useState<Record<string, number>>({});
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

  // Handle date selection from calendar
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // Filter entries by the selected date
    const dateStr = format(date, 'yyyy-MM-dd');
    const newFilters = {
      ...filters,
      dateFrom: dateStr,
      dateTo: dateStr,
    };
    setFilters(newFilters);

    // Update URL
    const params = new URLSearchParams();
    params.set('dateFrom', dateStr);
    params.set('dateTo', dateStr);
    if (filters.search) params.set('search', filters.search);
    if (filters.type) params.set('type', filters.type);
    if (filters.ticker) params.set('ticker', filters.ticker);
    if (filters.mood) params.set('mood', filters.mood);
    if (filters.conviction) params.set('conviction', filters.conviction);
    if (filters.sentiment) params.set('sentiment', filters.sentiment);
    if (filters.biases.length > 0) params.set('bias', filters.biases.join(','));
    if (filters.tags.length > 0) params.set('tag', filters.tags.join(','));
    router.push(`/journal?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* Calendar Week Strip */}
      <CalendarWeekStrip
        selectedDate={selectedDate}
        onSelectDate={handleDateSelect}
        entryCounts={entryCounts}
        className="sticky top-0 z-10 shadow-sm"
      />

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
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Showing {entries.length} of {totalCount} entries
          </p>
        )}

        {/* Loading State */}
        {loading ? (
          <EntryCardList>
            {[...Array(3)].map((_, i) => (
              <EntryCardSkeleton key={i} />
            ))}
          </EntryCardList>
        ) : entries.length === 0 ? (
          hasActiveFilters() ? (
            // Empty State - No search results
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">
                No entries found
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
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
              <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">
                No entries yet
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
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
          // Entry List using EntryCard
          <EntryCardList>
            {entries.map((entry) => (
              <EntryCard
                key={entry.id}
                id={entry.id}
                content={entry.content}
                type={entry.type}
                ticker={entry.ticker}
                mood={entry.mood}
                conviction={entry.conviction}
                createdAt={entry.createdAt}
              />
            ))}
          </EntryCardList>
        )}
      </div>
    </div>
  );
}

export default function JournalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
          <div className="h-24 skeleton" />
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <EntryCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <JournalContent />
    </Suspense>
  );
}
