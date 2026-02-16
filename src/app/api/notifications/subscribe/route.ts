/**
 * Push Subscription API Route
 *
 * POST /api/notifications/subscribe
 * Saves a push notification subscription.
 *
 * DELETE /api/notifications/subscribe
 * Removes a push notification subscription.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// POST - Subscribe to push notifications
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { user } = auth;

    const body = await request.json();

    // Validate subscription object
    if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
      return NextResponse.json(
        { error: 'Invalid subscription format' },
        { status: 400 }
      );
    }

    // Upsert subscription (update if exists, create if not)
    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint: body.endpoint },
      create: {
        endpoint: body.endpoint,
        keys: {
          p256dh: body.keys.p256dh,
          auth: body.keys.auth,
        },
        userId: user.id,
      },
      update: {
        keys: {
          p256dh: body.keys.p256dh,
          auth: body.keys.auth,
        },
        userId: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        createdAt: subscription.createdAt,
      },
    });
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}

// DELETE - Unsubscribe from push notifications
export async function DELETE(request: NextRequest) {
  try {
    // Authentication check
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const body = await request.json();

    if (!body.endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    // Delete subscription (only if owned by this user)
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: body.endpoint, userId: auth.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unsubscription error:', error);

    // If subscription doesn't exist, that's fine
    if ((error as { code?: string }).code === 'P2025') {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Failed to remove subscription' },
      { status: 500 }
    );
  }
}
