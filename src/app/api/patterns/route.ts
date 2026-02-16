/**
 * Patterns API Route
 *
 * GET /api/patterns
 * Returns all active detected patterns for the authenticated user.
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getActivePatterns } from '@/lib/patternAnalysis';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { user } = auth;

    const patterns = await getActivePatterns(user.id);

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
