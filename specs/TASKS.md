# Implementation Tasks

This document contains the complete task lists for all phases of the AI Trader Journal. Tasks are organized by phase and feature, with dependencies noted.

---

## Quick Navigation

- [Phase 0: OpenAI Integration Setup](#phase-0-openai-integration-setup)
- [Phase 1: MVP Polish](#phase-1-mvp-polish)
- [Phase 2: Engagement & Capture](#phase-2-engagement--capture)
- [Phase 3: Power User Features](#phase-3-power-user-features)
- [Phase 4: Mobile Deployment](#phase-4-mobile-deployment)

---

## Architecture Overview

**Single Provider: OpenAI (GPT-5 Family)**

| Model | Price (per 1M tokens) | Use For |
|-------|----------------------|---------|
| GPT-5 Nano | $0.05 / $0.40 | High-volume routine tasks |
| GPT-5 Mini | $0.25 / $2.00 | Vision, balanced tasks |
| GPT-5 | $1.25 / $10.00 | Complex reasoning, insights |
| Whisper | $0.006/min | Voice transcription |
| text-embedding-3-small | $0.02 | Semantic similarity |

**Total Estimated Cost: ~$6-8/month** for moderate usage (including Python service hosting)

---

## Recommended Implementation Order

```
Phase 0: Foundation (Prerequisites)
├── OpenAI SDK setup
└── Model constants

Phase 1: UX/UI Redesign (HIGH PRIORITY)
├── 1A: Design System Foundation (colors, typography, spacing)
├── 1B: Bottom Navigation + Center FAB
├── 1C: Card & Component Refresh
├── 1D: Dashboard Layout Redesign
└── 1E: Dark Mode Enhancement

Phase 2: Engagement & Capture (Core Differentiation)
├── 2A: Frictionless Capture (Voice + Screenshots + Quick Capture)
├── 2B: Proactive Engagement (Notifications + Market Context)
├── 2C: Context Surfacing (Ticker Intelligence)
└── 2D: Pattern Recognition (Behavioral Insights + Trade Patterns)

Phase 3: Trade Management & Intelligence
├── 3A: Thesis-Based Trade Management (NEW - replaces complex options analytics)
├── 3B: AI Trading Coach
├── 3C: Social/Mentor Sharing
└── 3D: Custom Dashboard

Phase 4: Mobile Deployment
├── 4A: PWA Enhancement
├── 4B: Capacitor Migration (Optional)
└── 4C: App Store Submission
```

### Key Architecture Decisions

**Removed (over-engineered for a journal):**
- ❌ Black-Scholes pricing calculations
- ❌ Greeks calculation engine
- ❌ P/L curve visualization
- ❌ Strategy detection algorithm
- ❌ Position-level leg tracking

**Added (journal-first approach):**
- ✅ Thesis-based trade grouping (user defines relationships)
- ✅ Screenshot data extraction via GPT-4o-mini vision
- ✅ Pattern learning from user's own historical data
- ✅ AI reminders of past lessons when entering similar trades

---

## Phase 0: OpenAI Integration Setup

### Initial Setup (Prerequisite for all AI features)

- [ ] **SETUP-1**: Install OpenAI SDK
  ```bash
  npm install openai
  ```

- [ ] **SETUP-2**: Create OpenAI client singleton
  ```typescript
  // src/lib/openai.ts
  import OpenAI from 'openai';

  export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  ```

- [ ] **SETUP-3**: Update environment variables
  - Ensure `OPENAI_API_KEY` is set locally
  - Add to Vercel environment

- [ ] **SETUP-4**: Create model constants
  ```typescript
  export const MODELS = {
    NANO: 'gpt-5-nano',      // Cheap, fast
    MINI: 'gpt-5-mini',      // Vision, balanced
    FLAGSHIP: 'gpt-5',       // Complex reasoning
    WHISPER: 'whisper-1',
    EMBEDDING: 'text-embedding-3-small'
  };
  ```

---

## Phase 1: UX/UI Redesign (HIGH PRIORITY)

**PRD:** `specs/11-ux-ui-design-system.md`

**Design References:** `/design/` folder (Sharpen, 5 Minute Journal)

### 1A: Design System Foundation

- [ ] **DESIGN-1**: Update globals.css with new color system
  ```css
  /* Dark theme (primary) */
  --bg-dark: #0D0D0D;
  --bg-card-dark: #1A1A1A;
  --accent-primary: #F5A623; /* Amber */
  ```

- [ ] **DESIGN-2**: Add new CSS custom properties
  - Glassmorphism variables
  - Shadow presets
  - Border radius tokens (20px cards, 14px buttons)

- [ ] **DESIGN-3**: Update tailwind.config.js
  - Add amber accent colors
  - Add custom border radius values
  - Add shadow presets

- [ ] **DESIGN-4**: Create Typography scale
  - Large friendly greetings
  - Clear hierarchy
  - Inter font optimization

### 1B: Bottom Navigation + Center FAB

- [ ] **NAV-1**: Create BottomNavigation component
  - 5 items: Home, Calendar, [FAB], Guides, Insights
  - FAB raised above bar with amber background
  - Backdrop blur on nav bar

- [ ] **NAV-2**: Update layout for mobile
  - Hide top nav on mobile
  - Add bottom safe area padding
  - Ensure content doesn't overlap nav

- [ ] **NAV-3**: Implement nav item states
  - Active state (amber color, scale)
  - Inactive state (gray)
  - Transition animations

- [ ] **NAV-4**: Connect FAB to QuickCapture
  - Opens bottom sheet on tap
  - Haptic feedback (if supported)

### 1C: Card & Component Refresh

- [ ] **CARD-1**: Update Card component
  - Increase border radius to 20px
  - Add subtle shadows
  - Glassmorphism variant for overlays

- [ ] **CARD-2**: Redesign entry cards
  - Left color indicator strip
  - Title + preview + timestamp layout
  - Mood emoji prominent

- [ ] **CARD-3**: Redesign mood selector
  - 5 large emoji buttons (48px)
  - Horizontal layout
  - Selected state with color + scale

- [ ] **CARD-4**: Create CalendarWeekStrip component
  - Horizontal week view
  - Today highlighted with amber pill
  - Tap to filter entries

- [ ] **CARD-5**: Update buttons
  - Rounded (14px)
  - Shadow on primary buttons
  - Active scale effect (0.95)

### 1D: Dashboard Layout Redesign

- [ ] **DASH-1**: Implement greeting header
  - "Good Morning, [Name]!" with sun/moon icon
  - Date display
  - Personalized based on time of day

- [ ] **DASH-2**: Add calendar week strip
  - Below greeting
  - Shows current week
  - Today auto-selected

- [ ] **DASH-3**: Redesign streak card
  - Gradient background (amber → orange)
  - Animated fire emoji
  - Progress toward next milestone

- [ ] **DASH-4**: Create action cards
  - "Morning reflection" / "Evening reflection"
  - Icon + title + subtitle
  - Status indicator (completed/pending)

- [ ] **DASH-5**: Add motivational quote card
  - Glassmorphism background
  - Rotating quotes
  - Dismissible

### 1E: Dark Mode Enhancement

- [ ] **DARK-1**: Make dark mode primary
  - Default to dark on first visit
  - Respect system preference
  - Manual toggle available

- [ ] **DARK-2**: Refine dark mode colors
  - Deep black backgrounds (#0D0D0D)
  - Subtle card elevation (#1A1A1A)
  - Amber accents pop on dark

- [ ] **DARK-3**: Test contrast ratios
  - Ensure WCAG AA compliance
  - Adjust muted text colors
  - Verify in various lighting

### 1F: Micro-Interactions & Polish

- [ ] **MICRO-1**: Add button press animations
  - Scale down on press (100ms)
  - Color shift feedback

- [ ] **MICRO-2**: Add card hover/tap states
  - Subtle lift on hover
  - Scale down on tap (0.98)

- [ ] **MICRO-3**: Add success animations
  - Checkmark animation on save
  - Confetti on streak milestones

- [ ] **MICRO-4**: Add skeleton loaders
  - Match card shapes
  - Shimmer animation

- [ ] **MICRO-5**: Add pull-to-refresh
  - Custom animation
  - Haptic feedback

---

## Phase 2: Engagement & Capture

### 2A: Frictionless Capture

**PRD:** `specs/01-frictionless-capture.md`

#### Cloud Storage Setup

- [ ] **STORAGE-1**: Create Cloudflare R2 bucket
  - Sign up for Cloudflare (if needed)
  - Create R2 bucket named `trader-journal-media`
  - Enable public access for reads
  - Generate API credentials

- [ ] **STORAGE-2**: Install AWS S3 SDK (R2 compatible)
  ```bash
  npm install @aws-sdk/client-s3
  ```

- [ ] **STORAGE-3**: Create storage service (`src/lib/storage.ts`)

- [ ] **STORAGE-4**: Create upload API route
  - `POST /api/upload` - Accept multipart form data
  - Validate file types and sizes
  - Return public URL

#### Database Schema Updates

- [ ] **SCHEMA-1**: Update Entry model for media
  ```prisma
  model Entry {
    // ... existing fields
    audioUrl        String?
    audioDuration   Int?
    transcription   String?
    imageUrls       String[]
    imageAnalyses   Json?
    captureMethod   CaptureMethod @default(TEXT)
  }

  enum CaptureMethod {
    TEXT
    VOICE
    SCREENSHOT
    QUICK_CAPTURE
  }
  ```

- [ ] **SCHEMA-2**: Run migration
  ```bash
  npx prisma migrate dev --name add_media_fields
  ```

#### Voice Recording

- [ ] **VOICE-1**: Create VoiceRecorder component
  - MediaRecorder API for audio capture
  - Visual pulsing indicator
  - Recording timer
  - Max 5 minute recording

- [ ] **VOICE-2**: Create transcription API route (`POST /api/transcribe`)
  - Accept audio file
  - Call Whisper API
  - Return transcription text

- [ ] **VOICE-3**: Create AudioPlayer component
  - Play/pause controls
  - Progress bar
  - Duration display

- [ ] **VOICE-4**: Integrate voice into entry form
  - Add microphone button
  - Auto-populate content with transcription
  - Save audioUrl to entry

#### Screenshot Analysis

- [ ] **IMG-1**: Create ImageCapture component
  - Camera capture (mobile)
  - File picker
  - Drag and drop (desktop)
  - Image preview

- [ ] **IMG-2**: Create image analysis API route (`POST /api/analyze/image`)
  - Accept image URL
  - Call GPT-5 Mini with vision
  - Return structured analysis

- [ ] **IMG-3**: Integrate images into entry form
  - Add camera button
  - Show image previews
  - Display analysis results

#### Quick Capture Mode

- [ ] **QUICK-1**: Create QuickCapture component
  - Minimal UI: textarea + voice + image
  - No required fields
  - Large submit button

- [ ] **QUICK-2**: Create auto-inference API (`POST /api/infer`)
  - Accept content text
  - Use GPT-5 Nano to infer type, mood, conviction, ticker

- [ ] **QUICK-3**: Update FAB to open quick capture

### 2B: Proactive Engagement

**PRD:** `specs/02-proactive-engagement.md`

#### Push Notifications Setup

- [ ] **PUSH-1**: Generate VAPID keys
  ```bash
  npx web-push generate-vapid-keys
  ```

- [ ] **PUSH-2**: Install web-push
  ```bash
  npm install web-push
  ```

- [ ] **PUSH-3**: Create PushSubscription schema

- [ ] **PUSH-4**: Create subscription API routes
  - `POST /api/notifications/subscribe`
  - `DELETE /api/notifications/unsubscribe`

- [ ] **PUSH-5**: Update service worker for push events

#### Time-Based Prompts

- [ ] **TIME-1**: Create daily reminder cron job
  - `app/api/cron/daily-reminder/route.ts`
  - Find users who haven't journaled today
  - Send push notifications

- [ ] **TIME-2**: Configure Vercel cron (`vercel.json`)

- [ ] **TIME-3**: Create in-app reminder banner

- [ ] **TIME-4**: Create notification preferences UI

#### Market Monitoring

- [ ] **MKT-1**: Create market data fetching function
  - Fetch SPY, VIX from yfinance service

- [ ] **MKT-2**: Create MarketCondition schema

- [ ] **MKT-3**: Create market check cron job

- [ ] **MKT-4**: Implement trigger logic (SPY ±2%, VIX >25)

- [ ] **MKT-5**: Create market alert banner component

#### Historical Context (Embeddings)

- [ ] **EMB-1**: Enable pgvector in Supabase
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  ALTER TABLE "Entry" ADD COLUMN embedding vector(1536);
  ```

- [ ] **EMB-2**: Create embedding generation function

- [ ] **EMB-3**: Generate embeddings on entry creation

- [ ] **EMB-4**: Backfill embeddings for existing entries

- [ ] **EMB-5**: Create similarity search API

- [ ] **EMB-6**: Build "From Your Past Self" component

### 2C: Context Surfacing

**PRD:** `specs/04-context-surfacing.md`

#### Ticker Detection

- [ ] **TICK-1**: Create ticker detection function
  - Regex for $TICKER and TICKER patterns
  - Filter false positives
  - Optional GPT-5 Nano validation

- [ ] **TICK-2**: Add ticker detection to entry form
  - Detect on input change (debounced)
  - Show detected tickers

#### Market Data Context

- [ ] **CTX-1**: Extend yfinance service with IV analysis
  - Add `/api/iv-analysis` endpoint
  - Calculate IV from ATM options
  - Calculate HV20, HV30, IV rank

- [ ] **CTX-2**: Create ticker context API (`GET /api/context/ticker`)

- [ ] **CTX-3**: Build context panel UI
  - Price, change, 52W range
  - IV, HV, IV rank
  - Collapsible design

#### Historical Entry Context

- [ ] **HIST-1**: Create TickerMention model
  ```prisma
  model TickerMention {
    id        String @id @default(cuid())
    ticker    String
    entryId   String
    @@index([ticker])
  }
  ```

- [ ] **HIST-2**: Create ticker history API

- [ ] **HIST-3**: Build history card component

#### Smart Insights

- [ ] **INSIGHT-1**: Create GPT-5 insight generation

- [ ] **INSIGHT-2**: Add insight to context panel

- [ ] **INSIGHT-3**: Add entry review context (what happened after)

### 2D: Pattern Recognition

**PRD:** `specs/03-pattern-recognition.md`

#### Pattern Infrastructure

- [ ] **PAT-1**: Create PatternInsight schema
  ```prisma
  model PatternInsight {
    id              String      @id @default(cuid())
    patternType     PatternType
    patternName     String
    description     String
    occurrences     Int
    trend           Trend
    confidence      Float
    relatedEntryIds String[]
    evidence        String[]
    isActive        Boolean     @default(true)
  }
  ```

- [ ] **PAT-2**: Backfill market conditions for entries

#### Pattern Detection

- [ ] **DETECT-1**: Create bias frequency analysis

- [ ] **DETECT-2**: Create market correlation analysis

- [ ] **DETECT-3**: Create pattern detection cron job (daily at 2 AM ET)

#### Pattern Display

- [ ] **DISP-1**: Add patterns to weekly insights

- [ ] **DISP-2**: Create monthly report page

- [ ] **DISP-3**: Build pattern detail view

#### Real-Time Alerts

- [ ] **ALERT-1**: Create draft pattern checking

- [ ] **ALERT-2**: Build pattern alert UI

- [ ] **ALERT-3**: Create pattern breaking recognition

---

## Phase 3: Trade Management & Intelligence

### 3A: Thesis-Based Trade Management

**PRD:** `specs/06-trade-management.md`

**Philosophy:** User groups related trades under a "thesis" (trading idea). We aggregate P/L across the thesis, capture reasoning for adjustments, and learn patterns over time. NO complex options analytics - just smart journaling.

#### Database Schema (Week 1)

- [ ] **THESIS-1**: Create Prisma schema for TradingThesis model
  - name, ticker, direction, originalThesis
  - status (ACTIVE/CLOSED/EXPIRED)
  - aggregated P/L fields

- [ ] **THESIS-2**: Create Trade model
  - action type (INITIAL/ADD/REDUCE/ROLL/CONVERT/CLOSE)
  - description, debitCredit, quantity
  - extractedData (flexible JSON)
  - reasoningNote, attachments

- [ ] **THESIS-3**: Create Attachment model
  - type (IMAGE/AUDIO/PDF)
  - extractedText, extractedData
  - url, filename

- [ ] **THESIS-4**: Run Prisma migration
  ```bash
  npx prisma migrate dev --name add_thesis_trade_models
  ```

#### API Endpoints (Week 1-2)

- [ ] **API-1**: Thesis CRUD endpoints
  - `POST /api/theses` - Create thesis
  - `GET /api/theses` - List (filter by status, ticker)
  - `GET /api/theses/:id` - Get with trades
  - `POST /api/theses/:id/close` - Close with outcome

- [ ] **API-2**: Trade endpoints
  - `POST /api/trades` - Log trade (with optional thesis link)
  - `PATCH /api/trades/:id` - Update trade
  - `POST /api/trades/:id/close` - Close with P/L

- [ ] **API-3**: Attachment upload endpoint
  - `POST /api/upload` - Accept images, audio, PDF
  - Store in Cloudflare R2
  - Return URL

#### Screenshot Data Extraction (Week 2)

- [ ] **EXTRACT-1**: Create extraction API
  - `POST /api/extract` - Accept image URL
  - Use GPT-4o-mini with vision
  - Return structured trade data

- [ ] **EXTRACT-2**: Support multiple screenshot types
  - OptionStrat P/L diagrams
  - ThinkorSwim option chains
  - Order confirmations
  - Volatility charts

- [ ] **EXTRACT-3**: Create extraction preview UI
  - Show extracted data
  - Allow user to edit/correct
  - Save to trade

#### Thesis UI (Week 2-3)

- [ ] **UI-1**: Create thesis list page
  - Active theses with P/L
  - Recently closed section
  - Create new thesis button

- [ ] **UI-2**: Create thesis detail page
  - Header with name, ticker, direction
  - Aggregate P/L display
  - Original thesis text

- [ ] **UI-3**: Create trade timeline component
  - Chronological list of trades
  - Action type badges (INITIAL, ADD, ROLL, etc.)
  - Attachments inline
  - Reasoning notes

- [ ] **UI-4**: Create "Log Trade" form
  - Action type selector
  - Description textarea
  - Debit/credit input
  - Attachment upload
  - Link to thesis dropdown

- [ ] **UI-5**: Create "Close Thesis" flow
  - Outcome selector (WIN/LOSS/BREAKEVEN)
  - Lessons learned textarea
  - AI summary generation

#### Pattern Learning (Week 3-4)

- [ ] **LEARN-1**: Create pattern analysis function
  - Analyze closed theses for patterns
  - IV/HV correlations
  - Adjustment timing patterns
  - Direction accuracy

- [ ] **LEARN-2**: Store learned patterns
  - Per-thesis tags
  - User-level insights

- [ ] **LEARN-3**: Create reminders API
  - `POST /api/patterns/reminders`
  - Check against user's history
  - Return relevant warnings/lessons

- [ ] **LEARN-4**: Create reminder UI
  - Display before trade submission
  - "From past theses" lessons
  - Acknowledge or reconsider options

#### Integration (Week 4)

- [ ] **INT-1**: Link journal entries to theses
  - Add thesisId to Entry model
  - Show thesis context in entry view

- [ ] **INT-2**: Add thesis selector to entry form
  - Dropdown of active theses
  - Quick create new thesis option

- [ ] **INT-3**: Show thesis P/L on dashboard
  - Active theses card
  - Total unrealized P/L

### 3B: AI Trading Coach

**PRD:** `specs/07-ai-coach.md`

#### Core Chat (Week 1-2)

- [ ] **CHAT-1**: Create chat interface component
  - Message bubbles
  - Typing indicator
  - Suggested responses

- [ ] **CHAT-2**: Implement message API endpoint (`POST /api/coach/chat`)

- [ ] **CHAT-3**: Build system prompt with user context
  - User profile
  - Recent patterns
  - Open positions

- [ ] **CHAT-4**: Add conversation persistence (CoachSession model)

- [ ] **CHAT-5**: Create entry reference parsing

#### Context & Retrieval (Week 2-3)

- [ ] **CTX-1**: Enable pgvector for embeddings (if not done in 2B)

- [ ] **CTX-2**: Generate embeddings for existing entries

- [ ] **CTX-3**: Implement semantic search for relevant entries

- [ ] **CTX-4**: Add entry embedding on creation

- [ ] **CTX-5**: Create context injection for conversations

#### Proactive Engagement (Week 3-4)

- [ ] **PROACT-1**: Implement trigger detection system

- [ ] **PROACT-2**: Create CoachPrompt database model

- [ ] **PROACT-3**: Build prompt display component

- [ ] **PROACT-4**: Add triggers on entry creation

- [ ] **PROACT-5**: Add triggers on session start

#### Goals & Progress (Week 4-5)

- [ ] **GOAL-1**: Create CoachGoal database schema

- [ ] **GOAL-2**: Build goal setting UI

- [ ] **GOAL-3**: Implement progress tracking

- [ ] **GOAL-4**: Add goal check-in prompts

- [ ] **GOAL-5**: Create progress visualization

#### Pre-Trade Checks (Week 5-6)

- [ ] **CHECK-1**: Design check-in flow UI

- [ ] **CHECK-2**: Implement structured check component

- [ ] **CHECK-3**: Connect to trade idea creation

- [ ] **CHECK-4**: Add historical comparison

- [ ] **CHECK-5**: Test and refine prompts

### 3C: Social/Mentor Sharing

**PRD:** `specs/08-social-sharing.md`

#### Share Links (Week 1-2)

- [ ] **SHARE-1**: Create ShareLink database schema

- [ ] **SHARE-2**: Implement share link creation API

- [ ] **SHARE-3**: Build public share viewer page

- [ ] **SHARE-4**: Add share button to entry cards

- [ ] **SHARE-5**: Implement redaction logic (P/L, tickers, dates)

#### Mentor System (Week 2-3)

- [ ] **MENTOR-1**: Create MentorRelationship schema

- [ ] **MENTOR-2**: Build mentor invite flow

- [ ] **MENTOR-3**: Create mentor dashboard

- [ ] **MENTOR-4**: Implement shared entry viewing

- [ ] **MENTOR-5**: Add commenting system (MentorComment)

#### Accountability (Week 3-4)

- [ ] **ACCT-1**: Create AccountabilityPair schema

- [ ] **ACCT-2**: Build partner invite flow

- [ ] **ACCT-3**: Create partner comparison widget

- [ ] **ACCT-4**: Implement nudge notifications

- [ ] **ACCT-5**: Add streak comparison

#### Social Features (Week 4-5)

- [ ] **SOCIAL-1**: Build image generation service
  - Vercel OG for shareable cards

- [ ] **SOCIAL-2**: Create shareable stats cards

- [ ] **SOCIAL-3**: Implement Discord webhook (DiscordWebhook model)

- [ ] **SOCIAL-4**: Add social share buttons

- [ ] **SOCIAL-5**: Test across platforms

### 3D: Custom Dashboard

**PRD:** `specs/09-custom-dashboard.md`

#### Core Grid System (Week 1-2)

- [ ] **GRID-1**: Install @dnd-kit for drag-and-drop
  ```bash
  npm install @dnd-kit/core @dnd-kit/sortable
  ```

- [ ] **GRID-2**: Create DashboardGrid component

- [ ] **GRID-3**: Implement responsive grid layout
  - 12-column grid
  - Mobile/tablet/desktop breakpoints

- [ ] **GRID-4**: Build basic widget wrapper

- [ ] **GRID-5**: Create DashboardLayout database model

#### Widget Library (Week 2-3)

- [ ] **WIDGET-1**: Refactor existing dashboard components into widgets
  - StreakWidget
  - WeeklyInsightsWidget
  - RecentEntriesWidget
  - etc.

- [ ] **WIDGET-2**: Create widget configuration schemas

- [ ] **WIDGET-3**: Build widget config modal

- [ ] **WIDGET-4**: Implement widget data fetching hooks

- [ ] **WIDGET-5**: Add widget loading states

#### Edit Mode (Week 3-4)

- [ ] **EDIT-1**: Create edit mode toggle

- [ ] **EDIT-2**: Implement drag-and-drop reordering

- [ ] **EDIT-3**: Build "Add Widget" panel

- [ ] **EDIT-4**: Add remove widget functionality

- [ ] **EDIT-5**: Create reset to default option

#### Layouts & Templates (Week 4-5)

- [ ] **LAYOUT-1**: Implement multiple layouts per user

- [ ] **LAYOUT-2**: Create layout switcher UI

- [ ] **LAYOUT-3**: Build template gallery
  - Default
  - Options Trader
  - Psychology Focus
  - Minimal

- [ ] **LAYOUT-4**: Add layout sharing (optional)

- [ ] **LAYOUT-5**: Create "copy layout" feature

#### Polish (Week 5-6)

- [ ] **POLISH-1**: Add smooth animations

- [ ] **POLISH-2**: Optimize performance (virtualization)

- [ ] **POLISH-3**: Mobile drag-and-drop support

- [ ] **POLISH-4**: Keyboard navigation

- [ ] **POLISH-5**: Accessibility audit

---

## Phase 4: Mobile Deployment

**PRD:** `specs/10-mobile-deployment.md`

### 4A: PWA Enhancement

- [ ] **PWA-E1**: Audit and improve web manifest
  - All required icons (192, 512, maskable)
  - Screenshots for install prompt
  - Shortcuts

- [ ] **PWA-E2**: Optimize service worker caching
  - App shell caching
  - API route caching strategies

- [ ] **PWA-E3**: Add iOS-specific meta tags
  - apple-mobile-web-app-capable
  - apple-touch-icons
  - Launch images

- [ ] **PWA-E4**: Implement background sync
  - Queue offline entries
  - Sync on reconnect

- [ ] **PWA-E5**: Test on iOS Safari and Android Chrome

### 4B: Capacitor Migration (Optional)

- [ ] **CAP-1**: Initialize Capacitor
  ```bash
  npm install @capacitor/core @capacitor/cli
  npx cap init
  ```

- [ ] **CAP-2**: Add iOS and Android platforms

- [ ] **CAP-3**: Configure native features
  - Push notifications
  - Biometric auth
  - Haptic feedback

- [ ] **CAP-4**: Build and test on simulators

- [ ] **CAP-5**: Create app store assets
  - Icons
  - Screenshots
  - Store descriptions

### 4C: App Store Submission

- [ ] **STORE-1**: Apple Developer account setup ($99/year)

- [ ] **STORE-2**: Create App Store Connect listing

- [ ] **STORE-3**: Configure certificates and provisioning

- [ ] **STORE-4**: Submit for TestFlight

- [ ] **STORE-5**: Submit for App Store review

---

## Environment Variables Required

```env
# OpenAI (Required)
OPENAI_API_KEY=sk-...

# Database (Required)
DATABASE_URL=postgresql://...

# Cloudflare R2 (Phase 2A)
R2_ENDPOINT=https://...r2.cloudflarestorage.com
R2_ACCESS_KEY=...
R2_SECRET_KEY=...
R2_BUCKET=trader-journal-media
R2_PUBLIC_URL=https://...

# Push Notifications (Phase 2B)
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...

# Python Options Service
OPTIONS_SERVICE_URL=http://localhost:8000
```

---

## Cost Summary by Phase

| Phase | Feature | Monthly Cost |
|-------|---------|-------------|
| Phase 1 | MVP Polish | $0 |
| Phase 2A | Frictionless Capture | ~$0.35 |
| Phase 2B | Proactive Engagement | ~$0.04 |
| Phase 2C | Context Surfacing | ~$0.06 |
| Phase 2D | Pattern Recognition | ~$0.12 |
| Phase 3A | Strategy Intelligence | ~$5.17 (includes hosting) |
| Phase 3B | AI Coach | ~$0.53 |
| Phase 3C | Social Sharing | $0 |
| Phase 3D | Custom Dashboard | $0 |
| Phase 4 | Mobile Deployment | $0-99 (App Store fee) |
| **Total** | | **~$6-8/month** |

---

## Testing Checklist

### Phase 2 Testing
- [ ] Voice recording on iOS Safari
- [ ] Voice recording on Android Chrome
- [ ] Image capture on mobile
- [ ] Transcription accuracy (>90% on trading terms)
- [ ] Auto-inference accuracy
- [ ] Context panel load time (<2s)
- [ ] Push notifications on PWA
- [ ] Pattern detection accuracy

### Phase 3 Testing
- [ ] Options pricing accuracy (within 2% of market)
- [ ] P/L attribution matches brokerage (within 5%)
- [ ] AI coach response quality
- [ ] Share link privacy (redaction works)
- [ ] Dashboard performance (LCP < 2.5s)

### Phase 4 Testing
- [ ] PWA install on iOS
- [ ] PWA install on Android
- [ ] Offline entry creation
- [ ] Background sync on reconnect
- [ ] Capacitor builds (if applicable)
