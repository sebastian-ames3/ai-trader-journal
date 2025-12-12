# Spec 12: Phase 5 Mobile Deployment

**Status:** In Progress
**Priority:** High
**Created:** 2024-12-11
**Last Updated:** 2024-12-11

## Overview

Complete the mobile deployment phase by generating PWA assets, setting up Capacitor for native app packaging, and preparing for App Store submission.

## Goals

1. Generate production-ready PWA splash screens and App Store screenshots
2. Create apple-touch-icon and favicon assets
3. Set up Capacitor for iOS/Android native app packaging
4. Configure native permissions (camera, microphone, storage)
5. Prepare App Store submission materials

## Non-Goals

- Push notifications (requires VAPID keys - separate spec)
- Background sync implementation (enhancement for later)
- App Store account setup (manual process)

---

## Feature 1: PWA Asset Generation

### 1.1 Requirements

Generate all required PWA assets for iOS and Android installation experience.

### 1.2 Assets Required

| Asset | Dimensions | Purpose | Location |
|-------|------------|---------|----------|
| apple-touch-icon.png | 180x180 | iOS home screen icon | `/public/apple-touch-icon.png` |
| favicon-16x16.png | 16x16 | Browser tab | `/public/favicon-16x16.png` |
| favicon-32x32.png | 32x32 | Browser tab | `/public/favicon-32x32.png` |
| favicon.ico | 48x48 | Legacy browsers | `/public/favicon.ico` |
| apple-splash-1290-2796.png | 1290x2796 | iPhone 14 Pro Max | `/public/splash/` |
| apple-splash-1179-2556.png | 1179x2556 | iPhone 14 Pro | `/public/splash/` |
| apple-splash-1170-2532.png | 1170x2532 | iPhone 14/13/12 | `/public/splash/` |
| apple-splash-750-1334.png | 750x1334 | iPhone SE | `/public/splash/` |
| apple-splash-2048-2732.png | 2048x2732 | iPad Pro 12.9" | `/public/splash/` |
| apple-splash-1668-2388.png | 1668x2388 | iPad Pro 11" | `/public/splash/` |

