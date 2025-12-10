/**
 * Integration tests for Thesis and Trade API routes
 * Run with: npx tsx tests/api-theses.test.ts
 *
 * Prerequisites:
 * - Database must be running and accessible
 * - Dev server must be running on localhost:3000
 */

import { prisma } from '../src/lib/prisma';

const THESES_API = 'http://localhost:3000/api/theses';
const TRADES_API = 'http://localhost:3000/api/trades';

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

async function cleanup() {
  // Delete all test theses and trades (created in the last 5 minutes)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60000);

  // Delete trades first (due to foreign key constraints)
  await prisma.thesisTrade.deleteMany({
    where: {
      createdAt: {
        gte: fiveMinutesAgo
      }
    }
  });

  // Delete thesis updates
  await prisma.thesisUpdate.deleteMany({
    where: {
      thesis: {
        createdAt: {
          gte: fiveMinutesAgo
        }
      }
    }
  });

  // Delete theses
  await prisma.tradingThesis.deleteMany({
    where: {
      createdAt: {
        gte: fiveMinutesAgo
      }
    }
  });
}

// Test Suite
async function runTests() {
  console.log('\n=================================');
  console.log('Thesis & Trade API Integration Tests');
  console.log('=================================');

  let createdThesisId: string;
  let createdTradeId: string;

  // Test 1: Database Connection
  await test('Database Connection', async () => {
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT 1 as value`;
    assert(Array.isArray(result), 'Database query should return an array');
    log('Database connected successfully');
  });

  // Test 2: POST /api/theses - Create thesis
  await test('POST /api/theses - Create new thesis', async () => {
    const response = await fetch(THESES_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test NVDA Bullish',
        ticker: 'NVDA',
        direction: 'BULLISH',
        originalThesis: 'Testing thesis creation via API. Bullish on AI demand.'
      })
    });

    assert(response.status === 201, `Expected status 201, got ${response.status}`);

    const thesis = await response.json();
    assert(thesis?.id, 'Response should include thesis ID');
    assert(thesis.name === 'Test NVDA Bullish', 'Thesis name should match');
    assert(thesis.ticker === 'NVDA', 'Ticker should be uppercase');
    assert(thesis.direction === 'BULLISH', 'Direction should match');
    assert(thesis.status === 'ACTIVE', 'Status should default to ACTIVE');

    createdThesisId = thesis.id;
    log(`Created thesis: ${thesis.id}`);
  });

  // Test 3: POST /api/theses - Validation errors
  await test('POST /api/theses - Validation error (missing fields)', async () => {
    const response = await fetch(THESES_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Incomplete Thesis'
        // Missing required fields
      })
    });

    assert(response.status === 400, `Expected status 400, got ${response.status}`);
    const data = await response.json();
    assert(data.error, 'Should return error message');
    log('Validation error returned correctly');
  });

  // Test 4: GET /api/theses - List theses
  await test('GET /api/theses - List theses', async () => {
    const response = await fetch(THESES_API);
    assert(response.ok, `Expected success, got status ${response.status}`);

    const data = await response.json();
    assert(Array.isArray(data.theses), 'Response should include theses array');
    assert(data.pagination, 'Response should include pagination');
    log(`Retrieved ${data.theses.length} theses`);
  });

  // Test 5: GET /api/theses?status=ACTIVE - Filter by status
  await test('GET /api/theses?status=ACTIVE - Filter by status', async () => {
    const response = await fetch(`${THESES_API}?status=ACTIVE`);
    assert(response.ok, `Expected success, got status ${response.status}`);

    const data = await response.json();
    assert(Array.isArray(data.theses), 'Response should include theses array');
    data.theses.forEach((t: { status: string }) => {
      assert(t.status === 'ACTIVE', 'All theses should have ACTIVE status');
    });
    log(`Retrieved ${data.theses.length} active theses`);
  });

  // Test 6: GET /api/theses/:id - Get single thesis
  await test('GET /api/theses/:id - Get single thesis', async () => {
    const response = await fetch(`${THESES_API}/${createdThesisId}`);
    assert(response.ok, `Expected success, got status ${response.status}`);

    const thesis = await response.json();
    assert(thesis.id === createdThesisId, 'Thesis ID should match');
    assert(Array.isArray(thesis.thesisTrades), 'Should include trades array');
    assert(Array.isArray(thesis.updates), 'Should include updates array');
    log(`Retrieved thesis: ${thesis.name}`);
  });

  // Test 7: GET /api/theses/:id - Not found
  await test('GET /api/theses/:id - Not found', async () => {
    const response = await fetch(`${THESES_API}/non-existent-id`);
    assert(response.status === 404, `Expected status 404, got ${response.status}`);
    log('404 returned correctly for non-existent thesis');
  });

  // Test 8: POST /api/trades - Log a trade
  await test('POST /api/trades - Log a trade', async () => {
    const response = await fetch(TRADES_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        thesisId: createdThesisId,
        action: 'INITIAL',
        description: 'Bought NVDA 150 call spread',
        debitCredit: -500,
        quantity: 1
      })
    });

    assert(response.status === 201, `Expected status 201, got ${response.status}`);

    const trade = await response.json();
    assert(trade?.id, 'Response should include trade ID');
    assert(trade.thesisId === createdThesisId, 'Trade should be linked to thesis');
    assert(trade.action === 'INITIAL', 'Action should match');
    assert(trade.debitCredit === -500, 'Debit/credit should match');

    createdTradeId = trade.id;
    log(`Created trade: ${trade.id}`);
  });

  // Test 9: GET /api/trades - List trades
  await test('GET /api/trades - List trades', async () => {
    const response = await fetch(TRADES_API);
    assert(response.ok, `Expected success, got status ${response.status}`);

    const data = await response.json();
    assert(Array.isArray(data.trades), 'Response should include trades array');
    assert(data.pagination, 'Response should include pagination');
    log(`Retrieved ${data.trades.length} trades`);
  });

  // Test 10: GET /api/trades?thesisId=xxx - Filter by thesis
  await test('GET /api/trades?thesisId=xxx - Filter by thesis', async () => {
    const response = await fetch(`${TRADES_API}?thesisId=${createdThesisId}`);
    assert(response.ok, `Expected success, got status ${response.status}`);

    const data = await response.json();
    assert(Array.isArray(data.trades), 'Response should include trades array');
    data.trades.forEach((t: { thesisId: string }) => {
      assert(t.thesisId === createdThesisId, 'All trades should belong to thesis');
    });
    log(`Retrieved ${data.trades.length} trades for thesis`);
  });

  // Test 11: GET /api/trades/:id - Get single trade
  await test('GET /api/trades/:id - Get single trade', async () => {
    const response = await fetch(`${TRADES_API}/${createdTradeId}`);
    assert(response.ok, `Expected success, got status ${response.status}`);

    const trade = await response.json();
    assert(trade.id === createdTradeId, 'Trade ID should match');
    assert(trade.thesis, 'Should include thesis relation');
    log(`Retrieved trade: ${trade.description}`);
  });

  // Test 12: PATCH /api/trades/:id - Update trade
  await test('PATCH /api/trades/:id - Update trade', async () => {
    const response = await fetch(`${TRADES_API}/${createdTradeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        realizedPL: 250,
        status: 'CLOSED'
      })
    });

    assert(response.ok, `Expected success, got status ${response.status}`);

    const trade = await response.json();
    assert(trade.realizedPL === 250, 'Realized P/L should be updated');
    assert(trade.status === 'CLOSED', 'Status should be updated');
    assert(trade.closedAt, 'Closed date should be set');
    log('Trade updated successfully');
  });

  // Test 13: POST /api/theses/:id/updates - Add thesis update
  await test('POST /api/theses/:id/updates - Add thesis update', async () => {
    const response = await fetch(`${THESES_API}/${createdThesisId}/updates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'THESIS_STRENGTHENED',
        content: 'Earnings beat expectations, raising PT'
      })
    });

    assert(response.status === 201, `Expected status 201, got ${response.status}`);

    const update = await response.json();
    assert(update?.id, 'Response should include update ID');
    assert(update.type === 'THESIS_STRENGTHENED', 'Type should match');
    log(`Created update: ${update.id}`);
  });

  // Test 14: PATCH /api/theses/:id - Update thesis
  await test('PATCH /api/theses/:id - Update thesis', async () => {
    const response = await fetch(`${THESES_API}/${createdThesisId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test NVDA Bullish (Updated)'
      })
    });

    assert(response.ok, `Expected success, got status ${response.status}`);

    const thesis = await response.json();
    assert(thesis.name === 'Test NVDA Bullish (Updated)', 'Name should be updated');
    log('Thesis updated successfully');
  });

  // Test 15: POST /api/theses/:id/close - Close thesis
  await test('POST /api/theses/:id/close - Close thesis', async () => {
    const response = await fetch(`${THESES_API}/${createdThesisId}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        outcome: 'WIN',
        lessonsLearned: 'AI demand continues to drive growth'
      })
    });

    assert(response.ok, `Expected success, got status ${response.status}`);

    const thesis = await response.json();
    assert(thesis.status === 'CLOSED', 'Status should be CLOSED');
    assert(thesis.outcome === 'WIN', 'Outcome should match');
    assert(thesis.lessonsLearned, 'Lessons learned should be saved');
    assert(thesis.closedAt, 'Closed date should be set');
    log('Thesis closed successfully');
  });

  // Test 16: POST /api/theses/:id/close - Already closed error
  await test('POST /api/theses/:id/close - Already closed error', async () => {
    const response = await fetch(`${THESES_API}/${createdThesisId}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        outcome: 'LOSS'
      })
    });

    assert(response.status === 400, `Expected status 400, got ${response.status}`);
    const data = await response.json();
    assert(data.error, 'Should return error message');
    log('Already closed error returned correctly');
  });

  // Test 17: DELETE /api/trades/:id - Delete trade
  await test('DELETE /api/trades/:id - Delete trade', async () => {
    // Create a trade to delete
    const createResponse = await fetch(TRADES_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'ADD',
        description: 'Trade to delete',
        debitCredit: -100
      })
    });
    const newTrade = await createResponse.json();

    const response = await fetch(`${TRADES_API}/${newTrade.id}`, {
      method: 'DELETE'
    });

    assert(response.ok, `Expected success, got status ${response.status}`);
    const data = await response.json();
    assert(data.success === true, 'Should return success');
    log('Trade deleted successfully');
  });

  // Test 18: DELETE /api/theses/:id - Delete thesis
  await test('DELETE /api/theses/:id - Delete thesis', async () => {
    // Create a thesis to delete
    const createResponse = await fetch(THESES_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Thesis to delete',
        ticker: 'DEL',
        direction: 'BEARISH',
        originalThesis: 'Test deletion'
      })
    });
    const newThesis = await createResponse.json();

    const response = await fetch(`${THESES_API}/${newThesis.id}`, {
      method: 'DELETE'
    });

    assert(response.ok, `Expected success, got status ${response.status}`);
    const data = await response.json();
    assert(data.success === true, 'Should return success');
    log('Thesis deleted successfully');
  });

  // Cleanup
  console.log('\n--- Cleanup ---');
  await cleanup();
  log('Test data cleaned up');

  // Summary
  console.log('\n=================================');
  console.log('Test Summary');
  console.log('=================================');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
    process.exit(1);
  }

  await prisma.$disconnect();
}

runTests().catch(console.error);
