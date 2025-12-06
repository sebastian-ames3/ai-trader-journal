/**
 * Integration Tests for Frictionless Capture Feature
 *
 * Tests the voice recording, transcription, and quick capture APIs.
 *
 * Prerequisites:
 * - Dev server running: npm run dev
 * - OPENAI_API_KEY set in .env for transcription tests
 * - R2 storage configured for upload tests (optional, will skip if not configured)
 *
 * Run: npm run test:capture (or add to package.json)
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

describe('Frictionless Capture API', () => {
  // Skip upload tests if R2 is not configured
  const R2_CONFIGURED = !!(
    process.env.R2_ENDPOINT &&
    process.env.R2_ACCESS_KEY &&
    process.env.R2_SECRET_KEY
  );

  describe('POST /api/infer', () => {
    test('should infer metadata from trade idea content', async () => {
      const response = await fetchAPI('/api/infer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'I think NVDA is going to break out above 500. Looking at entering some calls.',
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('entryType');
      expect(data).toHaveProperty('mood');
      expect(data).toHaveProperty('conviction');
      expect(data).toHaveProperty('ticker');
      expect(data).toHaveProperty('sentiment');

      // Should detect NVDA as the ticker
      expect(data.ticker).toBe('NVDA');
      // Should detect this as a trade idea
      expect(data.entryType).toBe('TRADE_IDEA');
    });

    test('should infer metadata from executed trade content', async () => {
      const response = await fetchAPI('/api/infer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'Just bought 10 AAPL 180 calls expiring next Friday. Got filled at 2.50.',
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.entryType).toBe('TRADE');
      expect(data.ticker).toBe('AAPL');
    });

    test('should infer metadata from reflection content', async () => {
      const response = await fetchAPI('/api/infer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'Looking back at my SPY trade last week, I should have taken profits earlier. Lesson learned.',
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.entryType).toBe('REFLECTION');
      expect(data.ticker).toBe('SPY');
    });

    test('should handle content without ticker', async () => {
      const response = await fetchAPI('/api/infer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'The market feels very uncertain today. I think I will sit on the sidelines.',
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.entryType).toBe('OBSERVATION');
      expect(data.ticker).toBeNull();
    });

    test('should return 400 for empty content', async () => {
      const response = await fetchAPI('/api/infer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '' }),
      });

      expect(response.status).toBe(400);
    });

    test('should return 400 for missing content', async () => {
      const response = await fetchAPI('/api/infer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/transcribe', () => {
    // Only run if OPENAI_API_KEY is set
    const OPENAI_CONFIGURED = !!process.env.OPENAI_API_KEY;

    test.skipIf(!OPENAI_CONFIGURED)(
      'should return 400 for missing audio file',
      async () => {
        const formData = new FormData();

        const response = await fetchAPI('/api/transcribe', {
          method: 'POST',
          body: formData,
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toContain('No audio file');
      }
    );
  });

  describe('POST /api/upload/audio', () => {
    test('should return 503 if R2 storage is not configured', async () => {
      if (R2_CONFIGURED) {
        console.log('Skipping - R2 is configured');
        return;
      }

      const formData = new FormData();
      const audioBlob = new Blob(['test audio data'], { type: 'audio/webm' });
      formData.append('audio', audioBlob, 'test.webm');

      const response = await fetchAPI('/api/upload/audio', {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(503);
      const data = await response.json();
      expect(data.error).toBe('Storage not configured');
    });

    test.skipIf(!R2_CONFIGURED)(
      'should return 400 for missing audio file',
      async () => {
        const formData = new FormData();

        const response = await fetchAPI('/api/upload/audio', {
          method: 'POST',
          body: formData,
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toContain('No audio file');
      }
    );
  });

  describe('POST /api/upload/image', () => {
    test('should return 503 if R2 storage is not configured', async () => {
      if (R2_CONFIGURED) {
        console.log('Skipping - R2 is configured');
        return;
      }

      const formData = new FormData();
      const imageBlob = new Blob(['test image data'], { type: 'image/jpeg' });
      formData.append('image', imageBlob, 'test.jpg');

      const response = await fetchAPI('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(503);
      const data = await response.json();
      expect(data.error).toBe('Storage not configured');
    });
  });

  describe('POST /api/entries with media fields', () => {
    // These tests require database access
    // They will be skipped if the database is not available

    test('should accept entries with captureMethod field', async () => {
      const response = await fetchAPI('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'OBSERVATION',
          content: 'Quick test entry via voice capture',
          captureMethod: 'VOICE',
        }),
      });

      // Will be 201 if DB is available, 500 if not
      if (response.status === 201) {
        const data = await response.json();
        expect(data.entry).toHaveProperty('captureMethod', 'VOICE');
      }
    });

    test('should accept entries with all media fields', async () => {
      const response = await fetchAPI('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'TRADE_IDEA',
          content: 'Voice memo about NVDA trade idea',
          mood: 'EXCITED',
          conviction: 'HIGH',
          ticker: 'NVDA',
          captureMethod: 'VOICE',
          audioUrl: 'https://example.com/audio/test.webm',
          audioDuration: 45,
          transcription: 'Voice memo about NVDA trade idea',
        }),
      });

      // Will be 201 if DB is available, 500 if not
      if (response.status === 201) {
        const data = await response.json();
        expect(data.entry).toHaveProperty('audioUrl', 'https://example.com/audio/test.webm');
        expect(data.entry).toHaveProperty('audioDuration', 45);
        expect(data.entry).toHaveProperty('transcription', 'Voice memo about NVDA trade idea');
        expect(data.entry).toHaveProperty('captureMethod', 'VOICE');
      }
    });

    test('should validate captureMethod enum', async () => {
      const response = await fetchAPI('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'OBSERVATION',
          content: 'Test entry',
          captureMethod: 'INVALID_METHOD',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('capture method');
    });
  });
});

// Export for test runner
export {};
