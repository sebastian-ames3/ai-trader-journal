/**
 * Notification Preferences API Route
 *
 * GET /api/notifications/prefs
 * Returns current notification preferences for the authenticated user.
 *
 * PUT /api/notifications/prefs
 * Updates notification preferences for the authenticated user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Get notification preferences
export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { user } = auth;

    let prefs = await prisma.userNotificationPrefs.findFirst({
      where: { userId: user.id },
    });

    // Create default preferences if none exist
    if (!prefs) {
      prefs = await prisma.userNotificationPrefs.create({
        data: { userId: user.id },
      });
    }

    return NextResponse.json(prefs);
  } catch (error) {
    console.error('Get prefs error:', error);
    return NextResponse.json(
      { error: 'Failed to get preferences' },
      { status: 500 }
    );
  }
}

// PUT - Update notification preferences
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { user } = auth;

    const body = await request.json();

    // Validate input types
    const validFields = [
      'marketAlerts',
      'vixAlerts',
      'tickerAlerts',
      'dailyReflection',
      'dailyReflectionTime',
      'weeklyReview',
      'tradeIdeaFollowups',
      'journalNudgeDays',
      'quietHoursStart',
      'quietHoursEnd',
    ];

    // Filter to only valid fields
    const updateData: Record<string, unknown> = {};

    for (const field of validFields) {
      if (field in body) {
        // Type validation
        if (field.endsWith('Alerts') || field === 'dailyReflection' || field === 'weeklyReview' || field === 'tradeIdeaFollowups') {
          if (typeof body[field] !== 'boolean') {
            return NextResponse.json(
              { error: `${field} must be a boolean` },
              { status: 400 }
            );
          }
        }

        if (field === 'journalNudgeDays') {
          if (typeof body[field] !== 'number' || body[field] < 0 || body[field] > 30) {
            return NextResponse.json(
              { error: 'journalNudgeDays must be a number between 0 and 30' },
              { status: 400 }
            );
          }
        }

        if (field === 'dailyReflectionTime' || field === 'quietHoursStart' || field === 'quietHoursEnd') {
          if (typeof body[field] !== 'string' || !/^\d{2}:\d{2}$/.test(body[field])) {
            return NextResponse.json(
              { error: `${field} must be in HH:MM format` },
              { status: 400 }
            );
          }
        }

        updateData[field] = body[field];
      }
    }

    // Upsert preferences keyed by userId
    const prefs = await prisma.userNotificationPrefs.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        ...updateData,
      },
      update: updateData,
    });

    return NextResponse.json(prefs);
  } catch (error) {
    console.error('Update prefs error:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
