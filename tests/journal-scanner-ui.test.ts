/**
 * Integration tests for Journal Scanner OCR API routes
 * Run with: npx tsx tests/journal-scanner-ui.test.ts
 *
 * Prerequisites:
 * - Database must be running and accessible
 * - Dev server must be running on localhost:3000 or 3001
 *
 * Note: These tests verify API route behavior. Protected routes will return 401
 * for unauthenticated requests, which is expected behavior.
 */

import { prisma } from '../src/lib/prisma';

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

async function cleanup() {
  // Delete test entries created in the last minute
  const oneMinuteAgo = new Date(Date.now() - 60000);
  await prisma.entry.deleteMany({
    where: {
      createdAt: {
        gte: oneMinuteAgo,
      },
      content: {
        contains: 'TEST_OCR_',
      },
    },
  });
}

// Test Suite
async function runTests() {
  console.log('\n=================================');
  console.log('Journal Scanner OCR Integration Tests');
  console.log('=================================');

  // Test 1: Database Connection
  await test('Database Connection', async () => {
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT 1 as value`;
    assert(Array.isArray(result), 'Database query should return an array');
    log('Database connected successfully');
  });

  // Test 2: OCR API requires authentication
  await test('POST /api/journal/ocr - Requires authentication', async () => {
    const response = await fetch(`${API_BASE}/journal/ocr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    // Protected route should return 401 without auth
    assert(response.status === 401, `Expected status 401, got ${response.status}`);
    log('Auth protection working correctly');
  });

  // Test 3: Link Suggestions API requires authentication
  await test('POST /api/journal/link-suggestions - Requires authentication', async () => {
    const response = await fetch(`${API_BASE}/journal/link-suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tickers: ['AAPL'],
        date: new Date().toISOString(),
      }),
    });

    // Protected route should return 401 without auth
    assert(response.status === 401, `Expected status 401, got ${response.status}`);
    log('Auth protection working correctly');
  });

  // Test 4: Entries API requires authentication
  await test('POST /api/entries - Requires authentication', async () => {
    const response = await fetch(`${API_BASE}/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'OBSERVATION',
        content: 'Test entry',
      }),
    });

    // Protected route should return 401 without auth
    assert(response.status === 401, `Expected status 401, got ${response.status}`);
    log('Auth protection working correctly');
  });

  // Test 5: Validate OCR result function (unit test)
  await test('validateOCRResult - Low confidence warning', async () => {
    // Import the validation function directly
    const { validateOCRResult } = await import('../src/lib/journalOCR');

    const lowConfidenceResult = {
      content: 'Some transcribed text',
      date: new Date().toISOString(),
      tickers: ['AAPL'],
      mood: 'CONFIDENT' as const,
      sentiment: 'positive' as const,
      confidence: 0.45,
    };

    const validation = validateOCRResult(lowConfidenceResult);

    assert(validation.warnings.length > 0, 'Should have warnings for low confidence');
    assert(
      validation.warnings.some((w) => w.includes('Very low OCR confidence')),
      'Should warn about very low confidence'
    );
    log('Low confidence warning generated correctly');
  });

  // Test 6: Validate OCR result - Missing date warning
  await test('validateOCRResult - Missing date warning', async () => {
    const { validateOCRResult } = await import('../src/lib/journalOCR');

    const noDateResult = {
      content: 'Some transcribed text with enough content',
      date: null,
      tickers: ['AAPL'],
      mood: 'NEUTRAL' as const,
      sentiment: 'neutral' as const,
      confidence: 0.85,
    };

    const validation = validateOCRResult(noDateResult);

    assert(
      validation.warnings.some((w) => w.includes('No date detected')),
      'Should warn about missing date'
    );
    log('Missing date warning generated correctly');
  });

  // Test 7: Validate OCR result - No tickers warning
  await test('validateOCRResult - No tickers warning', async () => {
    const { validateOCRResult } = await import('../src/lib/journalOCR');

    const noTickersResult = {
      content: 'Some transcribed text with enough content',
      date: new Date().toISOString(),
      tickers: [],
      mood: 'NEUTRAL' as const,
      sentiment: 'neutral' as const,
      confidence: 0.85,
    };

    const validation = validateOCRResult(noTickersResult);

    assert(
      validation.warnings.some((w) => w.includes('No ticker symbols')),
      'Should warn about missing tickers'
    );
    log('Missing tickers warning generated correctly');
  });

  // Test 8: Validate OCR result - Valid result
  await test('validateOCRResult - Valid high confidence result', async () => {
    const { validateOCRResult } = await import('../src/lib/journalOCR');

    const validResult = {
      content: 'Good transcription with enough content here',
      date: new Date().toISOString(),
      tickers: ['AAPL', 'SPY'],
      mood: 'CONFIDENT' as const,
      sentiment: 'positive' as const,
      confidence: 0.92,
    };

    const validation = validateOCRResult(validResult);

    assert(validation.isValid === true, 'Should be valid');
    assert(validation.warnings.length === 0, 'Should have no warnings');
    log('High confidence result validated correctly');
  });

  // Test 9: Auto-linking - getLinkSuggestions with empty tickers
  await test('getLinkSuggestions - Empty tickers returns empty array', async () => {
    const { getLinkSuggestions } = await import('../src/lib/autoLinking');

    const suggestions = await getLinkSuggestions('test-user-id', {
      tickers: [],
      date: new Date(),
    });

    assert(Array.isArray(suggestions), 'Should return array');
    assert(suggestions.length === 0, 'Should return empty array for empty tickers');
    log('Empty tickers handled correctly');
  });

  // Test 10: Verify OCR API route exists
  await test('GET /api/journal/ocr - Route exists (returns 405 for GET)', async () => {
    const response = await fetch(`${API_BASE}/journal/ocr`, {
      method: 'GET',
    });

    // Route should exist but not allow GET (405) or require auth (401)
    assert(
      response.status === 405 || response.status === 401,
      `Expected 405 or 401, got ${response.status}`
    );
    log('OCR route exists');
  });

  // Test 11: Verify link-suggestions API route exists
  await test('GET /api/journal/link-suggestions - Route exists', async () => {
    const response = await fetch(`${API_BASE}/journal/link-suggestions`, {
      method: 'GET',
    });

    // Route should exist but not allow GET (405) or require auth (401)
    assert(
      response.status === 405 || response.status === 401,
      `Expected 405 or 401, got ${response.status}`
    );
    log('Link suggestions route exists');
  });

  // Cleanup
  await cleanup();
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
