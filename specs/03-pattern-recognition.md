# PRD: Pattern Recognition Engine

## Overview

**Problem Statement:**
Traders repeat the same behavioral mistakes without realizing it. They panic sell during corrections, FOMO into tops, adjust winners too early, and let losers run. These patterns are invisible in the moment but clear in retrospect - if you have the data.

**Solution:**
A pattern recognition engine that analyzes journal entries over time to identify recurring behavioral patterns, correlates them with outcomes, and surfaces insights at relevant moments.

**Success Metrics:**
- 80% of users see at least one "pattern detected" insight within 30 days
- Users report "increased self-awareness" in surveys
- Measurable reduction in identified negative patterns (if outcome tracking enabled)
- Pattern insights shared/saved rate > 50%

---

## LLM Architecture

**Single Provider: OpenAI (GPT-5 Family)**

| Task | Model | Cost (per 1M tokens) | Why |
|------|-------|---------------------|-----|
| Bias frequency analysis | GPT-5 Nano | $0.05 / $0.40 | Batch processing |
| Pattern detection | GPT-5 | $1.25 / $10.00 | Complex reasoning |
| Monthly reports | GPT-5 | $1.25 / $10.00 | Nuanced insights |
| Real-time alerts | GPT-5 Nano | $0.05 / $0.40 | Fast response |
| Embeddings | text-embedding-3-small | $0.02 | Similarity search |

---

## User Stories

### Pattern Detection
1. As a trader, I want to know if I have a pattern of selling too early when uncertain, so I can work on conviction.
2. As a trader, I want to see my behavior during past corrections, so I can prepare for the next one.
3. As a trader, I want to identify my most common cognitive biases over time.

### Pattern Surfacing
4. As a trader feeling FOMO, I want to be shown my historical FOMO entries and what happened, so I can make a better decision.
5. As a trader about to make a trade, I want to see similar past trades and their outcomes.
6. As a trader, I want a monthly "behavioral report card" showing my patterns.

### Pattern Awareness
7. As a trader, I want to be warned when I'm about to repeat a negative pattern.
8. As a trader, I want to celebrate when I break a negative pattern.

---

## Feature Specifications

### 1. Behavioral Pattern Categories

**Timing Patterns:**
- Early profit taking (selling winners before target)
- Late loss cutting (holding losers too long)
- FOMO entries (buying after big moves up)
- Panic exits (selling during volatility spikes)
- Revenge trading (rapid trades after losses)

**Conviction Patterns:**
- Low conviction → early exit
- High conviction → holding through volatility
- Conviction decay over time
- Conviction inflation after price moves

**Emotional Patterns:**
- Anxious during drawdowns → panic action
- Euphoric during rallies → overexposure
- Frustrated → revenge trading
- Uncertain → analysis paralysis

**Market Condition Patterns:**
- Behavior during corrections (>5% drawdown)
- Behavior during rallies (>5% runup)
- Behavior during low volatility (VIX < 15)
- Behavior during high volatility (VIX > 25)

### 2. Pattern Detection Engine

**Data Inputs:**
- All journal entries (content, mood, conviction, sentiment)
- Entry metadata (type, timestamp, ticker)
- AI analysis (biases detected, emotional keywords)
- Market conditions at time of entry
- Trade outcomes (if tracked)

**GPT-5 Pattern Analysis:**

```typescript
async function detectPatterns(entries: Entry[]): Promise<PatternInsight[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-5',  // Flagship for complex analysis
    messages: [{
      role: 'system',
      content: `You are analyzing a trader's journal entries to identify behavioral patterns.
        Look for:
        - Recurring cognitive biases
        - Emotional patterns tied to market conditions
        - Timing patterns (early exits, late entries)
        - Conviction patterns
        - Correlations between mood and outcomes

        Be specific and provide evidence from the entries.`
    }, {
      role: 'user',
      content: `Analyze these ${entries.length} journal entries for behavioral patterns:

        ${entries.map(e => `
          Date: ${e.createdAt}
          Type: ${e.type}
          Mood: ${e.mood}
          Conviction: ${e.conviction}
          Biases: ${e.detectedBiases?.join(', ')}
          Content: ${e.content.substring(0, 500)}
        `).join('\n---\n')}`
    }],
    response_format: { type: 'json_object' },
    max_tokens: 2000
  });

  return JSON.parse(response.choices[0].message.content).patterns;
}
```

**Output Example:**
```json
{
  "patterns": [
    {
      "patternType": "TIMING",
      "patternName": "early_profit_taking",
      "description": "You tend to exit winning positions early when feeling uncertain",
      "occurrences": 5,
      "evidence": ["Entry from Oct 15: 'Took profits early, feeling nervous'", "..."],
      "trend": "INCREASING",
      "confidence": 0.82
    },
    {
      "patternType": "EMOTIONAL",
      "patternName": "drawdown_silence",
      "description": "You stop journaling during market corrections",
      "occurrences": 3,
      "evidence": ["Gap from Sep 1-12 during SPY -4% correction", "..."],
      "trend": "STABLE",
      "confidence": 0.91
    }
  ]
}
```

