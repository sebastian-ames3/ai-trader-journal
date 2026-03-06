import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { detectTradeInContent } from '@/lib/tradeDetection';

/**
 * POST /api/trades/detect
 * Lightweight trade detection on raw text — does NOT save anything.
 * Used by the voice flow to check for trades before showing VoiceCapturePreview.
 *
 * Request body:
 * - content: string (required)
 *
 * Response: TradeDetectionResult
 */
export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    const body = await request.json();
    if (!body.content || typeof body.content !== 'string') {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }

    const result = await detectTradeInContent(body.content);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Trade detection error:', error);
    return NextResponse.json({ error: 'Detection failed' }, { status: 500 });
  }
}
