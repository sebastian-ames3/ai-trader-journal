import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PairStatus } from '@prisma/client';

/**
 * POST /api/accountability/invite
 * Invite an accountability partner
 *
 * Body:
 * - partnerEmail: string (required)
 * - partnerName?: string
 * - settings: {
 *     shareStreak?: boolean
 *     shareEntryCount?: boolean
 *     shareBiasDistribution?: boolean
 *     shareMoodTrend?: boolean
 *     notifyOnJournal?: boolean
 *     notifyOnMilestone?: boolean
 *     notifyOnStreakBreak?: boolean
 *   }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.partnerEmail) {
      return NextResponse.json(
        { error: 'partnerEmail is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.partnerEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check for existing pending or active partnership
    const existingPartnership = await prisma.accountabilityPair.findFirst({
      where: {
        partnerEmail: body.partnerEmail.toLowerCase(),
        status: { in: [PairStatus.PENDING, PairStatus.ACTIVE] }
      }
    });

    if (existingPartnership) {
      return NextResponse.json(
        { error: 'An active or pending partnership with this person already exists' },
        { status: 400 }
      );
    }

    const settings = body.settings || {};

    // Set invite expiration (7 days from now)
    const inviteExpiresAt = new Date();
    inviteExpiresAt.setDate(inviteExpiresAt.getDate() + 7);

    // Create accountability pair
    const pair = await prisma.accountabilityPair.create({
      data: {
        partnerEmail: body.partnerEmail.toLowerCase(),
        partnerName: body.partnerName || null,
        shareStreak: settings.shareStreak ?? true,
        shareEntryCount: settings.shareEntryCount ?? true,
        shareBiasDistribution: settings.shareBiasDistribution ?? false,
        shareMoodTrend: settings.shareMoodTrend ?? false,
        notifyOnJournal: settings.notifyOnJournal ?? true,
        notifyOnMilestone: settings.notifyOnMilestone ?? true,
        notifyOnStreakBreak: settings.notifyOnStreakBreak ?? false,
        requestedBy: 'user',
        status: PairStatus.PENDING,
        inviteExpiresAt
      }
    });

    // Generate invite link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const inviteLink = `${baseUrl}/accountability/accept?token=${pair.inviteToken}`;

    return NextResponse.json(
      {
        pair,
        inviteLink,
        expiresAt: inviteExpiresAt
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating accountability invite:', error);
    return NextResponse.json(
      { error: 'Failed to create accountability invite' },
      { status: 500 }
    );
  }
}
