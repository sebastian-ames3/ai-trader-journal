# PRD: Thesis-Based Trade Management

## Overview

**Problem Statement:**
Options traders manage evolving positions - spreads become ratios, calendars become long calls, positions get rolled and adjusted. Current tools track individual transactions but fail to capture the holistic view of a trading thesis and its evolution over time.

**Solution:**
A thesis-based trade management system where users group related trades under a single "thesis" (trading idea), track adjustments with reasoning, and aggregate P/L across the entire campaign.

**Success Metrics:**
- 70%+ of trades linked to a thesis
- Users capture reasoning for 80%+ of adjustments
- AI surfaces actionable patterns from thesis outcomes
- Average thesis has 2+ trades (showing position management)

---

## Core Philosophy

### Journal First, Analytics Second

This is NOT a position management system. It's a **journal that understands trades**.

| What We Do | What We Don't Do |
|------------|------------------|
| Let users group related trades | Auto-detect position changes |
| Capture reasoning behind adjustments | Calculate real-time Greeks |
| Aggregate self-reported P/L | Mark-to-market valuations |
| Learn patterns from user's history | Compete with broker analytics |
| Extract data from screenshots | Build our own pricing engine |

### The Thesis Concept

A **thesis** is a trading idea that may involve multiple trades over time:

```
THESIS: "NVDA Bullish Q4 2024"
├── Trade 1: Initial position (call spread)
├── Trade 2: Scaled in (added more spreads)
├── Trade 3: Rolled up (took profits, stayed in)
├── Trade 4: Converted (added naked call for upside)
└── Close: Thesis complete, lessons captured
```

---

## User Stories

### Thesis Management
1. As a trader, I want to create a thesis so I can group related trades under one idea.
2. As a trader, I want to see all trades in a thesis on a timeline so I understand how my position evolved.
3. As a trader, I want to close a thesis and capture lessons learned.

### Trade Logging
4. As a trader, I want to log a trade with voice/text/screenshots so capture is frictionless.
5. As a trader, I want to link a trade to an existing thesis or create a new one.
6. As a trader, I want the AI to extract trade details from my screenshots.
7. As a trader, I want to categorize adjustments (roll, add, reduce, convert, close).

### P/L Tracking
8. As a trader, I want to see aggregate P/L across all trades in a thesis.
9. As a trader, I want to track realized vs unrealized P/L separately.
10. As a trader, I want to see my return on capital deployed for each thesis.

### Pattern Learning
11. As a trader, I want the AI to learn from my thesis outcomes over time.
12. As a trader, I want reminders of past lessons when entering similar trades.
13. As a trader, I want to see patterns like "your theses with 3+ adjustments perform better."

---

## Data Model

### Core Entities

