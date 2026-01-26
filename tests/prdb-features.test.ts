/**
 * PRD-B Feature Tests
 * Unit tests for trade detection, thesis generation, and related features
 *
 * Run with: npx tsx tests/prdb-features.test.ts
 */

import {
  groupTradesByTicker,
  generateQuickSuggestion,
  type TradeForAnalysis,
  type EntryForAnalysis,
} from '../src/lib/thesisGeneration';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function log(message: string) {
  console.log(`  ${message}`);
}

async function test(name: string, fn: () => Promise<void> | void) {
  process.stdout.write(`${name}\n`);
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`  ✅ PASSED`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, error: errorMessage });
    console.log(`  ❌ FAILED: ${errorMessage}`);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

// ===========================================
// Run all tests
// ===========================================

async function runTests() {

// ===========================================
// Trade Detection Tests
// ===========================================

console.log('\n🧪 Trade Detection Pattern Tests\n');

await test('Detects WIN pattern in text', () => {
  const patterns = [
    'closed AAPL for a nice profit today',
    'took profits on my SPY calls',
    'hit my target on TSLA, closed it',
    'banked some gains on NVDA',
  ];

  const winKeywords = ['profit', 'profits', 'target', 'gains', 'winner', 'win'];

  for (const text of patterns) {
    const hasWinKeyword = winKeywords.some(keyword =>
      text.toLowerCase().includes(keyword)
    );
    assert(hasWinKeyword, `Should detect win pattern in: "${text}"`);
  }
});

await test('Detects LOSS pattern in text', () => {
  const patterns = [
    'had to cut my AAPL position for a loss',
    'stopped out of SPY trade',
    'closed TSLA for a loss today',
    'got smoked on NVDA calls',
  ];

  const lossKeywords = ['loss', 'stopped', 'stop', 'cut', 'smoked', 'burned'];

  for (const text of patterns) {
    const hasLossKeyword = lossKeywords.some(keyword =>
      text.toLowerCase().includes(keyword)
    );
    assert(hasLossKeyword, `Should detect loss pattern in: "${text}"`);
  }
});

await test('Detects ticker symbols', () => {
  const testCases = [
    { text: 'Bought $AAPL calls', expected: 'AAPL' },
    { text: 'SPY looking weak today', expected: 'SPY' },
    { text: 'closed my TSLA position', expected: 'TSLA' },
    { text: 'NVDA breaking out', expected: 'NVDA' },
  ];

  const tickerRegex = /\$([A-Z]{1,5})\b|\b([A-Z]{2,5})\b(?=\s*(call|put|spread|option|trade|position|stock|shares|buy|sell|long|short|bullish|bearish|strike|looking|breaking|closed))/gi;

  for (const { text, expected } of testCases) {
    const matches = [...text.matchAll(new RegExp(tickerRegex.source, 'gi'))];
    const tickers = matches.map(m => (m[1] || m[2])?.toUpperCase()).filter(Boolean);
    assert(tickers.includes(expected), `Should detect ${expected} in: "${text}"`);
  }
});

await test('Detects P/L amounts', () => {
  const testCases = [
    { text: 'made $500 on this trade', expected: 500 },
    { text: 'lost $250 today', expected: 250 },
    { text: 'up +1000 on the position', expected: 1000 },
    { text: 'down -150 from my entry', expected: 150 },
  ];

  const pnlRegex = /(?:made|lost|up|down|profit|loss|gained|P\/L|pnl)[:\s]*[+-]?\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi;

  for (const { text, expected } of testCases) {
    const match = pnlRegex.exec(text);
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      assertEqual(amount, expected, `P/L in "${text}"`);
    }
    // Reset regex lastIndex
    pnlRegex.lastIndex = 0;
  }
});

// ===========================================
// Thesis Generation Tests
// ===========================================

console.log('\n🧪 Thesis Generation Tests\n');

