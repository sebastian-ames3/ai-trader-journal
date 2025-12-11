import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PairStatus } from '@prisma/client';

/**
 * POST /api/accountability/nudge
 * Send a nudge to your accountability partner
 *
 * Body:
 * - message?: string (optional custom message)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Find active accountability partnership
    const pair = await prisma.accountabilityPair.findFirst({
      where: {
        status: PairStatus.ACTIVE
      }
    });

    if (!pair) {
      return NextResponse.json(
        { error: 'No active accountability partner found' },
        { status: 404 }
      );
    }

    // Validate message length if provided
    if (body.message && body.message.length > 500) {
      return NextResponse.json(
        { error: 'Nudge message exceeds maximum length (500 characters)' },
        { status: 400 }
      );
    }

    // Default nudge messages
    const defaultMessages = [
      "Hey! Don't forget to journal today!",
      'Time to write down your trading thoughts!',
      'Your accountability partner is checking in - how are the markets treating you?',
      'Quick reminder to capture your trading insights!',
      "Let's keep those streaks going! Time to journal."
    ];

    const nudgeMessage =
      body.message || defaultMessages[Math.floor(Math.random() * defaultMessages.length)];

    // In a real implementation, this would:
    // 1. Send a push notification to the partner
    // 2. Send an email notification
    // 3. Log the nudge for rate limiting

    // Log the nudge in the notification log
    await prisma.notificationLog.create({
      data: {
        type: 'JOURNAL_NUDGE',
        trigger: 'accountability_partner_nudge',
        title: 'Nudge from Partner',
        body: nudgeMessage,
        data: {
          partnerId: pair.id,
          partnerEmail: pair.partnerEmail
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Nudge sent successfully',
      nudgeMessage,
      sentTo: pair.partnerEmail
    });
  } catch (error) {
    console.error('Error sending nudge:', error);
    return NextResponse.json(
      { error: 'Failed to send nudge' },
      { status: 500 }
    );
  }
}