```typescript
interface TradingThesis {
  id: string;

  // Identity
  name: string;                    // "NVDA Bullish Q4 2024"
  ticker: string;                  // Primary ticker
  direction: ThesisDirection;      // BULLISH | BEARISH | NEUTRAL | VOLATILE

  // The "why"
  originalThesis: string;          // Initial reasoning (text or transcription)
  thesisAttachments: Attachment[]; // Charts, screenshots supporting thesis

  // Status
  status: ThesisStatus;            // ACTIVE | CLOSED | EXPIRED
  startedAt: Date;
  closedAt?: Date;

  // Linked content
  trades: Trade[];                 // All trades in this thesis
  entries: Entry[];                // Journal entries about this thesis
  updates: ThesisUpdate[];         // How thesis evolved

  // Aggregate financials (calculated from trades)
  totalRealizedPL: number;
  totalUnrealizedPL: number;
  totalCapitalDeployed: number;
  returnOnCapital: number;         // (realized + unrealized) / deployed

  // Outcome
  outcome?: ThesisOutcome;         // WIN | LOSS | BREAKEVEN
  lessonsLearned?: string;

  // AI-generated
  aiSummary?: string;              // "5 adjustments, scaled well, held too long"
  learnedPatterns: string[];       // Tags for future pattern matching

  createdAt: Date;
  updatedAt: Date;
}

interface Trade {
  id: string;
  thesisId?: string;               // Optional link to thesis

  // Action type
  action: TradeAction;             // INITIAL | ADD | REDUCE | ROLL | CONVERT | CLOSE | ASSIGNED | EXERCISED
  previousTradeId?: string;        // What this trade adjusted (for rolls/converts)

  // Description
  description: string;             // "Sold 145/150 call spread for $1.85"
  strategyType?: StrategyType;     // CALL_SPREAD | PUT_SPREAD | IRON_CONDOR | etc.

  // Timing
  openedAt: Date;
  closedAt?: Date;
  expiration?: Date;

  // Financials (user-provided)
  debitCredit: number;             // Positive = paid, negative = received
  quantity: number;                // Number of contracts/spreads
  realizedPL?: number;             // When closed
  status: TradeStatus;             // OPEN | CLOSED | EXPIRED | ASSIGNED

  // Context (extracted from screenshots or user input)
  extractedData: ExtractedTradeData;

  // Attachments
  attachments: Attachment[];

  // Reasoning (linked journal entry)
  reasoningEntryId?: string;
  reasoningNote?: string;          // Quick note if no full entry

  createdAt: Date;
  updatedAt: Date;
}

interface ExtractedTradeData {
  // From screenshots or user input
  ticker?: string;
  strikes?: number[];
  expiration?: Date;
  underlyingPrice?: number;

  // Market context at time of trade
  iv?: number;
  hv?: number;
  ivRank?: number;
  ivPercentile?: number;

  // Position Greeks (if provided)
  delta?: number;
  theta?: number;
  gamma?: number;
  vega?: number;

  // Flexible additional data
  [key: string]: any;
}

interface ThesisUpdate {
  id: string;
  thesisId: string;
  date: Date;
  type: UpdateType;                // THESIS_STRENGTHENED | THESIS_WEAKENED | THESIS_CHANGED | NOTE
  content: string;                 // "Breakout confirmed, thesis strengthening"
  entryId?: string;                // Linked journal entry
}

interface Attachment {
  id: string;
  type: AttachmentType;            // IMAGE | AUDIO | PDF | VIDEO
  url: string;
  filename: string;

  // AI extraction
  extractedText?: string;          // OCR or transcription
  extractedData?: object;          // Structured data parsed from content
  extractionConfidence?: number;

  createdAt: Date;
}

// Enums
type ThesisDirection = 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'VOLATILE';
type ThesisStatus = 'ACTIVE' | 'CLOSED' | 'EXPIRED';
type ThesisOutcome = 'WIN' | 'LOSS' | 'BREAKEVEN';
type TradeAction = 'INITIAL' | 'ADD' | 'REDUCE' | 'ROLL' | 'CONVERT' | 'CLOSE' | 'ASSIGNED' | 'EXERCISED';
type TradeStatus = 'OPEN' | 'CLOSED' | 'EXPIRED' | 'ASSIGNED';
type UpdateType = 'THESIS_STRENGTHENED' | 'THESIS_WEAKENED' | 'THESIS_CHANGED' | 'NOTE';
type AttachmentType = 'IMAGE' | 'AUDIO' | 'PDF' | 'VIDEO';

type StrategyType =
  | 'LONG_CALL' | 'LONG_PUT'
  | 'SHORT_CALL' | 'SHORT_PUT'
  | 'CALL_SPREAD' | 'PUT_SPREAD'
  | 'IRON_CONDOR' | 'IRON_BUTTERFLY'
  | 'STRADDLE' | 'STRANGLE'
  | 'CALENDAR' | 'DIAGONAL'
  | 'RATIO' | 'BUTTERFLY'
  | 'STOCK' | 'COVERED_CALL' | 'CASH_SECURED_PUT'
  | 'CUSTOM';
```

### Database Schema (Prisma)

