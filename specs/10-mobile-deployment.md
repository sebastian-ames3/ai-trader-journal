# PRD: Mobile Deployment Strategy

## Overview

**Goal:** Deploy the AI Trader Journal so you can easily use it on your phone - either through enhanced PWA experience or native app store distribution.

**Options Evaluated:**
1. **Enhanced PWA** (Recommended for MVP)
2. **Capacitor** (For App Store if needed)
3. **React Native/Expo** (Full rewrite - not recommended)

---

## Recommendation Summary

| Approach | Effort | App Store | Offline | Push | Best For |
|----------|--------|-----------|---------|------|----------|
| **Enhanced PWA** | Low (2-3 days) | No | Yes | Yes* | MVP, quick deployment |
| **Capacitor** | Medium (1 week) | Yes | Yes | Yes | App Store presence |
| **React Native** | High (months) | Yes | Yes | Yes | Long-term native feel |

**Recommendation:** Start with **Enhanced PWA** (immediate), then add **Capacitor** if App Store presence is important.

*iOS push notifications via PWA require iOS 16.4+ and user to add to Home Screen

---

## Option 1: Enhanced PWA (Recommended MVP)

### What It Is
A Progressive Web App that can be "installed" to your home screen and works like a native app.

### Current State
The app already has basic PWA support via `next-pwa`. We need to enhance it for a better mobile experience.

### Benefits
- **No app store approval needed** - Deploy instantly
- **One codebase** - Same as web
- **Auto-updates** - No version management
- **Free** - No Apple/Google developer fees

### Limitations
- **iOS Safari quirks** - Some features limited
- **No App Store presence** - Users must know URL
- **Push notifications on iOS** - Requires iOS 16.4+, user must add to Home Screen

### Implementation

**1. Enhanced Manifest (`public/manifest.json`):**
```json
{
  "name": "AI Trader Journal",
  "short_name": "Trader Journal",
  "description": "AI-powered trading psychology journal",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#171717",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/dashboard.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Dashboard"
    },
    {
      "src": "/screenshots/journal.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Journal"
    }
  ],
  "categories": ["finance", "productivity"],
  "shortcuts": [
    {
      "name": "New Entry",
      "short_name": "New",
      "description": "Create a new journal entry",
      "url": "/journal/new",
      "icons": [{ "src": "/icons/shortcut-new.png", "sizes": "96x96" }]
    },
    {
      "name": "View Journal",
      "short_name": "Journal",
      "description": "View your journal entries",
      "url": "/journal",
      "icons": [{ "src": "/icons/shortcut-journal.png", "sizes": "96x96" }]
    }
  ]
}
```

**2. Apple-Specific Meta Tags (`layout.tsx`):**
```tsx
export const metadata: Metadata = {
  // ... existing metadata
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Trader Journal',
    startupImage: [
      {
        url: '/splash/apple-splash-2048-2732.png',
        media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)'
      },
      {
        url: '/splash/apple-splash-1170-2532.png',
        media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)'
      },
      // Add more sizes for different devices
    ]
  }
};
```

**3. Install Prompt Component (Enhanced):**
```tsx
// components/InstallPrompt.tsx
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Share, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Check if dismissed recently
    const dismissedAt = localStorage.getItem('install-prompt-dismissed');
    if (dismissedAt && Date.now() - parseInt(dismissedAt) < 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    // Android/Chrome install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    if (isIOS && !isInStandaloneMode) {
      setShowIOSPrompt(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('install-prompt-dismissed', Date.now().toString());
  };

  if (dismissed || (!deferredPrompt && !showIOSPrompt)) return null;

  return (
    <Card className="fixed bottom-20 left-4 right-4 z-50 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base">Install App</CardTitle>
          <Button variant="ghost" size="sm" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Add to your home screen for the best experience
        </CardDescription>
      </CardHeader>
      <CardContent>
        {deferredPrompt ? (
          <Button onClick={handleInstall} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Install Now
          </Button>
        ) : showIOSPrompt ? (
          <div className="text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              Tap <Share className="h-4 w-4" /> then "Add to Home Screen"
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
```

**4. Splash Screens (iOS):**

Generate splash screens for all iOS device sizes:
```bash
# Use pwa-asset-generator
npx pwa-asset-generator ./public/icon.png ./public/splash \
  --splash-only --type png --background "#171717"
```

