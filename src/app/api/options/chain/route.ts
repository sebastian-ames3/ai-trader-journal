/**
 * Options Chain API Route
 * Proxies requests to Python FastAPI options service
 *
 * GET /api/options/chain?ticker=AAPL&expiration=2025-11-15
 * GET /api/options/chain?ticker=AAPL&expiration=2025-11-15&minStrike=170&maxStrike=180
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const OPTIONS_SERVICE_URL = process.env.OPTIONS_SERVICE_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    const expiration = searchParams.get('expiration');
    const minStrike = searchParams.get('minStrike');
    const maxStrike = searchParams.get('maxStrike');

    // Validate required parameters
    if (!ticker) {
      return NextResponse.json(
        { error: 'Missing required parameter: ticker' },
        { status: 400 }
      );
    }

    if (!expiration) {
      return NextResponse.json(
        { error: 'Missing required parameter: expiration (format: YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    // Validate expiration date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(expiration)) {
      return NextResponse.json(
        { error: 'Invalid expiration date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Build query string
    const queryParams = new URLSearchParams({
      ticker,
      expiration,
    });

    if (minStrike) {
      queryParams.append('minStrike', minStrike);
    }

    if (maxStrike) {
      queryParams.append('maxStrike', maxStrike);
    }

    // Call Python FastAPI service
    const response = await fetch(
      `${OPTIONS_SERVICE_URL}/api/options/chain?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout (longer for chain data)
        signal: AbortSignal.timeout(15000), // 15 second timeout
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to fetch options chain' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Options chain API error:', error);

    // Check if it's a timeout error
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout - options service may be unavailable' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error fetching options chain' },
      { status: 500 }
    );
  }
}
