# PRD: Context Surfacing System

## Overview

**Problem Statement:**
When traders journal about a ticker or strategy, they don't have easy access to relevant context: their prior entries about that ticker, current market data (IV vs HV, price levels), or historical patterns. This context lives in their head, scattered notes, or requires manual lookup.

**Solution:**
An automatic context surfacing system that detects tickers and strategies mentioned in entries, fetches relevant market data, and surfaces the user's historical entries and insights about those tickers.

**Success Metrics:**
- 70% of entries with tickers show relevant context
- Users report context was "helpful" in > 60% of cases
- Reduction in "I forgot I wrote about this before" moments
- Increased entry depth when context is surfaced

---

## LLM Architecture

**Single Provider: OpenAI (GPT-5 Family)**

| Task | Model | Cost (per 1M tokens) | Why |
|------|-------|---------------------|-----|
| Ticker extraction | GPT-5 Nano | $0.05 / $0.40 | Fast, cheap |
| Context summarization | GPT-5 Nano | $0.05 / $0.40 | Quick responses |
| Smart insights | GPT-5 | $1.25 / $10.00 | Nuanced context |
| Embeddings | text-embedding-3-small | $0.02 | Similarity search |

**Market Data:** yfinance (free, 15-20 min delayed) - sufficient for journaling context

---

## User Stories

### Market Data Context
1. As a trader writing about AAPL, I want to see current IV vs HV so I know if options are expensive.
2. As a trader, I want to see key price levels (52-week high/low, recent support/resistance).
3. As a trader writing about VIX options, I want to see VIX term structure context.

### Historical Entry Context
4. As a trader writing about NVDA, I want to see my previous NVDA entries to remember my thesis evolution.
5. As a trader, I want to see how my sentiment on a ticker has changed over time.
6. As a trader, I want to see my win/loss record on a ticker if I've tracked outcomes.

### Strategy Context
7. As a trader writing about an iron condor, I want to see my past iron condor entries and outcomes.
8. As a trader, I want strategy-specific insights ("Your iron condors have 40% win rate on meme stocks").

---

## Feature Specifications

### 1. Ticker Detection & Context Panel

**Trigger:**
- User types or mentions a ticker symbol (e.g., AAPL, $NVDA)
- User selects a ticker from the picker
- AI extracts ticker from voice/screenshot

**Ticker Detection (GPT-5 Nano):**
```typescript
async function detectTickers(content: string): Promise<string[]> {
  // First try regex for common patterns
  const regexMatches = content.match(/\$?[A-Z]{1,5}\b/g) || [];
  const potentialTickers = [...new Set(regexMatches.map(t => t.replace('$', '')))];

  // Filter out common false positives
  const falsePositives = ['I', 'A', 'IT', 'AI', 'TV', 'CEO', 'IPO', 'ETF', 'ATH'];
  const filtered = potentialTickers.filter(t => !falsePositives.includes(t));

  // Validate with GPT-5 Nano if needed
  if (filtered.length > 0) {
    const response = await openai.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [{
        role: 'user',
        content: `Which of these are valid stock tickers? Return only valid tickers as JSON array.
          Candidates: ${filtered.join(', ')}
          Context: "${content.substring(0, 200)}"`
      }],
      response_format: { type: 'json_object' },
      max_tokens: 100
    });
    return JSON.parse(response.choices[0].message.content).tickers;
  }

  return [];
}
```

**Context Panel Display:**

```
┌─────────────────────────────────┐
│ NVDA Context           [Hide ▼] │
├─────────────────────────────────┤
│                                 │
│ Current: $142.50 (+2.3%)        │
│ 52W Range: $108 - $152          │
│                                 │
│ Options Context:                │
│ ├─ IV Rank: 45% (moderate)      │
│ ├─ IV: 38% | HV20: 32%          │
│ └─ IV Premium: +6%              │
│                                 │
│ Your History (12 entries):      │
│ ├─ Last entry: 3 days ago       │
│ ├─ Sentiment trend: Bullish →   │
│ │   More Cautious               │
│ └─ [View all NVDA entries]      │
│                                 │
│ Quick Insight:                  │
│ "Last time NVDA was at this     │
│ level, you wrote about taking   │
│ profits. It dropped 8% after."  │
│                                 │
└─────────────────────────────────┘
```

