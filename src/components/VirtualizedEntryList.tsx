'use client';

import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { VariableSizeList as List, ListChildComponentProps } from 'react-window';
import { SwipeableEntryCard } from '@/components/SwipeableEntryCard';

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
  thesisName?: string | null;
}

interface VirtualizedEntryListProps {
  entries: Entry[];
  onEditEntry: (entry: Entry) => void;
  onDeleteEntry?: (entryId: string) => void;
  className?: string;
}

// Base height for entry card (header + padding)
const BASE_HEIGHT = 120;
// Height per line of content (2 lines visible)
const CONTENT_LINE_HEIGHT = 20;
// Max content lines
const MAX_CONTENT_LINES = 2;
// Gap between items
const GAP = 12;

// Threshold for enabling virtualization
const VIRTUALIZATION_THRESHOLD = 20;

// Estimate item height based on content
function estimateItemHeight(entry: Entry): number {
  // Estimate lines: ~50 characters per line on mobile
  const contentLines = Math.min(
    Math.ceil(entry.content.length / 50),
    MAX_CONTENT_LINES
  );
  return BASE_HEIGHT + (contentLines * CONTENT_LINE_HEIGHT) + GAP;
}

// Row component for virtual list
interface ItemData {
  entries: Entry[];
  onEditEntry: (entry: Entry) => void;
  onDeleteEntry?: (entryId: string) => void;
}

const Row = React.memo(function Row({ data, index, style }: ListChildComponentProps<ItemData>) {
  const { entries, onEditEntry, onDeleteEntry } = data;
  const entry = entries[index];

  return (
    <div style={{ ...style, paddingBottom: GAP }}>
      <SwipeableEntryCard
        id={entry.id}
        content={entry.content}
        type={entry.type}
        ticker={entry.ticker}
        mood={entry.mood}
        conviction={entry.conviction}
        createdAt={entry.createdAt}
        thesisName={entry.thesisName}
        onEdit={() => onEditEntry(entry)}
        onDelete={onDeleteEntry ? () => onDeleteEntry(entry.id) : undefined}
      />
    </div>
  );
});

export function VirtualizedEntryList({
  entries,
  onEditEntry,
  onDeleteEntry,
  className,
}: VirtualizedEntryListProps) {
  const listRef = useRef<List<ItemData>>(null);
  const [listHeight, setListHeight] = useState(600);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate item heights
  const getItemSize = useCallback(
    (index: number) => estimateItemHeight(entries[index]),
    [entries]
  );

  // Memoize item data to prevent unnecessary re-renders
  const itemData = useMemo<ItemData>(
    () => ({ entries, onEditEntry, onDeleteEntry }),
    [entries, onEditEntry, onDeleteEntry]
  );

  // Reset list cache when entries change
  useEffect(() => {
    listRef.current?.resetAfterIndex(0);
  }, [entries]);

  // Measure container height
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        // Get available height (viewport - header - padding)
        const rect = containerRef.current.getBoundingClientRect();
        const availableHeight = window.innerHeight - rect.top - 80; // 80px for bottom nav
        setListHeight(Math.max(400, availableHeight));
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // For small lists, use regular rendering (no virtualization overhead)
  if (entries.length < VIRTUALIZATION_THRESHOLD) {
    return (
      <div className={className}>
        <div className="space-y-3">
          {entries.map((entry) => (
            <SwipeableEntryCard
              key={entry.id}
              id={entry.id}
              content={entry.content}
              type={entry.type}
              ticker={entry.ticker}
              mood={entry.mood}
              conviction={entry.conviction}
              createdAt={entry.createdAt}
              thesisName={entry.thesisName}
              onEdit={() => onEditEntry(entry)}
              onDelete={onDeleteEntry ? () => onDeleteEntry(entry.id) : undefined}
            />
          ))}
        </div>
      </div>
    );
  }

  // For large lists, use virtualization
  return (
    <div ref={containerRef} className={className}>
      <List<ItemData>
        ref={listRef}
        height={listHeight}
        width="100%"
        itemCount={entries.length}
        itemSize={getItemSize}
        itemData={itemData}
        overscanCount={3}
        className="scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700"
      >
        {Row}
      </List>
    </div>
  );
}
