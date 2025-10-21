# Yahoo Finance Integration Guide

This guide explains how to use and test the real Yahoo Finance API integration that has replaced the mock data system.

## Overview

The application now fetches real market data from Yahoo Finance using the `yahoo-finance2` npm package. This provides:

- **Real historical price data** for HV calculations
- **Real-time quote data** for ticker information
- **Ticker search** with company names and exchanges
- **Intelligent caching** to minimize API calls and improve performance
- **Automatic fallback** to mock data when API is unavailable

## Architecture

### Core Files

1. **`/src/lib/yahooFinance.ts`** - Yahoo Finance API wrapper
   - `fetchHistoricalPrices(ticker, days)` - Get historical closing prices
   - `getTickerInfo(ticker)` - Get real-time quote and company info
   - `searchTickers(query)` - Search for ticker symbols
   - `validateTicker(ticker)` - Check if ticker exists
   - `clearTickerCache(ticker)` - Clear cached data for a ticker

2. **`/src/lib/cache.ts`** - Caching system
   - Simple in-memory Map-based cache with TTL
   - Smart caching: 1 hour during market hours, 24 hours outside
   - Automatic eviction when cache reaches 1000 entries
   - Market hours detection (9:30 AM - 4:00 PM ET, weekdays)

3. **`/src/lib/data.ts`** - Data layer abstraction
   - `fetchDailyCloses(ticker, days)` - Unified interface for price data
   - Automatically uses Yahoo Finance API by default
   - Falls back to mock data on errors or when `USE_MOCK_DATA=true`

### API Routes

1. **`GET /api/prices?ticker={symbol}&days={number}`**
   - Fetch historical closing prices for HV calculations
   - Used by HvCard component to avoid client-side Node.js module issues
   - Example: `/api/prices?ticker=AAPL&days=30`

2. **`GET /api/ticker?q={query}`**
   - Search for ticker symbols
   - Returns up to 10 results with symbol, name, exchange
   - Example: `/api/ticker?q=apple`

3. **`GET /api/ticker/{symbol}`**
   - Get detailed quote information
   - Returns price, market cap, volume, 52-week range
   - Example: `/api/ticker/AAPL`

## Environment Variables

### `USE_MOCK_DATA`

Set to `true` to use mock data instead of Yahoo Finance API:

```bash
# In .env.local
USE_MOCK_DATA=true
```

When enabled:
- No API calls are made to Yahoo Finance
- Fast, predictable data for testing
- Useful for development without internet or to avoid rate limits

When disabled (default):
- Real data from Yahoo Finance
- Automatic fallback to mock data on errors
- Caching minimizes API calls

### `DEBUG`

Set to `1` to enable detailed logging:

```bash
# In .env.local
DEBUG=1
```

This logs:
- API calls to Yahoo Finance
- Cache hits/misses
- HV calculation steps
- Error details

## Testing the Integration

### 1. Start the Development Server

```bash
npm run dev
```

The app will start on `http://localhost:3000`

### 2. Test Ticker Search

1. Go to the home page
2. Start typing a ticker symbol in the search box (e.g., "AAPL")
3. Watch the network tab in DevTools
4. You should see a request to `/api/ticker?q=aapl`
5. The autocomplete dropdown should show real companies from Yahoo Finance

**Expected behavior:**
- First search is slower (~1-2 seconds) - fetching from Yahoo Finance
- Second search for same query is instant - served from cache
- Results include company names and exchanges

### 3. Test Historical Prices & HV Calculation

1. Select a ticker (e.g., AAPL)
2. The HvCard component should load real historical data
3. Watch the network tab: `/api/prices?ticker=AAPL&days=35`
4. HV20 and HV30 should be calculated from real price data

**Expected behavior:**
- Loading state appears briefly
- Real HV values appear (e.g., HV20: 28.3%, HV30: 25.7%)
- Calculated timestamp shows current time
- Subsequent loads are faster due to caching

### 4. Test Ticker Info

1. Select a ticker
2. Check the ticker info section
3. You should see real market data:
   - Current price
   - Market cap
   - Volume
   - Previous close

**Expected behavior:**
- Real, up-to-date market data
- Prices match what you'd see on Yahoo Finance website

### 5. Test Error Handling

Test with an invalid ticker:

1. Try searching for "XYZXYZ" (non-existent ticker)
2. The app should handle gracefully:
   - No results in search
   - Or error message if you force the ticker

**Expected behavior:**
- No crashes
- Graceful error messages
- Automatic fallback to mock data if configured

