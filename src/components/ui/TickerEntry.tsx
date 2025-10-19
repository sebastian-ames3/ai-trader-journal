import React, { useState, useEffect, useRef } from 'react';
import { Search, TrendingUp, AlertCircle, Loader, RefreshCw, Clock } from 'lucide-react';
import { HvCard } from '@/components/ui/HvCard';
import debounce from 'lodash.debounce';
import { useCallback } from 'react';
import ManualIvForm from '@/components/ui/ManualIvForm';

// Type definitions
interface TickerData {
  symbol: string;
  companyName: string;
  currentPrice: number;
  previousClose: number;
  dayChange: number;
  dayChangePercent: number;
  volume: number;
  avgVolume: number;
  bid: number;
  ask: number;
  bidSize: number;
  askSize: number;
  marketCap: number;
  pe: number | null;
  historicalVolatility: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  dividendYield: number;
  beta: number | null;
  open: number;
  high: number;
  low: number;
  timestamp: string;
  cached?: boolean;
}
interface TickerResult {
  symbol: string;
  name: string;
}
const TickerEntry: React.FC = () => {
  const [tickerInput, setTickerInput] = useState<string>('');
  const [tickerData, setTickerData] = useState<TickerData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [suggestions, setSuggestions] = useState<TickerResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch ticker data from backend
  const fetchTickerData = async (symbol: string): Promise<TickerData> => {
    const response = await fetch(`api/ticker/${symbol}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch ticker data');
    }
    return response.json();
  };

  // Search for ticker suggestions
  const searchTickers = async (query: string): Promise<TickerResult[]> => {
  const response = await fetch(`/api/ticker?q=${query}`);
  if (!response.ok) throw new Error('Failed to fetch suggestions');
  const data = await response.json();
  console.log('API response:', data);  
  console.log('Results:', data.results);
  return data.results || [];  // Extract the results array here
};

// Debouncer
const debouncedSearch = useCallback(
  debounce(async (query: string) => {
    try {
      const results = await searchTickers(query);
      setSuggestions(results);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
      setSuggestions([]);
    }
  }, 500), // 500ms delay should be enough
  []
);
  // Handle input changes with debounced autocomplete
  useEffect(() => {
    if (tickerInput.length >= 1) {
      setShowSuggestions(false); // Hide old lines while loading
      debouncedSearch(tickerInput);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    return () => {
      debouncedSearch.cancel(); // Cancel pending requests on cleanup
    };
  }, [tickerInput, debouncedSearch]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentTickerSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 5));
    }
  }, []);

  // Handle clicks outside suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTickerSearch = async (symbol: string = tickerInput) => {
    if (!symbol.trim()) {
      setError('Please enter a ticker symbol');
      return;
    }

    setLoading(true);
    setError('');
    setShowSuggestions(false);
    
    try {
      const data = await fetchTickerData(symbol);
      setTickerData(data);
      
      // Update recent searches
      const updatedRecent = [symbol.toUpperCase(), ...recentSearches.filter(s => s !== symbol.toUpperCase())].slice(0, 5);
      setRecentSearches(updatedRecent);
      localStorage.setItem('recentTickerSearches', JSON.stringify(updatedRecent));
      
    } catch (err) {
      setError((err as Error).message || 'Failed to fetch ticker data. Please try again.');
      setTickerData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !showSuggestions) {
      handleTickerSearch();
    }
  };

  const handleSuggestionClick = (symbol: string) => {
    setTickerInput(symbol);
    setShowSuggestions(false);
    handleTickerSearch(symbol);
  };

  const formatNumber = (num: number | null | undefined): string => {
    if (!num) return 'N/A';
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">AI Trader Journal</h1>
        
        {/* Ticker Search Section */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center">
            <Search className="mr-2" size={20} />
            Ticker Entry
          </h2>
          
          <div className="relative mb-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={tickerInput}
                  onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
                  onKeyPress={handleKeyPress}
                  onFocus={() => tickerInput && setShowSuggestions(true)}
                  placeholder="Enter ticker (e.g., AAPL)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                {/* Autocomplete Suggestions */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                      {suggestions.map((suggestion) => {
                        console.log('Rendering suggestion:', suggestion);  // Add this
                        return (
                          <button
                            key={suggestion.symbol}
                            onClick={() => handleSuggestionClick(suggestion.symbol)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                          >
                            <div className="font-medium">{suggestion.symbol}</div>
                            <div className="text-sm text-gray-500">{suggestion.name}</div>
                          </button>
                        );
                      })}
                    </div>
                  )}
              </div>
              
              <button
                onClick={() => handleTickerSearch()}
                disabled={loading}
                className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center whitespace-nowrap"
              >
                {loading ? <Loader className="animate-spin" size={20} /> : 'Search'}
              </button>
            </div>
          </div>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-500">Recent:</span>
              {recentSearches.map(ticker => (
                <button
                  key={ticker}
                  onClick={() => {
                    setTickerInput(ticker);
                    handleTickerSearch(ticker);
                  }}
                  className="px-3 py-1 text-sm bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {ticker}
                </button>
              ))}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center">
              <AlertCircle size={20} className="mr-2 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Ticker Data Display */}
        {tickerData && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            {/* Header with Price */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div className="mb-4 sm:mb-0">
                <h2 className="text-2xl font-bold flex items-center">
                  {tickerData.symbol}
                  {tickerData.cached && (
                    <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">Cached</span>
                  )}
                </h2>
                <p className="text-gray-600">{tickerData.companyName}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">${tickerData.currentPrice}</p>
                <p className={`text-lg font-medium ${tickerData.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tickerData.dayChange >= 0 ? '+' : ''}{tickerData.dayChange} ({tickerData.dayChangePercent}%)
                </p>
              </div>
            </div>

            {/* OHLC Bar for Mobile */}
            <div className="grid grid-cols-4 gap-2 mb-6 text-center sm:hidden">
              <div>
                <p className="text-xs text-gray-500">Open</p>
                <p className="font-medium">${tickerData.open}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">High</p>
                <p className="font-medium">${tickerData.high}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Low</p>
                <p className="font-medium">${tickerData.low}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Prev</p>
                <p className="font-medium">${tickerData.previousClose}</p>
              </div>
            </div>

            {/* Desktop Data Grid */}
            <div className="hidden sm:grid sm:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center">
                  <TrendingUp size={18} className="mr-2" />
                  Trading Data
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Open</span>
                    <span className="font-medium">${tickerData.open}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">High</span>
                    <span className="font-medium">${tickerData.high}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Low</span>
                    <span className="font-medium">${tickerData.low}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Prev Close</span>
                    <span className="font-medium">${tickerData.previousClose}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">Market Data</h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Volume</span>
                    <span className="font-medium">{formatNumber(tickerData.volume)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Avg Volume</span>
                    <span className="font-medium">{formatNumber(tickerData.avgVolume)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Market Cap</span>
                    <span className="font-medium">{formatNumber(tickerData.marketCap)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">P/E Ratio</span>
                    <span className="font-medium">{tickerData.pe || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Data List */}
            <div className="sm:hidden space-y-4 mb-6">
              <div>
                <h3 className="font-semibold mb-2 text-sm">Market Data</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Volume</span>
                    <span className="font-medium">{formatNumber(tickerData.volume)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Avg Vol</span>
                    <span className="font-medium">{formatNumber(tickerData.avgVolume)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Mkt Cap</span>
                    <span className="font-medium">{formatNumber(tickerData.marketCap)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">P/E</span>
                    <span className="font-medium">{tickerData.pe || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* HV Display */}
            <HvCard ticker={tickerData?.symbol} />
            
          {/* After the Historical Volatility section */}
            {tickerData && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Implied Volatility Entry
                </h2>
                <ManualIvForm 
                  selectedTicker={tickerData.symbol} 
                  onIvSaved={(data) => {
                    console.log('IV saved:', data);
                    // You can update your UI here if needed
                  }}
                />
              </div>
            )}
            
            {/* Update Time */}
            <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
              <span className="flex items-center">
                <Clock size={14} className="mr-1" />
                Last updated: {formatTime(tickerData.timestamp)}
              </span>
              <button
                onClick={() => handleTickerSearch(tickerData.symbol)}
                className="flex items-center hover:text-gray-700"
              >
                <RefreshCw size={14} className="mr-1" />
                Refresh
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Use for New Trade
              </button>
              <button className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                View Options Chain
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TickerEntry;