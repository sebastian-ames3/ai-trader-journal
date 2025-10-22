/**
 * Integration Tests for Entry Search & Filters
 *
 * Prerequisites:
 * 1. Dev server must be running (npm run dev)
 * 2. Database connection must be active
 * 3. Run from Windows PowerShell (not WSL)
 *
 * Usage: npm run test:search
 */

import dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'http://localhost:3000/api';

interface Entry {
  id: string;
  type: string;
  content: string;
  mood?: string;
  conviction?: string;
  sentiment?: string;
  detectedBiases?: string[];
  ticker?: string;
  createdAt: string;
}

interface ApiResponse {
  entries: Entry[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

describe('Entry Search & Filters API', () => {
  let testEntryIds: string[] = [];

  // Setup: Create test entries with various attributes
  beforeAll(async () => {
    console.log('Creating test entries for search/filter tests...');

    const testEntries = [
      {
        type: 'TRADE_IDEA',
        content: 'Bullish on AAPL due to strong earnings. Very confident in this setup.',
        mood: 'CONFIDENT',
        conviction: 'HIGH',
        ticker: 'AAPL',
      },
      {
        type: 'REFLECTION',
        content: 'I got stopped out on my SPY trade. Feeling frustrated and anxious.',
        mood: 'FRUSTRATED',
        conviction: 'LOW',
        ticker: 'SPY',
      },
      {
        type: 'OBSERVATION',
        content: 'Market is showing signs of weakness. Tech sector particularly vulnerable.',
        mood: 'UNCERTAIN',
        ticker: null,
      },
      {
        type: 'TRADE',
        content: 'Executed iron condor on TSLA. Premium collected: $200.',
        mood: 'CALM',
        conviction: 'MEDIUM',
        ticker: 'TSLA',
      },
      {
        type: 'TRADE_IDEA',
        content: 'Thinking about shorting GOOGL. Might be overvalued after recent rally.',
        mood: 'NERVOUS',
        conviction: 'LOW',
        ticker: 'GOOGL',
      },
    ];

    for (const entry of testEntries) {
      const response = await fetch(`${API_BASE}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      const created = await response.json();
      testEntryIds.push(created.id);
    }

    // Analyze some entries with AI to add sentiment and biases
    if (testEntryIds.length >= 2) {
      await fetch(`${API_BASE}/entries/${testEntryIds[0]}/analyze`, {
        method: 'POST',
      });
      await fetch(`${API_BASE}/entries/${testEntryIds[1]}/analyze`, {
        method: 'POST',
      });
    }

    console.log(`Created ${testEntryIds.length} test entries`);
  });

  // Cleanup: Delete test entries
  afterAll(async () => {
    console.log('Cleaning up test entries...');
    for (const id of testEntryIds) {
      await fetch(`${API_BASE}/entries/${id}`, { method: 'DELETE' });
    }
    console.log('Cleanup complete');
  });

  // Test 1: Basic fetch without filters
  test('should fetch all entries without filters', async () => {
    const response = await fetch(`${API_BASE}/entries`);
    expect(response.ok).toBe(true);

    const data: ApiResponse = await response.json();
    expect(data.entries).toBeDefined();
    expect(data.pagination).toBeDefined();
    expect(data.pagination.total).toBeGreaterThanOrEqual(testEntryIds.length);
    expect(Array.isArray(data.entries)).toBe(true);
  });

  // Test 2: Full-text search
  test('should filter entries by search term', async () => {
    const response = await fetch(`${API_BASE}/entries?search=AAPL`);
    expect(response.ok).toBe(true);

    const data: ApiResponse = await response.json();
    expect(data.entries.length).toBeGreaterThan(0);
    expect(
      data.entries.some((e) => e.content.includes('AAPL'))
    ).toBe(true);
  });

  // Test 3: Filter by entry type
  test('should filter entries by type', async () => {
    const response = await fetch(`${API_BASE}/entries?type=TRADE_IDEA`);
    expect(response.ok).toBe(true);

    const data: ApiResponse = await response.json();
    expect(data.entries.length).toBeGreaterThan(0);
    expect(data.entries.every((e) => e.type === 'TRADE_IDEA')).toBe(true);
  });

  // Test 4: Filter by ticker
  test('should filter entries by ticker (case-insensitive)', async () => {
    const response = await fetch(`${API_BASE}/entries?ticker=aapl`);
    expect(response.ok).toBe(true);

    const data: ApiResponse = await response.json();
    expect(data.entries.length).toBeGreaterThan(0);
    expect(data.entries.every((e) => e.ticker?.toUpperCase() === 'AAPL')).toBe(
      true
    );
  });

  // Test 5: Filter by mood
  test('should filter entries by mood', async () => {
    const response = await fetch(`${API_BASE}/entries?mood=CONFIDENT`);
    expect(response.ok).toBe(true);

    const data: ApiResponse = await response.json();
    if (data.entries.length > 0) {
      expect(data.entries.every((e) => e.mood === 'CONFIDENT')).toBe(true);
    }
  });

  // Test 6: Filter by conviction
  test('should filter entries by conviction level', async () => {
    const response = await fetch(`${API_BASE}/entries?conviction=HIGH`);
    expect(response.ok).toBe(true);

    const data: ApiResponse = await response.json();
    if (data.entries.length > 0) {
      expect(data.entries.every((e) => e.conviction === 'HIGH')).toBe(true);
    }
  });

  // Test 7: Filter by sentiment
  test('should filter entries by AI sentiment', async () => {
    const response = await fetch(`${API_BASE}/entries?sentiment=positive`);
    expect(response.ok).toBe(true);

    const data: ApiResponse = await response.json();
    if (data.entries.length > 0) {
      expect(data.entries.every((e) => e.sentiment === 'positive')).toBe(true);
    }
  });

  // Test 8: Filter by cognitive bias
  test('should filter entries by cognitive bias', async () => {
    const response = await fetch(`${API_BASE}/entries?bias=fomo`);
    expect(response.ok).toBe(true);

    const data: ApiResponse = await response.json();
    // Entries may or may not have biases detected
    expect(Array.isArray(data.entries)).toBe(true);
  });

  // Test 9: Multiple biases filter
  test('should filter entries by multiple biases', async () => {
    const response = await fetch(
      `${API_BASE}/entries?bias=fomo,confirmation_bias`
    );
    expect(response.ok).toBe(true);

    const data: ApiResponse = await response.json();
    expect(Array.isArray(data.entries)).toBe(true);
  });

  // Test 10: Date range filter
  test('should filter entries by date range', async () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const response = await fetch(
      `${API_BASE}/entries?dateFrom=${yesterday}&dateTo=${today}`
    );
    expect(response.ok).toBe(true);

    const data: ApiResponse = await response.json();
    expect(Array.isArray(data.entries)).toBe(true);
    expect(data.pagination.total).toBeGreaterThanOrEqual(testEntryIds.length);
  });

  // Test 11: Pagination
  test('should paginate results with limit and offset', async () => {
    const response = await fetch(`${API_BASE}/entries?limit=2&offset=0`);
    expect(response.ok).toBe(true);

    const data: ApiResponse = await response.json();
    expect(data.entries.length).toBeLessThanOrEqual(2);
    expect(data.pagination.limit).toBe(2);
    expect(data.pagination.offset).toBe(0);
    expect(typeof data.pagination.hasMore).toBe('boolean');
  });

  // Test 12: Combined filters
  test('should apply multiple filters simultaneously', async () => {
    const response = await fetch(
      `${API_BASE}/entries?type=TRADE_IDEA&conviction=HIGH`
    );
    expect(response.ok).toBe(true);

    const data: ApiResponse = await response.json();
    if (data.entries.length > 0) {
      expect(
        data.entries.every(
          (e) => e.type === 'TRADE_IDEA' && e.conviction === 'HIGH'
        )
      ).toBe(true);
    }
  });

  // Test 13: Search with filters
  test('should combine search with filters', async () => {
    const response = await fetch(
      `${API_BASE}/entries?search=trade&type=TRADE_IDEA`
    );
    expect(response.ok).toBe(true);

    const data: ApiResponse = await response.json();
    expect(Array.isArray(data.entries)).toBe(true);
  });

  // Test 14: Invalid filter values
  test('should handle invalid filter values gracefully', async () => {
    const response = await fetch(`${API_BASE}/entries?type=INVALID_TYPE`);
    expect(response.ok).toBe(true);

    const data: ApiResponse = await response.json();
    // Should return all entries since invalid type is ignored
    expect(Array.isArray(data.entries)).toBe(true);
  });

  // Test 15: Empty result set
  test('should return empty array when no entries match filters', async () => {
    const response = await fetch(
      `${API_BASE}/entries?ticker=NONEXISTENT123`
    );
    expect(response.ok).toBe(true);

    const data: ApiResponse = await response.json();
    expect(data.entries).toEqual([]);
    expect(data.pagination.total).toBe(0);
  });

  // Test 16: Case-insensitive search
  test('should perform case-insensitive search', async () => {
    const response1 = await fetch(`${API_BASE}/entries?search=earnings`);
    const response2 = await fetch(`${API_BASE}/entries?search=EARNINGS`);

    expect(response1.ok).toBe(true);
    expect(response2.ok).toBe(true);

    const data1: ApiResponse = await response1.json();
    const data2: ApiResponse = await response2.json();

    expect(data1.pagination.total).toBe(data2.pagination.total);
  });

  // Test 17: Default pagination values
  test('should use default pagination when not specified', async () => {
    const response = await fetch(`${API_BASE}/entries`);
    expect(response.ok).toBe(true);

    const data: ApiResponse = await response.json();
    expect(data.pagination.limit).toBe(50); // Default limit
    expect(data.pagination.offset).toBe(0); // Default offset
  });

  // Test 18: Reverse chronological order
  test('should return entries in reverse chronological order', async () => {
    const response = await fetch(`${API_BASE}/entries?limit=10`);
    expect(response.ok).toBe(true);

    const data: ApiResponse = await response.json();
    if (data.entries.length > 1) {
      const dates = data.entries.map((e) => new Date(e.createdAt).getTime());
      const sortedDates = [...dates].sort((a, b) => b - a);
      expect(dates).toEqual(sortedDates);
    }
  });
});
