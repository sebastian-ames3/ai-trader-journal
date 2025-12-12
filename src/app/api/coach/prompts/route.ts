import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PromptStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/coach/prompts
 * Get pending coach prompts
 *
 * Query parameters:
 * - status: Filter by status (PENDING, RESPONDED, DISMISSED) - default: PENDING
 * - limit: Max results (default: 10, max: 50)
 *
 * Response:
 * - prompts: CoachPrompt[]
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status') || 'PENDING';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);

    // Validate status
    if (!Object.values(PromptStatus).includes(status as PromptStatus)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be PENDING, RESPONDED, or DISMISSED' },
        { status: 400 }
      );
    }

    // Fetch prompts
    const prompts = await prisma.coachPrompt.findMany({
      where: {
        status: status as PromptStatus,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({
      prompts,
    });
  } catch (error) {
    console.error('Error fetching coach prompts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/coach/prompts
 * Create a new coach prompt (typically called by trigger system)
 *
 * Request body:
 * - triggerType: string (required) - e.g., 'emotional_entry', 'loss_streak', 'bias_alert'
 * - message: string (required) - The prompt message to display
 * - context?: object - Additional context data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.triggerType || typeof body.triggerType !== 'string') {
      return NextResponse.json(
        { error: 'Trigger type is required' },
        { status: 400 }
      );
    }

    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Validate message length
    if (body.message.length > 5000) {
      return NextResponse.json(
        { error: 'Message exceeds maximum length of 5000 characters' },
        { status: 400 }
      );
    }

    // Check for duplicate pending prompt with same trigger type (within last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingPrompt = await prisma.coachPrompt.findFirst({
      where: {
        triggerType: body.triggerType,
        status: PromptStatus.PENDING,
        createdAt: {
          gte: oneDayAgo,
        },
      },
    });

    if (existingPrompt) {
      return NextResponse.json(
        { error: 'A similar prompt is already pending', existingPromptId: existingPrompt.id },
        { status: 409 }
      );
    }

    // Create prompt
    const prompt = await prisma.coachPrompt.create({
      data: {
        triggerType: body.triggerType,
        message: body.message,
        context: body.context || null,
        status: PromptStatus.PENDING,
      },
    });

    return NextResponse.json(prompt, { status: 201 });
  } catch (error) {
    console.error('Error creating coach prompt:', error);
    return NextResponse.json(
      { error: 'Failed to create prompt' },
      { status: 500 }
    );
  }
}
