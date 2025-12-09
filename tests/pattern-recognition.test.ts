/**
 * Integration Tests for Pattern Recognition Feature
 *
 * Tests the pattern analysis, pattern insights, and monthly reports APIs.
 *
 * Prerequisites:
 * - Dev server running: npm run dev
 * - Database available
 * - OPENAI_API_KEY set for AI analysis tests
 *
 * Run: npm run test:patterns (add to package.json)
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

describe('Pattern Recognition API', () => {
  describe('GET /api/patterns', () => {
    test('should return patterns array', async () => {
      const response = await fetchAPI('/api/patterns');

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('patterns');
      expect(Array.isArray(data.patterns)).toBe(true);
    });

    test('should return valid pattern structure when patterns exist', async () => {
      const response = await fetchAPI('/api/patterns');

      expect(response.status).toBe(200);

      const data = await response.json();
      if (data.patterns.length > 0) {
        const pattern = data.patterns[0];
        expect(pattern).toHaveProperty('id');
        expect(pattern).toHaveProperty('patternType');
        expect(pattern).toHaveProperty('patternName');
        expect(pattern).toHaveProperty('description');
        expect(pattern).toHaveProperty('occurrences');
        expect(pattern).toHaveProperty('trend');
        expect(pattern).toHaveProperty('confidence');
        expect(pattern).toHaveProperty('evidence');
      }
    });
  });

  describe('GET /api/patterns/[id]', () => {
    test('should return 404 for non-existent pattern', async () => {
      const response = await fetchAPI('/api/patterns/non-existent-id');
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/patterns/check', () => {
    test('should return null for short content', async () => {
      const response = await fetchAPI('/api/patterns/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'short' }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.alert).toBeNull();
    });

    test('should check content for pattern matches', async () => {
      const response = await fetchAPI('/api/patterns/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'I am feeling very anxious about this trade, but I need to take it anyway because I missed the last rally.',
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      // Alert can be null if no matching patterns
      expect(data).toHaveProperty('alert');
    });

    test('should return 400 for missing content', async () => {
      const response = await fetchAPI('/api/patterns/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/patterns/dismiss', () => {
    test('should return 400 for missing patternId', async () => {
      const response = await fetchAPI('/api/patterns/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });

    test('should return 404 for non-existent pattern', async () => {
      const response = await fetchAPI('/api/patterns/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patternId: 'non-existent-id' }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/cron/pattern-analysis', () => {
    // This endpoint triggers AI analysis, so it should have OPENAI_API_KEY
    const OPENAI_CONFIGURED = !!process.env.OPENAI_API_KEY;

    test.skipIf(!OPENAI_CONFIGURED)(
      'should run pattern analysis',
      async () => {
        const response = await fetchAPI('/api/cron/pattern-analysis', {
          method: 'POST',
        });

        // Should return 200 even if no patterns found
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data).toHaveProperty('success');
      },
      30000 // 30 second timeout for AI call
    );
  });

  describe('GET /api/insights/monthly', () => {
    test('should return monthly report for current month', async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const response = await fetchAPI(`/api/insights/monthly?year=${year}&month=${month}`);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('month');
      expect(data).toHaveProperty('entryCount');
      expect(data).toHaveProperty('biasDistribution');
      expect(data).toHaveProperty('convictionDistribution');
      expect(data).toHaveProperty('moodDistribution');
      expect(data).toHaveProperty('marketConditionBehavior');
      expect(data).toHaveProperty('topPatterns');
      expect(data).toHaveProperty('keyInsight');
    });

    test('should return 400 for invalid month', async () => {
      const response = await fetchAPI('/api/insights/monthly?year=2024&month=13');
      expect(response.status).toBe(400);
    });

    test('should return 400 for missing parameters', async () => {
      const response = await fetchAPI('/api/insights/monthly');
      expect(response.status).toBe(400);
    });

    test('should return report for past month', async () => {
      // Test with last month
      const now = new Date();
      now.setMonth(now.getMonth() - 1);
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const response = await fetchAPI(`/api/insights/monthly?year=${year}&month=${month}`);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('entryCount');
    });
  });
});

// Export for test runner
export {};
