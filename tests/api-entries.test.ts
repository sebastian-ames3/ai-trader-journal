/**
 * Integration tests for Entry API routes
 * Run with: npx tsx tests/api-entries.test.ts
 *
 * Prerequisites:
 * - Database must be running and accessible
 * - Dev server must be running on localhost:3000
 */

import { prisma } from '../src/lib/prisma';

const API_BASE = 'http://localhost:3000/api/entries';

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
  // Delete all test entries (entries created in the last minute)
  const oneMinuteAgo = new Date(Date.now() - 60000);
  await prisma.entry.deleteMany({
    where: {
      createdAt: {
        gte: oneMinuteAgo
      }
    }
  });
}

// Test Suite
async function runTests() {
  console.log('\n=================================');
  console.log('Entry API Integration Tests');
  console.log('=================================');

  let createdEntryId: string;

  // Test 1: Database Connection
  await test('Database Connection', async () => {
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT 1 as value`;
    assert(Array.isArray(result), 'Database query should return an array');
    log('Database connected successfully');
  });

  // Test 2: POST /api/entries - Create entry
  await test('POST /api/entries - Create new entry', async () => {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'TRADE_IDEA',
        content: 'Test entry for integration tests',
        mood: 'CONFIDENT',
        conviction: 'HIGH',
        ticker: 'TEST'
      })
    });

    assert(response.status === 201, `Expected status 201, got ${response.status}`);

    const data = await response.json();
    assert(data.id, 'Response should include entry ID');
    assert(data.type === 'TRADE_IDEA', 'Entry type should match');
    assert(data.content === 'Test entry for integration tests', 'Content should match');
    assert(data.mood === 'CONFIDENT', 'Mood should match');
    assert(data.conviction === 'HIGH', 'Conviction should match');
    assert(data.ticker === 'TEST', 'Ticker should match');

    createdEntryId = data.id;
    log(`Created entry with ID: ${createdEntryId}`);
  });

  // Test 3: POST /api/entries - Validation (missing required fields)
  await test('POST /api/entries - Missing required fields', async () => {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Missing type and content
        mood: 'NEUTRAL'
      })
    });

    assert(response.status === 400, `Expected status 400, got ${response.status}`);

    const data = await response.json();
    assert(data.error, 'Response should include error message');
    log('Validation error returned correctly');
  });

  // Test 4: POST /api/entries - Invalid enum values
  await test('POST /api/entries - Invalid enum values', async () => {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'INVALID_TYPE',
        content: 'Test content'
      })
    });

    assert(response.status === 400, `Expected status 400, got ${response.status}`);

    const data = await response.json();
    assert(data.error, 'Response should include error message');
    log('Enum validation error returned correctly');
  });

  // Test 5: GET /api/entries - List all entries
  await test('GET /api/entries - List entries', async () => {
    const response = await fetch(API_BASE);

    assert(response.status === 200, `Expected status 200, got ${response.status}`);

    const data = await response.json();
    assert(Array.isArray(data), 'Response should be an array');
    assert(data.length > 0, 'Should have at least one entry');

    // Check that entries are sorted by createdAt desc
    if (data.length > 1) {
      const first = new Date(data[0].createdAt).getTime();
      const second = new Date(data[1].createdAt).getTime();
      assert(first >= second, 'Entries should be sorted by createdAt descending');
    }

    log(`Retrieved ${data.length} entries`);
  });

  // Test 6: GET /api/entries/[id] - Get specific entry
  await test('GET /api/entries/[id] - Get single entry', async () => {
    assert(createdEntryId, 'Created entry ID should be available');

    const response = await fetch(`${API_BASE}/${createdEntryId}`);

    assert(response.status === 200, `Expected status 200, got ${response.status}`);

    const data = await response.json();
    assert(data.id === createdEntryId, 'Entry ID should match');
    assert(data.type === 'TRADE_IDEA', 'Entry type should match');
    assert(data.content === 'Test entry for integration tests', 'Content should match');

    log(`Retrieved entry: ${data.id}`);
  });

  // Test 7: GET /api/entries/[id] - Non-existent entry
  await test('GET /api/entries/[id] - Non-existent entry', async () => {
    const fakeId = 'non-existent-id-12345';
    const response = await fetch(`${API_BASE}/${fakeId}`);

    assert(response.status === 404, `Expected status 404, got ${response.status}`);

    const data = await response.json();
    assert(data.error === 'Entry not found', 'Should return not found error');
    log('404 error returned correctly');
  });

  // Test 8: PUT /api/entries/[id] - Update entry
  await test('PUT /api/entries/[id] - Update entry', async () => {
    assert(createdEntryId, 'Created entry ID should be available');

    const response = await fetch(`${API_BASE}/${createdEntryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'Updated test content',
        mood: 'EXCITED',
        conviction: 'MEDIUM'
      })
    });

    assert(response.status === 200, `Expected status 200, got ${response.status}`);

    const data = await response.json();
    assert(data.id === createdEntryId, 'Entry ID should match');
    assert(data.content === 'Updated test content', 'Content should be updated');
    assert(data.mood === 'EXCITED', 'Mood should be updated');
    assert(data.conviction === 'MEDIUM', 'Conviction should be updated');

    log('Entry updated successfully');
  });

  // Test 9: PUT /api/entries/[id] - Invalid enum on update
  await test('PUT /api/entries/[id] - Invalid enum', async () => {
    assert(createdEntryId, 'Created entry ID should be available');

    const response = await fetch(`${API_BASE}/${createdEntryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mood: 'INVALID_MOOD'
      })
    });

    assert(response.status === 400, `Expected status 400, got ${response.status}`);

    const data = await response.json();
    assert(data.error, 'Response should include error message');
    log('Validation error returned correctly');
  });

  // Test 10: DELETE /api/entries/[id] - Delete entry
  await test('DELETE /api/entries/[id] - Delete entry', async () => {
    assert(createdEntryId, 'Created entry ID should be available');

    const response = await fetch(`${API_BASE}/${createdEntryId}`, {
      method: 'DELETE'
    });

    assert(response.status === 200, `Expected status 200, got ${response.status}`);

    const data = await response.json();
    assert(data.success === true, 'Response should indicate success');

    // Verify entry is deleted
    const getResponse = await fetch(`${API_BASE}/${createdEntryId}`);
    assert(getResponse.status === 404, 'Deleted entry should return 404');

    log('Entry deleted successfully');
  });

  // Test 11: DELETE /api/entries/[id] - Non-existent entry
  await test('DELETE /api/entries/[id] - Non-existent entry', async () => {
    const fakeId = 'non-existent-id-12345';
    const response = await fetch(`${API_BASE}/${fakeId}`, {
      method: 'DELETE'
    });

    assert(response.status === 404, `Expected status 404, got ${response.status}`);

    const data = await response.json();
    assert(data.error === 'Entry not found', 'Should return not found error');
    log('404 error returned correctly');
  });

  // Cleanup
  await cleanup();
  await prisma.$disconnect();

  // Summary
  console.log('\n=================================');
  console.log('Test Summary');
  console.log('=================================');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`\nTotal: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }

  console.log('\n=================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});