**5. Service Worker (Enhanced):**
```javascript
// public/sw.js
const CACHE_VERSION = 'v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/journal',
  '/journal/new',
  '/insights',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install: Cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network first, cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // API requests: Network only (let offline queue handle)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Static assets: Cache first
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request))
    );
    return;
  }

  // Dynamic content: Network first, cache fallback
  event.respondWith(
    fetch(request)
      .then(response => {
        const clone = response.clone();
        caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, clone));
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};

  event.waitUntil(
    self.registration.showNotification(data.title || 'Trader Journal', {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: { url: data.url || '/' },
      actions: data.actions || []
    })
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-entries') {
    event.waitUntil(syncOfflineEntries());
  }
});

async function syncOfflineEntries() {
  // This is handled by the main app via IndexedDB
  // Broadcast to any open clients
  const allClients = await clients.matchAll();
  allClients.forEach(client => {
    client.postMessage({ type: 'SYNC_REQUESTED' });
  });
}
```

### PWA Tasks

- [ ] **PWA-DEPLOY-1**: Generate all icon sizes (72-512px)
- [ ] **PWA-DEPLOY-2**: Generate iOS splash screens
- [ ] **PWA-DEPLOY-3**: Update manifest.json with full configuration
- [ ] **PWA-DEPLOY-4**: Add Apple-specific meta tags to layout
- [ ] **PWA-DEPLOY-5**: Enhance InstallPrompt component
- [ ] **PWA-DEPLOY-6**: Enhance service worker
- [ ] **PWA-DEPLOY-7**: Test on iOS Safari (add to home screen)
- [ ] **PWA-DEPLOY-8**: Test on Android Chrome (install prompt)
- [ ] **PWA-DEPLOY-9**: Test offline functionality
- [ ] **PWA-DEPLOY-10**: Set up custom domain (e.g., app.traderjournal.com)

### How to Use (For You)

**On iPhone:**
1. Open Safari → Navigate to your app URL
2. Tap Share button (bottom center)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" in the top right
5. App icon appears on home screen - tap to launch

**On Android:**
1. Open Chrome → Navigate to your app URL
2. Tap the install banner OR
3. Tap three-dot menu → "Install app" or "Add to Home Screen"
4. App icon appears - tap to launch

---

## Option 2: Capacitor (App Store Distribution)

### What It Is
Capacitor wraps your web app in a native shell, allowing distribution through App Store and Google Play.

### When to Use
- You want App Store presence
- You need native features PWA can't provide
- Users expect to find you in the app store

### Benefits
- **App Store presence** - Discoverability
- **Full native APIs** - All device features
- **Push notifications** - Reliable on all platforms
- **Native feel** - Smooth animations, haptics

### Costs
- **Apple Developer Account**: $99/year
- **Google Play Developer**: $25 one-time
- **Build time**: ~1 week initial setup
- **Maintenance**: App store updates, reviews

### Implementation

**1. Install Capacitor:**
```bash
npm install @capacitor/core @capacitor/cli
npx cap init "AI Trader Journal" "com.traderjournal.app"
```

**2. Configure (`capacitor.config.ts`):**
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.traderjournal.app',
  appName: 'AI Trader Journal',
  webDir: 'out', // Next.js static export
  server: {
    // For development
    url: 'http://localhost:3000',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#171717',
      showSpinner: false
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  },
  ios: {
    contentInset: 'automatic',
    scheme: 'Trader Journal'
  },
  android: {
    backgroundColor: '#171717'
  }
};

export default config;
```

**3. Add Native Platforms:**
```bash
npm install @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android
```

**4. Required Next.js Changes:**

For Capacitor, you need static export:
```javascript
// next.config.mjs
const nextConfig = {
  output: 'export', // Static HTML export
  images: {
    unoptimized: true // Required for static export
  },
  // ... rest of config
};
```

**5. Build & Deploy:**
```bash
# Build Next.js
npm run build

# Sync with native projects
npx cap sync

# Open in Xcode (iOS)
npx cap open ios

# Open in Android Studio
npx cap open android
```

**6. Native Plugins for Enhanced Features:**
```bash
# Push notifications
npm install @capacitor/push-notifications

# Camera (for screenshots)
npm install @capacitor/camera

# Haptics
npm install @capacitor/haptics

