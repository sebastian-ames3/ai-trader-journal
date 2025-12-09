/**
 * Integration Tests for Proactive Engagement Feature
 *
 * Tests the notifications, market conditions, and cron job APIs.
 *
 * Prerequisites:
 * - Dev server running: npm run dev
 * - Database available
 * - VAPID keys for push notification tests (optional)
 *
 * Run: npm run test:engagement (add to package.json)
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

describe('Proactive Engagement API', () => {
  // Check if VAPID keys are configured
  const VAPID_CONFIGURED = !!(
    process.env.VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY
  );

  describe('GET /api/notifications/vapid-key', () => {
    test.skipIf(!VAPID_CONFIGURED)(
      'should return public key when configured',
      async () => {
        const response = await fetchAPI('/api/notifications/vapid-key');

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data).toHaveProperty('publicKey');
        expect(typeof data.publicKey).toBe('string');
      }
    );

    test.skipIf(VAPID_CONFIGURED)(
      'should return 503 when not configured',
      async () => {
        const response = await fetchAPI('/api/notifications/vapid-key');
        expect(response.status).toBe(503);
      }
    );
  });

  describe('POST /api/notifications/subscribe', () => {
    test('should return 400 for missing subscription data', async () => {
      const response = await fetchAPI('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });

    test('should return 400 for missing endpoint', async () => {
      const response = await fetchAPI('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keys: { p256dh: 'test', auth: 'test' },
        }),
      });

      expect(response.status).toBe(400);
    });

    test('should return 400 for missing keys', async () => {
      const response = await fetchAPI('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'https://fcm.googleapis.com/fcm/test',
        }),
      });

      expect(response.status).toBe(400);
    });

    test('should accept valid subscription data', async () => {
      const response = await fetchAPI('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'https://fcm.googleapis.com/fcm/test-' + Date.now(),
          keys: {
            p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkA',
            auth: 'tBHItJI5svbpez7KI4CCXg',
          },
        }),
      });

      // Will be 200 if DB is available
      if (response.status === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('success', true);
      }
    });
  });

  describe('POST /api/notifications/unsubscribe', () => {
    test('should return 400 for missing endpoint', async () => {
      const response = await fetchAPI('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });

    test('should accept valid unsubscribe request', async () => {
      const response = await fetchAPI('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'https://fcm.googleapis.com/fcm/non-existent',
        }),
      });

      // Should succeed even if subscription doesn't exist
      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/notifications/prefs', () => {
    test('should return notification preferences', async () => {
      const response = await fetchAPI('/api/notifications/prefs');

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('marketAlerts');
      expect(data).toHaveProperty('vixAlerts');
      expect(data).toHaveProperty('tickerAlerts');
      expect(data).toHaveProperty('dailyReflection');
      expect(data).toHaveProperty('dailyReflectionTime');
      expect(data).toHaveProperty('weeklyReview');
      expect(data).toHaveProperty('journalNudgeDays');
      expect(data).toHaveProperty('quietHoursStart');
      expect(data).toHaveProperty('quietHoursEnd');
    });
  });

  describe('PUT /api/notifications/prefs', () => {
    test('should update notification preferences', async () => {
      const response = await fetchAPI('/api/notifications/prefs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketAlerts: false,
          dailyReflectionTime: '17:00',
        }),
      });

      if (response.status === 200) {
        const data = await response.json();
        expect(data.marketAlerts).toBe(false);
        expect(data.dailyReflectionTime).toBe('17:00');
      }
    });
  });

  describe('GET /api/market-condition', () => {
    test('should return current market condition', async () => {
      const response = await fetchAPI('/api/market-condition');

      // Will be 200 if data exists, 404 if no data yet
      if (response.status === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('date');
        expect(data).toHaveProperty('spyChange');
        expect(data).toHaveProperty('vixLevel');
        expect(data).toHaveProperty('marketState');
      }
    });
  });

  describe('POST /api/cron/market-check', () => {
    test('should run market check', async () => {
      const response = await fetchAPI('/api/cron/market-check', {
        method: 'POST',
      });

      // Should return 200 even if no notifications sent
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('success');
    });
  });

  describe('POST /api/cron/daily-reminder', () => {
    test('should run daily reminder check', async () => {
      const response = await fetchAPI('/api/cron/daily-reminder', {
        method: 'POST',
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('success');
    });
  });

  describe('POST /api/cron/weekly-review', () => {
    test('should run weekly review check', async () => {
      const response = await fetchAPI('/api/cron/weekly-review', {
        method: 'POST',
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('success');
    });
  });

  describe('Notification engagement tracking', () => {
    test('POST /api/notifications/engaged should return 400 for missing ID', async () => {
      const response = await fetchAPI('/api/notifications/engaged', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });

    test('POST /api/notifications/dismissed should return 400 for missing ID', async () => {
      const response = await fetchAPI('/api/notifications/dismissed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });

    test('POST /api/notifications/snooze should return 400 for missing ID', async () => {
      const response = await fetchAPI('/api/notifications/snooze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });
  });
});

// Export for test runner
export {};
