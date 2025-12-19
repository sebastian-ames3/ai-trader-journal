/**
 * Integration tests for CSV Import API routes
 * Run with: npx tsx tests/csv-import.test.ts
 *
 * Prerequisites:
 * - Database must be running and accessible
 * - Dev server must be running on localhost:3000 or 3001
 *
 * Note: These tests verify API route behavior. Protected routes will return 401
 * for unauthenticated requests, which is expected behavior.
 */

import { prisma } from '../src/lib/prisma';
import {
  parseOptionStratCSV,
  parsePL,
  parseStrategy,
  mapToTradeAction,
  generateTradeDescription,
} from '../src/lib/csvImport';

// Try port 3001 first (common when 3000 is in use), fallback to 3000
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

// Sample OptionStrat CSV content for testing
const VALID_CSV = `Date,Symbol,Strategy,Legs,P/L,Status
2024-01-15,AAPL,Iron Condor,"175P/180P/190C/195C",+$245,Closed
2024-01-16,NVDA,Bull Put Spread,"100P/95P",-$150,Open
2024-01-17,SPY,Covered Call,"420C",$0,Open`;

const INVALID_CSV = `Date,Symbol
2024-01-15,AAPL`;

const EMPTY_CSV = `Date,Symbol,Strategy,Legs,P/L,Status`;

const MALFORMED_CSV = `Not,A,Valid,CSV
missing,data`;

