import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PromptStatus } from '@prisma/client';

/**
 * POST /api/coach/prompts/[id]/dismiss
 * Dismiss a coach prompt
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check if prompt exists
    const existingPrompt = await prisma.coachPrompt.findUnique({
      where: { id },
    });

    if (!existingPrompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    // Check if prompt is already handled
    if (existingPrompt.status !== PromptStatus.PENDING) {
      return NextResponse.json(
        { error: `Prompt is already ${existingPrompt.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Update prompt status to dismissed
    const prompt = await prisma.coachPrompt.update({
      where: { id },
      data: {
        status: PromptStatus.DISMISSED,
        dismissedAt: new Date(),
      },
    });

    return NextResponse.json({
      prompt,
      message: 'Prompt dismissed successfully',
    });
  } catch (error) {
    console.error('Error dismissing coach prompt:', error);
    return NextResponse.json(
      { error: 'Failed to dismiss prompt' },
      { status: 500 }
    );
  }
}