```prisma
model TradingThesis {
  id                  String        @id @default(cuid())

  name                String
  ticker              String
  direction           ThesisDirection

  originalThesis      String        @db.Text

  status              ThesisStatus  @default(ACTIVE)
  startedAt           DateTime      @default(now())
  closedAt            DateTime?

  // Calculated aggregates (updated on trade changes)
  totalRealizedPL     Float         @default(0)
  totalUnrealizedPL   Float         @default(0)
  totalCapitalDeployed Float        @default(0)

  outcome             ThesisOutcome?
  lessonsLearned      String?       @db.Text

  aiSummary           String?
  learnedPatterns     String[]

  // Relations
  trades              Trade[]
  updates             ThesisUpdate[]
  attachments         ThesisAttachment[]

  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt

  @@index([ticker])
  @@index([status])
  @@index([startedAt])
}

model Trade {
  id                  String        @id @default(cuid())
  thesisId            String?
  thesis              TradingThesis? @relation(fields: [thesisId], references: [id])

  action              TradeAction
  previousTradeId     String?

  description         String
  strategyType        StrategyType?

  openedAt            DateTime      @default(now())
  closedAt            DateTime?
  expiration          DateTime?

  debitCredit         Float
  quantity            Int           @default(1)
  realizedPL          Float?
  status              TradeStatus   @default(OPEN)

  extractedData       Json?

  reasoningEntryId    String?
  reasoningNote       String?

  attachments         TradeAttachment[]

  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt

  @@index([thesisId])
  @@index([openedAt])
  @@index([status])
}

model ThesisUpdate {
  id                  String        @id @default(cuid())
  thesisId            String
  thesis              TradingThesis @relation(fields: [thesisId], references: [id], onDelete: Cascade)

  date                DateTime      @default(now())
  type                UpdateType
  content             String
  entryId             String?

  @@index([thesisId])
}

model ThesisAttachment {
  id                  String        @id @default(cuid())
  thesisId            String
  thesis              TradingThesis @relation(fields: [thesisId], references: [id], onDelete: Cascade)

  type                AttachmentType
  url                 String
  filename            String

  extractedText       String?       @db.Text
  extractedData       Json?
  extractionConfidence Float?

  createdAt           DateTime      @default(now())
}

model TradeAttachment {
  id                  String        @id @default(cuid())
  tradeId             String
  trade               Trade         @relation(fields: [tradeId], references: [id], onDelete: Cascade)

  type                AttachmentType
  url                 String
  filename            String

  extractedText       String?       @db.Text
  extractedData       Json?
  extractionConfidence Float?

  createdAt           DateTime      @default(now())
}

enum ThesisDirection {
  BULLISH
  BEARISH
  NEUTRAL
  VOLATILE
}

enum ThesisStatus {
  ACTIVE
  CLOSED
  EXPIRED
}

enum ThesisOutcome {
  WIN
  LOSS
  BREAKEVEN
}

enum TradeAction {
  INITIAL
  ADD
  REDUCE
  ROLL
  CONVERT
  CLOSE
  ASSIGNED
  EXERCISED
}

enum TradeStatus {
  OPEN
  CLOSED
  EXPIRED
  ASSIGNED
}

enum UpdateType {
  THESIS_STRENGTHENED
  THESIS_WEAKENED
  THESIS_CHANGED
  NOTE
}

enum AttachmentType {
  IMAGE
  AUDIO
  PDF
  VIDEO
}

enum StrategyType {
  LONG_CALL
  LONG_PUT
  SHORT_CALL
  SHORT_PUT
  CALL_SPREAD
  PUT_SPREAD
  IRON_CONDOR
  IRON_BUTTERFLY
  STRADDLE
  STRANGLE
  CALENDAR
  DIAGONAL
  RATIO
  BUTTERFLY
  STOCK
  COVERED_CALL
  CASH_SECURED_PUT
  CUSTOM
}
```

---

## AI Capabilities

### 1. Screenshot Data Extraction

Extract trade data from any screenshot format:

```typescript
async function extractTradeData(imageUrl: string): Promise<ExtractedTradeData> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',  // Vision model
    messages: [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: `Extract trading data from this screenshot. Look for:
            - Ticker symbol
            - Strategy type (spread, condor, etc.)
            - Strike prices
            - Expiration date
            - Premium/price
            - Greeks (delta, theta, gamma, vega) if shown
            - IV, HV, IV rank/percentile if shown
            - Underlying price
            - P/L information
            - Breakeven prices

            Return as JSON. If a field isn't visible, omit it.
            Be specific about what you see vs. infer.`
        },
        { type: 'image_url', image_url: { url: imageUrl } }
      ]
    }],
    response_format: { type: 'json_object' },
    max_tokens: 1000
  });

  return JSON.parse(response.choices[0].message.content);
}
```

