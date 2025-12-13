/**
 * Patterns API Route
 *
 * GET /api/patterns
 * Returns all active detected patterns.
 */

import { NextResponse } from 'next/server';
import { getActivePatterns } from '@/lib/patternAnalysis';

export async function GET() {
  try {
    const patterns = await getActivePatterns();

    return NextResponse.json({
      patterns,
      count: patterns.length,
    });
  } catch (error) {
    console.error('Get patterns error:', error);
    return NextResponse.json(
      { error: 'Failed to get patterns' },
      { status: 500 }
    );
  }
}
