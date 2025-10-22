/**
 * Integration Tests for Auto-Tagging Feature
 * Run with: npm run test:tags
 *
 * Prerequisites:
 * - Dev server running on localhost:3000
 * - OPENAI_API_KEY set in .env
 * - Database connection active
 */

import { config } from 'dotenv';
config();

const API_BASE = 'http://localhost:3000/api';

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

// Test Suite
async function runTests() {
  console.log('\n=================================');
  console.log('Auto-Tagging System Tests');
  console.log('=================================');

  let testEntryId: string;

  // Test 1: API Key Check
  await test('OpenAI API Key Configuration', async () => {
    assert(!!process.env.OPENAI_API_KEY, 'OPENAI_API_KEY must be set in .env');
    log('API key is configured');
  });

  // Test 2: Create test entry
  await test('Create Test Entry', async () => {
    const response = await fetch(`${API_BASE}/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'TRADE_IDEA',
        content: 'Looking at a bullish long call on AAPL. Market is showing strong upward momentum with high volatility. Did my technical analysis on the charts and the setup looks great. Feeling disciplined and patient about this trade. Risk is well-defined with my position sizing calculated.',
        mood: 'CONFIDENT',
        conviction: 'HIGH',
        ticker: 'AAPL'
      })
    });

    assert(response.ok, `Failed to create entry: ${response.status}`);
    const data = await response.json();
    testEntryId = data.id;
    assert(!!testEntryId, 'Entry ID should be returned');
    log(`Created entry: ${testEntryId}`);
  });

  // Test 3: AI analysis generates appropriate tags
  await test('AI Analysis Generates Tags', async () => {
    const response = await fetch(`${API_BASE}/entries/${testEntryId}/analyze`, {
      method: 'POST'
    });

    assert(response.ok, `Analysis failed: ${response.status}`);
    const data = await response.json();

    assert(Array.isArray(data.aiTags), 'aiTags should be an array');
    assert(data.aiTags.length > 0, 'Should generate at least one tag');
    assert(data.aiTags.length <= 7, 'Should generate at most 7 tags');

    log(`Generated ${data.aiTags.length} tags: ${data.aiTags.join(', ')}`);

    // Check for expected tags based on content
    const expectedTags = ['bullish', 'long-call', 'high-volatility', 'technical-analysis', 'disciplined', 'patient', 'defined-risk', 'position-sized'];
    const hasSomeExpectedTags = expectedTags.some(tag => data.aiTags.includes(tag));
    assert(hasSomeExpectedTags, `Expected at least one of: ${expectedTags.join(', ')}`);
  });

  // Test 4: Tags are persisted in database
  await test('Tags Persisted in Database', async () => {
    const response = await fetch(`${API_BASE}/entries/${testEntryId}`);
    assert(response.ok, `Failed to fetch entry: ${response.status}`);

    const data = await response.json();
    assert(Array.isArray(data.aiTags), 'aiTags should be an array');
    assert(data.aiTags.length > 0, 'Tags should be persisted');

    log(`Persisted tags: ${data.aiTags.join(', ')}`);
  });

  // Test 5: Filter entries by single AI tag
  await test('Filter Entries by Single Tag', async () => {
    // Get the tags from our test entry
    const entryResponse = await fetch(`${API_BASE}/entries/${testEntryId}`);
    const entryData = await entryResponse.json();

    assert(entryData.aiTags && entryData.aiTags.length > 0, 'Entry should have tags');

    const testTag = entryData.aiTags[0];
    log(`Filtering by tag: ${testTag}`);

    // Filter by that tag
    const filterResponse = await fetch(`${API_BASE}/entries?tag=${testTag}`);
    assert(filterResponse.ok, 'Filter request should succeed');

    const filterData = await filterResponse.json();
    assert(Array.isArray(filterData.entries), 'Should return entries array');

    // Our test entry should be in the results
    const foundEntry = filterData.entries.find((e: any) => e.id === testEntryId);
    assert(!!foundEntry, 'Test entry should be in filtered results');
    assert(foundEntry.aiTags.includes(testTag), 'Found entry should have the filtered tag');

    log(`Found ${filterData.entries.length} entries with tag "${testTag}"`);
  });

  // Test 6: Filter entries by multiple AI tags
  await test('Filter Entries by Multiple Tags', async () => {
    const entryResponse = await fetch(`${API_BASE}/entries/${testEntryId}`);
    const entryData = await entryResponse.json();

    if (entryData.aiTags && entryData.aiTags.length >= 2) {
      const tag1 = entryData.aiTags[0];
      const tag2 = entryData.aiTags[1];
      log(`Filtering by tags: ${tag1}, ${tag2}`);

      const filterResponse = await fetch(`${API_BASE}/entries?tag=${tag1},${tag2}`);
      assert(filterResponse.ok, 'Filter request should succeed');

      const filterData = await filterResponse.json();
      const foundEntry = filterData.entries.find((e: any) => e.id === testEntryId);

      assert(!!foundEntry, 'Test entry should be in filtered results');
      assert(foundEntry.aiTags.includes(tag1), `Entry should have tag: ${tag1}`);
      assert(foundEntry.aiTags.includes(tag2), `Entry should have tag: ${tag2}`);

      log(`Found ${filterData.entries.length} entries with both tags`);
    } else {
      log('Skipping multi-tag test (entry has < 2 tags)');
    }
  });

  // Test 7: Tags match defined taxonomy
  await test('Tags Match Defined Taxonomy', async () => {
    const response = await fetch(`${API_BASE}/entries/${testEntryId}`);
    const data = await response.json();

    const validTags = [
      // Trade Type/Strategy
      'long-call', 'long-put', 'options', 'spreads', 'covered-call', 'cash-secured-put',
      'vertical-spread', 'iron-condor', 'iron-butterfly', 'straddle', 'strangle',
      'wheel-strategy', 'earnings-play',
      // Market View
      'bullish', 'bearish', 'neutral', 'high-volatility', 'low-volatility',
      'trending', 'range-bound', 'uncertain-market',
      // Entry Catalyst
      'technical-analysis', 'chart-pattern', 'support-resistance', 'moving-average',
      'fundamental-analysis', 'news-catalyst', 'earnings', 'sector-rotation',
      'market-correlation', 'indicator-signal',
      // Psychological State
      'disciplined', 'patient', 'well-researched', 'emotional', 'rushed',
      'impulse-trade', 'overthinking', 'stressed', 'focused', 'distracted',
      'confident-execution', 'hesitant',
      // Risk Assessment
      'defined-risk', 'undefined-risk', 'position-sized', 'stop-loss-planned',
      'profit-target-set', 'risk-reward-favorable', 'hedged', 'concentrated-position',
      // Outcome Context
      'learning-experience', 'mistake-identified', 'good-process', 'bad-process', 'needs-review'
    ];

    if (data.aiTags && data.aiTags.length > 0) {
      data.aiTags.forEach((tag: string) => {
        assert(validTags.includes(tag), `Tag "${tag}" is not in the defined taxonomy`);
      });
      log('All tags are valid and from taxonomy');
    }
  });

  // Cleanup: Delete test entry
  await test('Cleanup Test Entry', async () => {
    if (testEntryId) {
      const response = await fetch(`${API_BASE}/entries/${testEntryId}`, {
        method: 'DELETE'
      });
      assert(response.ok, 'Failed to delete test entry');
      log('Test entry deleted');
    }
  });

  // Print summary
  console.log('\n=================================');
  console.log('Test Summary');
  console.log('=================================');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`\nTotal: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ❌ ${r.name}`);
      console.log(`     ${r.error}`);
    });
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});
