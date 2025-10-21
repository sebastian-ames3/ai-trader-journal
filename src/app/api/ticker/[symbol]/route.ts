import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  const { symbol } = params;
  
  // For now, return mock data
  // Later you can integrate with yfinance here
  const mockData = {
    symbol: symbol.toUpperCase(),
    companyName: `${symbol.toUpperCase()} Inc.`,
    currentPrice: 150.25,
    previousClose: 148.50,
    dayChange: 1.75,
    dayChangePercent: 1.18,
    volume: 45_234_123,
    avgVolume: 50_123_456,
    bid: 150.20,
    ask: 150.30,
    bidSize: 100,
    askSize: 200,
    marketCap: 2_500_000_000_000
  };
  
  return NextResponse.json(mockData);
}