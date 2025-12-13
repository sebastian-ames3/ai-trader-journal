import { NextResponse } from 'next/server';
import { getStreakData } from '@/lib/streakTracking';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/streak
 * Get current streak data
 */
export async function GET() {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const streakData = await getStreakData(user.id);

    return NextResponse.json(streakData);
  } catch (error) {
    console.error('Error fetching streak data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch streak data' },
      { status: 500 }
    );
  }
}
