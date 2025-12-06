# PRD: Proactive Engagement System

## Overview

**Problem Statement:**
Users stop journaling exactly when it would help most - during market drawdowns, emotional disengagement, or when their portfolio is underperforming. This is the "motivation gap": the inverse relationship between the value of journaling and the motivation to do it.

**Solution:**
A proactive engagement system that reaches out to users based on market conditions, behavioral patterns, and time-based triggers. The system prompts reflection during difficult periods and surfaces relevant historical context.

**Success Metrics:**
- 2x increase in entries during drawdown periods
- 50%+ response rate to proactive prompts
- Reduction in "journal silence" periods from 14+ days to < 7 days
- User sentiment improvement after prompted reflections

---

## LLM Architecture

**Single Provider: OpenAI (GPT-5 Family)**

| Task | Model | Cost (per 1M tokens) | Why |
|------|-------|---------------------|-----|
| Historical context matching | GPT-5 Nano | $0.05 / $0.40 | High volume similarity |
| Notification copy generation | GPT-5 Nano | $0.05 / $0.40 | Simple text |
| Embeddings for similarity | text-embedding-3-small | $0.02 | Cheap, good quality |
| Complex insight generation | GPT-5 | $1.25 / $10.00 | When depth matters |

---

## User Stories

### Market-Triggered Prompts
1. As a trader with a high-beta portfolio, when the market drops 2%+, I want a notification asking "Market down 2.3% - how are you feeling?" so I can capture my emotional state.
2. As a trader, when VIX spikes above 20, I want to be prompted to reflect on my risk exposure.
3. As a trader, when a stock I've journaled about moves significantly, I want to be notified to review my thesis.

### Historical Context Surfacing
4. As a trader in a drawdown, I want to see my past journal entries from similar market conditions so I can learn from my past self.
5. As a trader feeling FOMO, I want the app to show me my previous FOMO entries and what happened.
6. As a trader who hasn't journaled in a week, I want a gentle prompt with my last entry preview.

### Time-Based Triggers
7. As a trader, I want a daily end-of-day prompt at 4:30 PM ET asking for a quick reflection.
8. As a trader, I want a weekly Sunday evening prompt to review my week.
9. As a trader who journaled a trade idea 7 days ago, I want a follow-up prompt asking what happened.

---

## Feature Specifications

### 1. Market Condition Monitoring

**Data Sources:**
- SPY/QQQ daily change (free via yfinance or Yahoo Finance API)
- VIX level
- User's mentioned tickers (from their entries)

**Trigger Thresholds:**

| Condition | Threshold | Prompt Type |
|-----------|-----------|-------------|
| Market down | SPY < -2% | Emotional check-in |
| Market up big | SPY > +2% | Euphoria awareness |
| VIX spike | VIX > 25 or +20% day | Risk reflection |
| VIX elevated | VIX > 20 sustained | Ongoing awareness |
| Ticker move | Any journaled ticker ±5% | Thesis review |

**Prompt Examples:**

**Market Down:**
> "Market down 2.8% today. How are you feeling about your positions?
>
> [Quick voice note] [Write reflection]
>
> *You've been here before:* 3 similar days in the past 6 months"