// Test Suite
async function runTests() {
  console.log('\n=================================');
  console.log('CSV Import Integration Tests');
  console.log('=================================');

  // Test 1: Database Connection
  await test('Database Connection', async () => {
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT 1 as value`;
    assert(Array.isArray(result), 'Database query should return an array');
    log('Database connected successfully');
  });

  // Test 2: CSV Parser - Valid CSV
  await test('parseOptionStratCSV - Valid CSV parsing', async () => {
    const result = parseOptionStratCSV(VALID_CSV);

    assert(result.success === true, 'Should parse successfully');
    assert(result.trades.length === 3, `Expected 3 trades, got ${result.trades.length}`);
    assert(result.errors.length === 0, 'Should have no errors');

    // Verify first trade
    const firstTrade = result.trades[0];
    assert(firstTrade.symbol === 'AAPL', `Expected AAPL, got ${firstTrade.symbol}`);
    assert(firstTrade.strategyName === 'Iron Condor', `Expected Iron Condor, got ${firstTrade.strategyName}`);
    assert(firstTrade.realizedPL === 245, `Expected 245, got ${firstTrade.realizedPL}`);
    assert(firstTrade.status === 'CLOSED', `Expected CLOSED, got ${firstTrade.status}`);
    assert(firstTrade.isValid === true, 'Trade should be valid');

    log(`Parsed ${result.trades.length} trades successfully`);
  });

  // Test 3: CSV Parser - Missing required columns
  await test('parseOptionStratCSV - Missing required columns', async () => {
    const result = parseOptionStratCSV(INVALID_CSV);

    assert(result.success === false, 'Should fail with missing columns');
    assert(result.errors.some((e) => e.includes('Missing required columns')), 'Should report missing columns');

    log('Missing columns detected correctly');
  });

  // Test 4: CSV Parser - Empty CSV (headers only)
  await test('parseOptionStratCSV - Empty CSV', async () => {
    const result = parseOptionStratCSV(EMPTY_CSV);

    assert(result.success === true, 'Should parse successfully');
    assert(result.trades.length === 0, 'Should have no trades');

    log('Empty CSV handled correctly');
  });

  // Test 5: CSV Parser - P/L parsing
  await test('parsePL - Various P/L formats', async () => {
    assert(parsePL('+$245') === 245, 'Should parse +$245');
    assert(parsePL('-$150') === -150, 'Should parse -$150');
    assert(parsePL('$0') === 0, 'Should parse $0');
    assert(parsePL('1,245.50') === 1245.50, 'Should parse 1,245.50');
    assert(parsePL('') === null, 'Should return null for empty string');
    assert(parsePL('N/A') === null, 'Should return null for invalid string');

    log('P/L parsing works correctly');
  });

  // Test 6: CSV Parser - Strategy type mapping
  await test('parseStrategy - Strategy type mapping', async () => {
    const ironCondor = parseStrategy('Iron Condor');
    assert(ironCondor.strategyType === 'IRON_CONDOR', `Expected IRON_CONDOR, got ${ironCondor.strategyType}`);

    const bullPut = parseStrategy('Bull Put Spread');
    assert(bullPut.strategyType === 'PUT_SPREAD', `Expected PUT_SPREAD, got ${bullPut.strategyType}`);

    const coveredCall = parseStrategy('Covered Call');
    assert(coveredCall.strategyType === 'COVERED_CALL', `Expected COVERED_CALL, got ${coveredCall.strategyType}`);

    const unknown = parseStrategy('Unknown Strategy XYZ');
    assert(unknown.strategyType === null, 'Unknown strategy should return null');

    log('Strategy type mapping works correctly');
  });

  // Test 7: CSV Parser - Duplicate detection
  await test('parseOptionStratCSV - Duplicate detection', async () => {
    const csvWithDuplicates = `Date,Symbol,Strategy,Legs,P/L,Status
2024-01-15,AAPL,Iron Condor,"175P/180P",+$100,Closed
2024-01-15,AAPL,Iron Condor,"175P/180P",+$100,Closed
2024-01-16,NVDA,Straddle,"",+$50,Open`;

    const result = parseOptionStratCSV(csvWithDuplicates);

    assert(result.success === true, 'Should parse successfully');
    assert(result.summary.duplicates >= 1, 'Should detect at least 1 duplicate');

    const duplicateTrade = result.trades.find((t) => t.isDuplicate);
    assert(duplicateTrade !== undefined, 'Should mark duplicate trade');

    log(`Detected ${result.summary.duplicates} duplicates`);
  });

  // Test 8: Trade action mapping
  await test('mapToTradeAction - Status to action mapping', async () => {
    const { ThesisTradeStatus, TradeAction } = await import('@prisma/client');

    const closeAction = mapToTradeAction(ThesisTradeStatus.CLOSED);
    assert(closeAction === TradeAction.CLOSE, `Expected CLOSE for CLOSED status, got ${closeAction}`);

    const initialAction = mapToTradeAction(ThesisTradeStatus.OPEN);
    assert(initialAction === TradeAction.INITIAL, `Expected INITIAL for OPEN status, got ${initialAction}`);

    log('Trade action mapping works correctly');
  });

  // Test 9: Trade description generation
  await test('generateTradeDescription - Description generation', async () => {
    const trade = {
      id: 'test-1',
      date: new Date(),
      symbol: 'AAPL',
      strategyType: 'IRON_CONDOR' as const,
      strategyName: 'Iron Condor',
      legs: '175P/180P/190C/195C',
      realizedPL: 245,
      status: 'CLOSED' as const,
      rawRow: {} as any,
      warnings: [],
      isValid: true,
    };

    const description = generateTradeDescription(trade);

    assert(description.includes('Iron Condor'), 'Description should include strategy name');
    assert(description.includes('175P/180P'), 'Description should include legs');
    assert(description.includes('+$245'), 'Description should include P/L');

    log('Trade description generated correctly');
  });

  // Test 10: Upload API requires authentication
  await test('POST /api/import/csv/upload - Requires authentication', async () => {
    const response = await fetch(`${API_BASE}/import/csv/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvContent: VALID_CSV }),
    });

    // Protected route should return 401 without auth
    assert(response.status === 401, `Expected status 401, got ${response.status}`);
    log('Auth protection working correctly');
  });

  // Test 11: Confirm API requires authentication
  await test('POST /api/import/csv/confirm - Requires authentication', async () => {
    const response = await fetch(`${API_BASE}/import/csv/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batchId: 'test-batch-id',
        trades: [{ tradeId: 'test-trade', thesisId: 'test-thesis' }],
      }),
    });

    // Protected route should return 401 without auth
    assert(response.status === 401, `Expected status 401, got ${response.status}`);
    log('Auth protection working correctly');
  });

  // Test 12: Upload API route exists
  await test('GET /api/import/csv/upload - Route exists (returns 405 for GET)', async () => {
    const response = await fetch(`${API_BASE}/import/csv/upload`, {
      method: 'GET',
    });

    // Route should exist but not allow GET (405) or require auth (401)
    assert(
      response.status === 405 || response.status === 401,
      `Expected 405 or 401, got ${response.status}`
    );
    log('Upload route exists');
  });

  // Test 13: Confirm API route exists
  await test('GET /api/import/csv/confirm - Route exists', async () => {
    const response = await fetch(`${API_BASE}/import/csv/confirm`, {
      method: 'GET',
    });

    // Route should exist but not allow GET (405) or require auth (401)
    assert(
      response.status === 405 || response.status === 401,
      `Expected 405 or 401, got ${response.status}`
    );
    log('Confirm route exists');
  });

  // Test 14: CSV date parsing
  await test('parseOptionStratCSV - Date format handling', async () => {
    const csvWithDates = `Date,Symbol,Strategy,Legs,P/L,Status
2024-01-15,AAPL,Iron Condor,"",+$100,Closed
01/16/2024,NVDA,Straddle,"",+$50,Open`;

    const result = parseOptionStratCSV(csvWithDates);

    assert(result.success === true, 'Should parse successfully');

    const firstTrade = result.trades[0];
    assert(firstTrade.date instanceof Date, 'Date should be parsed as Date object');
    assert(firstTrade.date.getFullYear() === 2024, 'Year should be 2024');

    log('Date parsing works correctly');
  });

  // Test 15: Strategy type normalization
  await test('parseOptionStratCSV - Strategy normalization', async () => {
    const csvWithStrategies = `Date,Symbol,Strategy,Legs,P/L,Status
2024-01-15,AAPL,IRON CONDOR,"",+$100,Closed
2024-01-16,NVDA,iron condor,"",+$50,Open
2024-01-17,SPY,Iron Condor,"",+$75,Open`;

    const result = parseOptionStratCSV(csvWithStrategies);

    assert(result.success === true, 'Should parse successfully');

    // All should be recognized as IRON_CONDOR regardless of case
    result.trades.forEach((trade, index) => {
      assert(
        trade.strategyType === 'IRON_CONDOR',
        `Trade ${index + 1}: Expected IRON_CONDOR, got ${trade.strategyType}`
      );
    });

    log('Strategy normalization works correctly');
  });

  // Cleanup
  await prisma.$disconnect();

  // Summary
  console.log('\n=================================');
  console.log('Test Summary');
  console.log('=================================');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`\nTotal: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed tests:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
  }

  console.log('\n=================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});