**Supported Screenshot Types:**
- OptionStrat P/L diagrams
- ThinkorSwim option chains
- TastyTrade position views
- Trading platform order confirmations
- Volatility charts
- Any screenshot with visible trade data

### 2. Pattern Learning from Theses

```typescript
async function analyzeThesisPatterns(userId: string): Promise<ThesisPattern[]> {
  const closedTheses = await getClosedTheses(userId, 50);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: `Analyze these ${closedTheses.length} completed trading theses and identify patterns:

        ${JSON.stringify(closedTheses.map(t => ({
          ticker: t.ticker,
          direction: t.direction,
          duration: daysBetween(t.startedAt, t.closedAt),
          numTrades: t.trades.length,
          adjustmentTypes: t.trades.map(tr => tr.action),
          outcome: t.outcome,
          returnOnCapital: t.returnOnCapital,
          lessonsLearned: t.lessonsLearned,
          extractedMetrics: t.trades.flatMap(tr => tr.extractedData)
        })))}

        Identify patterns like:
        - Correlation between number of adjustments and outcome
        - Best performing thesis durations
        - Direction accuracy (bullish vs bearish)
        - Strategy types that work best for this trader
        - Common lessons that repeat
        - IV/HV patterns correlated with success
        - Adjustment timing patterns

        Return actionable insights the trader can use.`
    }],
    response_format: { type: 'json_object' }
  });

  return JSON.parse(response.choices[0].message.content);
}
```

### 3. Real-Time Thesis Reminders

When user starts a new trade:

```typescript
async function getThesisReminders(
  ticker: string,
  strategyType: StrategyType,
  extractedData: ExtractedTradeData
): Promise<Reminder[]> {
  // Find similar past theses
  const similarTheses = await findSimilarTheses(ticker, strategyType);

  // Get lessons from those theses
  const lessons = similarTheses
    .filter(t => t.lessonsLearned)
    .map(t => ({
      thesis: t.name,
      outcome: t.outcome,
      lesson: t.lessonsLearned
    }));

  // Check for specific patterns
  const reminders: Reminder[] = [];

  // IV/HV pattern
  if (extractedData.iv && extractedData.hv) {
    const ivHvRatio = extractedData.iv / extractedData.hv;
    const historicalIvHv = await getHistoricalIvHvPerformance(strategyType, ivHvRatio);
    if (historicalIvHv.winRate < 0.5) {
      reminders.push({
        type: 'WARNING',
        title: 'IV/HV Below Historical Sweet Spot',
        message: `Your ${strategyType} trades perform better when IV/HV > ${historicalIvHv.optimalRatio.toFixed(1)} (current: ${ivHvRatio.toFixed(1)}). Historical win rate at this level: ${(historicalIvHv.winRate * 100).toFixed(0)}%`
      });
    }
  }

  // Past lessons reminder
  if (lessons.length > 0) {
    reminders.push({
      type: 'INFO',
      title: `Lessons from ${lessons.length} Similar Theses`,
      message: lessons.map(l => `• ${l.lesson}`).join('\n')
    });
  }

  return reminders;
}
```

---

## API Endpoints

### Thesis Management

```typescript
// Create thesis
POST /api/theses
{
  name: string;
  ticker: string;
  direction: ThesisDirection;
  originalThesis: string;
  attachments?: File[];
}

// List theses
GET /api/theses
Query: { status?: ThesisStatus, ticker?: string }

// Get thesis with trades
GET /api/theses/:id

// Update thesis
PATCH /api/theses/:id
{
  name?: string;
  originalThesis?: string;
  status?: ThesisStatus;
}

// Close thesis
POST /api/theses/:id/close
{
  outcome: ThesisOutcome;
  lessonsLearned?: string;
}

// Add thesis update
POST /api/theses/:id/updates
{
  type: UpdateType;
  content: string;
}
```

### Trade Management