### 3. Pattern Insights Display

**Weekly Insights Enhancement:**

Add "Patterns" section to existing weekly insights:
```
┌─────────────────────────────────┐
│ 🔄 Behavioral Patterns          │
├─────────────────────────────────┤
│                                 │
│ Pattern Detected: FOMO Trading  │
│ ─────────────────────────────── │
│ You've shown FOMO signals in    │
│ 4 of your last 10 entries.      │
│                                 │
│ Historical outcome:             │
│ • FOMO trades: 35% win rate     │
│ • Non-FOMO trades: 62% win rate │
│                                 │
│ [See all FOMO entries]          │
│                                 │
├─────────────────────────────────┤
│                                 │
│ Positive Pattern: Patience      │
│ ─────────────────────────────── │
│ You've been more patient this   │
│ week - 0 entries with "rushed"  │
│ or "impulsive" tags.            │
│                                 │
│ Keep it up!                     │
│                                 │
└─────────────────────────────────┘
```

**Monthly Behavioral Report:**

New page: `/insights/patterns`
```
┌─────────────────────────────────┐
│ Your Trading Patterns           │
│ November 2024                   │
├─────────────────────────────────┤
│                                 │
│ Most common bias:               │
│ Loss Aversion (8 occurrences)   │
│ [████████░░] 40% of entries     │
│                                 │
│ Conviction distribution:        │
│ High:   ████████░░ 35%          │
│ Medium: ██████████ 45%          │
│ Low:    ████░░░░░░ 20%          │
│                                 │
│ Market condition behavior:      │
│ ┌─────────────────────────────┐ │
│ │ Down days: More anxious,    │ │
│ │ shorter entries, fewer      │ │
│ │ trade ideas                 │ │
│ │                             │ │
│ │ Up days: More confident,    │ │
│ │ higher conviction, more     │ │
│ │ FOMO signals                │ │
│ └─────────────────────────────┘ │
│                                 │
│ Key Insight                     │
│ ─────────────────────────────── │
│ "You tend to stop journaling    │
│ during corrections. Your last   │
│ 3 journal gaps (5+ days) all    │
│ coincided with SPY drawdowns."  │
│                                 │
│ [Set up drawdown check-ins]     │
│                                 │
└─────────────────────────────────┘
```

### 4. Real-Time Pattern Alerts

**During Entry Creation:**

When user types content that matches historical patterns:
```
┌─────────────────────────────────┐
│ Pattern Recognition             │
├─────────────────────────────────┤
│                                 │
│ This sounds similar to entries  │
│ you've made before...           │
│                                 │
│ "NVDA looks like it's breaking  │
│ out, I should add more"         │
│ - Oct 15 (NVDA then dropped 8%) │
│                                 │
│ "Can't miss this AI rally"      │
│ - Sep 3 (bought top)            │
│                                 │
│ Your FOMO entries have a 35%    │
│ success rate. Take a breath.    │
│                                 │
│ [I understand] [Show me more]   │
│                                 │
└─────────────────────────────────┘
```

**Implementation:**
```typescript
async function checkForPatternMatch(
  draftContent: string,
  userId: string
): Promise<PatternAlert | null> {
  // Generate embedding for draft
  const draftEmbedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: draftContent
  });

  // Find similar past entries with negative outcomes
  const similarEntries = await prisma.$queryRaw`
    SELECT e.*, 1 - (e.embedding <=> ${draftEmbedding.data[0].embedding}::vector) as similarity
    FROM "Entry" e
    WHERE e.user_id = ${userId}
      AND e.sentiment = 'negative'
      AND 1 - (e.embedding <=> ${draftEmbedding.data[0].embedding}::vector) > 0.75
    ORDER BY similarity DESC
    LIMIT 3
  `;

  if (similarEntries.length > 0) {
    // Use GPT-5 Nano to generate alert copy
    const alert = await openai.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [{
        role: 'user',
        content: `Generate a brief, empathetic pattern alert.
          Current draft: "${draftContent}"
          Similar past entries that had negative outcomes:
          ${similarEntries.map(e => `- "${e.content.substring(0, 100)}"`).join('\n')}`
      }],
      max_tokens: 150
    });

    return {
      message: alert.choices[0].message.content,
      similarEntries,
      patternType: 'FOMO' // or detected pattern
    };
  }

  return null;
}
```

### 5. Pattern Breaking Recognition

**Celebrating Positive Change:**