### 1.3 Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Asset Generation Flow                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Script reads base icon (icon-512.png)                       │
│     └── Source: /public/icon-512.png                            │
│                                                                  │
│  2. Generate splash screens using canvas/sharp                   │
│     ├── Background: gradient (#171717 → #0a0a0a)               │
│     ├── Logo: Centered icon-512.png                             │
│     ├── Text: "AI Trader Journal"                               │
│     └── Output: /public/splash/*.png                            │
│                                                                  │
│  3. Generate favicons using sharp resize                         │
│     ├── 180x180 → apple-touch-icon.png                          │
│     ├── 32x32 → favicon-32x32.png                               │
│     ├── 16x16 → favicon-16x16.png                               │
│     └── ICO → favicon.ico                                       │
│                                                                  │
│  4. Verify all files exist and are correct size                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.4 Implementation

**File:** `scripts/generate-pwa-icons.js`

```javascript
// Dependencies: sharp (image processing)
// Input: /public/icon-512.png
// Output: /public/splash/*.png, /public/*.png, /public/favicon.ico
```

### 1.5 Acceptance Criteria

- [x] All 6 splash screen images exist in `/public/splash/`
- [x] All splash screens have correct dimensions (verified programmatically)
- [x] `apple-touch-icon.png` exists and is 180x180
- [x] `favicon-32x32.png` exists and is 32x32
- [x] `favicon-16x16.png` exists and is 16x16
- [x] `favicon.ico` exists
- [ ] All images load without 404 errors in browser
- [ ] iOS PWA install shows custom splash screen (manual test)

---

## Feature 2: App Store Screenshots

### 2.1 Requirements

Generate screenshots of key app pages for App Store listings using Playwright.

### 2.2 Screenshots Required

| Screenshot | Page | Viewport | Purpose |
|------------|------|----------|---------|
| dashboard-mobile.png | `/` | 390x844 | Dashboard overview |
| journal-mobile.png | `/journal` | 390x844 | Journal entry list |
| entry-form-mobile.png | `/journal/new` | 390x844 | New entry with voice/image |
| insights-mobile.png | `/insights` | 390x844 | Weekly insights |
| coach-mobile.png | `/coach` | 390x844 | AI coach conversation |
| dashboard-desktop.png | `/` | 1280x720 | Desktop dashboard |

### 2.3 Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  Screenshot Generation Flow                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Start dev server (localhost:3000)                           │
│     └── Prerequisite: npm run dev                               │
│                                                                  │
│  2. Launch Playwright browser                                    │
│     ├── Device: iPhone 14 Pro (390x844, 3x scale)              │
│     └── Theme: Dark mode preferred                              │
│                                                                  │
│  3. For each page:                                               │
│     a. Navigate to URL                                          │
│     b. Wait for networkidle                                     │
│     c. Wait for API responses (entries, insights, etc.)         │
│     d. Verify no console errors                                 │
│     e. Capture full-page screenshot                             │
│     f. Save to /public/screenshots/                             │
│                                                                  │
│  4. Verify all screenshots exist and have content               │
│     └── Not blank/error pages                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.4 API Calls Per Page

| Page | API Calls | Expected Response |
|------|-----------|-------------------|
| `/` | `GET /api/entries`, `GET /api/streak`, `GET /api/theses` | 200 with data |
| `/journal` | `GET /api/entries?limit=50` | 200 with entries array |
| `/journal/new` | None (form page) | N/A |
| `/insights` | `GET /api/insights/weekly` | 200 with insights object |
| `/coach` | `GET /api/coach/sessions` | 200 with sessions array |

### 2.5 Acceptance Criteria

- [ ] All 6 screenshots generated successfully
- [ ] Screenshots are not blank or error pages
- [ ] Screenshots show real data (entries, insights, etc.) OR appropriate empty states
- [ ] No console errors during screenshot capture
- [ ] All API calls return 200 status
- [ ] Screenshots saved to `/public/screenshots/`
- [ ] manifest.json references correct screenshot paths

---

## Feature 3: Capacitor Setup

### 3.1 Requirements

Configure Capacitor to wrap the PWA as a native iOS and Android app.

### 3.2 Dependencies

```json
{
  "@capacitor/core": "^6.0.0",
  "@capacitor/cli": "^6.0.0",
  "@capacitor/ios": "^6.0.0",
  "@capacitor/android": "^6.0.0",
  "@capacitor/camera": "^6.0.0",
  "@capacitor/microphone": "^6.0.0",
  "@capacitor/filesystem": "^6.0.0",
  "@capacitor/splash-screen": "^6.0.0",
  "@capacitor/status-bar": "^6.0.0"
}
```

### 3.3 Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Capacitor Architecture                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐                                           │
│  │  Next.js PWA     │ ◄── Static export (next export)          │
│  │  (Web View)      │                                           │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────┐                                           │
│  │ Capacitor Bridge │ ◄── Native API access                     │
│  └────────┬─────────┘                                           │
│           │                                                      │
│     ┌─────┴─────┐                                               │
│     │           │                                                │
│     ▼           ▼                                                │
│  ┌──────┐   ┌──────────┐                                        │
│  │ iOS  │   │ Android  │                                        │
│  │ App  │   │ App      │                                        │
│  └──────┘   └──────────┘                                        │
│                                                                  │
│  Native Plugins:                                                 │
│  ├── Camera: Photo capture, gallery access                      │
│  ├── Microphone: Audio recording                                │
│  ├── Filesystem: File storage                                   │
│  ├── Splash Screen: Native splash display                       │
│  └── Status Bar: iOS status bar styling                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.4 Configuration Files

**capacitor.config.ts:**
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aitraderjournal.app',
  appName: 'AI Trader Journal',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#171717',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#171717',
    }
  }
};

export default config;
```

**next.config.mjs additions:**
```javascript
// Add output: 'export' for static generation
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true, // Required for static export
  },
};
```

### 3.5 Native Permission Configuration

**iOS (Info.plist):**
```xml
<key>NSCameraUsageDescription</key>
<string>AI Trader Journal needs camera access to capture screenshots and charts</string>
<key>NSMicrophoneUsageDescription</key>
<string>AI Trader Journal needs microphone access for voice memos</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>AI Trader Journal needs photo library access to attach images</string>
```

**Android (AndroidManifest.xml):**
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

### 3.6 Build Commands

```bash
# Initialize Capacitor
npx cap init "AI Trader Journal" com.aitraderjournal.app

# Add platforms
npx cap add ios
npx cap add android

# Build Next.js static export
npm run build && npx next export

# Sync web assets to native projects
npx cap sync

# Open native IDE
npx cap open ios      # Opens Xcode
npx cap open android  # Opens Android Studio
```

### 3.7 Acceptance Criteria

- [ ] `capacitor.config.ts` exists with correct configuration
- [ ] iOS project created in `/ios` directory
- [ ] Android project created in `/android` directory
- [ ] `next.config.mjs` updated with `output: 'export'`
- [ ] Static export generates successfully (`npm run build`)
- [ ] `npx cap sync` completes without errors
- [ ] iOS app builds in Xcode simulator
- [ ] Android app builds in Android emulator
- [ ] Camera permission works in native app
- [ ] Microphone permission works in native app
- [ ] Voice recording functions in native app
- [ ] Image capture functions in native app

---

## Feature 4: Native Media Capture Integration

### 4.1 Requirements

Enhance existing web-based media capture to use native device APIs when running in Capacitor.

### 4.2 Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              Native vs Web Media Capture                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Media Capture Request                 │    │
│  └─────────────────────────┬───────────────────────────────┘    │
│                            │                                     │
│                 ┌──────────┴──────────┐                         │
│                 │ Platform Detection  │                         │
│                 │ (Capacitor.isNative)│                         │
│                 └──────────┬──────────┘                         │
│                            │                                     │
│            ┌───────────────┼───────────────┐                    │
│            │               │               │                     │
│            ▼               ▼               ▼                     │
│     ┌──────────┐    ┌──────────┐    ┌──────────┐               │
│     │ Web PWA  │    │   iOS    │    │ Android  │               │
│     │ Browser  │    │ Native   │    │ Native   │               │
│     │ APIs     │    │ APIs     │    │ APIs     │               │
│     └────┬─────┘    └────┬─────┘    └────┬─────┘               │
│          │               │               │                      │
│          ▼               ▼               ▼                      │
│     MediaRecorder   Capacitor      Capacitor                    │
│     getUserMedia    Camera         Camera                       │
│                     Microphone     Microphone                   │
│          │               │               │                      │
│          └───────────────┴───────────────┘                      │
│                          │                                       │
│                          ▼                                       │
│                 ┌──────────────┐                                │
│                 │ Upload to R2 │                                │
│                 │ /api/upload/ │                                │
│                 └──────────────┘                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Implementation

**File:** `src/lib/nativeMedia.ts`

```typescript
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Microphone } from '@capacitor/microphone';

export const isNative = () => Capacitor.isNativePlatform();

export async function captureImage(): Promise<Blob | null> {
  if (isNative()) {
    // Use Capacitor Camera
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Prompt, // Camera or Gallery
    });
    // Convert base64 to Blob
    return base64ToBlob(image.base64String!, 'image/jpeg');
  } else {
    // Fall back to web file input
    return null; // Let web component handle
  }
}

export async function requestMicrophonePermission(): Promise<boolean> {
  if (isNative()) {
    const status = await Microphone.requestPermissions();
    return status.microphone === 'granted';
  } else {
    // Web handles via getUserMedia
    return true;
  }
}
```

### 4.4 Acceptance Criteria

- [ ] `src/lib/nativeMedia.ts` created with platform detection
- [ ] `isNative()` returns true in Capacitor, false in browser
- [ ] Camera capture works on iOS native
- [ ] Camera capture works on Android native
- [ ] Microphone recording works on iOS native
- [ ] Microphone recording works on Android native
- [ ] Web fallback continues to work in browser
- [ ] Uploaded images appear in R2 storage
- [ ] Audio files upload and transcribe successfully

---

## Integration Tests

### Test Suite: PWA Assets

**File:** `tests/pwa-assets.test.ts`

```typescript
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import sizeOf from 'image-size';

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

test.describe('PWA Assets', () => {
  test('apple-touch-icon exists with correct dimensions', () => {
    const iconPath = path.join(PUBLIC_DIR, 'apple-touch-icon.png');
    expect(fs.existsSync(iconPath)).toBe(true);
    const dimensions = sizeOf(iconPath);
    expect(dimensions.width).toBe(180);
    expect(dimensions.height).toBe(180);
  });

  test('all splash screens exist with correct dimensions', () => {
    const splashScreens = [
      { file: 'apple-splash-1290-2796.png', width: 1290, height: 2796 },
      { file: 'apple-splash-1179-2556.png', width: 1179, height: 2556 },
      { file: 'apple-splash-1170-2532.png', width: 1170, height: 2532 },
      { file: 'apple-splash-750-1334.png', width: 750, height: 1334 },
      { file: 'apple-splash-2048-2732.png', width: 2048, height: 2732 },
      { file: 'apple-splash-1668-2388.png', width: 1668, height: 2388 },
    ];

    for (const splash of splashScreens) {
      const filePath = path.join(PUBLIC_DIR, 'splash', splash.file);
      expect(fs.existsSync(filePath), `${splash.file} should exist`).toBe(true);
      const dimensions = sizeOf(filePath);
      expect(dimensions.width).toBe(splash.width);
      expect(dimensions.height).toBe(splash.height);
    }
  });

  test('manifest.json has valid screenshot references', async ({ request }) => {
    const response = await request.get('/manifest.json');
    expect(response.status()).toBe(200);
    const manifest = await response.json();

    for (const screenshot of manifest.screenshots) {
      const screenshotResponse = await request.get(screenshot.src);
      expect(screenshotResponse.status(), `${screenshot.src} should be accessible`).toBe(200);
    }
  });
});
```

### Test Suite: Screenshot Generation

**File:** `tests/screenshots.test.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('App Store Screenshots', () => {
  test('dashboard loads with real data', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check API responses
    const entriesResponse = await page.waitForResponse(
      response => response.url().includes('/api/entries') && response.status() === 200
    );
    expect(entriesResponse.status()).toBe(200);

    // Verify no console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.waitForTimeout(2000);
    expect(errors.length).toBe(0);
  });

  test('journal page loads entries', async ({ page }) => {
    await page.goto('/journal');
    await page.waitForLoadState('networkidle');

    const response = await page.waitForResponse(
      response => response.url().includes('/api/entries') && response.status() === 200
    );
    const data = await response.json();
    expect(response.status()).toBe(200);
    expect(Array.isArray(data.entries)).toBe(true);
  });

  test('insights page loads weekly data', async ({ page }) => {
    await page.goto('/insights');
    await page.waitForLoadState('networkidle');

    const response = await page.waitForResponse(
      response => response.url().includes('/api/insights/weekly') && response.status() === 200
    );
    expect(response.status()).toBe(200);
  });

  test('coach page loads sessions', async ({ page }) => {
    await page.goto('/coach');
    await page.waitForLoadState('networkidle');

    const response = await page.waitForResponse(
      response => response.url().includes('/api/coach/sessions') && response.status() === 200
    );
    expect(response.status()).toBe(200);
  });
});
```

### Test Suite: API Health Check

**File:** `tests/api-health.test.ts`

```typescript
import { test, expect } from '@playwright/test';

const API_ENDPOINTS = [
  { method: 'GET', path: '/api/entries', expectedStatus: 200 },
  { method: 'GET', path: '/api/streak', expectedStatus: 200 },
  { method: 'GET', path: '/api/theses', expectedStatus: 200 },
  { method: 'GET', path: '/api/insights/weekly', expectedStatus: 200 },
  { method: 'GET', path: '/api/coach/sessions', expectedStatus: 200 },
  { method: 'GET', path: '/api/coach/goals', expectedStatus: 200 },
  { method: 'GET', path: '/api/coach/prompts', expectedStatus: 200 },
  { method: 'GET', path: '/api/patterns', expectedStatus: 200 },
  { method: 'GET', path: '/api/dashboard/layouts', expectedStatus: 200 },
];

test.describe('API Health Check', () => {
  for (const endpoint of API_ENDPOINTS) {
    test(`${endpoint.method} ${endpoint.path} returns ${endpoint.expectedStatus}`, async ({ request }) => {
      const response = await request[endpoint.method.toLowerCase() as 'get'](endpoint.path);
      expect(response.status()).toBe(endpoint.expectedStatus);
    });
  }
});
```

### Test Suite: Media Upload

**File:** `tests/media-upload.test.ts`

```typescript
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Media Upload', () => {
  test('audio upload endpoint accepts webm', async ({ request }) => {
    // Create a minimal valid webm file
    const audioBuffer = Buffer.from([0x1A, 0x45, 0xDF, 0xA3]); // WebM magic bytes

    const response = await request.post('/api/upload/audio', {
      multipart: {
        audio: {
          name: 'test.webm',
          mimeType: 'audio/webm',
          buffer: audioBuffer,
        },
        duration: '5',
      },
    });

    // May fail with invalid file, but should not be 500
    expect([200, 400]).toContain(response.status());
  });

  test('image upload endpoint accepts jpeg', async ({ request }) => {
    // Create a minimal valid JPEG
    const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]); // JPEG magic bytes

    const response = await request.post('/api/upload/image', {
      multipart: {
        image: {
          name: 'test.jpg',
          mimeType: 'image/jpeg',
          buffer: jpegBuffer,
        },
      },
    });

    // May fail with invalid file, but should not be 500
    expect([200, 400]).toContain(response.status());
  });

  test('transcribe endpoint requires valid audio', async ({ request }) => {
    const response = await request.post('/api/transcribe', {
      multipart: {
        audio: {
          name: 'test.webm',
          mimeType: 'audio/webm',
          buffer: Buffer.from([0x1A, 0x45, 0xDF, 0xA3]),
        },
      },
    });

    // Should fail gracefully, not 500
    expect([200, 400]).toContain(response.status());
  });
});
```

---

## Definition of Done

### PWA Assets (Feature 1)
- [x] All 6 splash screen PNG files exist in `/public/splash/`
- [x] Splash screens have exact dimensions as specified
- [x] `apple-touch-icon.png` (180x180) exists
- [x] `favicon-32x32.png` and `favicon-16x16.png` exist
- [x] `favicon.ico` exists
- [ ] Integration test `pwa-assets.test.ts` passes (all assertions green)
- [ ] Manual verification: iOS PWA install shows branded splash screen

### App Store Screenshots (Feature 2)
- [ ] All 6 screenshots generated in `/public/screenshots/`
- [ ] Screenshots show actual app content (not error/blank pages)
- [ ] All referenced API calls return 200 status
- [ ] No console errors during screenshot generation
- [ ] Integration test `screenshots.test.ts` passes
- [ ] Manual verification: Screenshots look professional for store listing

### Capacitor Setup (Feature 3)
- [ ] `capacitor.config.ts` created with correct app ID/name
- [ ] `@capacitor/*` packages installed
- [ ] `npm run build` produces static export in `/out`
- [ ] `npx cap sync` completes without errors
- [ ] iOS project builds in Xcode (simulator test)
- [ ] Android project builds in Android Studio (emulator test)
- [ ] Integration test: App launches without crash

### Native Media Capture (Feature 4)
- [ ] `src/lib/nativeMedia.ts` created with platform detection
- [ ] Camera permission granted on iOS (manual test)
- [ ] Camera permission granted on Android (manual test)
- [ ] Microphone permission granted on iOS (manual test)
- [ ] Microphone permission granted on Android (manual test)
- [ ] Image capture uploads to R2 successfully
- [ ] Voice recording uploads and transcribes successfully
- [ ] Web fallback works in browser (no regression)

### All Features
- [ ] All integration tests pass: `npm run test:phase5`
- [ ] Production build succeeds: `npm run build`
- [ ] TypeScript compilation succeeds: `npm run typecheck`
- [ ] ESLint passes: `npm run lint`
- [ ] No 4xx/5xx errors on any API endpoint
- [ ] CLAUDE.md updated with Phase 5 completion status

---

## Verification Checklist

### Pre-Implementation Verification

Run before starting implementation:

```bash
# Verify current state
npm run typecheck          # Should pass
npm run build              # Should pass
npm run test:api           # Should pass (existing tests)
```

### Post-Implementation Verification

Run after completing implementation:

```bash
# Run all Phase 5 tests
npm run test:phase5

# Verify build still works
npm run build

# API health check
curl -s http://localhost:3000/api/entries | jq '.entries | length'
curl -s http://localhost:3000/api/insights/weekly | jq '.statistics'
curl -s http://localhost:3000/api/coach/sessions | jq '. | type'

# Verify assets exist
ls -la public/splash/
ls -la public/screenshots/
ls -la public/apple-touch-icon.png
```

### Features That May Fail

| Feature | Risk | Mitigation |
|---------|------|------------|
| Splash screen generation | Requires `sharp` npm package | Add dependency, handle missing gracefully |
| Capacitor static export | Next.js API routes won't work | Document that API must be hosted separately |
| Native camera | Requires physical device testing | Use simulators first, then device |
| Native microphone | iOS/Android permission differences | Test both platforms |

---

## Timeline Estimate

| Feature | Complexity | Estimated Effort |
|---------|------------|------------------|
| PWA Assets | Low | 1-2 hours |
| App Store Screenshots | Low | 1 hour |
| Capacitor Setup | Medium | 2-3 hours |
| Native Media Integration | Medium | 2-3 hours |
| Integration Tests | Medium | 2 hours |
| **Total** | | **8-11 hours** |

---

## Appendix: Package.json Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "generate:icons": "node scripts/generate-pwa-icons.js",
    "generate:screenshots": "node scripts/generate-screenshots.js",
    "cap:build": "npm run build && npx next export && npx cap sync",
    "cap:ios": "npx cap open ios",
    "cap:android": "npx cap open android",
    "test:phase5": "playwright test tests/pwa-assets.test.ts tests/screenshots.test.ts tests/api-health.test.ts tests/media-upload.test.ts"
  }
}
```
