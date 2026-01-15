import { NextRequest, NextResponse } from 'next/server';
import { generateWeeklyInsights } from '@/lib/weeklyInsights';
import { requireAuth } from '@/lib/auth';

// Force dynamic rendering (uses searchParams)
export const dynamic = 'force-dynamic';

/**
 * GET /api/insights/weekly?week=0
 * Get weekly insights for a specific week
 *
 * Query params:
 * - week: Week offset (0 = current week, -1 = last week, etc.)
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

    const searchParams = request.nextUrl.searchParams;
    const weekParam = searchParams.get('week');
    const weekOffset = weekParam ? parseInt(weekParam, 10) : 0;

    // Validate week offset
    if (isNaN(weekOffset) || weekOffset > 0 || weekOffset < -52) {
      return NextResponse.json(
        { error: 'Invalid week parameter. Must be between 0 and -52.' },
        { status: 400 }
      );
    }

    // Generate insights filtered by user
    const insights = await generateWeeklyInsights(weekOffset, user.id);

    return NextResponse.json(insights);

  } catch (error) {
    console.error('Error generating weekly insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate weekly insights' },
      { status: 500 }
    );
  }
}
