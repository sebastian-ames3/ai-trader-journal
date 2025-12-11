import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RelationshipStatus } from '@prisma/client';

/**
 * POST /api/mentors/accept
 * Accept a mentor invite using the invite token
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

    // Find the relationship by invite token
    const relationship = await prisma.mentorRelationship.findUnique({
      where: { inviteToken: body.inviteToken }
    });

    if (!relationship) {
      return NextResponse.json(
        { error: 'Invalid invite token' },
        { status: 404 }
      );
    }

    // Check if already accepted
    if (relationship.status === RelationshipStatus.ACTIVE) {
      return NextResponse.json(
        { error: 'Invite has already been accepted' },
        { status: 400 }
      );
    }

    // Check if invite has ended
    if (relationship.status === RelationshipStatus.ENDED) {
      return NextResponse.json(
        { error: 'This relationship has been ended' },
        { status: 400 }
      );
    }

    // Check if invite has expired
    if (relationship.inviteExpiresAt && relationship.inviteExpiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invite has expired' },
        { status: 400 }
      );
    }

    // Update relationship status to ACTIVE
    const updatedRelationship = await prisma.mentorRelationship.update({
      where: { id: relationship.id },
      data: {
        status: RelationshipStatus.ACTIVE,
        acceptedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Mentor invite accepted',
      relationship: updatedRelationship
    });
  } catch (error) {
    console.error('Error accepting mentor invite:', error);
    return NextResponse.json(
      { error: 'Failed to accept mentor invite' },
      { status: 500 }
    );
  }
}
