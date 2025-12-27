import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export const dynamic = 'force-dynamic';

/**
 * GET /api/entries/counts
 * Get entry counts grouped by date for a given month range
 *
 * Query Parameters:
 * - month: ISO date string representing any date in the target month (default: current month)
 *
 * Returns:
 * {
 *   counts: { "2025-12-01": 3, "2025-12-05": 1, ... },
 *   month: "2025-12",
 *   total: 15
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');

    // Parse the month parameter or default to current month
    const targetDate = monthParam ? new Date(monthParam) : new Date();
    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);

    // Fetch all entries in the month range
    const entries = await prisma.entry.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      select: {
        createdAt: true,
      },
    });

    // Group entries by date
    const counts: Record<string, number> = {};
    let total = 0;

    entries.forEach((entry) => {
      const dateKey = format(entry.createdAt, 'yyyy-MM-dd');
      counts[dateKey] = (counts[dateKey] || 0) + 1;
      total++;
    });

    return NextResponse.json({
      counts,
      month: format(targetDate, 'yyyy-MM'),
      total,
    });
  } catch (error) {
    console.error('Error fetching entry counts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entry counts' },
      { status: 500 }
    );
  }
}
