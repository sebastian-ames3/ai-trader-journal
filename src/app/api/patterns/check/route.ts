/**
 * Pattern Check API Route
 *
 * POST /api/patterns/check
 * Checks draft content for pattern matches in real-time.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkForPatternMatch } from '@/lib/patternAnalysis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const alert = await checkForPatternMatch(content);

    return NextResponse.json({
      alert,
      hasMatch: !!alert,
    });
  } catch (error) {
    console.error('Pattern check error:', error);
    return NextResponse.json(
      { error: 'Failed to check pattern' },
      { status: 500 }
    );
  }
}
