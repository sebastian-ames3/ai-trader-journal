/**
 * Integration Tests for Context Surfacing Feature
 *
 * Tests the ticker context, strategy context, and historical context APIs.
 *
 * Prerequisites:
 * - Dev server running: npm run dev
 * - Database available
 * - OPTIONS_SERVICE_URL set for market data tests (optional)
 *
 * Run: npm run test:context (add to package.json)
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// Helper to make API requests
async function fetchAPI(
  path: string,
  options?: RequestInit
): Promise<Response> {
  const url = `${BASE_URL}${path}`;
  return fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
    },
  });
}

describe('Context Surfacing API', () => {
  describe('GET /api/context/ticker', () => {
    test('should return 400 for missing ticker parameter', async () => {
      const response = await fetchAPI('/api/context/ticker');
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain('ticker');
    });

    test('should return context for valid ticker', async () => {
      const response = await fetchAPI('/api/context/ticker?ticker=AAPL');

      // Should return 200 even if no history exists
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('history');
      expect(data.history).toHaveProperty('ticker', 'AAPL');
      expect(data.history).toHaveProperty('entryCount');
      expect(data.history).toHaveProperty('sentimentTrend');
      expect(data.history).toHaveProperty('commonBiases');
      expect(data.history).toHaveProperty('convictionDistribution');
      expect(data.history).toHaveProperty('recentEntries');
    });

    test('should return market data when OPTIONS_SERVICE is available', async () => {
      const response = await fetchAPI('/api/context/ticker?ticker=SPY');

      expect(response.status).toBe(200);

      const data = await response.json();
      // Market data is optional - may be null if service not running
      if (data.market) {
        expect(data.market).toHaveProperty('price');
        expect(data.market).toHaveProperty('change');
        expect(data.market).toHaveProperty('changePercent');
      }
    });

    test('should return insight when enough history exists', async () => {
      const response = await fetchAPI('/api/context/ticker?ticker=AAPL');

      expect(response.status).toBe(200);

      const data = await response.json();
      // Insight is optional - only generated with sufficient history
      expect(data).toHaveProperty('insight');
      // Insight can be null if not enough history
    });
  });

  describe('GET /api/context/strategy', () => {
    test('should return 400 for missing strategy parameter', async () => {
      const response = await fetchAPI('/api/context/strategy');
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain('strategy');
    });

    test('should return history for valid strategy', async () => {
      const response = await fetchAPI('/api/context/strategy?strategy=iron%20condor');

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('strategy', 'iron condor');
      expect(data).toHaveProperty('entryCount');
      expect(data).toHaveProperty('avgConviction');
      expect(data).toHaveProperty('commonTickers');
    });
  });

  describe('GET /api/context/entry/[id]', () => {
    test('should return 404 for non-existent entry', async () => {
      const response = await fetchAPI('/api/context/entry/non-existent-id');
      expect(response.status).toBe(404);
    });

    // Note: Testing with actual entry ID requires creating an entry first
    // This would be done in an E2E test with proper setup/teardown
  });

  describe('POST /api/context/mention', () => {
    test('should return 400 for missing fields', async () => {
      const response = await fetchAPI('/api/context/mention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });

    test('should return 400 for missing ticker', async () => {
      const response = await fetchAPI('/api/context/mention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: 'test-id' }),
      });

      expect(response.status).toBe(400);
    });

    test('should return 400 for missing entryId', async () => {
      const response = await fetchAPI('/api/context/mention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: 'AAPL' }),
      });

      expect(response.status).toBe(400);
    });
  });
});

// Export for test runner
export {};
