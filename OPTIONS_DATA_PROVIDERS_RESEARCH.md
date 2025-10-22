# Options Data API Providers - Research Report

**Date:** 2025-10-22
**Context:** Issue #50 - Options Chain Integration & Data Pipeline
**Objective:** Identify viable data sources for options chain data (expirations, strikes, IV, Greeks, bid/ask, volume, OI)

---

## Executive Summary

**Key Finding:** `yahoo-finance2` (Node.js) does NOT support options data, unlike the Python `yfinance` library which has full options support.

**Recommendation:** Use **Polygon.io Options Starter ($99/mo)** or build a **Python microservice with yfinance** for free data with rate limits.

---

## Provider Comparison Matrix

| Provider | Free Tier | Paid Tier | Options Data | IV/Greeks | Rate Limit | Best For |
|----------|-----------|-----------|--------------|-----------|------------|----------|
| **yfinance (Python)** | ✅ Yes | N/A | ✅ Full chains | ✅ Yes | No official limit | Budget/MVP |
| **Polygon.io** | ⚠️ Limited | $99-$299/mo | ✅ OPRA feed | ✅ Yes | 5/min (free) | Production |
| **Alpha Vantage** | ❌ No options | $50-$250/mo | ✅ Realtime + Historical | ✅ Yes | 75-1200/min | Enterprise |
| **Tradier** | ⚠️ Sandbox | Usage-based | ✅ Full chains | ⚠️ Partial | Unknown | Brokerage integration |
| **yahoo-finance2 (Node)** | ✅ Yes | N/A | ❌ **NO OPTIONS** | ❌ No | 2000/hr | ❌ Not viable |

---

## Detailed Provider Analysis

### 1. yfinance (Python Library) ⭐ **RECOMMENDED FOR MVP**

**Pros:**
- ✅ **100% FREE** with no API keys required
- ✅ Fetches directly from Yahoo Finance
- ✅ Full options chain data: `ticker.options` (expirations), `ticker.option_chain(date)` (calls/puts)
- ✅ Includes IV per strike, bid/ask, volume, OI
- ✅ Well-documented and widely used
- ✅ No rate limits enforced (though Yahoo may throttle heavy usage)

**Cons:**
- ⚠️ **Python-only** - requires building a microservice or Python runtime
- ⚠️ Unofficial API - Yahoo can break it anytime
- ⚠️ No SLA or guaranteed uptime
- ⚠️ Greeks must be calculated separately (Black-Scholes)

**Usage Example:**
```python
import yfinance as yf

ticker = yf.Ticker("AAPL")
expirations = ticker.options  # ['2025-11-15', '2025-12-20', ...]
chain = ticker.option_chain('2025-11-15')

calls = chain.calls  # DataFrame with strike, lastPrice, bid, ask, volume, openInterest, impliedVolatility
puts = chain.puts
```

**Implementation Path:**
- Option A: FastAPI Python microservice (5-10 hours dev time)
- Option B: AWS Lambda with Python runtime (slower cold starts)
- Option C: Use Python child process from Node.js (not recommended - complex)

**Cost:** $0/month + ~$5-10/mo server hosting (Render, Railway, Fly.io)

---

### 2. Polygon.io ⭐ **RECOMMENDED FOR PRODUCTION**

**Pros:**
- ✅ **Official OPRA data feed** from all 17 US options exchanges
- ✅ Comprehensive options APIs: chains, snapshots, trades, quotes
- ✅ Includes IV, Greeks, bid/ask, volume, OI
- ✅ Real-time data (not delayed)
- ✅ Excellent documentation and SDKs (Node.js, Python, Go)
- ✅ SLA guarantees and reliable uptime
- ✅ WebSocket support for streaming data

**Cons:**
- ⚠️ **Paid only for options** - free tier has only 5 API calls/min
- ⚠️ Minimum $99/month for Options Starter tier
- ⚠️ Separate pricing for options vs stocks data

