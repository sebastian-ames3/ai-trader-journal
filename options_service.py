"""
FastAPI Options Data Service - Production-Ready yfinance Integration

Provides options chain data for AI Trader Journal with:
- Market hours-aware caching
- Rate limiting and error handling
- Efficient data fetching strategies
- OpenAPI documentation

Endpoints:
- GET /health - Service health check
- GET /api/options/expirations?ticker=AAPL - Get expiration dates
- GET /api/options/chain?ticker=AAPL&expiration=2025-11-15 - Get options chain
- GET /api/options/chain?ticker=AAPL&expiration=2025-11-15&minStrike=170&maxStrike=180 - Filtered chain
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timedelta
import yfinance as yf
import numpy as np
from functools import lru_cache
import time

app = FastAPI(
    title="AI Trader Journal - Options Data Service",
    description="Production-ready yfinance integration for options chain data",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production: ["https://your-domain.com"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Pydantic Models
# ============================================================================

class HealthResponse(BaseModel):
    status: str
    service: str
    timestamp: str
    version: str

class OptionsExpirationResponse(BaseModel):
    ticker: str
    expirations: List[str]
    count: int
    cached: bool = False

class OptionContract(BaseModel):
    strike: float
    bid: float
    ask: float
    last: float
    volume: int
    openInterest: int
    impliedVolatility: float  # As percentage (e.g., 32.5 for 32.5%)
    inTheMoney: bool
    contractSymbol: str

class OptionsChainResponse(BaseModel):
    ticker: str
    expiration: str
    underlyingPrice: float
    calls: List[OptionContract]
    puts: List[OptionContract]
    cached: bool = False
    fetchedAt: str

# ============================================================================
# Caching Layer
# ============================================================================

class CacheEntry:
    """Simple in-memory cache with TTL"""
    def __init__(self, data, ttl_seconds: int):
        self.data = data
        self.expires_at = time.time() + ttl_seconds

    def is_expired(self) -> bool:
        return time.time() > self.expires_at

# Global cache dictionary
_cache = {}

def get_cache_ttl() -> int:
    """
    Return cache TTL based on market hours
    - Market hours (9:30 AM - 4:00 PM ET): 5 minutes
    - After hours: 1 hour
    - Weekends: 24 hours
    """
    now = datetime.now()
    weekday = now.weekday()

    # Weekend (Saturday=5, Sunday=6)
    if weekday >= 5:
        return 86400  # 24 hours

    # Weekday - check market hours (simplified, doesn't account for ET timezone)
    hour = now.hour
    if 9 <= hour < 16:
        return 300  # 5 minutes during market hours
    else:
        return 3600  # 1 hour after hours

def get_from_cache(key: str):
    """Retrieve data from cache if not expired"""
    if key in _cache:
        entry = _cache[key]
        if not entry.is_expired():
            return entry.data
        else:
            del _cache[key]
    return None

def set_cache(key: str, data, ttl_seconds: int = None):
    """Store data in cache with TTL"""
    if ttl_seconds is None:
        ttl_seconds = get_cache_ttl()
    _cache[key] = CacheEntry(data, ttl_seconds)

# ============================================================================
# Helper Functions
# ============================================================================

def safe_float(value, default=0.0) -> float:
    """Safely convert value to float, handling NaN"""
    try:
        if np.isnan(value):
            return default
        return float(value)
    except (ValueError, TypeError):
        return default

def safe_int(value, default=0) -> int:
    """Safely convert value to int, handling NaN"""
    try:
        if np.isnan(value):
            return default
        return int(value)
    except (ValueError, TypeError):
        return default

def get_ticker_with_retry(symbol: str, max_retries: int = 3):
    """Fetch ticker data with retry logic"""
    for attempt in range(max_retries):
        try:
            ticker = yf.Ticker(symbol)
            # Verify ticker is valid by trying to get info
            _ = ticker.info
            return ticker
        except Exception as e:
            if attempt == max_retries - 1:
                raise HTTPException(
                    status_code=404,
                    detail=f"Invalid ticker symbol or API error: {symbol}"
                )
            time.sleep(0.5 * (attempt + 1))  # Exponential backoff

# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Service health check endpoint"""
    return HealthResponse(
        status="healthy",
        service="options-data-service",
        timestamp=datetime.now().isoformat(),
        version="1.0.0"
    )

