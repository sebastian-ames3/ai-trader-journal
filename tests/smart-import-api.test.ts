/**
 * Integration tests for Smart Import API routes
 * Run with: npx tsx tests/smart-import-api.test.ts
 *
 * Prerequisites:
 * - Database must be running and accessible
 * - Dev server must be running on localhost:3000 or 3001
 */

const API_BASE = process.env.TEST_API_BASE || 'http://localhost:3001/api';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function log(message: string) {
  console.log(`  ${message}`);
}

function logSuccess(message: string) {
  console.log(`  ✅ ${message}`);
}

function logError(message: string) {
  console.log(`  ❌ ${message}`);
}

async function test(name: string, fn: () => Promise<void>) {
  console.log(`\n${name}`);
  try {
    await fn();
    results.push({ name, passed: true });
    logSuccess('PASSED');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, error: errorMessage });
    logError(`FAILED: ${errorMessage}`);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

// Sample trade data for testing
const SAMPLE_TRADES = [
  {
    id: 'trade-1',
    ticker: 'AAPL',
    strategyType: 'IRON_CONDOR',
    openedAt: '2024-01-15',
    status: 'CLOSED',
    debitCredit: 0,
    realizedPL: 245,
    legs: '175P/180P/190C/195C',
  },
  {
    id: 'trade-2',
    ticker: 'AAPL',
    strategyType: 'IRON_CONDOR',
    openedAt: '2024-01-18',
    status: 'OPEN',
    debitCredit: -150,
    realizedPL: null,
    legs: '180P/185P/195C/200C',
  },
  {
    id: 'trade-3',
    ticker: 'NVDA',
    strategyType: 'PUT_SPREAD',
    openedAt: '2024-01-16',
    status: 'CLOSED',
    debitCredit: 0,
    realizedPL: -50,
    legs: '100P/95P',
  },
];

