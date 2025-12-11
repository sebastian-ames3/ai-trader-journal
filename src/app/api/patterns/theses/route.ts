import { NextResponse } from 'next/server';
import { analyzeThesisPatterns } from '@/lib/thesisPatterns';

/**
 * GET /api/patterns/theses
 * Analyze closed theses to identify patterns and performance metrics
 *
 * Returns:
 * - Overall statistics (win rate, avg P/L)
 * - Detected patterns by ticker, strategy, and direction
 * - Top performing tickers and strategies
 * - Recent insights from closed theses
 */
export async function GET(): Promise<NextResponse> {
  try {
    const analysis = await analyzeThesisPatterns();

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Error analyzing thesis patterns:', error);

    return NextResponse.json(
      { error: 'Failed to analyze thesis patterns' },
      { status: 500 }
    );
  }
}
