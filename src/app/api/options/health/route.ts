/**
 * Options Service Health Check API Route
 * Checks if Python FastAPI options service is available
 *
 * GET /api/options/health
 */

import { NextResponse } from 'next/server';

const OPTIONS_SERVICE_URL = process.env.OPTIONS_SERVICE_URL || 'http://localhost:8000';

export async function GET() {
  try {
    // Call Python FastAPI service health endpoint
    const response = await fetch(
      `${OPTIONS_SERVICE_URL}/health`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          error: 'Options service returned non-OK status',
          serviceUrl: OPTIONS_SERVICE_URL
        },
        { status: 503 }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      ...data,
      proxyStatus: 'healthy',
      serviceUrl: OPTIONS_SERVICE_URL
    });

  } catch (error) {
    console.error('Options service health check failed:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        serviceUrl: OPTIONS_SERVICE_URL,
        suggestion: 'Ensure OPTIONS_SERVICE_URL environment variable is set correctly'
      },
      { status: 503 }
    );
  }
}