**Pricing:**
- **Options Starter:** $99/month (unlimited API calls, 15-min delayed)
- **Options Developer:** $199/month (real-time data)
- **Options Advanced:** $399/month (includes historical + level 2)

**Free Tier Limitations:**
- 5 API calls/minute
- 2 years historical data
- **Not sufficient for real-time options chain fetching**

**Best For:**
- Production applications with paying users
- Applications requiring real-time data
- Professional traders willing to pay for reliability

**API Example:**
```typescript
// GET /v3/reference/options/contracts?underlying_ticker=AAPL
// GET /v3/snapshot/options/{ticker}
```

**Cost:** $99-$399/month depending on latency requirements

---

### 3. Alpha Vantage

**Pros:**
- ✅ Realtime and historical options data
- ✅ Includes IV and Greeks calculations
- ✅ 15+ years of historical options chains
- ✅ Simple REST API

**Cons:**
- ❌ **No free tier for options** - requires premium ($50+/mo)
- ⚠️ Options access requires premium tier + entitlement process
- ⚠️ More expensive than Polygon.io for same features
- ⚠️ Slower API compared to Polygon

**Pricing:**
- $49.99/mo (75 req/min) - Options **NOT included**
- $99.99/mo (150 req/min) - Options available
- $199.99/mo (600 req/min) - Recommended for options
- $249.99/mo (1200 req/min) - High frequency

**Best For:**
- Users already on Alpha Vantage ecosystem
- Applications needing deep historical options data (15+ years)

**Cost:** $100-$250/month

---

### 4. Tradier Brokerage API

**Pros:**
- ✅ Free sandbox environment for testing
- ✅ Full options chain data
- ✅ Real brokerage integration (can execute trades)
- ✅ Market data bundled with brokerage services

**Cons:**
- ⚠️ Primarily a brokerage API, not pure data provider
- ⚠️ Requires brokerage account for production
- ⚠️ Pricing unclear - appears usage-based
- ⚠️ Documentation less accessible

**Pricing:**
- **Sandbox:** Free for development
- **Production:** Requires funded brokerage account

**Best For:**
- Applications planning to integrate trade execution
- Users who want brokerage + data in one platform

**Cost:** Unclear - likely usage-based or included with brokerage fees

---

### 5. yahoo-finance2 (Node.js) ❌ **NOT VIABLE**

**Verdict:** Does NOT support options data despite being based on Yahoo Finance.

**What it provides:**
- ✅ Stock quotes and historical prices
- ✅ Ticker search
- ✅ Company info

**What it lacks:**
- ❌ No `options()` method
- ❌ No options chain endpoints
- ❌ No IV or Greeks

**Why it failed:** The Python `yfinance` library reverse-engineers Yahoo's private APIs, but `yahoo-finance2` (Node) only implements the public/documented APIs which don't include options.

**Conclusion:** Must use Python `yfinance` or switch to paid provider.

---

## Recommendation by Use Case

### For MVP / Budget-Conscious ($0-10/month)
**Use Python yfinance with FastAPI microservice**

**Pros:**
- Free data (no API costs)
- Full options chain functionality
- Quick to implement (5-10 hours)
- Can migrate to paid provider later

**Cons:**
- Requires Python runtime
- No SLA guarantees
- Yahoo can break API anytime

**Implementation:**
```
Frontend (Next.js) → Python FastAPI → yfinance → Yahoo Finance
```

---

### For Production / Paying Users ($99-199/month)
**Use Polygon.io Options Starter**

**Pros:**
- Official OPRA data (reliable)
- Real-time with 15-min delay (Starter) or real-time (Developer)
- Excellent documentation
- Production-ready SDKs

**Cons:**
- $99-$199/month ongoing cost
- Overkill if not monetizing yet

---

### For Brokerage Integration (Variable cost)
**Use Tradier API**

**Pros:**
- Combines data + execution
- Free sandbox for development
- Good for algo trading platforms

**Cons:**
- Requires brokerage account
- Unclear pricing structure

---

## Technical Implementation Paths

