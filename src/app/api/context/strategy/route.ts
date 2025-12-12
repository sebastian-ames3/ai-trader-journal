/**
 * Strategy Context API Route
 *
 * GET /api/context/strategy?strategy=iron-condor
 * Returns history and insights for a trading strategy.
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getStrategyHistory, detectStrategy } from '@/lib/contextSurfacing';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const strategy = searchParams.get('strategy');
    const content = searchParams.get('content');

    // If content is provided, detect strategy first
    if (content && !strategy) {
      const detectedStrategy = detectStrategy(content);

      if (!detectedStrategy) {
        return NextResponse.json({
          strategy: null,
          history: null,
        });
      }

      const history = await getStrategyHistory(detectedStrategy);

      return NextResponse.json({
        strategy: detectedStrategy,
        history,
      });
    }

    if (!strategy) {
      return NextResponse.json(
        { error: 'Strategy or content is required' },
        { status: 400 }
      );
    }

    // Normalize strategy name (replace hyphens with spaces)
    const normalizedStrategy = strategy.replace(/-/g, ' ').toLowerCase();
    const history = await getStrategyHistory(normalizedStrategy);

    return NextResponse.json({
      strategy: normalizedStrategy,
      history,
    });
  } catch (error) {
    console.error('Strategy context error:', error);
    return NextResponse.json(
      { error: 'Failed to get strategy context' },
      { status: 500 }
    );
  }
}
