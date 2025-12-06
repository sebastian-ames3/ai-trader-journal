/**
 * Push Notification Service
 *
 * Handles push notification delivery using web-push.
 * Supports VAPID authentication for secure delivery.
 *
 * Environment variables required:
 * - VAPID_PUBLIC_KEY: VAPID public key
 * - VAPID_PRIVATE_KEY: VAPID private key
 * - VAPID_SUBJECT: mailto: or https: URL for contact
 */

import webpush from 'web-push';
import { prisma } from '@/lib/prisma';
import { NotificationType } from '@prisma/client';

// Types for push notification payload
export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url?: string;
    type?: NotificationType;
    trigger?: string;
    notificationId?: string;
    [key: string]: unknown;
  };
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

// Check if push notifications are configured
export function isPushConfigured(): boolean {
  return !!(
    process.env.VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY &&
    process.env.VAPID_SUBJECT
  );
}

// Initialize web-push with VAPID details
function initWebPush(): void {
  if (!isPushConfigured()) {
    throw new Error(
      'Push notifications not configured. Set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT.'
    );
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
}

/**
 * Send a push notification to all subscribed devices
 */
export async function sendPushNotification(
  payload: NotificationPayload
): Promise<{ success: number; failed: number }> {
  if (!isPushConfigured()) {
    console.log('Push notifications not configured, skipping');
    return { success: 0, failed: 0 };
  }

  initWebPush();

  // Get all subscriptions
  const subscriptions = await prisma.pushSubscription.findMany();

  if (subscriptions.length === 0) {
    console.log('No push subscriptions found');
    return { success: 0, failed: 0 };
  }

  let success = 0;
  let failed = 0;

  // Send to all subscriptions
  for (const sub of subscriptions) {
    try {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: sub.keys as { p256dh: string; auth: string },
      };

      await webpush.sendNotification(
        pushSubscription,
        JSON.stringify(payload)
      );
      success++;
    } catch (error) {
      console.error('Failed to send push notification:', error);
      failed++;

      // Remove invalid subscriptions (410 Gone or 404 Not Found)
      if (
        error instanceof webpush.WebPushError &&
        (error.statusCode === 410 || error.statusCode === 404)
      ) {
        await prisma.pushSubscription.delete({
          where: { endpoint: sub.endpoint },
        });
        console.log('Removed invalid subscription:', sub.endpoint);
      }
    }
  }

  return { success, failed };
}

/**
 * Log a notification in the database
 */
