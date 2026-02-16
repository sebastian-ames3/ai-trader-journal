/**
 * Pattern Dismiss API Route
 *
 * POST /api/patterns/dismiss
 * Dismisses a pattern so it won't show again.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { dismissPattern } from '@/lib/patternAnalysis';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { user } = auth;

    const body = await request.json();
    const { patternId } = body;

    if (!patternId || typeof patternId !== 'string') {
      return NextResponse.json(
        { error: 'Pattern ID is required' },
        { status: 400 }
      );
    }

    await dismissPattern(patternId, user.id);

    return NextResponse.json({
      success: true,
      message: 'Pattern dismissed',
    });
  } catch (error) {
    console.error('Pattern dismiss error:', error);
    return NextResponse.json(
      { error: 'Failed to dismiss pattern' },
      { status: 500 }
    );
  }
}