### 2. Market Data Fetching

**Data Points to Surface:**

| Data Point | Source | Cache Duration |
|------------|--------|----------------|
| Price, change | yfinance | 15 minutes |
| 52-week range | yfinance | 1 hour |
| Volume | yfinance | 15 minutes |
| IV (ATM) | yfinance options | 30 minutes |
| HV20, HV30 | Calculated | 1 hour |
| IV Rank | Calculated | 1 hour |
| Earnings date | yfinance | 24 hours |

**Market Data Service:**
```typescript
// Using existing yfinance Python service
async function getTickerContext(ticker: string): Promise<TickerContext> {
  const [quote, ivAnalysis] = await Promise.all([
    fetch(`${OPTIONS_SERVICE_URL}/api/quote?ticker=${ticker}`),
    fetch(`${OPTIONS_SERVICE_URL}/api/iv-analysis?ticker=${ticker}`)
  ]);

  return {
    price: quote.price,
    change: quote.change,
    changePercent: quote.changePercent,
    fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
    volume: quote.volume,
    iv: ivAnalysis.iv,
    hv20: ivAnalysis.hv20,
    hv30: ivAnalysis.hv30,
    ivRank: ivAnalysis.ivRank,
    ivPremium: ivAnalysis.iv - ivAnalysis.hv20
  };
}
```

### 3. Historical Entry Context

**User History Aggregation:**
```typescript
interface TickerHistory {
  ticker: string;
  entryCount: number;
  firstMentioned: Date;
  lastMentioned: Date;
  sentimentTimeline: {
    date: Date;
    sentiment: 'positive' | 'negative' | 'neutral';
  }[];
  sentimentTrend: 'bullish' | 'bearish' | 'neutral' | 'mixed';
  commonBiases: { bias: string; count: number }[];
  convictionDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  recentEntries: Entry[];  // Last 3
}

async function getTickerHistory(ticker: string, userId: string): Promise<TickerHistory> {
  const entries = await prisma.entry.findMany({
    where: {
      userId,
      OR: [
        { ticker: { equals: ticker, mode: 'insensitive' } },
        { content: { contains: ticker, mode: 'insensitive' } }
      ]
    },
    orderBy: { createdAt: 'desc' }
  });

  // Aggregate sentiment, biases, conviction
  const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
  const biasCounts: Record<string, number> = {};
  const convictionCounts = { HIGH: 0, MEDIUM: 0, LOW: 0 };

  for (const entry of entries) {
    if (entry.sentiment) sentimentCounts[entry.sentiment]++;
    if (entry.conviction) convictionCounts[entry.conviction]++;
    for (const bias of entry.detectedBiases || []) {
      biasCounts[bias] = (biasCounts[bias] || 0) + 1;
    }
  }

  return {
    ticker,
    entryCount: entries.length,
    firstMentioned: entries[entries.length - 1]?.createdAt,
    lastMentioned: entries[0]?.createdAt,
    sentimentTimeline: entries.map(e => ({
      date: e.createdAt,
      sentiment: e.sentiment
    })),
    sentimentTrend: calculateTrend(entries),
    commonBiases: Object.entries(biasCounts)
      .map(([bias, count]) => ({ bias, count }))
      .sort((a, b) => b.count - a.count),
    convictionDistribution: {
      high: convictionCounts.HIGH,
      medium: convictionCounts.MEDIUM,
      low: convictionCounts.LOW
    },
    recentEntries: entries.slice(0, 3)
  };
}
```

### 4. Smart Context Insights

