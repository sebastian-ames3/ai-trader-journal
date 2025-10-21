import { NextRequest, NextResponse } from 'next/server';

// This is a basic ticker search endpoint
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q') || '';
  
  // For now, return mock data to get it working
  // You can replace this with actual yfinance calls later
  const mockResults = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'EOSE', name: 'Eos Energy Enterprises' },
    { symbol: 'AMD', name: 'Advanced Micro Devices' },
    { symbol: 'STRC', name: 'Sarcos Technology' },
  ].filter(item => 
    item.symbol.toLowerCase().includes(q.toLowerCase())
  );
  
  return NextResponse.json({ results: mockResults });
}