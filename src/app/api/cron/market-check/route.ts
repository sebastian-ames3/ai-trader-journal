/**
 * Market Check Cron Job API Route
 *
 * GET /api/cron/market-check
 *
 * Called by Vercel Cron every 30 minutes during market hours (9 AM - 4 PM ET, weekdays).
 * Checks market conditions (SPY, VIX) and triggers notifications if thresholds are met.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  fetchMarketSnapshot,
  saveMarketCondition,
  checkMarketTriggers,
  hasNotificationBeenSent,
} from '@/lib/marketData';
import {
  sendAndLogNotification,
  shouldSendNotification,
  NOTIFICATION_COPY,
} from '@/lib/notifications';
import { verifyCronRequest } from '@/lib/cronAuth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  // Verify this is a legitimate cron request
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch current market snapshot
    const snapshot = await fetchMarketSnapshot();

    if (!snapshot) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch market data',
      });
    }

    // Save market condition to database
    await saveMarketCondition(snapshot);

    // Check for notification triggers
    const trigger = checkMarketTriggers(snapshot);

    if (!trigger) {
      return NextResponse.json({
        success: true,
        message: 'No triggers met',
        data: {
          spy: snapshot.spy,
          vix: snapshot.vix,
        },
      });
    }

    // Check if we've already sent this notification today
    const alreadySent = await hasNotificationBeenSent(trigger.trigger);

    if (alreadySent) {
      return NextResponse.json({
        success: true,
        message: 'Notification already sent today',
        trigger: trigger.trigger,
      });
    }

    // Generate notification copy
    let copy: { title: string; body: string };

    switch (trigger.type) {
      case 'market_down_big':
        copy = NOTIFICATION_COPY.marketDownBig(trigger.spy.change);
        break;
      case 'market_down':
        copy = NOTIFICATION_COPY.marketDown(trigger.spy.change);
        break;
      case 'market_up':
        copy = NOTIFICATION_COPY.marketUp(trigger.spy.change);
        break;
      case 'vix_spike':
        copy = NOTIFICATION_COPY.vixSpike(trigger.vix.price);
        break;
      case 'vix_elevated':
        copy = NOTIFICATION_COPY.vixSpike(trigger.vix.price);
        break;
      default:
        copy = { title: 'Market Alert', body: 'Market conditions have changed.' };
    }

    // Send to all users who have market alerts enabled
    const users = await prisma.user.findMany({
      select: { id: true },
    });

    let sent = 0;
    for (const { id: userId } of users) {
      const shouldSend = await shouldSendNotification('MARKET_CONDITION', userId);
      if (!shouldSend) continue;

      await sendAndLogNotification({
        type: 'MARKET_CONDITION',
        trigger: trigger.trigger,
        title: copy.title,
        body: copy.body,
        url: '/journal/new',
        userId,
        data: {
          spyChange: trigger.spy.change,
          vixLevel: trigger.vix.price,
        },
        actions: [
          { action: 'voice', title: 'Voice Note' },
          { action: 'quick', title: 'Quick Text' },
        ],
      });
      sent++;
    }

    return NextResponse.json({
      success: true,
      message: `Notification sent to ${sent} users`,
      trigger: trigger.trigger,
    });
  } catch (error) {
    console.error('Market check error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
