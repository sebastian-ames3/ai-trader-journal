/**
 * Integration tests for Weekly Insights
 * Run with: npx tsx tests/weekly-insights.test.ts
 *
 * Prerequisites:
 * - Database must be running and accessible
 * - Dev server must be running on localhost:3000
 */

// Load environment variables from .env file
import { config } from 'dotenv';
config();

import { generateWeeklyInsights } from '../src/lib/weeklyInsights';
import { prisma } from '../src/lib/prisma';

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
  console.log('Weekly Insights Tests');
  console.log('=================================');

  const testEntryIds: string[] = [];

  // Test 1: Generate insights with no data
  await test('Generate insights for empty week', async () => {
    // Use a week from the future with no data
    const insights = await generateWeeklyInsights(-100);

    assert(insights !== null, 'Should return insights object');
    assert(insights.stats.totalEntries === 0, 'Should have 0 entries');
    assert(insights.insights.length > 0, 'Should have at least one insight message');
    assert(insights.insights[0].includes('No journal entries'), 'Should suggest to start journaling');

    log(`Week: ${insights.weekStart} - ${insights.weekEnd}`);
    log(`Insights: ${insights.insights[0]}`);
  });

  // Test 2: Create sample entries for current week
  await test('Create sample entries for testing', async () => {
    const sampleEntries = [
      {
        type: 'TRADE_IDEA',
        content: 'Feeling very confident about this setup. The chart looks perfect and all my indicators align.',
        mood: 'CONFIDENT',
        conviction: 'HIGH',
        sentiment: 'positive',
        emotionalKeywords: ['confident', 'perfect'],
        detectedBiases: []
      },
      {
        type: 'REFLECTION',
        content: 'I made a mistake by entering too early. Feeling frustrated and disappointed.',
        mood: 'FRUSTRATED',
        conviction: 'MEDIUM',
        sentiment: 'negative',
        emotionalKeywords: ['frustrated', 'disappointed'],
        detectedBiases: ['loss_aversion']
      },
      {
        type: 'OBSERVATION',
        content: 'Market seems uncertain today. Maybe I should wait for a better opportunity.',
        mood: 'UNCERTAIN',
        conviction: 'LOW',
        sentiment: 'neutral',
        emotionalKeywords: ['uncertain'],
        detectedBiases: []
      },
      {
        type: 'TRADE',
        content: 'Everyone is buying this stock and I feel like I am missing out. Need to get in now!',
        mood: 'ANXIOUS',
        conviction: 'MEDIUM',
        sentiment: 'negative',
        emotionalKeywords: ['anxious', 'FOMO'],
        detectedBiases: ['fomo', 'herd_mentality']
      },
      {
        type: 'TRADE_IDEA',
        content: 'Lost on my last trade. Going to double down on this one to make it back quickly.',
        mood: 'FRUSTRATED',
        conviction: 'HIGH',
        sentiment: 'negative',
        emotionalKeywords: ['frustrated'],
        detectedBiases: ['revenge_trading']
      }
    ];

    for (const entry of sampleEntries) {
      const created = await prisma.entry.create({
        data: entry
      });
      testEntryIds.push(created.id);
    }

    assert(testEntryIds.length === 5, `Expected 5 entries, created ${testEntryIds.length}`);
    log(`Created ${testEntryIds.length} test entries`);
  });

  // Test 3: Generate insights for current week with data
  await test('Generate insights for current week', async () => {
    const insights = await generateWeeklyInsights(0);

    assert(insights !== null, 'Should return insights object');
    assert(insights.stats.totalEntries >= 5, `Should have at least 5 entries, got ${insights.stats.totalEntries}`);

    log(`Total entries: ${insights.stats.totalEntries}`);
    log(`Trade ideas: ${insights.stats.tradeIdeas}`);
    log(`Reflections: ${insights.stats.reflections}`);
    log(`Observations: ${insights.stats.observations}`);
  });

  // Test 4: Verify emotional analysis
  await test('Analyze emotional trends', async () => {
    const insights = await generateWeeklyInsights(0);

    assert(insights.emotional.dominantSentiment !== null, 'Should have dominant sentiment');
    assert(insights.emotional.sentimentBreakdown.positive >= 0, 'Should have positive count');
    assert(insights.emotional.sentimentBreakdown.negative >= 0, 'Should have negative count');
    assert(insights.emotional.sentimentBreakdown.neutral >= 0, 'Should have neutral count');

    log(`Dominant sentiment: ${insights.emotional.dominantSentiment}`);
    log(`Positive: ${insights.emotional.sentimentBreakdown.positive}`);
    log(`Negative: ${insights.emotional.sentimentBreakdown.negative}`);
    log(`Neutral: ${insights.emotional.sentimentBreakdown.neutral}`);

    if (insights.emotional.topEmotions.length > 0) {
      log(`Top emotion: ${insights.emotional.topEmotions[0].emotion} (${insights.emotional.topEmotions[0].count}x)`);
    }
  });

  // Test 5: Verify pattern detection
  await test('Detect cognitive patterns', async () => {
    const insights = await generateWeeklyInsights(0);

    assert(insights.patterns.detectedBiases.length > 0, 'Should detect some biases');
    assert(insights.patterns.convictionDistribution.high >= 0, 'Should have high conviction count');
    assert(insights.patterns.convictionDistribution.medium >= 0, 'Should have medium conviction count');
    assert(insights.patterns.convictionDistribution.low >= 0, 'Should have low conviction count');

    log(`Detected biases: ${insights.patterns.detectedBiases.length}`);
    insights.patterns.detectedBiases.forEach(bias => {
      log(`  - ${bias.bias}: ${bias.count}x`);
    });

    log(`Conviction - High: ${insights.patterns.convictionDistribution.high}, Medium: ${insights.patterns.convictionDistribution.medium}, Low: ${insights.patterns.convictionDistribution.low}`);
  });

  // Test 6: Verify personalized insights
  await test('Generate personalized insights', async () => {
    const insights = await generateWeeklyInsights(0);

    assert(insights.insights.length > 0, 'Should have at least one insight');
    assert(typeof insights.insights[0] === 'string', 'Insights should be strings');

    log(`Generated ${insights.insights.length} insights:`);
    insights.insights.forEach((insight, i) => {
      log(`  ${i + 1}. ${insight}`);
    });
  });

  // Test 7: API endpoint - GET /api/insights/weekly
  await test('GET /api/insights/weekly (current week)', async () => {
    const response = await fetch(`${API_BASE}/insights/weekly?week=0`);

    assert(response.ok, `Request failed with status ${response.status}`);

    const data = await response.json();
    assert(data.weekStart !== undefined, 'Should have weekStart');
    assert(data.weekEnd !== undefined, 'Should have weekEnd');
    assert(data.stats !== undefined, 'Should have stats');
    assert(data.emotional !== undefined, 'Should have emotional');
    assert(data.patterns !== undefined, 'Should have patterns');
    assert(data.insights !== undefined, 'Should have insights');

    log(`Week: ${data.weekStart} - ${data.weekEnd}`);
    log(`Total entries: ${data.stats.totalEntries}`);
  });

  // Test 8: API endpoint - GET /api/insights/weekly (last week)
  await test('GET /api/insights/weekly (last week)', async () => {
    const response = await fetch(`${API_BASE}/insights/weekly?week=-1`);

    assert(response.ok, `Request failed with status ${response.status}`);

    const data = await response.json();
    assert(data.weekStart !== undefined, 'Should have weekStart');
    assert(data.weekEnd !== undefined, 'Should have weekEnd');

    log(`Week: ${data.weekStart} - ${data.weekEnd}`);
  });

  // Test 9: API endpoint - Invalid week parameter
  await test('GET /api/insights/weekly (invalid week)', async () => {
    const response = await fetch(`${API_BASE}/insights/weekly?week=100`);

    assert(!response.ok, 'Should reject future week offset');
    assert(response.status === 400, `Expected 400, got ${response.status}`);

    const data = await response.json();
    assert(data.error !== undefined, 'Should have error message');

    log(`Error message: ${data.error}`);
  });

  // Test 10: Verify week-over-week comparison
  await test('Verify week-over-week comparison', async () => {
    const insights = await generateWeeklyInsights(0);

    // Only current week (offset 0) should have comparison
    if (insights.comparison) {
      assert(typeof insights.comparison.entriesChange === 'number', 'Should have entries change percentage');
      assert(['improving', 'declining', 'stable'].includes(insights.comparison.sentimentChange),
        `Invalid sentiment change: ${insights.comparison.sentimentChange}`);
      assert(Array.isArray(insights.comparison.newBiases), 'Should have new biases array');

      log(`Entries change: ${insights.comparison.entriesChange}%`);
      log(`Sentiment trend: ${insights.comparison.sentimentChange}`);
      log(`New biases: ${insights.comparison.newBiases.length}`);
    } else {
      log('No comparison available (expected for historical weeks)');
    }
  });

  // Cleanup test entries
  if (testEntryIds.length > 0) {
    log('\nCleaning up test entries...');
    await prisma.entry.deleteMany({
      where: {
        id: { in: testEntryIds }
      }
    });
    log(`Deleted ${testEntryIds.length} test entries`);
  }

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
