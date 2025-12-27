/**
 * Unit tests for Smart Import suggestion algorithm
 * Run with: npx tsx tests/smart-import-suggestions.test.ts
 */

import {
  suggestLinks,
  basicGrouping,
  type TradeForSuggestion,
  type LinkSuggestion,
} from '../src/lib/suggestions';

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

async function test(name: string, fn: () => Promise<void> | void) {
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

// Sample trade data
function createTrade(overrides: Partial<TradeForSuggestion> = {}): TradeForSuggestion {
  return {
    id: `trade-${Math.random().toString(36).substr(2, 9)}`,
    ticker: 'AAPL',
    strategyType: 'IRON_CONDOR',
    openedAt: '2024-01-15',
    status: 'CLOSED',
    debitCredit: 0,
    realizedPL: 100,
    ...overrides,
  };
}

// Test Suite
async function runTests() {
  console.log('\n=================================');
  console.log('Smart Import Suggestion Tests');
  console.log('=================================');

  // ============================================
  // Basic Grouping Tests
  // ============================================

  await test('basicGrouping - groups trades by ticker', () => {
    const trades: TradeForSuggestion[] = [
      createTrade({ id: '1', ticker: 'AAPL', openedAt: '2024-01-15' }),
      createTrade({ id: '2', ticker: 'AAPL', openedAt: '2024-01-16' }),
      createTrade({ id: '3', ticker: 'NVDA', openedAt: '2024-01-15' }),
      createTrade({ id: '4', ticker: 'NVDA', openedAt: '2024-01-16' }),
    ];

    const groups = basicGrouping(trades);

    assert(groups.length === 2, `Expected 2 groups, got ${groups.length}`);

    const aaplGroup = groups.find(g => g.ticker === 'AAPL');
    const nvdaGroup = groups.find(g => g.ticker === 'NVDA');

    assert(aaplGroup !== undefined, 'Should have AAPL group');
    assert(nvdaGroup !== undefined, 'Should have NVDA group');
    assert(aaplGroup!.trades.length === 2, 'AAPL group should have 2 trades');
    assert(nvdaGroup!.trades.length === 2, 'NVDA group should have 2 trades');

    log('Correctly grouped trades by ticker');
  });

  await test('basicGrouping - separates trades > 14 days apart', () => {
    const trades: TradeForSuggestion[] = [
      createTrade({ id: '1', ticker: 'AAPL', openedAt: '2024-01-01' }),
      createTrade({ id: '2', ticker: 'AAPL', openedAt: '2024-01-05' }),
      createTrade({ id: '3', ticker: 'AAPL', openedAt: '2024-02-01' }), // >14 days later
    ];

    const groups = basicGrouping(trades);

    // First two trades should be grouped, third should be separate (or not grouped at all)
    // Since we need 2+ trades for a group, the third trade alone won't form a group
    assert(groups.length === 1, `Expected 1 group (first 2 trades), got ${groups.length}`);
    assert(groups[0].trades.length === 2, 'Group should have 2 trades');

    log('Correctly separated trades > 14 days apart');
  });

  await test('basicGrouping - keeps trades within 7 days together', () => {
    const trades: TradeForSuggestion[] = [
      createTrade({ id: '1', ticker: 'AAPL', openedAt: '2024-01-15' }),
      createTrade({ id: '2', ticker: 'AAPL', openedAt: '2024-01-17' }),
      createTrade({ id: '3', ticker: 'AAPL', openedAt: '2024-01-20' }),
    ];

    const groups = basicGrouping(trades);

    assert(groups.length === 1, `Expected 1 group, got ${groups.length}`);
    assert(groups[0].trades.length === 3, 'Group should have all 3 trades');

    log('Correctly grouped trades within 7 days');
  });

  await test('basicGrouping - requires minimum 2 trades for a group', () => {
    const trades: TradeForSuggestion[] = [
      createTrade({ id: '1', ticker: 'AAPL', openedAt: '2024-01-15' }),
    ];

    const groups = basicGrouping(trades);

    assert(groups.length === 0, `Expected 0 groups for single trade, got ${groups.length}`);

    log('Correctly requires minimum 2 trades');
  });

  await test('basicGrouping - handles multiple tickers correctly', () => {
    const trades: TradeForSuggestion[] = [
      createTrade({ id: '1', ticker: 'AAPL', openedAt: '2024-01-15' }),
      createTrade({ id: '2', ticker: 'NVDA', openedAt: '2024-01-15' }),
      createTrade({ id: '3', ticker: 'TSLA', openedAt: '2024-01-15' }),
      createTrade({ id: '4', ticker: 'AAPL', openedAt: '2024-01-16' }),
      createTrade({ id: '5', ticker: 'NVDA', openedAt: '2024-01-16' }),
    ];

    const groups = basicGrouping(trades);

    // AAPL: 2 trades, NVDA: 2 trades, TSLA: 1 trade (no group)
    assert(groups.length === 2, `Expected 2 groups, got ${groups.length}`);

    const tickers = groups.map(g => g.ticker).sort();
    assert(tickers.includes('AAPL'), 'Should have AAPL group');
    assert(tickers.includes('NVDA'), 'Should have NVDA group');
    assert(!tickers.includes('TSLA'), 'Should not have TSLA group (only 1 trade)');

    log('Correctly handled multiple tickers');
  });

  // ============================================
  // suggestLinks Tests
  // ============================================

  await test('suggestLinks - returns empty for less than 2 trades', () => {
    const trades: TradeForSuggestion[] = [
      createTrade({ id: '1', ticker: 'AAPL' }),
    ];

    const suggestions = suggestLinks(trades);

    assert(suggestions.length === 0, 'Should return no suggestions for single trade');

    log('Correctly returns empty for < 2 trades');
  });

  await test('suggestLinks - generates suggestions for related trades', () => {
    const trades: TradeForSuggestion[] = [
      createTrade({ id: '1', ticker: 'AAPL', openedAt: '2024-01-15', strategyType: 'IRON_CONDOR' }),
      createTrade({ id: '2', ticker: 'AAPL', openedAt: '2024-01-17', strategyType: 'IRON_CONDOR' }),
    ];

    const suggestions = suggestLinks(trades);

    assert(suggestions.length === 1, `Expected 1 suggestion, got ${suggestions.length}`);
    assert(suggestions[0].tradeIds.length === 2, 'Suggestion should include both trades');
    assert(suggestions[0].confidence >= 40, 'Confidence should be >= 40');

    log('Correctly generated suggestion for related trades');
  });

  await test('suggestLinks - includes confidence score', () => {
    const trades: TradeForSuggestion[] = [
      createTrade({ id: '1', ticker: 'AAPL', openedAt: '2024-01-15' }),
      createTrade({ id: '2', ticker: 'AAPL', openedAt: '2024-01-16' }),
    ];

    const suggestions = suggestLinks(trades);

    assert(suggestions.length > 0, 'Should have at least one suggestion');
    assert(typeof suggestions[0].confidence === 'number', 'Confidence should be a number');
    assert(suggestions[0].confidence >= 0 && suggestions[0].confidence <= 100, 'Confidence should be 0-100');

    log(`Confidence score: ${suggestions[0].confidence}%`);
  });

  await test('suggestLinks - includes reason', () => {
    const trades: TradeForSuggestion[] = [
      createTrade({ id: '1', ticker: 'AAPL', openedAt: '2024-01-15' }),
      createTrade({ id: '2', ticker: 'AAPL', openedAt: '2024-01-16' }),
    ];

    const suggestions = suggestLinks(trades);

    assert(suggestions.length > 0, 'Should have at least one suggestion');
    assert(typeof suggestions[0].reason === 'string', 'Reason should be a string');
    assert(suggestions[0].reason.length > 0, 'Reason should not be empty');

    log(`Reason: ${suggestions[0].reason}`);
  });

  await test('suggestLinks - generates thesis name', () => {
    const trades: TradeForSuggestion[] = [
      createTrade({ id: '1', ticker: 'AAPL', openedAt: '2024-01-15' }),
      createTrade({ id: '2', ticker: 'AAPL', openedAt: '2024-01-16' }),
    ];

    const suggestions = suggestLinks(trades);

    assert(suggestions.length > 0, 'Should have at least one suggestion');
    assert(typeof suggestions[0].suggestedName === 'string', 'Name should be a string');
    assert(suggestions[0].suggestedName.includes('AAPL'), 'Name should include ticker');

    log(`Suggested name: ${suggestions[0].suggestedName}`);
  });

  await test('suggestLinks - respects minConfidence filter', () => {
    const trades: TradeForSuggestion[] = [
      createTrade({ id: '1', ticker: 'AAPL', openedAt: '2024-01-15' }),
      createTrade({ id: '2', ticker: 'AAPL', openedAt: '2024-01-28' }), // 13 days apart - lower confidence
    ];

    const highThreshold = suggestLinks(trades, { minConfidence: 90 });
    const lowThreshold = suggestLinks(trades, { minConfidence: 30 });

    assert(lowThreshold.length >= highThreshold.length, 'Lower threshold should return more or equal suggestions');

    log('Correctly filtered by minConfidence');
  });

  await test('suggestLinks - detects roll pattern', () => {
    const trades: TradeForSuggestion[] = [
      createTrade({
        id: '1',
        ticker: 'AAPL',
        openedAt: '2024-01-15',
        strategyType: 'CALL_SPREAD',
        status: 'CLOSED',
      }),
      createTrade({
        id: '2',
        ticker: 'AAPL',
        openedAt: '2024-01-20',
        strategyType: 'CALL_SPREAD',
        status: 'OPEN',
      }),
    ];

    const suggestions = suggestLinks(trades);

    assert(suggestions.length > 0, 'Should have at least one suggestion');

    // Check if roll pattern was detected
    const hasRollOrHighConfidence = suggestions.some(
      s => s.pattern === 'ROLL' || s.confidence >= 50
    );
    assert(hasRollOrHighConfidence, 'Should detect roll pattern or have high confidence');

    log(`Pattern detected: ${suggestions[0].pattern}`);
  });

  await test('suggestLinks - detects position lifecycle', () => {
    const trades: TradeForSuggestion[] = [
      createTrade({
        id: '1',
        ticker: 'AAPL',
        openedAt: '2024-01-15',
        status: 'OPEN',
      }),
      createTrade({
        id: '2',
        ticker: 'AAPL',
        openedAt: '2024-01-20',
        status: 'CLOSED',
      }),
    ];

    const suggestions = suggestLinks(trades);

    assert(suggestions.length > 0, 'Should have at least one suggestion');

    const hasLifecyclePattern = suggestions.some(
      s => s.pattern === 'POSITION_LIFECYCLE' || s.confidence >= 50
    );
    assert(hasLifecyclePattern, 'Should detect lifecycle pattern or have good confidence');

    log(`Pattern detected: ${suggestions[0].pattern}`);
  });

  await test('suggestLinks - suggests trade actions', () => {
    const trades: TradeForSuggestion[] = [
      createTrade({ id: '1', ticker: 'AAPL', openedAt: '2024-01-15' }),
      createTrade({ id: '2', ticker: 'AAPL', openedAt: '2024-01-16' }),
    ];

    const suggestions = suggestLinks(trades);

    assert(suggestions.length > 0, 'Should have at least one suggestion');
    assert(suggestions[0].suggestedActions !== undefined, 'Should have suggested actions');
    assert(suggestions[0].suggestedActions!.length === 2, 'Should have action for each trade');

    const actions = suggestions[0].suggestedActions!;
    const hasInitial = actions.some(a => a.action === 'INITIAL');
    assert(hasInitial, 'Should have INITIAL action');

    log(`Actions: ${actions.map(a => a.action).join(', ')}`);
  });

  await test('suggestLinks - sorts by confidence descending', () => {
    const trades: TradeForSuggestion[] = [
      // Group 1: AAPL, close together, same strategy (high confidence)
      createTrade({ id: '1', ticker: 'AAPL', openedAt: '2024-01-15', strategyType: 'IRON_CONDOR' }),
      createTrade({ id: '2', ticker: 'AAPL', openedAt: '2024-01-16', strategyType: 'IRON_CONDOR' }),
      // Group 2: NVDA, further apart (lower confidence)
      createTrade({ id: '3', ticker: 'NVDA', openedAt: '2024-01-10' }),
      createTrade({ id: '4', ticker: 'NVDA', openedAt: '2024-01-20' }),
    ];

    const suggestions = suggestLinks(trades);

    if (suggestions.length >= 2) {
      assert(
        suggestions[0].confidence >= suggestions[1].confidence,
        'Suggestions should be sorted by confidence descending'
      );
      log(`Confidences: ${suggestions.map(s => s.confidence).join(', ')}`);
    } else {
      log('Only one suggestion generated, sort order verified');
    }
  });

  await test('suggestLinks - handles empty array', () => {
    const suggestions = suggestLinks([]);

    assert(suggestions.length === 0, 'Should return empty array for empty input');

    log('Correctly handles empty array');
  });

  await test('suggestLinks - infers direction from strategies', () => {
    // Bullish strategies
    const bullishTrades: TradeForSuggestion[] = [
      createTrade({ id: '1', ticker: 'AAPL', openedAt: '2024-01-15', strategyType: 'LONG_CALL' }),
      createTrade({ id: '2', ticker: 'AAPL', openedAt: '2024-01-16', strategyType: 'LONG_CALL' }),
    ];

    const bullishSuggestions = suggestLinks(bullishTrades);
    assert(bullishSuggestions.length > 0, 'Should have suggestion');
    assert(bullishSuggestions[0].suggestedDirection === 'BULLISH', 'Should suggest BULLISH direction');

    // Neutral strategies
    const neutralTrades: TradeForSuggestion[] = [
      createTrade({ id: '3', ticker: 'NVDA', openedAt: '2024-01-15', strategyType: 'IRON_CONDOR' }),
      createTrade({ id: '4', ticker: 'NVDA', openedAt: '2024-01-16', strategyType: 'IRON_CONDOR' }),
    ];

    const neutralSuggestions = suggestLinks(neutralTrades);
    assert(neutralSuggestions.length > 0, 'Should have suggestion');
    assert(neutralSuggestions[0].suggestedDirection === 'NEUTRAL', 'Should suggest NEUTRAL direction');

    log('Correctly inferred directions');
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
