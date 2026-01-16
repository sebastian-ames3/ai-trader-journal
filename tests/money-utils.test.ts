/**
 * Unit tests for Money Utilities
 * Run with: npx tsx tests/money-utils.test.ts
 *
 * Prerequisites: None (pure unit tests)
 */

import {
  round,
  addMoney,
  subtractMoney,
  sumMoney,
  calculatePercentage,
  formatMoney,
  formatPercent,
  parseMoney,
  moneyEquals,
  calculateTotalPL,
  formatPL,
  formatChange,
} from '../src/lib/money';

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

function test(name: string, fn: () => void) {
  console.log(`\n${name}`);
  try {
    fn();
    results.push({ name, passed: true });
    logSuccess('PASSED');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, error: errorMessage });
    logError(`FAILED: ${errorMessage}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(
      message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

function assertClose(actual: number, expected: number, epsilon: number = 0.001) {
  if (Math.abs(actual - expected) > epsilon) {
    throw new Error(`Expected ${expected} (±${epsilon}), got ${actual}`);
  }
}

// ============ Tests ============

async function runTests() {
  console.log('🧪 Money Utilities Unit Tests\n');

  // round() tests
  test('round: basic rounding', () => {
    assertEqual(round(1.234, 2), 1.23);
    assertEqual(round(1.235, 2), 1.24); // rounds up
    assertEqual(round(1.236, 2), 1.24);
  });

  test('round: handles negative numbers', () => {
    assertEqual(round(-1.234, 2), -1.23);
    assertEqual(round(-1.236, 2), -1.24);
  });

  test('round: handles zero decimals', () => {
    assertEqual(round(1.5, 0), 2);
    assertEqual(round(1.4, 0), 1);
  });

  // addMoney() tests
  test('addMoney: basic addition', () => {
    assertEqual(addMoney(10.50, 20.25), 30.75);
  });

  test('addMoney: avoids floating point issues', () => {
    // 0.1 + 0.2 !== 0.3 in JS due to floating point
    assertEqual(addMoney(0.1, 0.2), 0.3);
  });

  // subtractMoney() tests
  test('subtractMoney: basic subtraction', () => {
    assertEqual(subtractMoney(100.00, 35.50), 64.5);
  });

  test('subtractMoney: handles negative result', () => {
    assertEqual(subtractMoney(10.00, 15.00), -5);
  });

  // sumMoney() tests
  test('sumMoney: sums array of values', () => {
    assertEqual(sumMoney([10.10, 20.20, 30.30]), 60.6);
  });

  test('sumMoney: handles null and undefined', () => {
    assertEqual(sumMoney([10, null, 20, undefined, 30]), 60);
  });

  test('sumMoney: returns 0 for empty array', () => {
    assertEqual(sumMoney([]), 0);
  });

  // calculatePercentage() tests
  test('calculatePercentage: basic percentage', () => {
    assertEqual(calculatePercentage(25, 100), 25);
    assertEqual(calculatePercentage(1, 3), 33.33);
  });

  test('calculatePercentage: handles zero total', () => {
    assertEqual(calculatePercentage(10, 0), 0);
  });

  // formatMoney() tests
  test('formatMoney: basic formatting', () => {
    assertEqual(formatMoney(1234.56), '$1,234.56');
  });

  test('formatMoney: handles negative values', () => {
    assertEqual(formatMoney(-500.00), '-$500.00');
  });

  test('formatMoney: shows sign when requested', () => {
    assertEqual(formatMoney(100, { showSign: true }), '+$100.00');
    assertEqual(formatMoney(-100, { showSign: true }), '-$100.00');
  });

  test('formatMoney: zero shows no sign', () => {
    assertEqual(formatMoney(0), '$0.00');
    assertEqual(formatMoney(0, { showSign: true }), '$0.00');
  });

  // formatPercent() tests
  test('formatPercent: basic formatting', () => {
    assertEqual(formatPercent(12.34), '12.34%');
  });

  test('formatPercent: shows sign when requested', () => {
    assertEqual(formatPercent(10, { showSign: true }), '+10.00%');
    assertEqual(formatPercent(-10, { showSign: true }), '-10.00%');
  });

  // parseMoney() tests
  test('parseMoney: parses currency strings', () => {
    assertEqual(parseMoney('$1,234.56'), 1234.56);
    assertEqual(parseMoney('-$500'), -500);
    assertEqual(parseMoney('+$100.00'), 100);
  });

  test('parseMoney: returns null for invalid input', () => {
    assertEqual(parseMoney(''), null);
    assertEqual(parseMoney('abc'), null);
  });

  // moneyEquals() tests
  test('moneyEquals: compares with precision tolerance', () => {
    assertEqual(moneyEquals(10.00, 10.00), true);
    assertEqual(moneyEquals(10.001, 10.002), true); // within epsilon
    assertEqual(moneyEquals(10.00, 10.01), false);
  });

  // calculateTotalPL() tests
  test('calculateTotalPL: sums realized P/L', () => {
    const trades = [
      { realizedPL: 100 },
      { realizedPL: -50 },
      { realizedPL: 75 },
    ];
    assertEqual(calculateTotalPL(trades), 125);
  });

  test('calculateTotalPL: handles null values', () => {
    const trades = [
      { realizedPL: 100 },
      { realizedPL: null },
      { realizedPL: 50 },
    ];
    assertEqual(calculateTotalPL(trades), 150);
  });

  // formatPL() tests
  test('formatPL: formats with sign', () => {
    assertEqual(formatPL(100), '+$100.00');
    assertEqual(formatPL(-50), '-$50.00');
    assertEqual(formatPL(0), '+$0.00');
  });

  test('formatPL: handles null/undefined', () => {
    assertEqual(formatPL(null), '$0.00');
    assertEqual(formatPL(undefined), '$0.00');
  });

  test('formatPL: respects decimals parameter', () => {
    assertEqual(formatPL(100.567, 0), '+$101');
    assertEqual(formatPL(-50.123, 1), '-$50.1');
  });

  // formatChange() tests
  test('formatChange: formats percentage with sign', () => {
    assertEqual(formatChange(12.34), '+12.34%');
    assertEqual(formatChange(-5.5), '-5.50%');
    assertEqual(formatChange(0), '+0.00%');
  });

  test('formatChange: handles null/undefined', () => {
    assertEqual(formatChange(null), '0.00%');
    assertEqual(formatChange(undefined), '0.00%');
  });

  // Print summary
  console.log('\n' + '='.repeat(50));
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.log('\n❌ Failed tests:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => console.log(`  - ${r.name}: ${r.error}`));
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
}

runTests();
