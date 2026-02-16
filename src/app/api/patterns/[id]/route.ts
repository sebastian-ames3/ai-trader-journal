/**
 * Pattern Detail API Route
 *
 * GET /api/patterns/[id]
 * Returns a specific pattern with its related entries for the authenticated user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getPatternWithEntries } from '@/lib/patternAnalysis';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { user } = auth;

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Pattern ID required' },
        { status: 400 }
      );
    }

    const pattern = await getPatternWithEntries(id, user.id);

    if (!pattern) {
      return NextResponse.json(
        { error: 'Pattern not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(pattern);
  } catch (error) {
    console.error('Get pattern detail error:', error);
    return NextResponse.json(
      { error: 'Failed to get pattern' },
      { status: 500 }
    );
  }
}
