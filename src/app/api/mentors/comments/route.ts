import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RelationshipStatus } from '@prisma/client';

/**
 * POST /api/mentors/comments
 * Add a comment on a shared entry
 *
 * Body:
 * - relationshipId: string (required)
 * - entryId: string (required)
 * - content: string (required)
 * - authorType: 'mentor' | 'mentee' (required)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.relationshipId || !body.entryId || !body.content || !body.authorType) {
      return NextResponse.json(
        { error: 'relationshipId, entryId, content, and authorType are required' },
        { status: 400 }
      );
    }

    // Validate authorType
    if (!['mentor', 'mentee'].includes(body.authorType)) {
      return NextResponse.json(
        { error: 'authorType must be "mentor" or "mentee"' },
        { status: 400 }
      );
    }

    // Validate content length
    if (body.content.length < 1) {
      return NextResponse.json(
        { error: 'Comment content cannot be empty' },
        { status: 400 }
      );
    }

    if (body.content.length > 5000) {
      return NextResponse.json(
        { error: 'Comment content exceeds maximum length (5000 characters)' },
        { status: 400 }
      );
    }

    // Find the mentor relationship
    const relationship = await prisma.mentorRelationship.findUnique({
      where: { id: body.relationshipId }
    });

    if (!relationship) {
      return NextResponse.json(
        { error: 'Mentor relationship not found' },
        { status: 404 }
      );
    }

    // Check if relationship is active
    if (relationship.status !== RelationshipStatus.ACTIVE) {
      return NextResponse.json(
        { error: 'Cannot comment on inactive relationship' },
        { status: 403 }
      );
    }

    // Verify the entry exists and is shared
    const entryExists = await prisma.entry.findUnique({
      where: { id: body.entryId },
      select: { id: true }
    });

    if (!entryExists) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    // Check if entry is in shared entries (for mentors) or belongs to mentee
    if (body.authorType === 'mentor' && !relationship.sharedEntryIds.includes(body.entryId)) {
      // Check if individual entry sharing is enabled
      if (!relationship.shareIndividualEntries) {
        return NextResponse.json(
          { error: 'Entry is not shared with this mentor' },
          { status: 403 }
        );
      }
    }

    // Create the comment
    const comment = await prisma.mentorComment.create({
      data: {
        relationshipId: body.relationshipId,
        entryId: body.entryId,
        authorType: body.authorType,
        content: body.content
      }
    });

    // Update interaction timestamp and message count
    await prisma.mentorRelationship.update({
      where: { id: body.relationshipId },
      data: {
        lastInteraction: new Date(),
        messageCount: { increment: 1 }
      }
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating mentor comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mentors/comments
 * Get comments for a relationship or entry
 *
 * Query params:
 * - relationshipId: string (required)
 * - entryId?: string (optional, filter by entry)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const relationshipId = searchParams.get('relationshipId');
    const entryId = searchParams.get('entryId');

    if (!relationshipId) {
      return NextResponse.json(
        { error: 'relationshipId is required' },
        { status: 400 }
      );
    }

    // Verify relationship exists
    const relationship = await prisma.mentorRelationship.findUnique({
      where: { id: relationshipId }
    });

    if (!relationship) {
      return NextResponse.json(
        { error: 'Mentor relationship not found' },
        { status: 404 }
      );
    }

    // Build query
    const where: { relationshipId: string; entryId?: string } = { relationshipId };
    if (entryId) {
      where.entryId = entryId;
    }

    const comments = await prisma.mentorComment.findMany({
      where,
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}
