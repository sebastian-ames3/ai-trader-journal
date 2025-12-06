/**
 * Entry Historical Context API Route
 *
 * GET /api/context/entry/[id]
 * Returns historical context for an entry including what happened after.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEntryHistoricalContext } from '@/lib/contextSurfacing';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Entry ID is required' },
        { status: 400 }
      );
    }

    const context = await getEntryHistoricalContext(id);

    if (!context) {
      return NextResponse.json(
        { error: 'Entry not found or has no ticker' },
        { status: 404 }
      );
    }

    return NextResponse.json(context);
  } catch (error) {
    console.error('Entry context error:', error);
    return NextResponse.json(
      { error: 'Failed to get entry context' },
      { status: 500 }
    );
  }
}
