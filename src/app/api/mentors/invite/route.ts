import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RelationshipStatus } from '@prisma/client';
import { requireAuth } from '@/lib/auth';

/**
 * POST /api/mentors/invite
 * Invite a mentor to view your journal data
 *
 * Body:
 * - mentorEmail: string (required)
 * - mentorName?: string
 * - permissions: {
 *     shareWeeklyInsights?: boolean
 *     shareBiasPatterns?: boolean
 *     shareIndividualEntries?: boolean
 *     sharePLData?: boolean
 *   }
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const body = await request.json();

    // Validate required fields
    if (!body.mentorEmail) {
      return NextResponse.json(
        { error: 'mentorEmail is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.mentorEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check for existing pending or active relationship
    const existingRelationship = await prisma.mentorRelationship.findFirst({
      where: {
        userId: user.id,
        mentorEmail: body.mentorEmail.toLowerCase(),
        status: { in: [RelationshipStatus.PENDING, RelationshipStatus.ACTIVE] }
      }
    });

    if (existingRelationship) {
      return NextResponse.json(
        { error: 'An active or pending relationship with this mentor already exists' },
        { status: 400 }
      );
    }

    const permissions = body.permissions || {};

    // Set invite expiration (7 days from now)
    const inviteExpiresAt = new Date();
    inviteExpiresAt.setDate(inviteExpiresAt.getDate() + 7);

    // Create mentor relationship
    const relationship = await prisma.mentorRelationship.create({
      data: {
        userId: user.id,
        mentorEmail: body.mentorEmail.toLowerCase(),
        mentorName: body.mentorName || null,
        shareWeeklyInsights: permissions.shareWeeklyInsights ?? true,
        shareBiasPatterns: permissions.shareBiasPatterns ?? true,
        shareIndividualEntries: permissions.shareIndividualEntries ?? false,
        sharePLData: permissions.sharePLData ?? false,
        requestedBy: 'mentee',
        status: RelationshipStatus.PENDING,
        inviteExpiresAt
      }
    });

    // Generate invite link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const inviteLink = `${baseUrl}/mentor/accept?token=${relationship.inviteToken}`;

    return NextResponse.json(
      {
        relationship,
        inviteLink,
        expiresAt: inviteExpiresAt
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating mentor invite:', error);
    return NextResponse.json(
      { error: 'Failed to create mentor invite' },
      { status: 500 }
    );
  }
}