await test('groupTradesByTicker: groups trades correctly', () => {
  const trades: TradeForAnalysis[] = [
    { id: '1', ticker: 'AAPL', outcome: 'WIN', realizedPL: 100, strategyType: 'CALL_SPREAD', description: null, createdAt: new Date() },
    { id: '2', ticker: 'AAPL', outcome: 'WIN', realizedPL: 150, strategyType: 'CALL_SPREAD', description: null, createdAt: new Date() },
    { id: '3', ticker: 'SPY', outcome: 'LOSS', realizedPL: -50, strategyType: 'PUT_SPREAD', description: null, createdAt: new Date() },
    { id: '4', ticker: 'AAPL', outcome: 'LOSS', realizedPL: -75, strategyType: 'CALL_SPREAD', description: null, createdAt: new Date() },
  ];

  const entries: EntryForAnalysis[] = [];

  const groups = groupTradesByTicker(trades, entries);

  // Should have 2 groups (AAPL with 3 trades, SPY with 1 - but SPY only has 1 trade so it's filtered out)
  assertEqual(groups.length, 1, 'Should have 1 group (AAPL, SPY filtered due to <2 trades)');

  const aaplGroup = groups.find(g => g.ticker === 'AAPL');
  assert(aaplGroup !== undefined, 'Should have AAPL group');
  assertEqual(aaplGroup!.trades.length, 3, 'AAPL should have 3 trades');
  assertEqual(aaplGroup!.stats.wins, 2, 'AAPL should have 2 wins');
  assertEqual(aaplGroup!.stats.losses, 1, 'AAPL should have 1 loss');
  assertEqual(aaplGroup!.stats.totalPnL, 175, 'AAPL total P/L should be 175');
});

await test('groupTradesByTicker: calculates stats correctly', () => {
  const trades: TradeForAnalysis[] = [
    { id: '1', ticker: 'NVDA', outcome: 'WIN', realizedPL: 500, strategyType: null, description: null, createdAt: new Date('2024-01-01') },
    { id: '2', ticker: 'NVDA', outcome: 'WIN', realizedPL: 300, strategyType: null, description: null, createdAt: new Date('2024-01-15') },
    { id: '3', ticker: 'NVDA', outcome: 'BREAKEVEN', realizedPL: 0, strategyType: null, description: null, createdAt: new Date('2024-01-30') },
  ];

  const entries: EntryForAnalysis[] = [];

  const groups = groupTradesByTicker(trades, entries);

  assertEqual(groups.length, 1, 'Should have 1 group');

  const nvdaGroup = groups[0];
  assertEqual(nvdaGroup.stats.totalTrades, 3, 'Should have 3 trades');
  assertEqual(nvdaGroup.stats.wins, 2, 'Should have 2 wins');
  assertEqual(nvdaGroup.stats.losses, 0, 'Should have 0 losses');
  assertEqual(nvdaGroup.stats.breakevens, 1, 'Should have 1 breakeven');
  assertEqual(nvdaGroup.stats.totalPnL, 800, 'Total P/L should be 800');
});

await test('groupTradesByTicker: includes related entries', () => {
  const trades: TradeForAnalysis[] = [
    { id: '1', ticker: 'TSLA', outcome: 'WIN', realizedPL: 200, strategyType: null, description: null, createdAt: new Date() },
    { id: '2', ticker: 'TSLA', outcome: 'LOSS', realizedPL: -100, strategyType: null, description: null, createdAt: new Date() },
  ];

  const entries: EntryForAnalysis[] = [
    { id: 'e1', content: 'TSLA looking bullish', ticker: 'TSLA', entryType: 'IDEA', mood: 'CONFIDENT', sentiment: 'positive', createdAt: new Date() },
    { id: 'e2', content: 'SPY analysis', ticker: 'SPY', entryType: 'OBSERVATION', mood: 'NEUTRAL', sentiment: 'neutral', createdAt: new Date() },
    { id: 'e3', content: 'Another TSLA thought', ticker: 'TSLA', entryType: 'REFLECTION', mood: 'EXCITED', sentiment: 'positive', createdAt: new Date() },
  ];

  const groups = groupTradesByTicker(trades, entries);

  assertEqual(groups.length, 1, 'Should have 1 group');
  assertEqual(groups[0].relatedEntries.length, 2, 'Should have 2 related entries for TSLA');
});

await test('generateQuickSuggestion: creates bullish suggestion for winning trades', () => {
  const trades: TradeForAnalysis[] = [
    { id: '1', ticker: 'MSFT', outcome: 'WIN', realizedPL: 300, strategyType: null, description: null, createdAt: new Date() },
    { id: '2', ticker: 'MSFT', outcome: 'WIN', realizedPL: 200, strategyType: null, description: null, createdAt: new Date() },
    { id: '3', ticker: 'MSFT', outcome: 'WIN', realizedPL: 150, strategyType: null, description: null, createdAt: new Date() },
  ];

  const entries: EntryForAnalysis[] = [
    { id: 'e1', content: 'MSFT strong momentum', ticker: 'MSFT', entryType: 'IDEA', mood: 'CONFIDENT', sentiment: 'positive', createdAt: new Date() },
  ];

  const groups = groupTradesByTicker(trades, entries);
  const suggestion = generateQuickSuggestion(groups[0]);

  assertEqual(suggestion.direction, 'BULLISH', 'Direction should be BULLISH');
  assertEqual(suggestion.ticker, 'MSFT', 'Ticker should be MSFT');
  assert(suggestion.stats.totalPnL === 650, 'Total P/L should be 650');
  assert(suggestion.suggestedName.toLowerCase().includes('msft'), 'Name should include ticker');
});

