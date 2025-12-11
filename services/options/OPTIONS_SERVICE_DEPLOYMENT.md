# Options Service Deployment Guide

## Overview

The AI Trader Journal uses a **FastAPI Python microservice** for options data, powered by the free `yfinance` library. This provides:
- Options chain data (calls/puts with strikes, bid/ask, volume, OI, IV)
- Expiration dates for any ticker
- Intelligent caching (market hours aware)
- Production-ready error handling and retry logic

**Cost:** $0-10/month (free data, minimal hosting)

---

## Architecture

```
┌─────────────┐      HTTP       ┌──────────────┐     yfinance     ┌─────────────┐
│  Next.js    │ ────────────>   │   FastAPI    │ ──────────────>  │   Yahoo     │
│  Frontend   │  (API routes)   │   (Python)   │   (HTTP calls)   │   Finance   │
└─────────────┘                 └──────────────┘                  └─────────────┘
```

**Data Flow:**
1. Frontend calls Next.js API route: `GET /api/options/chain?ticker=AAPL&expiration=2025-11-15`
2. Next.js proxies to Python service: `http://options-service.railway.app/api/options/chain?ticker=AAPL&expiration=2025-11-15`
3. Python service fetches from yfinance → Yahoo Finance API (free, 15-20 min delayed)
4. Response cached (5 min during market hours, 1 hour after hours)
5. Data returned to frontend

---

## Local Development

### 1. Install Python Dependencies

```bash
# Install Python 3.11+ (if not installed)
python --version  # Should be 3.11.0 or higher

# Install dependencies
pip install -r requirements.txt
```

### 2. Run the FastAPI Service

```bash
# Option A: Using uvicorn directly
uvicorn options_service:app --reload --port 8000

# Option B: Using Python
python options_service.py
```

The service will start at `http://localhost:8000`

### 3. Test the Service

**Health Check:**
```bash
curl http://localhost:8000/health
```

**Get Expirations:**
```bash
curl "http://localhost:8000/api/options/expirations?ticker=AAPL"
```

**Get Options Chain:**
```bash
curl "http://localhost:8000/api/options/chain?ticker=AAPL&expiration=2025-11-21"
```

**Interactive Docs:**
- OpenAPI/Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 4. Configure Next.js

Add to `.env.local`:
```bash
OPTIONS_SERVICE_URL=http://localhost:8000
```

### 5. Test Integration

```bash
# Start Next.js dev server (in separate terminal)
npm run dev

# Test proxy routes
curl "http://localhost:3000/api/options/expirations?ticker=AAPL"
curl "http://localhost:3000/api/options/chain?ticker=AAPL&expiration=2025-11-21"
curl "http://localhost:3000/api/options/health"
```

---

## Production Deployment

### Option 1: Railway.app (Recommended)

**Cost:** ~$5/month (500 MB RAM, 500 GB bandwidth)

**Steps:**

1. **Create Railway Account**
   - Sign up at https://railway.app
   - Connect your GitHub account

2. **Create New Project**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select `ai-trader-journal` repository
   - Railway will auto-detect Python and use `railway.json` config

3. **Configure Environment** (if needed)
   - Railway auto-detects Python 3.11 from `.python-version`
   - No environment variables needed (yfinance is free)

4. **Deploy**
   - Railway will automatically:
     - Install dependencies from `requirements.txt`
     - Run `uvicorn options_service:app --host 0.0.0.0 --port $PORT`
     - Provide a public URL: `https://ai-trader-journal-production.up.railway.app`

5. **Update Next.js Environment**
   - In Vercel/production, set environment variable:
   ```
   OPTIONS_SERVICE_URL=https://ai-trader-journal-production.up.railway.app
   ```

6. **Test Deployment**
   ```bash
   curl "https://ai-trader-journal-production.up.railway.app/health"
   ```

**Railway Advantages:**
- Zero-config deployment
- Auto-deploys on git push
- Built-in metrics and logs
- Custom domains supported

---

### Option 2: Render.com (Free Tier Available)

**Cost:** Free tier available (750 hours/month, auto-sleep after 15 min inactivity)

**Steps:**

1. **Create Render Account**
   - Sign up at https://render.com
   - Connect GitHub

2. **New Web Service**
   - Click "New +" → "Web Service"
   - Select `ai-trader-journal` repo
   - Render will use `render.yaml` config

3. **Configure**
   - Environment: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn options_service:app --host 0.0.0.0 --port $PORT`
   - Health Check Path: `/health`

4. **Deploy**
   - Render provides URL: `https://ai-trader-journal-options.onrender.com`

5. **Update Next.js**
   ```
   OPTIONS_SERVICE_URL=https://ai-trader-journal-options.onrender.com
   ```

**Render Free Tier Limitations:**
- Service spins down after 15 min inactivity
- First request after spin-down takes ~30 seconds
- Good for MVP, not production

---

### Option 3: Fly.io

**Cost:** Free tier (3 shared-cpu-1x 256MB VMs)

**Steps:**

1. **Install Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login & Initialize**
   ```bash
   fly auth login
   fly launch
   ```

3. **Deploy**
   ```bash
   fly deploy
   ```

---

## Monitoring & Maintenance

### Health Check Endpoint

```bash
# Check service status
curl https://your-service.railway.app/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "options-data-service",
  "timestamp": "2025-10-24T15:30:00",
  "version": "1.0.0"
}
```

### Logs

