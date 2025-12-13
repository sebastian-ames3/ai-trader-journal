/**
 * Client-side cleanup utilities for secure logout
 * Prevents data leakage between users on shared devices
 */

import { offlineDb } from './offlineQueue'

/**
 * Clear all local data on logout
 * Must be called before redirecting to login page
 */
export async function clearAllLocalData(): Promise<void> {
  // Clear IndexedDB (Dexie offline queue)
  try {
    await offlineDb.queuedEntries.clear()
  } catch {
    // Database might not exist yet
  }

  // Clear localStorage
  if (typeof window !== 'undefined') {
    localStorage.clear()
  }

  // Clear sessionStorage
  if (typeof window !== 'undefined') {
    sessionStorage.clear()
  }
}

/**
 * Clear only the offline queue for a specific user
 * Used when syncing to ensure we only sync current user's data
 */
export async function clearUserOfflineData(userId: string): Promise<void> {
  try {
    await offlineDb.queuedEntries
      .where('userId')
      .equals(userId)
      .delete()
  } catch {
    // Database might not exist or userId column not yet added
  }
}
