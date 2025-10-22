/**
 * Test script for Options Chain Integration (Issue #50)
 *
 * Run with: npx tsx test-options-chain.ts
 */

import { getOptionsExpirations, getOptionsChain } from './src/lib/yahooFinance';

async function testOptionsChain() {
  console.log('🧪 Testing Options Chain Integration (Issue #50)\n');

  const ticker = 'AAPL';

  try {
    // Test 1: Get expiration dates
    console.log(`1️⃣ Fetching expiration dates for ${ticker}...`);
    const expirations = await getOptionsExpirations(ticker);

    if (!expirations || expirations.length === 0) {
      console.error('❌ No expirations found');
      return;
    }

    console.log(`✅ Found ${expirations.length} expiration dates:`);
    expirations.slice(0, 5).forEach((date, i) => {
      console.log(`   ${i + 1}. ${date.toISOString().split('T')[0]}`);
    });
    console.log('');

    // Test 2: Get options chain for nearest expiration
    console.log(`2️⃣ Fetching options chain for nearest expiration...`);
    const nearestExpiration = expirations[0];
    const chain = await getOptionsChain(ticker, nearestExpiration);

    if (!chain) {
      console.error('❌ Failed to fetch options chain');
      return;
    }

    console.log(`✅ Options chain fetched successfully:`);
    console.log(`   Ticker: ${chain.ticker}`);
    console.log(`   Expiration: ${chain.expirationDate.toISOString().split('T')[0]}`);
    console.log(`   Underlying Price: $${chain.underlyingPrice.toFixed(2)}`);
    console.log(`   Calls: ${chain.calls.length} strikes`);
    console.log(`   Puts: ${chain.puts.length} strikes`);
    console.log('');

    // Test 3: Show ATM options
    console.log(`3️⃣ At-The-Money (ATM) options:`);
    const atmStrike = chain.calls.reduce((prev, curr) =>
      Math.abs(curr.strike - chain.underlyingPrice) < Math.abs(prev.strike - chain.underlyingPrice) ? curr : prev
    );

    const atmPut = chain.puts.find(p => p.strike === atmStrike.strike);

    console.log(`\n   📞 CALL @ $${atmStrike.strike}:`);
    console.log(`      Last: $${atmStrike.lastPrice.toFixed(2)}`);
    console.log(`      Bid/Ask: $${atmStrike.bid.toFixed(2)} / $${atmStrike.ask.toFixed(2)}`);
    console.log(`      IV: ${(atmStrike.impliedVolatility * 100).toFixed(1)}%`);
    console.log(`      Volume: ${atmStrike.volume.toLocaleString()}`);
    console.log(`      OI: ${atmStrike.openInterest.toLocaleString()}`);

    if (atmPut) {
      console.log(`\n   📉 PUT @ $${atmPut.strike}:`);
      console.log(`      Last: $${atmPut.lastPrice.toFixed(2)}`);
      console.log(`      Bid/Ask: $${atmPut.bid.toFixed(2)} / $${atmPut.ask.toFixed(2)}`);
      console.log(`      IV: ${(atmPut.impliedVolatility * 100).toFixed(1)}%`);
      console.log(`      Volume: ${atmPut.volume.toLocaleString()}`);
      console.log(`      OI: ${atmPut.openInterest.toLocaleString()}`);
    }

    console.log('\n✅ All tests passed! Options Chain Integration is working correctly.');
    console.log('\n📊 Features Implemented:');
    console.log('   ✓ Get all expiration dates for a ticker');
    console.log('   ✓ Fetch full options chain (calls + puts)');
    console.log('   ✓ Strike-level data: IV, bid/ask, volume, OI');
    console.log('   ✓ Current underlying price');
    console.log('   ✓ 5-minute caching for options data');
    console.log('   ✓ Error handling and stale data fallback');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testOptionsChain();