### Path 1: Python Microservice (yfinance) ⭐ **RECOMMENDED FOR ISSUE #50**

**Architecture:**
```
┌─────────────┐      HTTP       ┌──────────────┐     yfinance     ┌─────────────┐
│  Next.js    │ ────────────>   │   FastAPI    │ ──────────────>  │   Yahoo     │
│  Frontend   │                 │   (Python)   │                  │   Finance   │
└─────────────┘                 └──────────────┘                  └─────────────┘
```

**Endpoints to build:**
- `GET /options/expirations?ticker=AAPL`
- `GET /options/chain?ticker=AAPL&expiration=2025-11-15`

**Deployment:**
- Railway.app: ~$5/mo (500MB RAM)
- Render.com: Free tier available
- Fly.io: Free tier available

**Development Time:** 5-10 hours

**Code Example (FastAPI):**
```python
from fastapi import FastAPI
import yfinance as yf

app = FastAPI()

@app.get("/options/expirations")
async def get_expirations(ticker: str):
    t = yf.Ticker(ticker)
    return {"ticker": ticker, "expirations": list(t.options)}

@app.get("/options/chain")
async def get_chain(ticker: str, expiration: str):
    t = yf.Ticker(ticker)
    chain = t.option_chain(expiration)
    return {
        "ticker": ticker,
        "expiration": expiration,
        "calls": chain.calls.to_dict('records'),
        "puts": chain.puts.to_dict('records')
    }
```

---

### Path 2: Polygon.io Integration (Node.js)

**Architecture:**
```
┌─────────────┐      HTTP       ┌──────────────┐     REST API     ┌─────────────┐
│  Next.js    │ ────────────>   │  Next.js API │ ──────────────>  │  Polygon.io │
│  Frontend   │                 │   Routes     │                  │   (OPRA)    │
└─────────────┘                 └──────────────┘                  └─────────────┘
```

**Implementation:**
- Use `@polygon.io/client-js` npm package
- Update existing `/api/options/[ticker]/route.ts`
- Store API key in `.env`

**Development Time:** 2-3 hours (API integration only)

**Code Example:**
```typescript
import { restClient } from '@polygon.io/client-js';

const client = restClient(process.env.POLYGON_API_KEY);

// Get options chain
const chain = await client.reference.optionsContracts({
  underlying_ticker: 'AAPL',
  expiration_date: '2025-11-15'
});
```

---

## Final Recommendation for Issue #50

**Phase 1 (MVP - Next 2 weeks):**
Build Python yfinance microservice
- **Cost:** $0-10/month
- **Dev Time:** 5-10 hours
- **Risk:** Medium (unofficial API)
- **Benefit:** Unblocks all downstream features (#51-55)

**Phase 2 (Production - 3-6 months):**
Migrate to Polygon.io Options Starter
- **Cost:** $99/month
- **Dev Time:** 2-3 hours (migration)
- **Risk:** Low (official data)
- **Benefit:** Production-ready with SLA

**Hybrid Approach:**
- Use yfinance for **delayed/cached** data (snapshot every 5-15 min)
- Use Polygon.io free tier for **critical real-time** needs (5 calls/min)
- Transition to paid when users willing to pay

---

## Action Items

1. ✅ Document findings (this file)
2. ⬜ Update Issue #50 with research summary
3. ⬜ Decision: Python microservice vs paid provider
4. ⬜ If Python: Build FastAPI service
5. ⬜ If Polygon: Sign up for trial, implement SDK
6. ⬜ Update API route to call chosen provider
7. ⬜ Test with real tickers (AAPL, SPY, TSLA)
8. ⬜ Update CLAUDE.md with options data source

---

## References

- yfinance GitHub: https://github.com/ranaroussi/yfinance
- yfinance Docs: https://ranaroussi.github.io/yfinance/
- Polygon.io Options: https://polygon.io/docs/options/getting-started
- Alpha Vantage Options: https://www.alphavantage.co/documentation/
- Tradier API: https://docs.tradier.com/