**GPT-5 Generated Insights:**
```typescript
async function generateContextInsight(
  ticker: string,
  currentPrice: number,
  tickerHistory: TickerHistory
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-5',  // Use flagship for nuanced insights
    messages: [{
      role: 'system',
      content: `Generate a brief, actionable insight for a trader journaling about a stock.
        Be specific and reference their history. Max 2 sentences.`
    }, {
      role: 'user',
      content: `Ticker: ${ticker}
        Current price: $${currentPrice}

        User's history with this ticker:
        - ${tickerHistory.entryCount} entries over ${daysBetween(tickerHistory.firstMentioned, new Date())} days
        - Sentiment trend: ${tickerHistory.sentimentTrend}
        - Most common bias: ${tickerHistory.commonBiases[0]?.bias || 'none'}

        Recent entries:
        ${tickerHistory.recentEntries.map(e =>
          `- ${e.createdAt.toDateString()}: "${e.content.substring(0, 100)}..." (${e.sentiment})`
        ).join('\n')}`
    }],
    max_tokens: 100
  });

  return response.choices[0].message.content;
}
```

**Example Insights:**
- "Last time NVDA was at this level ($142), you wrote about taking profits due to uncertainty. It then dropped 8%."
- "Your AAPL entries have been increasingly bearish over the past month. Current sentiment: cautious."
- "You've written about this iron condor setup 3 times before - win rate was 67%."

### 5. Strategy Context

**Strategy Detection:**
```typescript
async function detectStrategy(content: string): Promise<string | null> {
  const strategies = [
    'iron condor', 'iron butterfly', 'vertical spread', 'calendar spread',
    'diagonal spread', 'straddle', 'strangle', 'covered call', 'cash secured put',
    'wheel strategy', 'butterfly', 'ratio spread'
  ];

  const lowerContent = content.toLowerCase();
  for (const strategy of strategies) {
    if (lowerContent.includes(strategy)) {
      return strategy;
    }
  }

  // Also check AI tags from entry
  return null;
}

interface StrategyHistory {
  strategy: string;
  entryCount: number;
  outcomes?: {
    wins: number;
    losses: number;
    winRate: number;
  };
  avgConviction: number;
  commonTickers: string[];
  insights: string[];
}
```

### 6. Context During Entry Review

**Entry Detail Page Enhancement:**

When viewing an old entry, show what happened after:
```
┌─────────────────────────────────┐
│ Entry from Oct 15, 2024         │
├─────────────────────────────────┤
│                                 │
│ [Your entry content here...]    │
│                                 │
│ ─────────────────────────────── │
│ Context at Time of Entry:       │
│                                 │
│ NVDA: $140.25                   │
│ SPY: -1.2% that day             │
│ VIX: 18.5                       │
│                                 │
│ What happened after:            │
│ NVDA 7 days later: $148 (+5.5%) │
│ NVDA 30 days later: $155 (+10%) │
│                                 │
│ Your next NVDA entry was 12     │
│ days later, sentiment: bearish  │
│                                 │
└─────────────────────────────────┘
```

---

## Technical Architecture

### Context Fetching Flow

```
User types ticker (debounce 500ms)
    ↓
Parallel fetch:
├─ Market data (yfinance service)
├─ User's ticker history (database)
└─ Generate insight (GPT-5, if enough history)
    ↓
Merge and display context panel
    ↓
Cache for 5 minutes
```

### API Endpoints

```typescript
// Get full context for a ticker
GET /api/context/ticker?ticker=NVDA
  Returns: {
    market: TickerContext,
    history: TickerHistory,
    insight: string | null
  }

// Get strategy context
GET /api/context/strategy?strategy=iron-condor
  Returns: StrategyHistory

// Get historical context for an entry
GET /api/context/entry/[id]
  Returns: {
    marketAtEntry: TickerContext,
    whatHappenedAfter: {
      price7Days: number,
      price30Days: number,
      nextEntry: Entry | null
    }
  }

// Track ticker mentions (for analytics)
POST /api/context/mention
  Body: { ticker: string, entryId: string }
```

### Database Schema

```prisma
// Track ticker mentions for quick lookup
model TickerMention {
  id        String   @id @default(cuid())
  ticker    String
  entryId   String
  createdAt DateTime @default(now())

  entry     Entry    @relation(fields: [entryId], references: [id])

  @@index([ticker])
  @@index([entryId])
}

// Cache market snapshots for historical context
model MarketSnapshot {
  id        String   @id @default(cuid())
  ticker    String
  date      DateTime
  price     Float
  change    Float
  volume    Float?
  iv        Float?
  hv20      Float?
  ivRank    Float?

  @@unique([ticker, date])
  @@index([ticker])
  @@index([date])
}
```

