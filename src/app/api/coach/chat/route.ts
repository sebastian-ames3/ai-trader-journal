import { NextRequest, NextResponse } from 'next/server';
import { processCoachMessage, CoachContext } from '@/lib/coach';
import { handleClaudeError, isClaudeConfigured } from '@/lib/claude';

/**
 * POST /api/coach/chat
 * Process a chat message with the AI trading coach
 *
 * Request body:
 * - sessionId?: string - Omit to start new session
 * - message: string - User's message
 * - context?: { currentEntry?: string, currentPosition?: string, trigger?: string }
 *
 * Response:
 * - sessionId: string
 * - response: { content, suggestions, references, actionItems }
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Claude is configured
    if (!isClaudeConfigured()) {
      return NextResponse.json(
        { error: 'AI coach is not configured. Please set ANTHROPIC_API_KEY.' },
        { status: 503 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate message is not empty
    if (body.message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      );
    }

    // Validate message length
    if (body.message.length > 10000) {
      return NextResponse.json(
        { error: 'Message exceeds maximum length of 10000 characters' },
        { status: 400 }
      );
    }

    // Parse optional context
    const context: CoachContext | undefined = body.context
      ? {
          currentEntry: body.context.currentEntry,
          currentPosition: body.context.currentPosition,
          trigger: body.context.trigger,
        }
      : undefined;

    // Process the message
    const result = await processCoachMessage(
      body.sessionId || null,
      body.message.trim(),
      context
    );

    return NextResponse.json({
      sessionId: result.sessionId,
      response: result.response,
    });
  } catch (error) {
    console.error('Error in coach chat:', error);

    // Handle Claude-specific errors
    const claudeError = handleClaudeError(error);
    if (claudeError.status !== 500) {
      return NextResponse.json(
        { error: claudeError.message },
        { status: claudeError.status }
      );
    }

    // Handle session not found
    if (error instanceof Error && error.message === 'Session not found') {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
