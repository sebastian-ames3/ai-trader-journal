'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, Link2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SearchFilters, { FilterState } from '@/components/SearchFilters';
import { EntryCardList, EntryCardSkeleton } from '@/components/ui/entry-card';
import { VirtualizedEntryList } from '@/components/VirtualizedEntryList';
import { InlineEditModal } from '@/components/InlineEditModal';
import { CalendarMonthView, CalendarSelectedDateHeader } from '@/components/ui/calendar-month-view';
import { PullToRefresh } from '@/components/PullToRefresh';
import BulkLinkingTool from '@/components/entries/BulkLinkingTool';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
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
  const { toast } = useToast();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [entryCounts, setEntryCounts] = useState<Record<string, number>>({});
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Inline edit state
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Bulk linking state
  const [showBulkLinking, setShowBulkLinking] = useState(false);

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
    // fetchEntries uses filters state which is derived from searchParams - including it would cause infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Fetch entry counts when month changes
  const fetchEntryCounts = useCallback(async (month: Date) => {
    try {
      const monthStr = format(month, 'yyyy-MM-dd');
      const response = await fetch(`/api/entries/counts?month=${monthStr}`);
      if (!response.ok) throw new Error('Failed to fetch entry counts');
      const data = await response.json();
      setEntryCounts(data.counts);
    } catch (error) {
      console.error('Error fetching entry counts:', error);
    }
  }, []);

  useEffect(() => {
    fetchEntryCounts(currentMonth);
  }, [currentMonth, fetchEntryCounts]);

  // Handle month change from calendar
  const handleMonthChange = useCallback((date: Date) => {
    setCurrentMonth(date);
  }, []);

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

  // Handle opening the edit modal
  const handleEditEntry = useCallback((entry: Entry) => {
    setEditingEntry(entry);
    setIsEditModalOpen(true);
  }, []);

  // Handle closing the edit modal
  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setTimeout(() => setEditingEntry(null), 300); // Clear after animation
  }, []);

  // Handle saving edits with optimistic update
  const handleSaveEntry = useCallback(async (
    entryId: string,
    updates: { content: string; mood: string | null; conviction: string | null; createdAt?: string }
  ) => {
    // Optimistic update - cast mood and conviction to Entry types
    const originalEntries = [...entries];
    const typedUpdates: Partial<Entry> = {
      content: updates.content,
      mood: updates.mood as Entry['mood'],
      conviction: updates.conviction as Entry['conviction'],
      ...(updates.createdAt ? { createdAt: updates.createdAt } : {}),
    };
    setEntries(prev =>
      prev.map(e =>
        e.id === entryId
          ? { ...e, ...typedUpdates }
          : e
      )
    );

    try {
      const response = await fetch(`/api/entries/${entryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update entry');
      }

      const updatedEntry = await response.json();

      // Update with server response (may include AI re-analysis)
      setEntries(prev =>
        prev.map(e => (e.id === entryId ? { ...e, ...updatedEntry } : e))
      );

      toast({
        title: 'Entry updated',
        description: 'Your changes have been saved.',
        duration: 3000,
      });
    } catch (error) {
      // Rollback on error
      setEntries(originalEntries);
      throw error; // Re-throw to let modal handle it
    }
  }, [entries, toast]);

  // Handle restoring a soft-deleted entry
  const handleRestoreEntry = useCallback(async (entryId: string, deletedEntry: Entry) => {
    try {
      const response = await fetch(`/api/entries/${entryId}/restore`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to restore entry');
      }

      // Restore entry to list
      setEntries(prev => [deletedEntry, ...prev].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
      setTotalCount(prev => prev + 1);
      fetchEntryCounts(currentMonth);

      toast({
        title: 'Entry restored',
        description: 'The entry has been restored.',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to restore entry',
        variant: 'destructive',
        duration: 5000,
      });
    }
  }, [toast, currentMonth, fetchEntryCounts]);

  // Handle deleting an entry (soft delete with undo)
  const handleDeleteEntry = useCallback(async (entryId: string) => {
    // Find the entry before removing it (for potential restore)
    const deletedEntry = entries.find(e => e.id === entryId);
    if (!deletedEntry) return;

    // Optimistic update - remove entry from list
    const originalEntries = [...entries];
    setEntries(prev => prev.filter(e => e.id !== entryId));
    setTotalCount(prev => prev - 1);

    try {
      const response = await fetch(`/api/entries/${entryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete entry');
      }

      // Refresh entry counts after deletion
      fetchEntryCounts(currentMonth);

      // Show toast with undo action
      toast({
        title: 'Entry deleted',
        description: 'The entry has been moved to trash.',
        duration: 5000,
        action: (
          <ToastAction
            altText="Undo delete"
            onClick={() => handleRestoreEntry(entryId, deletedEntry)}
          >
            Undo
          </ToastAction>
        ),
      });
    } catch (error) {
      // Rollback on error
      setEntries(originalEntries);
      setTotalCount(prev => prev + 1);
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to delete entry',
        variant: 'destructive',
        duration: 5000,
      });
    }
  }, [entries, toast, currentMonth, fetchEntryCounts, handleRestoreEntry]);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    await Promise.all([
      fetchEntries(),
      fetchEntryCounts(currentMonth),
    ]);
    // fetchEntries is not memoized; including it would cause unnecessary re-renders. filters is included to capture its dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, currentMonth, fetchEntryCounts]);

  return (
    <PullToRefresh
      onRefresh={handleRefresh}
      className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20"
    >
      {/* Calendar Month View */}
      <CalendarMonthView
        selectedDate={selectedDate}
        onSelectDate={handleDateSelect}
        entryCounts={entryCounts}
        onMonthChange={handleMonthChange}
        className="sticky top-0 z-10 shadow-lg"
      />

      {/* Selected Date Header */}
      <CalendarSelectedDateHeader
        selectedDate={selectedDate}
        entryCount={entryCounts[format(selectedDate, 'yyyy-MM-dd')] || 0}
      />

      {/* Search & Filters */}
      <SearchFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onSearch={handleSearch}
      />

      {/* Quick Actions */}
      <div className="max-w-4xl mx-auto px-4 py-2 flex gap-2">
        <Link href="/journal/import/smart">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Import Trades
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowBulkLinking(true)}
          className="gap-2"
        >
          <Link2 className="h-4 w-4" />
          Bulk Link Entries
        </Button>
      </div>

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
          // Entry List using VirtualizedEntryList (enables virtual scrolling for 20+ entries)
          <VirtualizedEntryList
            entries={entries}
            onEditEntry={handleEditEntry}
            onDeleteEntry={handleDeleteEntry}
          />
        )}
      </div>

      {/* Inline Edit Modal */}
      <InlineEditModal
        entry={editingEntry}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveEntry}
      />

      {/* Bulk Linking Tool */}
      <BulkLinkingTool
        isOpen={showBulkLinking}
        onClose={() => setShowBulkLinking(false)}
        onComplete={() => {
          setShowBulkLinking(false);
          fetchEntries(); // Refresh entries
        }}
      />
    </PullToRefresh>
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