### Context Panel Component

```typescript
// components/ContextPanel.tsx
interface ContextPanelProps {
  ticker?: string;
  strategy?: string;
}

export function ContextPanel({ ticker, strategy }: ContextPanelProps) {
  const { data, isLoading } = useQuery(
    ['context', ticker, strategy],
    () => fetchContext(ticker, strategy),
    { enabled: !!(ticker || strategy), staleTime: 5 * 60 * 1000 }
  );

  if (!ticker && !strategy) return null;

  return (
    <Collapsible defaultOpen={true}>
      <CollapsibleTrigger className="flex items-center gap-2">
        <span>{ticker || strategy} Context</span>
        <ChevronDown className="h-4 w-4" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        {isLoading ? (
          <ContextSkeleton />
        ) : (
          <>
            {data?.market && <MarketDataCard data={data.market} />}
            {data?.history && <HistoryCard data={data.history} />}
            {data?.insight && <InsightCard insight={data.insight} />}
          </>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
```

---

## Cost Estimates (Monthly)

| Service | Usage | Cost |
|---------|-------|------|
| GPT-5 Nano (ticker detection) | 200 entries | $0.01 |
| GPT-5 (smart insights) | 50 insights | $0.05 |
| yfinance service | Unlimited | $0 (free) |
| **Total** | | **~$0.06/month** |

---

## Implementation Phases

### Phase 1: Basic Ticker Context (Week 1-2)
1. Implement ticker detection (regex + validation)
2. Add basic quote fetching from yfinance
3. Build collapsible context panel UI
4. Show user's entry count for ticker

### Phase 2: Market Data Enhancement (Week 3-4)
1. Add IV/HV analysis to yfinance service
2. Implement IV rank calculation
3. Add earnings date fetching
4. Build options context display

### Phase 3: Historical Context (Week 5-6)
1. Create TickerMention tracking
2. Implement ticker history aggregation
3. Build sentiment timeline visualization
4. Add "View all entries" filtering

### Phase 4: Smart Insights (Week 7-8)
1. Implement GPT-5 insight generation
2. Build strategy detection
3. Add entry review context (what happened after)
4. Add contextual prompts during entry creation

---

## Example Context Scenarios

**Scenario 1: Writing about a familiar ticker**
```
User types: "Thinking about adding to my AAPL position..."

Context surfaces:
- AAPL: $178.50 (+0.8%)
- Your history: 8 entries, mostly bullish
- Last entry (2 weeks ago): "Waiting for pullback to $175"
- Insight: "AAPL is above your $175 target. Still want to add?"
```

**Scenario 2: New ticker, options trade**
```
User types: "Looking at selling puts on PLTR..."

Context surfaces:
- PLTR: $24.80 (-1.2%)
- IV Rank: 78% (elevated)
- HV20: 42% | IV: 58% (premium: +16%)
- Your history: First PLTR entry
- Insight: "IV is elevated - good environment for put selling"
```

**Scenario 3: Strategy context**
```
User writes about iron condor on SPY

Context surfaces:
- SPY: $450.20 (+0.3%)
- VIX: 14.5 (low)
- Your iron condor history: 12 trades, 67% win rate
- Pattern: "You tend to place these when VIX < 15"
- Insight: "Low VIX = lower premium collected. Consider wider wings?"
```

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Slow context loading | High | Parallel fetches, aggressive caching, skeleton UI |
| yfinance rate limits | Low | Cache aggressively, batch requests |
| Incorrect ticker detection | Medium | Validate against known tickers, user confirmation |
| Overwhelming context | High | Collapsible by default on mobile, progressive disclosure |

---

## Success Criteria

**MVP Launch:**
- [ ] Ticker detection working (90%+ accuracy)
- [ ] Basic quote data displayed
- [ ] User entry history shown
- [ ] Context panel loads in < 2 seconds

**30-Day Post-Launch:**
- [ ] Context panel expanded in 40%+ of entries with tickers
- [ ] Users rate context as "helpful" > 60%
- [ ] No performance degradation (page load < 2s)
