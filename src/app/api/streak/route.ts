import { NextResponse } from 'next/server';
import { getStreakData } from '@/lib/streakTracking';

/**
 * GET /api/streak
 * Get current streak data
 */
export async function GET() {
  try {
    const streakData = await getStreakData();

    return NextResponse.json(streakData);
  } catch (error) {
    console.error('Error fetching streak data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch streak data' },
      { status: 500 }
    );
  }
}