**VIX Spike:**
> "VIX jumped to 24 today (+18%). This is often when emotional decisions happen.
>
> Would you like to:
> [Review your positions] [Record how you're feeling] [See past VIX spike entries]"

### 2. Historical Context Engine

**Embedding-Based Similarity Search:**

```typescript
// Using OpenAI embeddings for semantic similarity
async function findSimilarEntries(
  currentContext: string,
  userId: string
): Promise<Entry[]> {
  // Generate embedding for current context
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: currentContext
  });

  // Query similar entries using pgvector
  const similarEntries = await prisma.$queryRaw`
    SELECT *, 1 - (embedding <=> ${embedding.data[0].embedding}::vector) as similarity
    FROM "Entry"
    WHERE user_id = ${userId}
    ORDER BY similarity DESC
    LIMIT 3
  `;

  return similarEntries;
}
```

**Display Format:**
```
┌─────────────────────────────────┐
│ 📚 From Your Past Self          │
├─────────────────────────────────┤
│ Similar day: Oct 27, 2024       │
│ SPY was -2.1%, you wrote:       │
│                                 │
│ "Feeling anxious about my TSLA  │
│ position. Tempted to sell but   │
│ I know that's when I make..."   │
│                                 │
│ What happened: You held. TSLA   │
│ recovered +12% over next 2 wks  │
│                                 │
│ [Read full entry] [See more]    │
└─────────────────────────────────┘
```

### 3. Time-Based Prompts

**Daily Prompt (4:30 PM ET):**
> "Market's closed. Quick thought on today?"
>
> [Voice note] [Quick text] [Skip today]

**Weekly Review (Sunday 6 PM):**
> "Week in review: You made 4 entries, traded AAPL and SPY.
> Your dominant mood was 'uncertain'.
>
> [Start weekly reflection] [View insights] [Remind me later]"

**Trade Idea Follow-up (7 days after TRADE_IDEA entry):**
> "7 days ago you wrote about a NVDA call idea at $140.
> NVDA is now at $148 (+5.7%).
>
> [Update: I took the trade] [Update: I passed] [Still watching]"

**Journal Silence (7+ days no entry):**
> "Haven't heard from you in 8 days.
> Markets have been choppy - how are you holding up?
>
> [Quick check-in] [I'm fine, just busy] [Snooze 3 days]"

### 4. Notification System

**Channels:**
- Push notifications (PWA web push)
- In-app banner on dashboard
- Email digest (optional, weekly)

**Notification Preferences:**
```
┌─────────────────────────────────┐
│ Notification Settings           │
├─────────────────────────────────┤
│ Market Alerts                   │
│ ☑ Big market moves (±2%)        │
│ ☑ VIX spikes (>20%)             │
│ ☑ My tickers move (±5%)         │
│                                 │
│ Reminders                       │
│ ☑ Daily close reflection        │
│   Time: [4:30 PM ▼]             │
│ ☑ Weekly review (Sunday)        │
│ ☑ Trade idea follow-ups         │
│                                 │
│ Journal Nudges                  │
│ ☑ After 7 days of silence       │
│ ☐ After 3 days of silence       │
│                                 │
│ Quiet Hours                     │
│ [9 PM] to [7 AM]                │
└─────────────────────────────────┘
```

### 5. Response Capture (One-Tap Actions)

**Quick Response Options:**

From notification:
- [Voice note] - Opens directly to voice recording
- [Quick text] - Opens simplified text entry
- [Dismiss] - Acknowledge but don't act
- [Snooze] - Remind me in X hours

**Inline Response:**
```
┌─────────────────────────────────┐
│ Market down 2.1% - how are you? │
├─────────────────────────────────┤
│ [😰 Anxious] [😤 Frustrated]    │
│ [😐 Fine] [🤔 Thinking]         │
│                                 │
│ Add a note (optional):          │
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ └─────────────────────────────┘ │
│ [Save]                          │
└─────────────────────────────────┘
```

Creates entry automatically with selected mood.

---

## Technical Architecture

### Market Data Pipeline

**Architecture:**
```
Vercel Cron Job (every 30 min, market hours)
    ↓
Fetch: SPY, QQQ, VIX via yfinance/Yahoo Finance
    ↓
Compare to thresholds
    ↓
Query users with relevant tickers
    ↓
Queue notifications (deduplicated)
    ↓
Send via Web Push API
```

### Push Notification Setup

**Web Push (PWA):**
```typescript
// Service worker registration
async function subscribeToPush(): Promise<PushSubscription> {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  });

  // Save subscription to database
  await fetch('/api/notifications/subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription)
  });

  return subscription;
}

// Send notification (server-side)
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:your@email.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function sendPushNotification(subscription: PushSubscription, payload: NotificationPayload) {
  await webpush.sendNotification(subscription, JSON.stringify(payload));
}
```

### Database Schema

```prisma
model PushSubscription {
  id        String   @id @default(cuid())
  endpoint  String   @unique
  keys      Json     // { p256dh, auth }
  createdAt DateTime @default(now())
}

model NotificationLog {
  id         String           @id @default(cuid())
  type       NotificationType
  trigger    String           // "market_down_2pct", "vix_spike", etc.
  sentAt     DateTime         @default(now())
  engagedAt  DateTime?
  dismissed  Boolean          @default(false)
}

enum NotificationType {
  MARKET_CONDITION
  TICKER_MOVE
  TIME_BASED
  JOURNAL_NUDGE
  HISTORICAL_CONTEXT
}

model UserNotificationPrefs {
  id                  String  @id @default(cuid())
  marketAlerts        Boolean @default(true)
  vixAlerts           Boolean @default(true)
  tickerAlerts        Boolean @default(true)
  dailyReflection     Boolean @default(true)
  dailyReflectionTime String  @default("16:30") // ET
  weeklyReview        Boolean @default(true)
  tradeIdeaFollowups  Boolean @default(true)
  journalNudgeDays    Int     @default(7)
  quietHoursStart     String  @default("21:00")
  quietHoursEnd       String  @default("07:00")
}

model MarketCondition {
  id          String      @id @default(cuid())
  date        DateTime    @unique
  spyPrice    Float
  spyChange   Float
  vixLevel    Float
  vixChange   Float
  marketState MarketState

  @@index([date])
}

enum MarketState {
  UP       // SPY > +1%
  DOWN     // SPY < -1%
  FLAT     // -1% to +1%
  VOLATILE // VIX > 25 or |SPY| > 2%
}
```

### Embedding Storage (pgvector)

```sql
-- Enable pgvector extension in Supabase
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to Entry
ALTER TABLE "Entry" ADD COLUMN embedding vector(1536);

-- Create index for fast similarity search
CREATE INDEX ON "Entry" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

**Generate embeddings on entry creation:**
```typescript
async function generateAndStoreEmbedding(entryId: string, content: string) {
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: content
  });

  await prisma.$executeRaw`
    UPDATE "Entry"
    SET embedding = ${embedding.data[0].embedding}::vector
    WHERE id = ${entryId}
  `;
}
```

### API Endpoints

```typescript
// Cron job endpoints (called by Vercel Cron)
GET /api/cron/market-check
  - Fetches market data, triggers notifications