export async function logNotification(params: {
  type: NotificationType;
  trigger: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): Promise<string> {
  const log = await prisma.notificationLog.create({
    data: {
      type: params.type,
      trigger: params.trigger,
      title: params.title,
      body: params.body,
      data: params.data ? JSON.parse(JSON.stringify(params.data)) : undefined,
    },
  });

  return log.id;
}

/**
 * Send notification and log it
 */
export async function sendAndLogNotification(params: {
  type: NotificationType;
  trigger: string;
  title: string;
  body: string;
  url?: string;
  actions?: NotificationPayload['actions'];
  data?: Record<string, unknown>;
}): Promise<{ notificationId: string; success: number; failed: number }> {
  // Log the notification first
  const notificationId = await logNotification({
    type: params.type,
    trigger: params.trigger,
    title: params.title,
    body: params.body,
    data: params.data,
  });

  // Send push notification
  const result = await sendPushNotification({
    title: params.title,
    body: params.body,
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    tag: params.trigger,
    data: {
      url: params.url || '/',
      type: params.type,
      trigger: params.trigger,
      notificationId,
      ...params.data,
    },
    actions: params.actions,
  });

  return {
    notificationId,
    ...result,
  };
}

/**
 * Mark a notification as engaged (clicked)
 */
export async function markNotificationEngaged(
  notificationId: string
): Promise<void> {
  await prisma.notificationLog.update({
    where: { id: notificationId },
    data: { engagedAt: new Date() },
  });
}

/**
 * Dismiss a notification
 */
export async function dismissNotification(
  notificationId: string
): Promise<void> {
  await prisma.notificationLog.update({
    where: { id: notificationId },
    data: { dismissed: true },
  });
}

/**
 * Snooze a notification for a specified duration
 */
export async function snoozeNotification(
  notificationId: string,
  hours: number = 3
): Promise<Date> {
  const snoozedTo = new Date(Date.now() + hours * 60 * 60 * 1000);

  await prisma.notificationLog.update({
    where: { id: notificationId },
    data: { snoozedTo },
  });

  return snoozedTo;
}

/**
 * Check if we're in quiet hours
 */
export function isQuietHours(
  quietStart: string = '21:00',
  quietEnd: string = '07:00',
  timezone: string = 'America/New_York'
): boolean {
  const now = new Date();

  // Get current time in specified timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const currentTime = formatter.format(now);
  const [currentHour, currentMinute] = currentTime.split(':').map(Number);
  const currentMinutes = currentHour * 60 + currentMinute;

  const [startHour, startMinute] = quietStart.split(':').map(Number);
  const startMinutes = startHour * 60 + startMinute;

  const [endHour, endMinute] = quietEnd.split(':').map(Number);
  const endMinutes = endHour * 60 + endMinute;

  // Handle overnight quiet hours (e.g., 21:00 to 07:00)
  if (startMinutes > endMinutes) {
    // Quiet hours span midnight
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  } else {
    // Quiet hours within same day
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
}

/**
 * Get notification preferences (or defaults)
 */
export async function getNotificationPrefs() {
  let prefs = await prisma.userNotificationPrefs.findFirst({
    where: { id: 'default' },
  });

  if (!prefs) {
    // Create default preferences
    prefs = await prisma.userNotificationPrefs.create({
      data: { id: 'default' },
    });
  }

  return prefs;
}

/**
 * Check if notifications should be sent based on preferences
 */
export async function shouldSendNotification(
  type: NotificationType
): Promise<boolean> {
  const prefs = await getNotificationPrefs();

  // Check quiet hours
  if (isQuietHours(prefs.quietHoursStart, prefs.quietHoursEnd)) {
    return false;
  }

  // Check type-specific preferences
  switch (type) {
    case 'MARKET_CONDITION':
      return prefs.marketAlerts;
    case 'TICKER_MOVE':
      return prefs.tickerAlerts;
    case 'TIME_BASED':
      return prefs.dailyReflection || prefs.weeklyReview;
    case 'JOURNAL_NUDGE':
      return prefs.journalNudgeDays > 0;
    case 'HISTORICAL_CONTEXT':
      return true; // Always enabled
    default:
      return true;
  }
}

// Notification copy templates
export const NOTIFICATION_COPY = {
  // Market conditions
  marketDown: (change: number) => ({
    title: `Market down ${Math.abs(change).toFixed(1)}%`,
    body: "Tough day in the markets. How are you holding up?",
  }),
  marketDownBig: (change: number) => ({
    title: `Significant selloff (-${Math.abs(change).toFixed(1)}%)`,
    body: "Take a breath before any decisions. Want to capture how you're feeling?",
  }),
  marketUp: (change: number) => ({
    title: `Great day (+${change.toFixed(1)}%)`,
    body: "Feeling euphoric? That's worth noting.",
  }),
  vixSpike: (level: number) => ({
    title: `VIX spiking to ${level.toFixed(0)}`,
    body: "Fear is elevated. Good time to check in with yourself.",
  }),

  // Time-based
  dailyClose: () => ({
    title: "Market's closed",
    body: "30 seconds to capture today's thoughts?",
  }),
  weeklyReview: (entryCount: number) => ({
    title: "Week in review",
    body: `You made ${entryCount} ${entryCount === 1 ? 'entry' : 'entries'} this week. Ready to reflect?`,
  }),

  // Journal nudge
  journalSilence: (days: number) => ({
    title: `Haven't heard from you in ${days} days`,
    body: "Quick check-in?",
  }),

  // Trade idea follow-up
  tradeIdeaFollowup: (ticker: string, days: number) => ({
    title: `Update on ${ticker}?`,
    body: `${days} days ago you had a ${ticker} trade idea. What happened?`,
  }),
};
