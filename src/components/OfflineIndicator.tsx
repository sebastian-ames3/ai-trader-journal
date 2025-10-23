'use client';

import { useEffect, useState, useCallback } from 'react';
import { isOnline, subscribeToOnlineStatus, getQueuedEntriesCount, syncQueuedEntries } from '@/lib/offlineQueue';
import { useToast } from '@/hooks/use-toast';

/**
 * Offline Indicator Component
 *
 * Shows when the app is offline and displays the count of queued entries.
 * Automatically syncs when connection is restored.
 */
export default function OfflineIndicator() {
  const [online, setOnline] = useState(true);
  const [queuedCount, setQueuedCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  // Update queued count
  const updateQueuedCount = useCallback(async () => {
    try {
      const count = await getQueuedEntriesCount();
      setQueuedCount(count);
    } catch (error) {
      console.error('Failed to get queued entries count:', error);
    }
  }, []);

  // Sync queued entries
  const handleSync = useCallback(async () => {
    if (!online || syncing || queuedCount === 0) {
      return;
    }

    setSyncing(true);
    try {
      const result = await syncQueuedEntries();

      if (result.successful > 0) {
        toast({
          title: 'Sync Complete',
          description: `${result.successful} ${result.successful === 1 ? 'entry' : 'entries'} synced successfully`,
        });
      }

      if (result.failed > 0) {
        toast({
          title: 'Sync Incomplete',
          description: `${result.failed} ${result.failed === 1 ? 'entry' : 'entries'} failed to sync`,
          variant: 'destructive',
        });
      }

      await updateQueuedCount();
    } catch (error) {
      console.error('Failed to sync queued entries:', error);
      toast({
        title: 'Sync Failed',
        description: 'Failed to sync offline entries. Will retry automatically.',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  }, [online, syncing, queuedCount, toast, updateQueuedCount]);

  useEffect(() => {
    // Initialize online status
    setOnline(isOnline());
    updateQueuedCount();

    // Subscribe to online/offline events
    const unsubscribe = subscribeToOnlineStatus(
      async () => {
        setOnline(true);
        // Auto-sync when coming back online
        await updateQueuedCount();
        await handleSync();
      },
      () => {
        setOnline(false);
      }
    );

    // Update queued count every 5 seconds
    const interval = setInterval(updateQueuedCount, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [updateQueuedCount, handleSync]);

  // Re-run sync when online status or count changes
  useEffect(() => {
    if (online && queuedCount > 0 && !syncing) {
      handleSync();
    }
  }, [online, queuedCount, syncing, handleSync]);

  // Don't show anything if online and no queued entries
  if (online && queuedCount === 0) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 text-sm font-medium text-center ${
        online
          ? 'bg-green-600 text-white'
          : 'bg-yellow-600 text-white'
      }`}
      role="status"
      aria-live="polite"
    >
      {!online && (
        <div className="flex items-center justify-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
          <span>
            Offline
            {queuedCount > 0 && ` - ${queuedCount} ${queuedCount === 1 ? 'entry' : 'entries'} queued`}
          </span>
        </div>
      )}
      {online && queuedCount > 0 && (
        <div className="flex items-center justify-center gap-2">
          {syncing ? (
            <>
              <svg
                className="w-5 h-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Syncing {queuedCount} {queuedCount === 1 ? 'entry' : 'entries'}...</span>
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Back online - Syncing...</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
