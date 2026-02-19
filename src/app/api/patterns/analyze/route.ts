/**
 * POST /api/patterns/analyze
 *
 * Authenticated endpoint to manually trigger pattern analysis for the
 * logged-in user. Equivalent to the nightly cron but scoped to one user.
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { analyzePatterns } from '@/lib/patternAnalysis';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { user } = auth;

    const patterns = await analyzePatterns(user.id);

    return NextResponse.json({
      success: true,
      patternsFound: patterns.length,
    });
  } catch (error) {
    console.error('Manual pattern analysis error:', error);
    return NextResponse.json(
      { error: 'Pattern analysis failed' },
      { status: 500 }
    );
  }
}
