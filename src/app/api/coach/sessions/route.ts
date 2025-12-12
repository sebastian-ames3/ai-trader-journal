import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/coach/sessions
 * List coach conversation sessions
 *
 * Query parameters:
 * - limit: Max results (default: 20, max: 100)
 * - offset: Pagination offset (default: 0)
 * - includeEnded: Include ended sessions (default: true)
 *
 * Response:
 * - sessions: CoachSession[]
 * - pagination: { total, limit, offset, hasMore }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const includeEnded = searchParams.get('includeEnded') !== 'false';

    // Build where clause
    const where = includeEnded
      ? {}
      : { endedAt: null };

    // Fetch sessions with pagination
    const sessions = await prisma.coachSession.findMany({
      where,
      orderBy: {
        startedAt: 'desc',
      },
      take: limit,
      skip: offset,
      select: {
        id: true,
        triggerType: true,
        triggerEntryId: true,
        topicsDiscussed: true,
        emotionalTone: true,
        actionItems: true,
        goalsSet: true,
        userRating: true,
        wasHelpful: true,
        summary: true,
        startedAt: true,
        endedAt: true,
        // Include message count instead of full messages for list view
        messages: true,
      },
    });

    // Get total count for pagination
    const total = await prisma.coachSession.count({ where });

    // Transform sessions to include message count
    const transformedSessions = sessions.map((session) => {
      const messages = session.messages as unknown[];
      return {
        ...session,
        messageCount: Array.isArray(messages) ? messages.length : 0,
        // Remove full messages from list response
        messages: undefined,
      };
    });

    return NextResponse.json({
      sessions: transformedSessions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + sessions.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching coach sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