@app.get("/api/options/expirations", response_model=OptionsExpirationResponse)
async def get_expirations(
    ticker: str = Query(..., description="Stock ticker symbol (e.g., AAPL)")
):
    """
    Get all available options expiration dates for a ticker

    Cached for 1 hour (expirations don't change frequently)
    """
    ticker_upper = ticker.upper()
    cache_key = f"expirations:{ticker_upper}"

    # Check cache
    cached_data = get_from_cache(cache_key)
    if cached_data:
        cached_data["cached"] = True
        return cached_data

    # Fetch from yfinance
    try:
        ticker_obj = get_ticker_with_retry(ticker_upper)
        expirations = ticker_obj.options

        if not expirations:
            raise HTTPException(
                status_code=404,
                detail=f"No options data available for {ticker_upper}"
            )

        response = {
            "ticker": ticker_upper,
            "expirations": list(expirations),
            "count": len(expirations),
            "cached": False
        }

        # Cache for 1 hour
        set_cache(cache_key, response, ttl_seconds=3600)

        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching options expirations: {str(e)}"
        )

@app.get("/api/options/chain", response_model=OptionsChainResponse)
async def get_options_chain(
    ticker: str = Query(..., description="Stock ticker symbol (e.g., AAPL)"),
    expiration: str = Query(..., description="Expiration date (YYYY-MM-DD format)"),
    minStrike: Optional[float] = Query(None, description="Minimum strike price filter"),
    maxStrike: Optional[float] = Query(None, description="Maximum strike price filter")
):
    """
    Get options chain (calls and puts) for a specific expiration date

    Supports strike price filtering for efficient data fetching.
    Cached based on market hours (5 min during market, 1 hour after hours).
    """
    ticker_upper = ticker.upper()
    cache_key = f"chain:{ticker_upper}:{expiration}:{minStrike}:{maxStrike}"

    # Check cache
    cached_data = get_from_cache(cache_key)
    if cached_data:
        cached_data["cached"] = True
        return cached_data

    # Fetch from yfinance
    try:
        ticker_obj = get_ticker_with_retry(ticker_upper)

        # Verify expiration date is valid
        if expiration not in ticker_obj.options:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid expiration date: {expiration}. Use /api/options/expirations to get valid dates."
            )

        # Get options chain
        chain = ticker_obj.option_chain(expiration)

        # Get current underlying price
        try:
            hist = ticker_obj.history(period="1d")
            underlying_price = safe_float(hist['Close'].iloc[-1], 0.0)
        except:
            underlying_price = 0.0

        # Process calls
        calls_data = []
        for _, row in chain.calls.iterrows():
            strike = safe_float(row['strike'])

            # Apply strike filter
            if minStrike is not None and strike < minStrike:
                continue
            if maxStrike is not None and strike > maxStrike:
                continue

            calls_data.append(OptionContract(
                strike=strike,
                bid=safe_float(row['bid']),
                ask=safe_float(row['ask']),
                last=safe_float(row['lastPrice']),
                volume=safe_int(row['volume']),
                openInterest=safe_int(row['openInterest']),
                impliedVolatility=safe_float(row['impliedVolatility']) * 100,  # Convert to percentage
                inTheMoney=bool(row['inTheMoney']),
                contractSymbol=str(row['contractSymbol'])
            ))

        # Process puts
        puts_data = []
        for _, row in chain.puts.iterrows():
            strike = safe_float(row['strike'])

            # Apply strike filter
            if minStrike is not None and strike < minStrike:
                continue
            if maxStrike is not None and strike > maxStrike:
                continue

            puts_data.append(OptionContract(
                strike=strike,
                bid=safe_float(row['bid']),
                ask=safe_float(row['ask']),
                last=safe_float(row['lastPrice']),
                volume=safe_int(row['volume']),
                openInterest=safe_int(row['openInterest']),
                impliedVolatility=safe_float(row['impliedVolatility']) * 100,
                inTheMoney=bool(row['inTheMoney']),
                contractSymbol=str(row['contractSymbol'])
            ))

        response = OptionsChainResponse(
            ticker=ticker_upper,
            expiration=expiration,
            underlyingPrice=underlying_price,
            calls=calls_data,
            puts=puts_data,
            cached=False,
            fetchedAt=datetime.now().isoformat()
        )

        # Cache with market-aware TTL
        set_cache(cache_key, response.dict())

        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching options chain: {str(e)}"
        )

# ============================================================================
# Startup Event
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Log startup information"""
    print("=" * 60)
    print("AI Trader Journal - Options Data Service")
    print("=" * 60)
    print(f"Service started at: {datetime.now().isoformat()}")
    print(f"Cache TTL strategy: Market hours aware")
    print(f"Documentation: http://localhost:8000/docs")
    print("=" * 60)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
