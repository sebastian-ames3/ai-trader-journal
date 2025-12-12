import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSessionSummary } from '@/lib/coach';

/**
 * POST /api/coach/sessions/[id]/end
 * End a coach session with optional rating and feedback
 *
 * Request body:
 * - rating?: number (1-5)
 * - feedback?: string
 * - wasHelpful?: boolean
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if session exists
    const existingSession = await prisma.coachSession.findUnique({
      where: { id },
    });

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if session is already ended
    if (existingSession.endedAt) {
      return NextResponse.json(
        { error: 'Session is already ended' },
        { status: 400 }
      );
    }

    // Validate rating if provided
    if (body.rating !== undefined) {
      const rating = parseInt(body.rating, 10);
      if (isNaN(rating) || rating < 1 || rating > 5) {
        return NextResponse.json(
          { error: 'Rating must be a number between 1 and 5' },
          { status: 400 }
        );
      }
    }

    // Validate feedback length if provided
    if (body.feedback && body.feedback.length > 5000) {
      return NextResponse.json(
        { error: 'Feedback exceeds maximum length of 5000 characters' },
        { status: 400 }
      );
    }

    // Generate session summary
    let summary: string | null = null;
    try {
      summary = await generateSessionSummary(existingSession);
    } catch (error) {
      console.error('Error generating session summary:', error);
      // Continue without summary
    }

    // Update session with ending data
    const session = await prisma.coachSession.update({
      where: { id },
      data: {
        endedAt: new Date(),
        userRating: body.rating ? parseInt(body.rating, 10) : null,
        userFeedback: body.feedback || null,
        wasHelpful: body.wasHelpful ?? null,
        summary,
      },
    });

    return NextResponse.json({
      session,
      message: 'Session ended successfully',
    });
  } catch (error) {
    console.error('Error ending coach session:', error);
    return NextResponse.json(
      { error: 'Failed to end session' },
      { status: 500 }
    );
  }
}
