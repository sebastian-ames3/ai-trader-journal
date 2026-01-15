/**
 * Persisted State Hook
 *
 * Provides state persistence using localStorage with automatic
 * serialization/deserialization.
 */

import { useState, useEffect, useCallback } from 'react';

interface PersistedStateOptions<T> {
  /** Storage key */
  key: string;
  /** Default value if nothing in storage */
  defaultValue: T;
  /** Time-to-live in milliseconds (optional) */
  ttlMs?: number;
}

interface StoredValue<T> {
  value: T;
  timestamp: number;
}

/**
 * Hook for persisting state to localStorage
 */
export function usePersistedState<T>({
  key,
  defaultValue,
  ttlMs,
}: PersistedStateOptions<T>): readonly [T, React.Dispatch<React.SetStateAction<T>>, () => void] {
  const [state, setState] = useState<T>(defaultValue);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed: StoredValue<T> = JSON.parse(stored);

        // Check TTL if configured
        if (ttlMs && parsed.timestamp) {
          const age = Date.now() - parsed.timestamp;
          if (age > ttlMs) {
            localStorage.removeItem(key);
            setIsInitialized(true);
            return;
          }
        }

        // Use stored value
        if (parsed.value !== undefined) {
          setState(parsed.value);
        }
      }
    } catch (error) {
      console.error(`Failed to load persisted state for ${key}:`, error);
      localStorage.removeItem(key);
    }

    setIsInitialized(true);
  }, [key, ttlMs]);

  // Save to localStorage when state changes
  useEffect(() => {
    if (typeof window === 'undefined' || !isInitialized) return;

    try {
      const toStore: StoredValue<T> = {
        value: state,
        timestamp: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(toStore));
    } catch (error) {
      console.error(`Failed to persist state for ${key}:`, error);
    }
  }, [key, state, isInitialized]);

  // Clear persisted state
  const clear = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  }, [key]);

  return [state, setState, clear] as const;
}