```typescript
// Log trade
POST /api/trades
{
  thesisId?: string;
  action: TradeAction;
  description: string;
  strategyType?: StrategyType;
  debitCredit: number;
  quantity?: number;
  extractedData?: ExtractedTradeData;
  reasoningNote?: string;
  attachments?: File[];
}

// Update trade
PATCH /api/trades/:id

// Close trade
POST /api/trades/:id/close
{
  realizedPL: number;
  closedAt?: Date;
}

// Extract data from attachment
POST /api/trades/extract
{
  attachmentUrl: string;
}
```

### Pattern Analysis

```typescript
// Get thesis patterns
GET /api/patterns/theses

// Get reminders for new trade
POST /api/patterns/reminders
{
  ticker: string;
  strategyType: StrategyType;
  extractedData?: ExtractedTradeData;
}
```

---

## UI Flows

### Active Theses Dashboard

```
┌─────────────────────────────────────────┐
│  My Theses                    [+ New]   │
├─────────────────────────────────────────┤
│                                         │
│  ── Active (3) ──                       │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ NVDA Bullish Q4        📈 +$1,850  ││
│  │ 4 trades • 47 days • +34% ROC      ││
│  │ Last: Rolled up to 155/160         ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ SPY Hedge Dec           📉 -$320   ││
│  │ 2 trades • 12 days • -8% ROC       ││
│  │ Last: Added more puts              ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ TSLA Earnings Play      ⏸ $0      ││
│  │ 1 trade • 3 days • Waiting         ││
│  │ Iron condor, earnings Friday       ││
│  └─────────────────────────────────────┘│
│                                         │
│  ── Recently Closed ──                  │
│  [View All Closed Theses →]             │
│                                         │
└─────────────────────────────────────────┘
```

### Thesis Detail View

```
┌─────────────────────────────────────────┐
│  ← NVDA Bullish Q4            [Close]   │
├─────────────────────────────────────────┤
│                                         │
│  📈 BULLISH                    Active   │
│                                         │
│  Total P/L: +$1,850 (+34% ROC)         │
│  ├── Realized: +$1,200                  │
│  └── Unrealized: +$650                  │
│                                         │
│  Capital Deployed: $5,400               │
│  Duration: 47 days                      │
│                                         │
│  ── Original Thesis ──                  │
│  "AI chip demand accelerating.          │
│  Expecting breakout above 140 by EOY.   │
│  Will scale in with call spreads."      │
│                                         │
│  ── Timeline ──                         │
│                                         │
│  Nov 1 ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  INITIAL                                │
│  Bought 140/145 call spread             │
│  Cost: $2.00 • P/L: +$180 (closed)     │
│  📝 "Starting small, testing thesis"    │
│                                         │
│  Nov 8 ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ADD                                    │
│  Bought 2x 145/150 call spread          │
│  Cost: $3.20 • P/L: +$420 (closed)     │
│  📝 "Breakout confirmed, scaling in"    │
│  📷 [OptionStrat screenshot]            │
│                                         │
│  Nov 15 ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ROLL                                   │
│  Rolled 145/150 → 150/155 spread        │
│  Credit: $0.80 • P/L: +$650 (open)     │
│  📝 "Taking profits, staying in"        │
│                                         │
│  ── Thesis Updates ──                   │
│  Nov 12: "Thesis strengthening -        │
│           broke above 145 on volume"    │
│                                         │
│  [+ Add Trade]  [+ Update Thesis]       │
│                                         │
└─────────────────────────────────────────┘
```

### Log Trade Flow

