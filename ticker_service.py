# ticker_service.py
import yfinance as yf
from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime, timedelta
import numpy as np

app = Flask(__name__)
CORS(app)

def calculate_historical_volatility(ticker_data, period=20):
    """
    Calculate historical volatility (HV) using daily returns
    Default period is 20 days (HV20)
    """
    try:
        # Get historical data for the past 30 days to ensure we have enough
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        
        hist_data = ticker_data.history(start=start_date, end=end_date)
        
        if len(hist_data) < period:
            return None
            
        # Calculate daily returns
        daily_returns = hist_data['Close'].pct_change().dropna()
        
        # Calculate HV (annualized)
        hv = daily_returns.rolling(window=period).std() * np.sqrt(252) * 100
        
        # Return the most recent HV value
        return round(hv.iloc[-1], 2) if not np.isnan(hv.iloc[-1]) else None
    except:
        return None

@app.route('/api/ticker/search', methods=['GET'])
def search_tickers():
    """Autocomplete endpoint for ticker search"""
    query = request.args.get('q', '').upper()
    
    if not query:
        return jsonify([])
    
    # Common tickers for autocomplete
    COMMON_TICKERS = [
        "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "JPM", "V", "JNJ",
        "WMT", "PG", "UNH", "DIS", "MA", "HD", "BAC", "NFLX", "ADBE", "XOM",
        "SPY", "QQQ", "DIA", "IWM", "VTI", "VOO", "GLD", "SLV", "TLT", "VXX",
        "AMD", "INTC", "PYPL", "CRM", "ORCL", "CSCO", "PEP", "KO", "NKE", "MCD",
        "BA", "GS", "MS", "C", "WFC", "T", "VZ", "CVX", "LLY", "ABBV", "TSLL", "OKLO",
        "EOSE", "UEC", "EEM",         
    ]
    
    # Filter common tickers that start with query
    matches = [ticker for ticker in COMMON_TICKERS if ticker.startswith(query)]
    
    return jsonify(matches[:10])  # Return top 10 matches

@app.route('/api/ticker/<symbol>', methods=['GET'])
def get_ticker_data(symbol):
    """
    Fetch ticker data from yfinance
    """
    try:
        # Create ticker object
        ticker = yf.Ticker(symbol.upper())
        
        # Get ticker info
        info = ticker.info
        
        # Get current data
        current_data = ticker.history(period="1d")
        
        if current_data.empty:
            return jsonify({"error": "Invalid ticker symbol"}), 404
            
        current_price = round(current_data['Close'].iloc[-1], 2)
        previous_close = round(info.get('previousClose', current_price), 2)
        
        # Calculate day change
        day_change = round(current_price - previous_close, 2)
        day_change_percent = round((day_change / previous_close) * 100, 2) if previous_close != 0 else 0
        
        # Calculate HV
        hv = calculate_historical_volatility(ticker)
        
        # Prepare response data
        ticker_data = {
            "symbol": symbol.upper(),
            "companyName": info.get('longName', symbol.upper()),
            "currentPrice": current_price,
            "previousClose": previous_close,
            "dayChange": day_change,
            "dayChangePercent": day_change_percent,
            "volume": int(current_data['Volume'].iloc[-1]),
            "avgVolume": info.get('averageVolume', 0),
            "bid": info.get('bid', 0),
            "ask": info.get('ask', 0),
            "bidSize": info.get('bidSize', 0),
            "askSize": info.get('askSize', 0),
            "marketCap": info.get('marketCap', 0),
            "pe": info.get('forwardPE', info.get('trailingPE', None)),
            "historicalVolatility": hv,
            "fiftyTwoWeekHigh": info.get('fiftyTwoWeekHigh', None),
            "fiftyTwoWeekLow": info.get('fiftyTwoWeekLow', None),
            "dividendYield": info.get('dividendYield', 0),
            "beta": info.get('beta', None)
        }
        
        return jsonify(ticker_data)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/options-chain/<symbol>', methods=['GET'])
def get_options_chain(symbol):
    """
    Fetch options chain data for liquidity analysis
    This is for feature #2 in your MVP
    """
    try:
        ticker = yf.Ticker(symbol.upper())
        
        # Get available expiration dates
        expirations = ticker.options
        
        if not expirations:
            return jsonify({"error": "No options data available"}), 404
            
        # Get the nearest expiration date
        nearest_expiry = expirations[0]
        
        # Get options chain for nearest expiry
        opt_chain = ticker.option_chain(nearest_expiry)
        
        # Process calls
        calls = opt_chain.calls
        calls_data = []
        for _, row in calls.head(10).iterrows():  # Top 10 strikes
            calls_data.append({
                "strike": float(row['strike']),
                "bid": float(row['bid']),
                "ask": float(row['ask']),
                "volume": int(row['volume']) if not np.isnan(row['volume']) else 0,
                "openInterest": int(row['openInterest']) if not np.isnan(row['openInterest']) else 0,
                "impliedVolatility": float(row['impliedVolatility']) * 100  # Convert to percentage
            })
        
        # Process puts
        puts = opt_chain.puts
        puts_data = []
        for _, row in puts.head(10).iterrows():  # Top 10 strikes
            puts_data.append({
                "strike": float(row['strike']),
                "bid": float(row['bid']),
                "ask": float(row['ask']),
                "volume": int(row['volume']) if not np.isnan(row['volume']) else 0,
                "openInterest": int(row['openInterest']) if not np.isnan(row['openInterest']) else 0,
                "impliedVolatility": float(row['impliedVolatility']) * 100
            })
        
        return jsonify({
            "symbol": symbol.upper(),
            "expiration": nearest_expiry,
            "calls": calls_data,
            "puts": puts_data
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)

@app.route('/')
def home():
    return jsonify({
        "message": "AI Trader Journal API is running!",
        "endpoints": {
            "Get ticker data": "/api/ticker/<symbol>",
            "Search tickers": "/api/ticker/search?q=<query>",
            "Options chain": "/api/options-chain/<symbol>"
        }
    })

# requirements.txt
"""
flask==2.3.2
flask-cors==4.0.0
yfinance==0.2.28
numpy==1.24.3
pandas==2.0.3
"""