When user breaks a negative pattern:
```
┌─────────────────────────────────┐
│ Pattern Broken!                 │
├─────────────────────────────────┤
│                                 │
│ Market down 2.1% today, but     │
│ you journaled anyway!           │
│                                 │
│ In the past, you'd go silent    │
│ during corrections. Not today.  │
│                                 │
│ This is how habits change.      │
│                                 │
└─────────────────────────────────┘
```

---

## Technical Architecture

### Pattern Analysis Pipeline

```
Daily Batch Job (2 AM ET)
    ↓
Fetch entries from last 90 days
    ↓
Run GPT-5 pattern analysis
    ↓
Store patterns in PatternInsight table
    ↓
Flag significant patterns for notification
```

### Database Schema

```prisma
model PatternInsight {
  id              String      @id @default(cuid())
  patternType     PatternType
  patternName     String      // "fomo_trading", "drawdown_silence", etc.
  description     String
  occurrences     Int
  trend           Trend       // INCREASING, STABLE, DECREASING
  confidence      Float       // 0-1
  relatedEntryIds String[]    // IDs of entries that form this pattern
  evidence        String[]    // Quotes from entries
  outcomeData     Json?       // { winRate, avgReturn, etc. }
  firstDetected   DateTime
  lastUpdated     DateTime    @default(now())
  isActive        Boolean     @default(true)

  @@index([patternType])
}

enum PatternType {
  TIMING
  CONVICTION
  EMOTIONAL
  MARKET_CONDITION
  STRATEGY
  BIAS_FREQUENCY
}

enum Trend {
  INCREASING
  STABLE
  DECREASING
}
```

### API Endpoints

```typescript
// Get all detected patterns
GET /api/patterns
  Returns: PatternInsight[]

// Get pattern details with related entries
GET /api/patterns/[id]
  Returns: PatternInsight with full entry data

// Check draft for pattern matches (real-time)
POST /api/patterns/check
  Body: { content: string }
  Returns: PatternAlert | null

// Dismiss a pattern (won't show again)
POST /api/patterns/dismiss
  Body: { patternId: string }

// Monthly behavioral report
GET /api/insights/monthly?month=2024-11
  Returns: MonthlyReport

// Trigger pattern analysis (admin/cron)
POST /api/patterns/analyze
  Runs full pattern detection
```

### Cron Job Configuration

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/pattern-analysis",
      "schedule": "0 7 * * *"  // 2 AM ET daily
    }
  ]
}
```

---

## Cost Estimates (Monthly)

| Service | Usage | Cost |
|---------|-------|------|
| GPT-5 (pattern analysis) | 30 analyses | $0.10 |
| GPT-5 Nano (alerts) | 100 checks | $0.01 |
| Embeddings | 500 entries | $0.01 |
| **Total** | | **~$0.12/month** |

---

## Implementation Phases

### Phase 1: Basic Pattern Detection (Week 1-2)
1. Create PatternInsight model
2. Implement bias frequency analysis
3. Add "Patterns" section to weekly insights
4. Run analysis on entry creation

### Phase 2: Market Correlation (Week 3-4)
1. Tag entries with market conditions
2. Implement market condition correlation
3. Build monthly behavioral report page
4. Add "behavior during X" insights

### Phase 3: Real-Time Detection (Week 5-6)
1. Implement draft similarity checking
2. Build real-time pattern alert UI
3. Add "I understand" acknowledgment flow
4. Track alert engagement

### Phase 4: Pattern Breaking (Week 7-8)
1. Detect pattern-breaking behavior
2. Build celebration UI component
3. Track pattern-breaking streaks
4. Add to weekly insights

---

## Example Pattern Insights

**High-Value Patterns to Detect:**

1. "You stop journaling during corrections (3 of last 4 gaps were during drawdowns)"

2. "Your FOMO entries have a 35% win rate vs 62% for planned entries"

3. "You adjust winning positions 40% earlier than losing positions"

4. "Monday entries are 2x more likely to show 'rushed' tag than other days"

5. "After a losing trade, your next entry is 70% more likely to show revenge_trading bias"

6. "Your conviction decreases by an average of 1 level between entry and exit"

7. "You journal 3x more on up days than down days - but down days matter more"

8. "When you write 'can't miss this', historical outcome is -4.2% average"

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Not enough data | High | Require 20+ entries before showing patterns |
| False pattern detection | Medium | Show confidence levels, require 3+ occurrences |
| Demotivating negative patterns | High | Balance with positive patterns, empathetic framing |
| Alert fatigue | Medium | Limit alerts, "don't show again" option |

---

## Success Criteria

**MVP Launch:**
- [ ] Bias frequency patterns detected and displayed
- [ ] Monthly report page functional
- [ ] At least 3 pattern types detected per user (with 30+ entries)
- [ ] Pattern alerts show during entry creation

**30-Day Post-Launch:**
- [ ] 80% of active users see pattern insights
- [ ] User survey: "More self-aware" > 60%
- [ ] Pattern alerts dismissed < 50% (meaning they're useful)