# Status bar control
npm install @capacitor/status-bar
```

### Capacitor Tasks

- [ ] **CAP-1**: Install and configure Capacitor
- [ ] **CAP-2**: Modify Next.js for static export
- [ ] **CAP-3**: Set up iOS project in Xcode
- [ ] **CAP-4**: Set up Android project in Android Studio
- [ ] **CAP-5**: Configure push notifications (native)
- [ ] **CAP-6**: Add native splash screens
- [ ] **CAP-7**: Test on iOS simulator
- [ ] **CAP-8**: Test on Android emulator
- [ ] **CAP-9**: Create Apple Developer account
- [ ] **CAP-10**: Create Google Play Developer account
- [ ] **CAP-11**: Submit to TestFlight (iOS beta)
- [ ] **CAP-12**: Submit to Google Play Internal Testing
- [ ] **CAP-13**: App Store submission
- [ ] **CAP-14**: Google Play submission

---

## Option 3: React Native (Not Recommended)

### Why Not
- **Full rewrite required** - Different component library
- **Months of work** - Re-implement everything
- **Code duplication** - Maintain web + native
- **Overkill for this app** - Journal doesn't need 60fps animations

### When It Makes Sense
- Building a highly interactive app (games, complex animations)
- Need performance-critical features
- Have resources for separate mobile team
- Web is secondary to mobile

**Verdict:** Not recommended for AI Trader Journal. PWA or Capacitor provides everything needed.

---

## Recommended Deployment Path

### Phase 1: Enhanced PWA (Now)
**Timeline:** 2-3 days
**Cost:** $0

1. Generate icons and splash screens
2. Update manifest and meta tags
3. Enhance service worker
4. Test installation on your devices
5. Deploy to Vercel with custom domain

**Result:** You can use the app on your phone immediately via home screen icon.

### Phase 2: Capacitor (If Needed)
**Timeline:** 1 week
**Cost:** $124 (developer accounts)

Only pursue if:
- You want App Store presence for others to find
- PWA push notifications aren't reliable enough
- You need features PWA can't provide

### Phase 3: Continuous Improvement
- Monitor PWA usage analytics
- Gather feedback on mobile experience
- Iterate on mobile-specific features

---

## Quick Start: Get on Your Phone Today

**Fastest path to using on your phone:**

1. **Deploy to Vercel** (if not already):
   ```bash
   vercel --prod
   ```

2. **On your iPhone:**
   - Open Safari
   - Go to your Vercel URL
   - Tap Share → Add to Home Screen
   - Done! App icon on your home screen

3. **On Android:**
   - Open Chrome
   - Go to your Vercel URL
   - Tap "Install" when prompted (or Menu → Add to Home Screen)
   - Done!

That's it. You can start using the app on your phone right now with the existing PWA support.

---

## Custom Domain Setup

For a professional feel, set up a custom domain:

**Option A: Subdomain**
- `app.yourname.com` or `journal.yourname.com`

**Option B: Dedicated domain**
- `traderjournal.app` (~$12/year)

**Vercel Domain Setup:**
1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain
3. Update DNS records as instructed
4. SSL is automatic

---

## Testing Checklist

### PWA Testing
- [ ] Install prompt appears (Android)
- [ ] Add to Home Screen works (iOS)
- [ ] App opens in standalone mode (no browser UI)
- [ ] Splash screen displays correctly
- [ ] Offline page works when disconnected
- [ ] App updates when new version deployed
- [ ] Push notifications work (if implemented)

### Mobile UX Testing
- [ ] All touch targets ≥ 44px
- [ ] No horizontal scroll
- [ ] Keyboard doesn't cover inputs
- [ ] Forms work with mobile keyboards
- [ ] Voice recording works
- [ ] Camera/gallery access works

---

## Success Metrics

| Metric | Target |
|--------|--------|
| PWA Install Rate | > 50% of mobile visitors |
| Mobile Session Duration | > 3 minutes |
| Mobile Entry Creation | > 30% of total entries |
| Offline Entries Synced | 100% sync success |
| Push Notification Opt-in | > 40% |

---

## Summary

**For your immediate need (using on phone):**
→ PWA is already functional. Just add to home screen.

**For polished experience:**
→ Implement Enhanced PWA tasks (2-3 days)

**For App Store presence (future):**
→ Add Capacitor wrapper (1 week + $124)

**Not recommended:**
→ React Native rewrite (months of work, unnecessary)
