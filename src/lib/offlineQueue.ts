/**
 * Offline Queue Service
 *
 * Manages offline entry creation using IndexedDB.
 * When offline, entries are queued and synced when connection is restored.
 */

import Dexie, { Table } from 'dexie';

export interface QueuedEntry {
  id?: number;
  type: 'TRADE_IDEA' | 'TRADE' | 'REFLECTION' | 'OBSERVATION';
  content: string;
  mood?: string;
  conviction?: 'LOW' | 'MEDIUM' | 'HIGH';
  ticker?: string;
  tradeId?: string;
  snapshotId?: string;
  createdAt: Date;
  retryCount: number;
  error?: string;
}

export class OfflineQueueDB extends Dexie {
  queuedEntries!: Table<QueuedEntry, number>;

  constructor() {
    super('TraderJournalOfflineQueue');
    this.version(1).stores({
      queuedEntries: '++id, createdAt, retryCount',
    });
  }
}

// Singleton instance
let db: OfflineQueueDB | null = null;

/**
 * Get the offline queue database instance
 */
export function getOfflineQueueDB(): OfflineQueueDB {
  if (!db) {
    db = new OfflineQueueDB();
  }
  return db;
}

// Export singleton for direct access (used by clientCleanup)
export const offlineDb = getOfflineQueueDB();

/**
 * Add an entry to the offline queue
 */
export async function queueEntry(entry: Omit<QueuedEntry, 'id' | 'createdAt' | 'retryCount'>): Promise<number> {
  const db = getOfflineQueueDB();
  const id = await db.queuedEntries.add({
    ...entry,
    createdAt: new Date(),
    retryCount: 0,
  });
  return id;
}

/**
 * Get all queued entries
 */
export async function getQueuedEntries(): Promise<QueuedEntry[]> {
  const db = getOfflineQueueDB();
  return db.queuedEntries.orderBy('createdAt').toArray();
}

/**
 * Get the count of queued entries
 */
export async function getQueuedEntriesCount(): Promise<number> {
  const db = getOfflineQueueDB();
  return db.queuedEntries.count();
}

/**
 * Remove an entry from the queue
 */
export async function removeQueuedEntry(id: number): Promise<void> {
  const db = getOfflineQueueDB();
  await db.queuedEntries.delete(id);
}

/**
 * Update retry count for a queued entry
 */
export async function incrementRetryCount(id: number, error?: string): Promise<void> {
  const db = getOfflineQueueDB();
  const entry = await db.queuedEntries.get(id);
  if (entry) {
    await db.queuedEntries.update(id, {
      retryCount: entry.retryCount + 1,
      error,
    });
  }
}

/**
 * Clear all queued entries
 */
export async function clearQueue(): Promise<void> {
  const db = getOfflineQueueDB();
  await db.queuedEntries.clear();
}

/**
 * Sync queued entries to the server
 */
export async function syncQueuedEntries(): Promise<{
  successful: number;
  failed: number;
  errors: Array<{ id: number; error: string }>;
}> {
  const entries = await getQueuedEntries();

  let successful = 0;
  let failed = 0;
  const errors: Array<{ id: number; error: string }> = [];

  for (const entry of entries) {
    try {
      // Skip entries that have failed too many times
      if (entry.retryCount >= 3) {
        failed++;
        errors.push({
          id: entry.id!,
          error: 'Max retry attempts reached',
        });
        continue;
      }

      // Attempt to create the entry
      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: entry.type,
          content: entry.content,
          mood: entry.mood,
          conviction: entry.conviction,
          ticker: entry.ticker,
          tradeId: entry.tradeId,
          snapshotId: entry.snapshotId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create entry: ${response.statusText}`);
      }

      // Success - remove from queue
      await removeQueuedEntry(entry.id!);
      successful++;
    } catch (error) {
      // Failure - increment retry count
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await incrementRetryCount(entry.id!, errorMessage);
      failed++;
      errors.push({
        id: entry.id!,
        error: errorMessage,
      });
    }
  }

  return { successful, failed, errors };
}

/**
 * Check if the browser is online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Subscribe to online/offline events
 */
export function subscribeToOnlineStatus(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}
