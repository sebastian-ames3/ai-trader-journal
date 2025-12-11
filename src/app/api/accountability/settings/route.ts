import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PairStatus } from '@prisma/client';

/**
 * PATCH /api/accountability/settings
 * Update accountability partner sharing settings
 *
 * Body (all optional):
 * - shareStreak?: boolean
 * - shareEntryCount?: boolean
 * - shareBiasDistribution?: boolean
 * - shareMoodTrend?: boolean
 * - notifyOnJournal?: boolean
 * - notifyOnMilestone?: boolean
 * - notifyOnStreakBreak?: boolean
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    // Find active accountability partnership
    const pair = await prisma.accountabilityPair.findFirst({
      where: {
        status: PairStatus.ACTIVE
      }
    });

    if (!pair) {
      return NextResponse.json(
        { error: 'No active accountability partner found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: {
      shareStreak?: boolean;
      shareEntryCount?: boolean;
      shareBiasDistribution?: boolean;
      shareMoodTrend?: boolean;
      notifyOnJournal?: boolean;
      notifyOnMilestone?: boolean;
      notifyOnStreakBreak?: boolean;
    } = {};

    // Sharing settings
    if (typeof body.shareStreak === 'boolean') {
      updateData.shareStreak = body.shareStreak;
    }
    if (typeof body.shareEntryCount === 'boolean') {
      updateData.shareEntryCount = body.shareEntryCount;
    }
    if (typeof body.shareBiasDistribution === 'boolean') {
      updateData.shareBiasDistribution = body.shareBiasDistribution;
    }
    if (typeof body.shareMoodTrend === 'boolean') {
      updateData.shareMoodTrend = body.shareMoodTrend;
    }

    // Notification settings
    if (typeof body.notifyOnJournal === 'boolean') {
      updateData.notifyOnJournal = body.notifyOnJournal;
    }
    if (typeof body.notifyOnMilestone === 'boolean') {
      updateData.notifyOnMilestone = body.notifyOnMilestone;
    }
    if (typeof body.notifyOnStreakBreak === 'boolean') {
      updateData.notifyOnStreakBreak = body.notifyOnStreakBreak;
    }

    // Check if there are any updates
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid settings provided to update' },
        { status: 400 }
      );
    }

    // Update the partnership
    const updatedPair = await prisma.accountabilityPair.update({
      where: { id: pair.id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      pair: updatedPair
    });
  } catch (error) {
    console.error('Error updating accountability settings:', error);
    return NextResponse.json(
      { error: 'Failed to update accountability settings' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/accountability/settings
 * Get current accountability partner sharing settings
 */
export async function GET() {
  try {
    // Find active accountability partnership
    const pair = await prisma.accountabilityPair.findFirst({
      where: {
        status: PairStatus.ACTIVE
      }
    });

    if (!pair) {
      return NextResponse.json(
        { error: 'No active accountability partner found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      sharing: {
        shareStreak: pair.shareStreak,
        shareEntryCount: pair.shareEntryCount,
        shareBiasDistribution: pair.shareBiasDistribution,
        shareMoodTrend: pair.shareMoodTrend
      },
      notifications: {
        notifyOnJournal: pair.notifyOnJournal,
        notifyOnMilestone: pair.notifyOnMilestone,
        notifyOnStreakBreak: pair.notifyOnStreakBreak
      }
    });
  } catch (error) {
    console.error('Error fetching accountability settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accountability settings' },
      { status: 500 }
    );
  }
}