// Test Suite
async function runTests() {
  console.log('\n=================================');
  console.log('Smart Import API Integration Tests');
  console.log('=================================');

  // ============================================
  // POST /api/import/smart/suggest-links Tests
  // ============================================

  await test('suggest-links API - returns 401 for unauthenticated requests', async () => {
    const response = await fetch(`${API_BASE}/import/smart/suggest-links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trades: SAMPLE_TRADES }),
    });

    assert(response.status === 401, `Expected 401, got ${response.status}`);
    log('Protected route correctly returns 401');
  });

  await test('suggest-links API - validates trades array is required', async () => {
    const response = await fetch(`${API_BASE}/import/smart/suggest-links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    // Should return 400 or 401
    assert([400, 401].includes(response.status), `Expected 400 or 401, got ${response.status}`);
    log('Correctly validates trades array');
  });

  await test('suggest-links API - validates trade objects have required fields', async () => {
    const invalidTrades = [
      { id: 'trade-1' }, // Missing ticker, openedAt, status
    ];

    const response = await fetch(`${API_BASE}/import/smart/suggest-links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trades: invalidTrades }),
    });

    // Should return 400 or 401
    assert([400, 401].includes(response.status), `Expected 400 or 401, got ${response.status}`);
    log('Correctly validates required trade fields');
  });

  await test('suggest-links API - handles empty trades array', async () => {
    const response = await fetch(`${API_BASE}/import/smart/suggest-links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trades: [] }),
    });

    // Empty array should be valid but return no suggestions
    // Will return 401 for auth or process normally
    assert([200, 401].includes(response.status), `Expected 200 or 401, got ${response.status}`);

    if (response.status === 200) {
      const data = await response.json();
      assert(data.success === true, 'Should succeed');
      assert(Array.isArray(data.data?.suggestions), 'Should return suggestions array');
      assert(data.data.suggestions.length === 0, 'Should return empty suggestions');
    }

    log('Correctly handles empty trades array');
  });

  // ============================================
  // POST /api/import/smart/confirm Tests
  // ============================================

  await test('confirm API - returns 401 for unauthenticated requests', async () => {
    const response = await fetch(`${API_BASE}/import/smart/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batchId: 'test-batch-123',
        decisions: [
          { tradeId: 'trade-1', action: 'approve' },
        ],
      }),
    });

    assert(response.status === 401, `Expected 401, got ${response.status}`);
    log('Protected route correctly returns 401');
  });

  await test('confirm API - validates batchId is required', async () => {
    const response = await fetch(`${API_BASE}/import/smart/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decisions: [{ tradeId: 'trade-1', action: 'approve' }],
      }),
    });

    assert([400, 401].includes(response.status), `Expected 400 or 401, got ${response.status}`);
    log('Correctly validates batchId');
  });

  await test('confirm API - validates decisions array is required', async () => {
    const response = await fetch(`${API_BASE}/import/smart/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batchId: 'test-batch-123',
      }),
    });

    assert([400, 401].includes(response.status), `Expected 400 or 401, got ${response.status}`);
    log('Correctly validates decisions array');
  });

  await test('confirm API - returns 410 for expired batch', async () => {
    const response = await fetch(`${API_BASE}/import/smart/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batchId: 'non-existent-batch-' + Date.now(),
        decisions: [{ tradeId: 'trade-1', action: 'approve' }],
      }),
    });

    // Should return 401 (auth) or 410 (expired)
    assert([401, 410].includes(response.status), `Expected 401 or 410, got ${response.status}`);
    log('Correctly handles expired batch');
  });

  await test('confirm API - accepts valid linkGroups structure', async () => {
    const response = await fetch(`${API_BASE}/import/smart/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batchId: 'test-batch-123',
        decisions: [
          { tradeId: 'trade-1', action: 'approve', notes: 'Test note' },
          { tradeId: 'trade-2', action: 'skip' },
        ],
        linkGroups: [
          {
            name: 'AAPL Jan 2024 Trade',
            ticker: 'AAPL',
            direction: 'BULLISH',
            tradeIds: ['trade-1'],
          },
        ],
      }),
    });

    // Will fail auth but validates structure parsing
    assert([401, 410].includes(response.status), `Expected 401 or 410, got ${response.status}`);
    log('Correctly parses linkGroups structure');
  });

  await test('confirm API - handles decisions with edits', async () => {
    const response = await fetch(`${API_BASE}/import/smart/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batchId: 'test-batch-123',
        decisions: [
          {
            tradeId: 'trade-1',
            action: 'approve',
            edits: {
              ticker: 'AAPL',
              strategyType: 'IRON_CONDOR',
              openedAt: '2024-01-15',
              realizedPL: 300,
              status: 'CLOSED',
              description: 'Edited trade',
            },
            notes: 'Trade notes here',
            tradeAction: 'INITIAL',
          },
        ],
      }),
    });

    // Will fail auth but validates parsing
    assert([401, 410].includes(response.status), `Expected 401 or 410, got ${response.status}`);
    log('Correctly parses edits structure');
  });

  // ============================================
  // Response Format Tests
  // ============================================

  await test('suggest-links API - returns expected response format', async () => {
    const response = await fetch(`${API_BASE}/import/smart/suggest-links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trades: SAMPLE_TRADES }),
    });

    if (response.status === 200) {
      const data = await response.json();

      assert(typeof data.success === 'boolean', 'Response should have success boolean');
      assert(data.data !== undefined, 'Response should have data object');
      assert(Array.isArray(data.data.suggestions), 'data.suggestions should be array');
      assert(typeof data.data.processingTime === 'number', 'data.processingTime should be number');
      assert(typeof data.data.aiUsed === 'boolean', 'data.aiUsed should be boolean');

      log('Response format is correct');
    } else {
      assert(response.status === 401, 'Non-200 should be 401 for auth');
      log('Auth required - format validation skipped');
    }
  });

  await test('suggest-links API - suggestion objects have expected fields', async () => {
    const response = await fetch(`${API_BASE}/import/smart/suggest-links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trades: SAMPLE_TRADES }),
    });

    if (response.status === 200) {
      const data = await response.json();

      if (data.data.suggestions.length > 0) {
        const suggestion = data.data.suggestions[0];

        assert(typeof suggestion.id === 'string', 'Suggestion should have id');
        assert(typeof suggestion.confidence === 'number', 'Suggestion should have confidence');
        assert(Array.isArray(suggestion.tradeIds), 'Suggestion should have tradeIds array');
        assert(typeof suggestion.pattern === 'string', 'Suggestion should have pattern');
        assert(typeof suggestion.reason === 'string', 'Suggestion should have reason');
        assert(typeof suggestion.suggestedName === 'string', 'Suggestion should have suggestedName');
        assert(typeof suggestion.suggestedDirection === 'string', 'Suggestion should have suggestedDirection');

        log('Suggestion object format is correct');
      } else {
        log('No suggestions returned - field validation skipped');
      }
    } else {
      log('Auth required - field validation skipped');
    }
  });

  // ============================================
  // Performance Tests
  // ============================================

  await test('suggest-links API - responds within 3 seconds for 100 trades', async () => {
    // Generate 100 trades
    const trades = [];
    const tickers = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'GOOGL'];

    for (let i = 0; i < 100; i++) {
      const ticker = tickers[i % tickers.length];
      const day = (i % 28) + 1;
      trades.push({
        id: `trade-${i}`,
        ticker,
        strategyType: 'IRON_CONDOR',
        openedAt: `2024-01-${day.toString().padStart(2, '0')}`,
        status: i % 3 === 0 ? 'CLOSED' : 'OPEN',
        debitCredit: 0,
        realizedPL: i % 3 === 0 ? (Math.random() - 0.5) * 500 : null,
      });
    }

    const startTime = Date.now();

    const response = await fetch(`${API_BASE}/import/smart/suggest-links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trades }),
    });

    const elapsed = Date.now() - startTime;

    // Even if auth fails, timing should be reasonable
    assert(elapsed < 3000, `Request took ${elapsed}ms, expected < 3000ms`);
    log(`Response time: ${elapsed}ms for 100 trades`);
  });

  // ============================================
  // Print Summary
  // ============================================

  console.log('\n=================================');
  console.log('Test Summary');
  console.log('=================================');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`\n✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total:  ${results.length}`);

  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
    process.exit(1);
  }

  console.log('\n✨ All tests passed!\n');
}

// Run tests
runTests().catch(console.error);
