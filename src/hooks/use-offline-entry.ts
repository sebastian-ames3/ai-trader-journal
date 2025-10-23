'use client';

import { useState } from 'react';
import { isOnline, queueEntry } from '@/lib/offlineQueue';
import { useToast } from '@/hooks/use-toast';

export interface EntryData {
  type: 'TRADE_IDEA' | 'TRADE' | 'REFLECTION' | 'OBSERVATION';
  content: string;
  mood?: string;
  conviction?: 'LOW' | 'MEDIUM' | 'HIGH';
  ticker?: string;
  tradeId?: string;
  snapshotId?: string;
}

/**
 * Hook for creating entries with offline support
 */
export function useOfflineEntry() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const createEntry = async (data: EntryData): Promise<{ success: boolean; entry?: unknown; queued?: boolean }> => {
    setIsSubmitting(true);

    try {
      // Check if online
      if (!isOnline()) {
        // Queue the entry for later
        await queueEntry(data);

        toast({
          title: 'Entry Queued',
          description: 'You are offline. Entry will be saved when connection is restored.',
        });

        return { success: true, queued: true };
      }

      // Online - attempt to create entry
      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        // Network error - queue entry
        await queueEntry(data);

        toast({
          title: 'Entry Queued',
          description: 'Failed to save entry. It will be retried automatically.',
        });

        return { success: true, queued: true };
      }

      const entry = await response.json();

      toast({
        title: 'Entry Saved',
        description: 'Your entry has been saved successfully.',
      });

      return { success: true, entry };
    } catch (error) {
      console.error('Failed to create entry:', error);

      // Try to queue the entry as a fallback
      try {
        await queueEntry(data);

        toast({
          title: 'Entry Queued',
          description: 'Could not save entry right now. It will be saved automatically when possible.',
        });

        return { success: true, queued: true };
      } catch (queueError) {
        console.error('Failed to queue entry:', queueError);

        toast({
          title: 'Error',
          description: 'Failed to save entry. Please try again.',
          variant: 'destructive',
        });

        return { success: false };
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    createEntry,
    isSubmitting,
  };
}
