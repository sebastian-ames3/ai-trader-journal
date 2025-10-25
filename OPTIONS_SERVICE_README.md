# Options Data Service - Quick Start

Production-ready FastAPI microservice providing options chain data via yfinance.

## Quick Start (Local Development)

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Start Service

```bash
# Option A: Direct Python
python options_service.py

# Option B: Uvicorn with hot reload
uvicorn options_service:app --reload
```

Service starts at: `http://localhost:8000`

### 3. Test Endpoints

**Interactive Documentation:**
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

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

**Filtered Chain (by strike range):**
```bash
curl "http://localhost:8000/api/options/chain?ticker=AAPL&expiration=2025-11-21&minStrike=170&maxStrike=180"
```

### 4. Run Test Script

```bash
./test-options-service.sh
```

## Integration with Next.js

### 1. Set Environment Variable

Add to `.env.local`:
```bash
OPTIONS_SERVICE_URL=http://localhost:8000
```

### 2. Start Next.js Dev Server

```bash
npm run dev
```

### 3. Test Proxy Routes

```bash
# Health check
curl http://localhost:3000/api/options/health

# Expirations
curl "http://localhost:3000/api/options/expirations?ticker=AAPL"

# Options chain
curl "http://localhost:3000/api/options/chain?ticker=AAPL&expiration=2025-11-21"
```

## Features

✅ **Free Data** - Uses yfinance (Yahoo Finance)
✅ **Smart Caching** - Market hours aware (5 min during market, 1 hour after hours)
✅ **Error Handling** - Retry logic with exponential backoff
✅ **Type Safety** - Pydantic models with validation
✅ **API Docs** - Auto-generated OpenAPI/Swagger documentation
✅ **Production Ready** - Structured for Railway/Render deployment

## API Response Examples

### Expirations Response
```json
{
  "ticker": "AAPL",
  "expirations": [
    "2025-10-31",
    "2025-11-07",
    "2025-11-15"
  ],
  "count": 3,
  "cached": false
}
```

### Options Chain Response
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
  "puts": [...],
  "cached": false,
  "fetchedAt": "2025-10-24T15:30:00"
}
```

## Production Deployment

See `OPTIONS_SERVICE_DEPLOYMENT.md` for complete deployment guide.

**Recommended Platform:** Railway.app (~$5/month)

## Troubleshooting

### Service Won't Start
- Verify Python 3.11+ installed: `python --version`
- Install dependencies: `pip install -r requirements.txt`
- Check port 8000 not in use: `lsof -i :8000` (Mac/Linux)

### "Invalid ticker symbol" Error
- Verify ticker has options: Try AAPL, SPY, or TSLA first
- Some tickers don't have options data

### Slow Response Times
- First request fetches from Yahoo (can take 3-5 seconds)
- Subsequent requests use cache (fast)
- Strike filtering reduces response time

## Development

### Add New Endpoint

```python
@app.get("/api/options/custom")
async def custom_endpoint(ticker: str):
    # Your logic here
    return {"ticker": ticker}
```

### Modify Cache TTL

Edit `get_cache_ttl()` function in `options_service.py`

### Add Rate Limiting

Install: `pip install slowapi`

```python
from slowapi import Limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.get("/api/options/chain")
@limiter.limit("10/minute")
async def get_options_chain(...):
    ...
```

## Support

- FastAPI Docs: http://localhost:8000/docs
- yfinance Issues: https://github.com/ranaroussi/yfinance/issues
- Deployment Guide: `OPTIONS_SERVICE_DEPLOYMENT.md`
