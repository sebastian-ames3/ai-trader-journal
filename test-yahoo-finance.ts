/**
 * Test script for Yahoo Finance integration
 * Run with: npx tsx test-yahoo-finance.ts
 */

import { fetchHistoricalPrices, getTickerInfo, searchTickers } from './src/lib/yahooFinance';
import { calculateHVMetrics } from './src/lib/hv';

async function testYahooFinanceIntegration() {
  console.log('='.repeat(60));
  console.log('Yahoo Finance Integration Test');
  console.log('='.repeat(60));
  console.log('');

  // Test 1: Fetch historical prices for AAPL
  console.log('Test 1: Fetching AAPL historical prices (30 days)...');
  try {
    const aaplPrices = await fetchHistoricalPrices('AAPL', 30);
    if (aaplPrices && aaplPrices.length > 0) {
      console.log('✓ SUCCESS: Got', aaplPrices.length, 'price data points');
      console.log('  First date:', aaplPrices[0].date.toISOString().split('T')[0]);
      console.log('  Last date:', aaplPrices[aaplPrices.length - 1].date.toISOString().split('T')[0]);
      console.log('  First close:', aaplPrices[0].close.toFixed(2));
      console.log('  Last close:', aaplPrices[aaplPrices.length - 1].close.toFixed(2));

      // Calculate HV with real data
      const closes = aaplPrices.map(p => p.close);
      const hvMetrics = calculateHVMetrics(closes);
      console.log('  HV20:', hvMetrics.hv20?.toFixed(2) + '%' || 'N/A');
      console.log('  HV30:', hvMetrics.hv30?.toFixed(2) + '%' || 'N/A');
    } else {
      console.log('✗ FAILED: No price data returned');
    }
  } catch (error) {
    console.log('✗ FAILED:', error instanceof Error ? error.message : error);
  }
  console.log('');

  // Test 2: Fetch historical prices for SPY
  console.log('Test 2: Fetching SPY historical prices (30 days)...');
  try {
    const spyPrices = await fetchHistoricalPrices('SPY', 30);
    if (spyPrices && spyPrices.length > 0) {
      console.log('✓ SUCCESS: Got', spyPrices.length, 'price data points');
      console.log('  First date:', spyPrices[0].date.toISOString().split('T')[0]);
      console.log('  Last date:', spyPrices[spyPrices.length - 1].date.toISOString().split('T')[0]);
      console.log('  First close:', spyPrices[0].close.toFixed(2));
      console.log('  Last close:', spyPrices[spyPrices.length - 1].close.toFixed(2));

      // Calculate HV with real data
      const closes = spyPrices.map(p => p.close);
      const hvMetrics = calculateHVMetrics(closes);
      console.log('  HV20:', hvMetrics.hv20?.toFixed(2) + '%' || 'N/A');
      console.log('  HV30:', hvMetrics.hv30?.toFixed(2) + '%' || 'N/A');
    } else {
      console.log('✗ FAILED: No price data returned');
    }
  } catch (error) {
    console.log('✗ FAILED:', error instanceof Error ? error.message : error);
  }
  console.log('');

  // Test 3: Get ticker info for AAPL
  console.log('Test 3: Getting AAPL ticker info...');
  try {
    const aaplInfo = await getTickerInfo('AAPL');
    if (aaplInfo) {
      console.log('✓ SUCCESS: Got ticker info');
      console.log('  Symbol:', aaplInfo.symbol);
      console.log('  Company:', aaplInfo.companyName);
      console.log('  Exchange:', aaplInfo.exchange);
      console.log('  Price:', aaplInfo.regularMarketPrice?.toFixed(2) || 'N/A');
      console.log('  Market Cap:', aaplInfo.marketCap ? '$' + (aaplInfo.marketCap / 1e9).toFixed(2) + 'B' : 'N/A');
    } else {
      console.log('✗ FAILED: No ticker info returned');
    }
  } catch (error) {
    console.log('✗ FAILED:', error instanceof Error ? error.message : error);
  }
  console.log('');

  // Test 4: Search for tickers
  console.log('Test 4: Searching for "Apple"...');
  try {
    const results = await searchTickers('Apple');
    if (results && results.length > 0) {
      console.log('✓ SUCCESS: Got', results.length, 'search results');
      results.slice(0, 5).forEach((result, i) => {
        console.log(`  ${i + 1}. ${result.symbol} - ${result.name} (${result.exchange || 'N/A'})`);
      });
    } else {
      console.log('✗ FAILED: No search results returned');
    }
  } catch (error) {
    console.log('✗ FAILED:', error instanceof Error ? error.message : error);
  }
  console.log('');

  // Test 5: Test with invalid ticker
  console.log('Test 5: Testing error handling with invalid ticker "XYZXYZ"...');
  try {
    const invalidPrices = await fetchHistoricalPrices('XYZXYZ', 30);
    if (invalidPrices === null) {
      console.log('✓ SUCCESS: Correctly returned null for invalid ticker');
    } else {
      console.log('✗ FAILED: Should have returned null for invalid ticker');
    }
  } catch (error) {
    console.log('✓ SUCCESS: Correctly handled error:', error instanceof Error ? error.message : error);
  }
  console.log('');

  // Test 6: Test caching (second call should be faster)
  console.log('Test 6: Testing cache performance...');
  try {
    const start1 = Date.now();
    await fetchHistoricalPrices('AAPL', 30);
    const time1 = Date.now() - start1;
    console.log('  First call (no cache):', time1, 'ms');

    const start2 = Date.now();
    await fetchHistoricalPrices('AAPL', 30);
    const time2 = Date.now() - start2;
    console.log('  Second call (cached):', time2, 'ms');

    if (time2 < time1) {
      console.log('✓ SUCCESS: Cached call was faster');
    } else {
      console.log('⚠ WARNING: Cached call was not faster (may still be OK)');
    }
  } catch (error) {
    console.log('✗ FAILED:', error instanceof Error ? error.message : error);
  }
  console.log('');

  console.log('='.repeat(60));
  console.log('Test Complete');
  console.log('='.repeat(60));
}

// Run the tests
testYahooFinanceIntegration().catch(console.error);