GET /api/cron/daily-reminder
  - Sends daily reflection prompts at 4:30 PM ET

GET /api/cron/weekly-review
  - Sends weekly review prompts on Sunday

// User-facing endpoints
POST /api/notifications/subscribe
  - Saves push subscription

DELETE /api/notifications/unsubscribe
  - Removes push subscription

GET /api/notifications/prefs
PUT /api/notifications/prefs
  - Manage user preferences

GET /api/context/similar
  - Query: { currentContext: string }
  - Returns: similar past entries via embedding search

POST /api/notifications/respond
  - Body: { notificationId, response: 'engaged'|'dismissed'|'snoozed' }
  - Tracks engagement metrics
```

### Vercel Cron Configuration

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/market-check",
      "schedule": "*/30 9-16 * * 1-5"  // Every 30 min, 9 AM - 4 PM ET, weekdays
    },
    {
      "path": "/api/cron/daily-reminder",
      "schedule": "30 21 * * 1-5"  // 4:30 PM ET (21:30 UTC), weekdays
    },
    {
      "path": "/api/cron/weekly-review",
      "schedule": "0 23 * * 0"  // 6 PM ET Sunday (23:00 UTC)
    }
  ]
}
```

---

## Cost Estimates (Monthly)

| Service | Usage | Cost |
|---------|-------|------|
| Embeddings (text-embedding-3-small) | 500 entries | $0.01 |
| GPT-5 Nano (notification copy) | 100 notifications | $0.01 |
| GPT-5 (complex context) | 10 deep analyses | $0.02 |
| Vercel Cron | 3 jobs | Free tier |
| **Total** | | **~$0.04/month** |

---

## Implementation Phases

### Phase 1: Time-Based Prompts (Week 1-2)
1. Set up Vercel cron jobs
2. Implement daily reflection prompt (in-app banner first)
3. Add notification preferences UI
4. Track engagement metrics

### Phase 2: Push Notifications (Week 3-4)
1. Set up VAPID keys and web-push
2. Implement push subscription flow
3. Add service worker for push handling
4. Test across iOS/Android PWA

### Phase 3: Market Condition Monitoring (Week 5-6)
1. Add market data fetching (yfinance)
2. Implement market condition triggers
3. Create MarketCondition table
4. Build in-app market alert banner

### Phase 4: Historical Context (Week 7-8)
1. Set up pgvector in Supabase
2. Generate embeddings for existing entries
3. Implement similarity search
4. Build "From Your Past Self" component

---

## Notification Copy Library

### Market Conditions

**Market Down (2-3%):**
- "Tough day in the markets (-2.3%). How are you holding up?"
- "SPY down 2.8%. Remember: the best decisions come from a clear head."
- "Market taking a hit today. This is when journals are most valuable."

**Market Down (3%+):**
- "Significant selloff today (-3.2%). Take a breath before any decisions."
- "Markets in correction mode. How are you feeling right now?"

**VIX Spike:**
- "Fear is elevated (VIX at 24). Good time to check in with yourself."
- "VIX spiking - volatility often leads to emotional decisions."

**Market Up Big:**
- "Great day in the markets (+2.5%)! Feeling euphoric? That's worth noting."
- "SPY up big today. How's your FOMO meter?"

### Time-Based

**Daily Close:**
- "Market's closed. 30 seconds to capture today's thoughts?"
- "End of day reflection: What's one thing you learned today?"

**Weekly Review:**
- "Sunday reflection: How was your week in the markets?"
- "Week in review time. Your future self will thank you."

**Journal Silence:**
- "Haven't heard from you in [X] days. Quick check-in?"
- "Markets have been busy while you were away. How are things?"

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Notification fatigue | High | Smart frequency limiting (max 2/day), easy opt-out |
| Annoying during stress | High | Empathetic copy, "snooze" without guilt |
| Push permission denial | Medium | Clear value prop, in-app fallback |
| Market data latency | Low | 15-min delayed is fine for prompts |

---

## Success Criteria

**MVP Launch:**
- [ ] Daily reflection prompt works (in-app)
- [ ] Push notifications delivered on mobile PWA
- [ ] User can customize notification preferences
- [ ] Engagement tracked in database

**30-Day Post-Launch:**
- [ ] 40%+ notification engagement rate
- [ ] Entry frequency increases during drawdowns
- [ ] < 10% notification opt-out rate
- [ ] User feedback: "Helpful" > "Annoying"
