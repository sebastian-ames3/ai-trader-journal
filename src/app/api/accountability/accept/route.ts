import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PairStatus } from '@prisma/client';

/**
 * POST /api/accountability/accept
 * Accept an accountability partner invite using the invite token
 *
 * Body:
 * - inviteToken: string (required)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.inviteToken) {
      return NextResponse.json(
        { error: 'inviteToken is required' },
        { status: 400 }
      );
    }

    // Find the pair by invite token
    const pair = await prisma.accountabilityPair.findUnique({
      where: { inviteToken: body.inviteToken }
    });

    if (!pair) {
      return NextResponse.json(
        { error: 'Invalid invite token' },
        { status: 404 }
      );
    }

    // Check if already accepted
    if (pair.status === PairStatus.ACTIVE) {
      return NextResponse.json(
        { error: 'Invite has already been accepted' },
        { status: 400 }
      );
    }

    // Check if partnership has ended
    if (pair.status === PairStatus.ENDED) {
      return NextResponse.json(
        { error: 'This partnership has been ended' },
        { status: 400 }
      );
    }

    // Check if invite has expired
    if (pair.inviteExpiresAt && pair.inviteExpiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invite has expired' },
        { status: 400 }
      );
    }

    // Update pair status to ACTIVE
    const updatedPair = await prisma.accountabilityPair.update({
      where: { id: pair.id },
      data: {
        status: PairStatus.ACTIVE,
        acceptedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Accountability partner invite accepted',
      pair: updatedPair
    });
  } catch (error) {
    console.error('Error accepting accountability invite:', error);
    return NextResponse.json(
      { error: 'Failed to accept accountability invite' },
      { status: 500 }
    );
  }
}