```
┌─────────────────────────────────────────┐
│  Log Trade                       [×]    │
├─────────────────────────────────────────┤
│                                         │
│  What did you do?                       │
│  ┌─────────────────────────────────────┐│
│  │ Rolled the 145/150 spread up to    ││
│  │ 150/155 for $0.80 credit...        ││
│  └─────────────────────────────────────┘│
│                                         │
│  [🎤 Voice]  [📷 Screenshot]  [📎 PDF]  │
│                                         │
│  ── Attachments ──                      │
│  ┌────────┐                             │
│  │ 📷     │  AI Extracted:              │
│  │ TOS    │  • Ticker: NVDA             │
│  │ Chain  │  • Strategy: Call Spread    │
│  │        │  • Strikes: 150/155         │
│  └────────┘  • IV: 48% | HV: 35%        │
│              [Edit Extracted Data]      │
│                                         │
│  ── Trade Details ──                    │
│                                         │
│  Action: [○ Initial ○ Add ● Roll        │
│           ○ Reduce ○ Convert ○ Close]   │
│                                         │
│  Strategy: [Call Spread ▼]              │
│                                         │
│  Debit/Credit: [Credit ▼] $[0.80___]   │
│                                         │
│  Quantity: [1___] spreads               │
│                                         │
│  ── Link to Thesis ──                   │
│                                         │
│  [NVDA Bullish Q4 ▼]                    │
│  or [+ Create New Thesis]               │
│                                         │
│  Why this adjustment? (optional)        │
│  ┌─────────────────────────────────────┐│
│  │ Stock hit 148, wanted to take      ││
│  │ profits but stay in the trade.     ││
│  └─────────────────────────────────────┘│
│                                         │
│  [Save Trade]                           │
│                                         │
└─────────────────────────────────────────┘
```

### AI Reminders (When Creating Trade)

```
┌─────────────────────────────────────────┐
│  🧠 Before You Trade...                 │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ ⚠️ IV/HV Ratio: 1.2                 ││
│  │                                      ││
│  │ Your iron condors perform better    ││
│  │ when IV/HV > 1.5                    ││
│  │                                      ││
│  │ Historical win rate at 1.2: 42%     ││
│  │ Historical win rate at 1.5+: 68%    ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 📝 From Past TSLA Theses            ││
│  │                                      ││
│  │ "Don't hold through earnings -      ││
│  │ IV crush killed premium"            ││
│  │ — Nov 2024 thesis (LOSS)            ││
│  │                                      ││
│  │ "Exit at 50% profit, TSLA moves    ││
│  │ fast in both directions"            ││
│  │ — Oct 2024 thesis (WIN)             ││
│  └─────────────────────────────────────┘│
│                                         │
│  [Acknowledge & Continue]  [Reconsider] │
│                                         │
└─────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Core Data Model (Week 1)
- [ ] Create Prisma schema for Thesis, Trade, Attachments
- [ ] Run migrations
- [ ] Create basic CRUD API endpoints
- [ ] Create thesis list view
- [ ] Create thesis detail view

### Phase 2: Trade Logging (Week 2)
- [ ] Create trade logging form
- [ ] Implement file upload to R2
- [ ] Add voice recording support
- [ ] Create trade timeline component
- [ ] Link trades to theses

### Phase 3: AI Extraction (Week 3)
- [ ] Implement screenshot data extraction
- [ ] Create extraction preview/edit UI
- [ ] Handle multiple screenshot formats
- [ ] Add transcription for voice notes
- [ ] Store extracted data in trades

### Phase 4: P/L Aggregation (Week 4)
- [ ] Calculate thesis aggregates on trade changes
- [ ] Create P/L summary components
- [ ] Implement ROC calculation
- [ ] Add realized vs unrealized breakdown
- [ ] Create thesis close flow

### Phase 5: Pattern Learning (Week 5)
- [ ] Implement thesis pattern analysis
- [ ] Create reminders API
- [ ] Build reminder UI components
- [ ] Store learned patterns
- [ ] Show patterns on dashboard

---

## Cost Estimates

| Component | Usage | Monthly Cost |
|-----------|-------|--------------|
| GPT-4o-mini (extraction) | 100 screenshots | $0.15 |
| GPT-4o (pattern analysis) | 10 analyses | $0.30 |
| Whisper (voice notes) | 30 minutes | $0.18 |
| R2 Storage | 1GB | Free tier |
| **Total** | | **~$0.63/month** |

---

## Success Criteria

**MVP (Launch):**
- [ ] Create and manage theses
- [ ] Log trades with voice/text/screenshots
- [ ] AI extracts data from screenshots
- [ ] Timeline view of thesis evolution
- [ ] Aggregate P/L calculation

**Post-MVP (30 days):**
- [ ] 50%+ of trades linked to theses
- [ ] Average 2+ trades per thesis
- [ ] Pattern learning generating useful insights
- [ ] Users report "aha moments" from AI reminders
