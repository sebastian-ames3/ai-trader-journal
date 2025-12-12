import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RelationshipStatus } from '@prisma/client';

/**
 * DELETE /api/mentors/relationships/[id]
 * End a mentor relationship
 *
 * Path params:
 * - id: The mentor relationship ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find the relationship
    const relationship = await prisma.mentorRelationship.findUnique({
      where: { id }
    });

    if (!relationship) {
      return NextResponse.json(
        { error: 'Mentor relationship not found' },
        { status: 404 }
      );
    }

    // Check if already ended
    if (relationship.status === RelationshipStatus.ENDED) {
      return NextResponse.json(
        { error: 'Relationship has already ended' },
        { status: 400 }
      );
    }

    // End the relationship
    const updatedRelationship = await prisma.mentorRelationship.update({
      where: { id },
      data: {
        status: RelationshipStatus.ENDED,
        endedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Mentor relationship ended',
      relationship: updatedRelationship
    });
  } catch (error) {
    console.error('Error ending mentor relationship:', error);
    return NextResponse.json(
      { error: 'Failed to end mentor relationship' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mentors/relationships/[id]
 * Get a specific mentor relationship
 *
 * Path params:
 * - id: The mentor relationship ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const relationship = await prisma.mentorRelationship.findUnique({
      where: { id },
      include: {
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!relationship) {
      return NextResponse.json(
        { error: 'Mentor relationship not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(relationship);
  } catch (error) {
    console.error('Error fetching mentor relationship:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mentor relationship' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/mentors/relationships/[id]
 * Update mentor relationship permissions
 *
 * Path params:
 * - id: The mentor relationship ID
 *
 * Body:
 * - shareWeeklyInsights?: boolean
 * - shareBiasPatterns?: boolean
 * - shareIndividualEntries?: boolean
 * - sharePLData?: boolean
 * - sharedEntryIds?: string[] (to add/update shared entries)
 * - status?: 'PAUSED' | 'ACTIVE' (to pause/resume)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Find the relationship
    const relationship = await prisma.mentorRelationship.findUnique({
      where: { id }
    });

    if (!relationship) {
      return NextResponse.json(
        { error: 'Mentor relationship not found' },
        { status: 404 }
      );
    }

    // Cannot update ended relationships
    if (relationship.status === RelationshipStatus.ENDED) {
      return NextResponse.json(
        { error: 'Cannot update ended relationship' },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (body.status) {
      if (!['PAUSED', 'ACTIVE'].includes(body.status)) {
        return NextResponse.json(
          { error: 'status can only be updated to PAUSED or ACTIVE' },
          { status: 400 }
        );
      }
    }

    // Validate sharedEntryIds if provided
    if (body.sharedEntryIds) {
      if (!Array.isArray(body.sharedEntryIds)) {
        return NextResponse.json(
          { error: 'sharedEntryIds must be an array' },
          { status: 400 }
        );
      }

      // Verify all entries exist
      const entries = await prisma.entry.findMany({
        where: { id: { in: body.sharedEntryIds } },
        select: { id: true }
      });

      if (entries.length !== body.sharedEntryIds.length) {
        return NextResponse.json(
          { error: 'One or more entries not found' },
          { status: 404 }
        );
      }
    }

    // Build update data
    const updateData: {
      shareWeeklyInsights?: boolean;
      shareBiasPatterns?: boolean;
      shareIndividualEntries?: boolean;
      sharePLData?: boolean;
      sharedEntryIds?: string[];
      status?: RelationshipStatus;
    } = {};

    if (typeof body.shareWeeklyInsights === 'boolean') {
      updateData.shareWeeklyInsights = body.shareWeeklyInsights;
    }
    if (typeof body.shareBiasPatterns === 'boolean') {
      updateData.shareBiasPatterns = body.shareBiasPatterns;
    }
    if (typeof body.shareIndividualEntries === 'boolean') {
      updateData.shareIndividualEntries = body.shareIndividualEntries;
    }
    if (typeof body.sharePLData === 'boolean') {
      updateData.sharePLData = body.sharePLData;
    }
    if (body.sharedEntryIds) {
      updateData.sharedEntryIds = body.sharedEntryIds;
    }
    if (body.status) {
      updateData.status = body.status as RelationshipStatus;
    }

    const updatedRelationship = await prisma.mentorRelationship.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updatedRelationship);
  } catch (error) {
    console.error('Error updating mentor relationship:', error);
    return NextResponse.json(
      { error: 'Failed to update mentor relationship' },
      { status: 500 }
    );
  }
}
