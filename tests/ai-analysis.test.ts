/**
 * Integration tests for AI Text Analysis
 * Run with: npx tsx tests/ai-analysis.test.ts
 *
 * Prerequisites:
 * - ANTHROPIC_API_KEY must be set in .env (Claude for AI analysis)
 * - Database must be running and accessible
 * - Dev server must be running on localhost:3000
 */

// Load environment variables from .env file
import { config } from 'dotenv';
config();

import {
  analyzeEntryText,
  batchAnalyzeEntries,
  MIN_CONTENT_LENGTH_FOR_BIAS,
  HIGH_CONFIDENCE_THRESHOLD,
  SAFE_ANALYSIS_DEFAULTS,
  INSUFFICIENT_CONTENT_DEFAULTS,
} from '../src/lib/aiAnalysis';
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

// Test Suite
async function runTests() {
  console.log('\n=================================');
  console.log('AI Text Analysis Tests');
  console.log('=================================');

  let testEntryId: string;

  // Test 1: Anthropic API Key Check
  await test('Anthropic API Key Configuration', async () => {
    assert(!!process.env.ANTHROPIC_API_KEY, 'ANTHROPIC_API_KEY must be set in .env');
    log('API key is configured');
  });

  // Test 2: Basic Sentiment Analysis - Positive
  await test('Analyze Positive Sentiment Entry', async () => {
    const content = "I'm feeling really confident about this trade. Did thorough analysis and everything looks great. Market conditions are perfect.";

    const analysis = await analyzeEntryText(content, 'CONFIDENT', 'HIGH');

    assert(analysis.sentiment === 'positive', `Expected positive sentiment, got ${analysis.sentiment}`);
    assert(analysis.emotionalKeywords.length > 0, 'Should extract emotional keywords');
    assert(analysis.emotionalKeywords.some(k => k.toLowerCase().includes('confid')), 'Should detect confidence');
    assert(analysis.confidence > 0, 'Confidence score should be > 0');

    log(`Sentiment: ${analysis.sentiment}`);
    log(`Keywords: ${analysis.emotionalKeywords.join(', ')}`);
    log(`Confidence: ${analysis.confidence}`);
  });

  // Test 3: Basic Sentiment Analysis - Negative
  await test('Analyze Negative Sentiment Entry', async () => {
    const content = "I'm really nervous about this position. Market is volatile and I'm not sure if I should hold or cut losses. Feeling anxious.";

    const analysis = await analyzeEntryText(content, 'NERVOUS', 'LOW');

    assert(analysis.sentiment === 'negative', `Expected negative sentiment, got ${analysis.sentiment}`);
    assert(analysis.emotionalKeywords.length > 0, 'Should extract emotional keywords');
    assert(analysis.emotionalKeywords.some(k => k.toLowerCase().includes('nerv') || k.toLowerCase().includes('anxi')), 'Should detect nervousness/anxiety');

    log(`Sentiment: ${analysis.sentiment}`);
    log(`Keywords: ${analysis.emotionalKeywords.join(', ')}`);
  });

  // Test 4: Bias Detection - FOMO
  await test('Detect FOMO Bias', async () => {
    const content = "Everyone is making money on this move and I'm missing out. I need to get in now before it's too late!";

    const analysis = await analyzeEntryText(content);

    assert(analysis.detectedBiases.length > 0, 'Should detect biases');
    assert(analysis.detectedBiases.some(b => b.toLowerCase().includes('fomo')), 'Should detect FOMO bias');

    log(`Detected biases: ${analysis.detectedBiases.join(', ')}`);
  });

  // Test 5: Bias Detection - Revenge Trading
  await test('Detect Revenge Trading Bias', async () => {
    const content = "Lost money on that last trade. I need to make it back quickly. Going all-in on this next one to recover my losses.";

    const analysis = await analyzeEntryText(content);

    assert(analysis.detectedBiases.length > 0, 'Should detect biases');
    assert(analysis.detectedBiases.some(b => b.toLowerCase().includes('revenge')), 'Should detect revenge trading');

    log(`Detected biases: ${analysis.detectedBiases.join(', ')}`);
  });

  // Test 6: Conviction Level Inference
  await test('Infer High Conviction', async () => {
    const content = "I am absolutely certain this is the right play. All indicators align perfectly and I have no doubt about the outcome.";

    const analysis = await analyzeEntryText(content);

    assert(analysis.convictionInferred === 'HIGH', `Expected HIGH conviction, got ${analysis.convictionInferred}`);

    log(`Inferred conviction: ${analysis.convictionInferred}`);
  });

  // Test 7: Conviction Level Inference - Low
  await test('Infer Low Conviction', async () => {
    const content = "Maybe this could work? Not really sure. The setup looks okay but I'm uncertain about entry timing.";

    const analysis = await analyzeEntryText(content);

    assert(analysis.convictionInferred === 'LOW', `Expected LOW conviction, got ${analysis.convictionInferred}`);

    log(`Inferred conviction: ${analysis.convictionInferred}`);
  });

  // Test 8: API Endpoint - Analyze Single Entry
  await test('POST /api/entries/[id]/analyze', async () => {
    // First create a test entry
    const createResponse = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'TRADE_IDEA',
        content: 'Feeling very confident about selling puts on SPY. Market looks strong and IV is elevated.',
        mood: 'CONFIDENT',
        conviction: 'HIGH'
      })
    });

    assert(createResponse.ok, 'Failed to create test entry');
    const createData = await createResponse.json();
    testEntryId = createData.entry.id;

    // Now analyze it
    const analyzeResponse = await fetch(`${API_BASE}/${testEntryId}/analyze`, {
      method: 'POST'
    });

    assert(analyzeResponse.ok, `Analysis failed with status ${analyzeResponse.status}`);

    const analyzed = await analyzeResponse.json();
    assert(analyzed.sentiment !== null, 'Should have sentiment');
    assert(Array.isArray(analyzed.emotionalKeywords), 'Should have emotional keywords array');
    assert(Array.isArray(analyzed.detectedBiases), 'Should have detected biases array');

    log(`Entry analyzed: ${analyzed.id}`);
    log(`Sentiment: ${analyzed.sentiment}`);
    log(`Keywords: ${analyzed.emotionalKeywords.join(', ')}`);
  });

  // Test 9: Batch Analysis
  await test('Batch Analyze Multiple Entries', async () => {
    // Create 3 test entries
    const entries = await Promise.all([
      fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'REFLECTION',
          content: 'Good trade. Stayed disciplined and followed my plan.'
        })
      }),
      fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'OBSERVATION',
          content: 'Market feels uncertain today. Lots of choppy price action.'
        })
      }),
      fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'TRADE_IDEA',
          content: 'Missed this move completely. Should have acted faster!'
        })
      })
    ]);

    const entryData = await Promise.all(entries.map(r => r.json()));
    const entryIds = entryData.map(e => e.entry.id);

    // Batch analyze
    const batchResponse = await fetch(`${API_BASE}/analyze-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entryIds })
    });

    assert(batchResponse.ok, `Batch analysis failed with status ${batchResponse.status}`);

    const batchResult = await batchResponse.json();
    assert(batchResult.analyzed === 3, `Expected 3 analyzed, got ${batchResult.analyzed}`);
    assert(Array.isArray(batchResult.results), 'Results should be an array');

    log(`Batch analyzed ${batchResult.analyzed} entries`);

    // Cleanup
    await Promise.all(entryIds.map(id =>
      fetch(`${API_BASE}/${id}`, { method: 'DELETE' })
    ));
  });

  // ========================================
  // PRD 4 Phase D: Bias Detection Tuning Tests
  // ========================================

  // Test 10: Minimum Content Length Check
  await test('Short Content Returns Insufficient Content Response', async () => {
    const shortContent = 'Bought AAPL calls.'; // 18 chars

    assert(shortContent.length < MIN_CONTENT_LENGTH_FOR_BIAS,
      `Test content should be shorter than ${MIN_CONTENT_LENGTH_FOR_BIAS} chars`);

    const analysis = await analyzeEntryText(shortContent);

    assert(analysis.insufficientContent === true,
      'Should mark insufficientContent as true for short entries');
    assert(analysis.detectedBiases.length === 0,
      'Should not detect biases for short entries');
    assert(analysis.confidence === 0,
      'Should have zero confidence for insufficient content');

    log(`Content length: ${shortContent.length} chars`);
    log(`Insufficient content: ${analysis.insufficientContent}`);
  });

  // Test 11: Empty Content Check
  await test('Empty Content Returns Safe Defaults', async () => {
    const emptyContent = '';
    const whitespaceContent = '   \n\t   ';

    const emptyAnalysis = await analyzeEntryText(emptyContent);
    const whitespaceAnalysis = await analyzeEntryText(whitespaceContent);

    assert(emptyAnalysis.sentiment === 'neutral', 'Empty content should return neutral sentiment');
    assert(whitespaceAnalysis.sentiment === 'neutral', 'Whitespace content should return neutral sentiment');

    log('Empty and whitespace content handled correctly');
  });

  // Test 12: Bias Confidence Scores
  await test('Bias Detection Returns Confidence Scores', async () => {
    const content = `
      Everyone is making money on this move and I'm missing out completely!
      I need to get in NOW before it's too late. This is definitely going to
      keep running. The chart is so bullish and I'm certain it will hit new highs.
      I can feel it - this is the one that will make back all my losses.
    `.trim();

    assert(content.length >= MIN_CONTENT_LENGTH_FOR_BIAS,
      'Content should be long enough for analysis');

    const analysis = await analyzeEntryText(content);

    // Should have bias confidence scores
    assert(Array.isArray(analysis.biasConfidenceScores),
      'Should have biasConfidenceScores array');

    // Log all bias confidence scores for debugging
    log(`Bias confidence scores: ${JSON.stringify(analysis.biasConfidenceScores)}`);
    log(`High-confidence biases: ${analysis.detectedBiases.join(', ')}`);

    // The detectedBiases should only contain high-confidence biases
    if (analysis.biasConfidenceScores.length > 0) {
      const highConfBiases = analysis.biasConfidenceScores.filter(
        b => b.confidence >= HIGH_CONFIDENCE_THRESHOLD
      );
      assert(analysis.detectedBiases.length === highConfBiases.length,
        'detectedBiases should only include high-confidence biases');
    }
  });

  // Test 13: High Confidence Threshold Filtering
  await test('Only High Confidence Biases Are Shown', async () => {
    // Verify the threshold value
    assert(HIGH_CONFIDENCE_THRESHOLD === 0.7,
      'HIGH_CONFIDENCE_THRESHOLD should be 0.7');

    // Verify constants are exported correctly
    assert(MIN_CONTENT_LENGTH_FOR_BIAS === 50,
      'MIN_CONTENT_LENGTH_FOR_BIAS should be 50');

    log(`High confidence threshold: ${HIGH_CONFIDENCE_THRESHOLD}`);
    log(`Minimum content length: ${MIN_CONTENT_LENGTH_FOR_BIAS}`);
  });

  // Test 14: Insufficient Content Defaults Structure
  await test('Insufficient Content Defaults Have Correct Structure', async () => {
    assert(INSUFFICIENT_CONTENT_DEFAULTS.insufficientContent === true,
      'INSUFFICIENT_CONTENT_DEFAULTS.insufficientContent should be true');
    assert(Array.isArray(INSUFFICIENT_CONTENT_DEFAULTS.biasConfidenceScores),
      'Should have biasConfidenceScores array');
    assert(INSUFFICIENT_CONTENT_DEFAULTS.biasConfidenceScores.length === 0,
      'biasConfidenceScores should be empty');

    log('INSUFFICIENT_CONTENT_DEFAULTS structure is correct');
  });

  // Test 15: Safe Defaults Structure
  await test('Safe Analysis Defaults Have Correct Structure', async () => {
    assert(SAFE_ANALYSIS_DEFAULTS.insufficientContent === false,
      'SAFE_ANALYSIS_DEFAULTS.insufficientContent should be false');
    assert(Array.isArray(SAFE_ANALYSIS_DEFAULTS.biasConfidenceScores),
      'Should have biasConfidenceScores array');
    assert(SAFE_ANALYSIS_DEFAULTS.confidence === 0,
      'Default confidence should be 0');

    log('SAFE_ANALYSIS_DEFAULTS structure is correct');
  });

  // Cleanup test entry
  if (testEntryId) {
    await fetch(`${API_BASE}/${testEntryId}`, { method: 'DELETE' });
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
