/**
 * Options Expirations API Route
 * Proxies requests to Python FastAPI options service
 *
 * GET /api/options/expirations?ticker=AAPL
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const OPTIONS_SERVICE_URL = process.env.OPTIONS_SERVICE_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');

    if (!ticker) {
      return NextResponse.json(
        { error: 'Missing required parameter: ticker' },
        { status: 400 }
      );
    }

    // Call Python FastAPI service
    const response = await fetch(
      `${OPTIONS_SERVICE_URL}/api/options/expirations?ticker=${encodeURIComponent(ticker)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout
        signal: AbortSignal.timeout(10000), // 10 second timeout
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to fetch options expirations' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Options expirations API error:', error);

    // Check if it's a timeout error
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout - options service may be unavailable' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error fetching options expirations' },
      { status: 500 }
    );
  }
}
