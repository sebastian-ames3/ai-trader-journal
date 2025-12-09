/**
 * Push Notification Service Worker
 *
 * Handles push notifications for the AI Trader Journal app.
 * This is a separate service worker for push events that works alongside
 * the main Workbox service worker (sw.js) for caching.
 */

// Listen for push events
self.addEventListener('push', (event) => {
  console.log('[Push SW] Push received:', event);

  if (!event.data) {
    console.log('[Push SW] No data in push event');
    return;
  }

  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    console.error('[Push SW] Failed to parse push data:', e);
    payload = {
      title: 'AI Trader Journal',
      body: event.data.text(),
    };
  }

  const {
    title = 'AI Trader Journal',
    body = 'You have a new notification',
    icon = '/icon-192.png',
    badge = '/icon-72.png',
    tag,
    data = {},
    actions = [],
  } = payload;

  const options = {
    body,
    icon,
    badge,
    tag: tag || 'default',
    data,
    actions,
    vibrate: [100, 50, 100],
    requireInteraction: true,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Push SW] Notification click:', event);

  event.notification.close();

  const { action } = event;
  const { url, notificationId, type, trigger } = event.notification.data || {};

  // Track engagement if we have a notification ID
  if (notificationId) {
    fetch('/api/notifications/engaged', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId }),
    }).catch((err) => console.error('[Push SW] Failed to track engagement:', err));
  }

  // Handle different actions
  let targetUrl = '/';

  if (action === 'journal') {
    targetUrl = '/journal/new';
  } else if (action === 'dismiss') {
    // Just close the notification
    return;
  } else if (action === 'snooze') {
    // Snooze for 3 hours
    if (notificationId) {
      fetch('/api/notifications/snooze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, hours: 3 }),
      }).catch((err) => console.error('[Push SW] Failed to snooze:', err));
    }
    return;
  } else if (url) {
    targetUrl = url;
  }

  // Focus existing window or open new one
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to find an existing window
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // Open new window if no existing window found
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle notification close (for analytics)
self.addEventListener('notificationclose', (event) => {
  console.log('[Push SW] Notification closed:', event);

  const { notificationId } = event.notification.data || {};

  if (notificationId) {
    fetch('/api/notifications/dismissed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId }),
    }).catch((err) => console.error('[Push SW] Failed to track dismissal:', err));
  }
});

// Handle service worker installation
self.addEventListener('install', (event) => {
  console.log('[Push SW] Installing...');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
  console.log('[Push SW] Activating...');
  // Claim all clients immediately
  event.waitUntil(clients.claim());
});

console.log('[Push SW] Service worker loaded');
