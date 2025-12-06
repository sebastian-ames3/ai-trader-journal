/**
 * Pattern Detail API Route
 *
 * GET /api/patterns/[id]
 * Returns a specific pattern with its related entries.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPatternWithEntries } from '@/lib/patternAnalysis';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Pattern ID required' },
        { status: 400 }
      );
    }

    const pattern = await getPatternWithEntries(id);

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
