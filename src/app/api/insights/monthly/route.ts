/**
 * Monthly Insights API Route
 *
 * GET /api/insights/monthly
 * Returns a monthly behavioral report.
 *
 * Query params:
 * - month: YYYY-MM format (defaults to current month)
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { generateMonthlyReport } from '@/lib/patternAnalysis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');

    let year: number;
    let month: number;

    if (monthParam) {
      const parts = monthParam.split('-');
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);

      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return NextResponse.json(
          { error: 'Invalid month format. Use YYYY-MM' },
          { status: 400 }
        );
      }
    } else {
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth() + 1;
    }

    const report = await generateMonthlyReport(year, month);

    return NextResponse.json(report);
  } catch (error) {
    console.error('Monthly insights error:', error);
    return NextResponse.json(
      { error: 'Failed to generate monthly report' },
      { status: 500 }
    );
  }
}