**Railway:**
- View logs in Railway dashboard
- Real-time log streaming available

**Render:**
- View logs in Render dashboard
- Download log files

### Caching Strategy

The service uses intelligent caching:
- **Market hours (9:30 AM - 4:00 PM):** 5 minute cache
- **After hours (4:00 PM - 9:30 AM):** 1 hour cache
- **Weekends:** 24 hour cache
- **Expirations list:** 1 hour cache (expirations don't change often)

### Rate Limits

**yfinance (Yahoo Finance):**
- No official rate limits
- Yahoo may throttle heavy usage (100+ requests/minute)
- Service includes retry logic with exponential backoff

**Recommended Usage:**
- 1-2 requests per trade entry (fetch expirations, then chain)
- Cache aggressively on frontend
- Use strike filtering to reduce data transfer

---

## Troubleshooting

### Service Unreachable

**Problem:** Next.js API returns 504 timeout

**Solutions:**
1. Check service health: `curl https://your-service.railway.app/health`
2. Verify `OPTIONS_SERVICE_URL` environment variable is set
3. Check Railway/Render logs for errors
4. Restart service in dashboard

### Invalid Ticker Errors

**Problem:** 404 "Invalid ticker symbol"

**Cause:** Ticker doesn't exist or has no options data

**Solution:** Use `/api/options/expirations` first to validate ticker has options

### Slow Response Times

**Problem:** Requests take >5 seconds

**Causes:**
- First request after cache expires
- Yahoo Finance API slow
- Service cold start (Render free tier)

**Solutions:**
- Use Railway (no cold starts)
- Implement frontend loading states
- Pre-fetch common tickers

### Cache Issues

**Problem:** Data seems stale

**Solution:** Cache TTL is intentional (delayed data acceptable for journaling)
- Market hours: 5 min delay
- After hours: 1 hour delay

To force refresh, wait for cache expiration or restart service.

---

## API Reference

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "options-data-service",
  "timestamp": "2025-10-24T15:30:00",
  "version": "1.0.0"
}
```

---

### GET /api/options/expirations

Get all available expiration dates for a ticker.

**Parameters:**
- `ticker` (required): Stock ticker symbol (e.g., AAPL)

**Example:**
```bash
curl "https://your-service.railway.app/api/options/expirations?ticker=AAPL"
```

**Response:**
```json
{
  "ticker": "AAPL",
  "expirations": [
    "2025-10-31",
    "2025-11-07",
    "2025-11-15",
    "2025-11-21",
    "2025-12-20"
  ],
  "count": 5,
  "cached": false
}
```

---

### GET /api/options/chain

Get options chain (calls and puts) for a specific expiration.

**Parameters:**
- `ticker` (required): Stock ticker symbol
- `expiration` (required): Expiration date in YYYY-MM-DD format
- `minStrike` (optional): Minimum strike price filter
- `maxStrike` (optional): Maximum strike price filter

**Example:**
```bash
# Full chain
curl "https://your-service.railway.app/api/options/chain?ticker=AAPL&expiration=2025-11-21"

# Filtered by strike range
curl "https://your-service.railway.app/api/options/chain?ticker=AAPL&expiration=2025-11-21&minStrike=170&maxStrike=180"
```

**Response:**
```json
{
  "ticker": "AAPL",
  "expiration": "2025-11-21",
  "underlyingPrice": 175.43,
  "calls": [
    {
      "strike": 175.0,
      "bid": 3.85,
      "ask": 3.95,
      "last": 3.90,
      "volume": 1250,
      "openInterest": 5420,
      "impliedVolatility": 32.5,
      "inTheMoney": true,
      "contractSymbol": "AAPL251121C00175000"
    }
  ],
  "puts": [
    {
      "strike": 175.0,
      "bid": 3.70,
      "ask": 3.80,
      "last": 3.75,
      "volume": 980,
      "openInterest": 4200,
      "impliedVolatility": 30.2,
      "inTheMoney": false,
      "contractSymbol": "AAPL251121P00175000"
    }
  ],
  "cached": false,
  "fetchedAt": "2025-10-24T15:30:00"
}
```

---

## Cost Analysis

### Development (Local)
- **Cost:** $0/month
- **Data Source:** Free yfinance

### Production (Railway)
- **Hosting:** ~$5/month
- **Data Source:** Free yfinance
- **Total:** ~$5/month

### Comparison to Polygon.io
- **Polygon Options Starter:** $99/month
- **Our Solution:** $5/month
- **Savings:** $94/month ($1,128/year)

**Trade-offs:**
- Polygon: Real-time, SLA guaranteed, official data
- yfinance: 15-20 min delayed, no SLA, unofficial API
- **Verdict:** yfinance sufficient for post-trade journaling (not live trading)

---

## Migration Path to Polygon.io (Future)

When ready to upgrade to real-time data:

1. **Sign up for Polygon.io Options Starter** ($99/month)
2. **Update Python service** to use Polygon SDK:
   ```python
   from polygon import RESTClient
   client = RESTClient(api_key=os.getenv("POLYGON_API_KEY"))
   ```
3. **Minimal code changes** (same endpoint structure)
4. **No frontend changes required** (same API contract)

Migration time: ~2-3 hours

---

## Support

For issues or questions:
- FastAPI docs: http://localhost:8000/docs
- yfinance GitHub: https://github.com/ranaroussi/yfinance
- Railway support: https://railway.app/help