### 6. Test Caching

1. Select AAPL
2. Wait for HV data to load
3. Select a different ticker (e.g., SPY)
4. Select AAPL again
5. Notice the second load is instant - served from cache

**Expected behavior:**
- First load: ~1-2 seconds (API call)
- Second load: <100ms (cache hit)
- Check DevTools Network tab to confirm no API call on second load

### 7. Test Mock Data Fallback

1. Stop your development server
2. Add `USE_MOCK_DATA=true` to `.env.local`
3. Restart the server
4. Search for AAPL again
5. You should see mock data with predictable values

**Expected behavior:**
- No actual API calls to Yahoo Finance
- Mock prices generated algorithmically
- Ticker search returns hardcoded list
- Useful for testing HV calculations without API dependency

## Manual Testing Checklist

- [ ] Ticker search returns real company names
- [ ] AAPL HV20/HV30 shows reasonable values (15-35% typically)
- [ ] SPY HV20/HV30 shows reasonable values (10-25% typically)
- [ ] Invalid ticker (XYZXYZ) shows error or no results
- [ ] Second search for same ticker is instant (cache hit)
- [ ] Network tab shows `/api/prices`, `/api/ticker` calls
- [ ] Mock data mode works when `USE_MOCK_DATA=true`
- [ ] Debug logging works when `DEBUG=1`
- [ ] HV values change when switching tickers
- [ ] Real prices match Yahoo Finance website

## Common Issues

### Issue: TypeScript errors in yahoo-finance2

**Solution:** The package has complex type overloads. We use `@ts-expect-error` annotations where needed. This is intentional and safe.

### Issue: Build fails with "Module not found: fs/promises"

**Solution:** This happens if `yahoo-finance2` is imported in client components. Always use API routes to call Yahoo Finance from the server side.

### Issue: Rate limiting from Yahoo Finance

**Solution:**
- Caching is aggressive to minimize API calls
- During development, use `USE_MOCK_DATA=true` to avoid hitting limits
- Production deployments should monitor cache hit rates

### Issue: Stale data

**Solution:**
- Clear cache by restarting the server
- Or use `clearTickerCache(ticker)` function
- Cache TTL is 1 hour during market hours, 24 hours outside
- Can adjust TTL in `/src/lib/cache.ts`

## Performance Considerations

### Caching Strategy

**During market hours (9:30 AM - 4:00 PM ET, weekdays):**
- Price data cached for 1 hour
- Frequent price changes require shorter cache

**Outside market hours:**
- Price data cached for 24 hours
- Prices don't change when markets are closed

**Always:**
- Ticker info cached for 24 hours (rarely changes)
- Search results cached for 1 hour
- Maximum 1000 cache entries (automatic eviction)

### API Call Reduction

The caching system dramatically reduces API calls:

**Without cache:** 100+ API calls per session
**With cache:** 5-10 API calls per session (90-95% cache hit rate)

This prevents:
- Rate limiting from Yahoo Finance
- Slow page loads from repeated API calls
- Unnecessary bandwidth usage

## Next Steps

### Potential Enhancements

1. **Redis caching** - For multi-instance deployments
2. **Stale-while-revalidate** - Serve stale data, fetch fresh in background
3. **Webhook updates** - Real-time price updates via WebSocket
4. **Alternative data sources** - Fallback to Alpha Vantage or IEX if Yahoo fails
5. **Historical data backfilling** - Fetch more history once, cache forever

### Production Considerations

1. **Rate limiting** - Add rate limit middleware to API routes
2. **Error monitoring** - Track Yahoo Finance API failures
3. **Cache warming** - Pre-populate cache for popular tickers
4. **CDN caching** - Cache API responses at edge for faster loads
5. **Database persistence** - Store historical prices in database for faster HV calculations

## Additional Resources

- **yahoo-finance2 docs:** https://github.com/gadicc/node-yahoo-finance2
- **Yahoo Finance website:** https://finance.yahoo.com
- **HV calculation details:** See `/src/lib/hv.ts`
- **Cache implementation:** See `/src/lib/cache.ts`

## Questions?

If you encounter issues:

1. Check DEBUG logs (`DEBUG=1` in `.env.local`)
2. Verify Yahoo Finance API is accessible
3. Test with `USE_MOCK_DATA=true` to isolate issues
4. Check network tab in DevTools for API call details
5. Review error logs in terminal/console

The integration is designed to be robust with automatic fallbacks, so even if Yahoo Finance is down, the app will continue working with mock data.