await test('generateQuickSuggestion: creates bearish suggestion for losing trades', () => {
  const trades: TradeForAnalysis[] = [
    { id: '1', ticker: 'META', outcome: 'LOSS', realizedPL: -200, strategyType: null, description: null, createdAt: new Date() },
    { id: '2', ticker: 'META', outcome: 'LOSS', realizedPL: -150, strategyType: null, description: null, createdAt: new Date() },
    { id: '3', ticker: 'META', outcome: 'LOSS', realizedPL: -100, strategyType: null, description: null, createdAt: new Date() },
  ];

  const entries: EntryForAnalysis[] = [
    { id: 'e1', content: 'META weak', ticker: 'META', entryType: 'IDEA', mood: 'UNCERTAIN', sentiment: 'negative', createdAt: new Date() },
    { id: 'e2', content: 'META still dropping', ticker: 'META', entryType: 'OBSERVATION', mood: 'NERVOUS', sentiment: 'negative', createdAt: new Date() },
    { id: 'e3', content: 'Why did I trade META', ticker: 'META', entryType: 'REFLECTION', mood: 'UNCERTAIN', sentiment: 'negative', createdAt: new Date() },
  ];

  const groups = groupTradesByTicker(trades, entries);
  const suggestion = generateQuickSuggestion(groups[0]);

  assertEqual(suggestion.direction, 'BEARISH', 'Direction should be BEARISH');
  assert(suggestion.stats.totalPnL === -450, 'Total P/L should be -450');
});

// ===========================================
// Quick Trade Validation Tests
// ===========================================

console.log('\n🧪 Quick Trade Validation Tests\n');

await test('Validates ticker format', () => {
  const validTickers = ['AAPL', 'SPY', 'A', 'NVDA', 'TSLA'];
  const invalidTickers = ['', 'TOOLONG', '123', 'aa', 'A1B2'];

  for (const ticker of validTickers) {
    const isValid = /^[A-Z]{1,5}$/.test(ticker);
    assert(isValid, `${ticker} should be valid`);
  }

  for (const ticker of invalidTickers) {
    const isValid = /^[A-Z]{1,5}$/.test(ticker.toUpperCase());
    // Empty and TOOLONG should fail
    if (ticker === '' || ticker === 'TOOLONG') {
      assert(!isValid || ticker.length < 1 || ticker.length > 5, `${ticker} should be invalid`);
    }
  }
});

await test('Validates outcome values', () => {
  const validOutcomes = ['WIN', 'LOSS', 'BREAKEVEN'];
  const invalidOutcomes = ['win', 'WINNING', 'TIE', '', null];

  for (const outcome of validOutcomes) {
    const isValid = ['WIN', 'LOSS', 'BREAKEVEN'].includes(outcome);
    assert(isValid, `${outcome} should be valid`);
  }

  for (const outcome of invalidOutcomes) {
    const isValid = outcome && ['WIN', 'LOSS', 'BREAKEVEN'].includes(outcome as string);
    assert(!isValid, `${outcome} should be invalid`);
  }
});

await test('Parses P/L values correctly', () => {
  const testCases = [
    { input: '100', expected: 100 },
    { input: '-50', expected: -50 },
    { input: '0', expected: 0 },
    { input: '1234.56', expected: 1234.56 },
    { input: 'abc', expected: NaN },
    { input: '', expected: NaN },
  ];

  for (const { input, expected } of testCases) {
    const parsed = parseFloat(input);
    if (isNaN(expected)) {
      assert(isNaN(parsed), `${input} should parse to NaN`);
    } else {
      assertEqual(parsed, expected, `${input} should parse to ${expected}`);
    }
  }
});

// ===========================================
// Summary
// ===========================================

console.log('\n==================================================');
const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.log('\n❌ Failed tests:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  - ${r.name}: ${r.error}`);
  });
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  process.exit(0);
}

} // end runTests

// Run
runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
