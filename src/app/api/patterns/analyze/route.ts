/**
 * POST /api/patterns/analyze
 *
 * Authenticated endpoint to manually trigger pattern analysis for the
 * logged-in user. Equivalent to the nightly cron but scoped to one user.
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { analyzePatterns } from '@/lib/patternAnalysis';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const MIN_ENTRIES_REQUIRED = 20;

export async function POST() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { user } = auth;

    // Count entries from last 90 days to give user meaningful feedback
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const entryCount = await prisma.entry.count({
      where: {
        userId: user.id,
        createdAt: { gte: ninetyDaysAgo },
      },
    });

    if (entryCount < MIN_ENTRIES_REQUIRED) {
      return NextResponse.json({
        success: false,
        reason: 'insufficient_entries',
        entryCount,
        required: MIN_ENTRIES_REQUIRED,
      });
    }

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
