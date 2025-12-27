# PRD-004: AI Link Suggestions

**Version:** 1.0
**Created:** 2024-12-27
**Status:** Draft
**Parent PRD:** PRD-001 (Smart Import Wizard), PRD-003 (Trade Linking Panel)
**Feature Branch:** `claude/file-upload-handling-BLQMo`

---

## 1. Overview

### 1.1 Summary

AI Link Suggestions is an intelligent feature that analyzes imported trades and suggests logical groupings based on ticker, timing, strategy relationships, and trading patterns. It helps users quickly identify related trades that should be linked into theses without manual analysis.

### 1.2 Problem Statement

When importing many trades, users face cognitive load in:
- Identifying which trades are related
- Remembering the context of each position
- Recognizing rolls, adjustments, and multi-leg strategies
- Spotting trades that should be linked to existing positions

Manual linking is tedious and error-prone, especially for active traders with dozens of trades per import.

### 1.3 Goals

1. Automatically identify trade groupings with high confidence
2. Explain why trades are suggested to be linked
3. Suggest appropriate thesis names and directions
4. Identify potential links to existing database trades
5. Reduce time spent on manual trade organization

### 1.4 Non-Goals

- Mandatory grouping (all suggestions are optional)
- Modifying trade data (suggestions only affect linking)
- Real-time suggestions during review (batch analysis only)

---

## 2. User Stories

| ID | Story | Priority |
|----|-------|----------|
| US-040 | As a trader, I want the system to suggest which import trades belong together so I don't miss obvious groupings | P0 |
| US-041 | As a trader, I want to understand why trades are suggested as related so I can verify the suggestion makes sense | P0 |
| US-042 | As a trader, I want suggested thesis names so I don't have to think of names myself | P1 |
| US-043 | As a trader, I want the system to identify if import trades relate to my existing trades | P1 |
| US-044 | As a trader, I want to see confidence levels so I know which suggestions are more certain | P1 |
| US-045 | As a trader, I want to easily accept or reject suggestions so I stay in control | P0 |
| US-046 | As a trader, I want suggestions to appear quickly so the import flow isn't slowed down | P1 |

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-040 | System SHALL analyze approved trades for potential groupings | P0 |
| FR-041 | System SHALL group trades by ticker as a baseline | P0 |
| FR-042 | System SHALL consider date proximity when suggesting groups | P0 |
| FR-043 | System SHALL detect roll patterns (same ticker, different expiration) | P1 |
| FR-044 | System SHALL detect adjustment patterns (same ticker, modified strikes) | P1 |
| FR-045 | System SHALL detect scaling patterns (same strategy, increasing/decreasing size) | P2 |
| FR-046 | System SHALL suggest thesis direction based on strategies | P1 |
| FR-047 | System SHALL generate thesis name suggestions | P1 |
| FR-048 | System SHALL provide confidence score (0-100%) for each suggestion | P0 |
| FR-049 | System SHALL provide human-readable reason for each suggestion | P0 |
| FR-050 | System SHALL identify matches with existing database trades | P1 |
| FR-051 | System SHALL NOT suggest groups with only 1 trade | P0 |
| FR-052 | System SHALL allow user to accept or dismiss suggestions | P0 |
| FR-053 | System SHALL support re-running suggestions after user edits | P2 |

### 3.2 Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-040 | Suggestions SHALL complete in < 3 seconds for 100 trades | P0 |
| NFR-041 | API response SHALL be < 500KB | P1 |
| NFR-042 | Suggestion algorithm SHALL not require external AI API for basic patterns | P1 |
| NFR-043 | Advanced pattern detection MAY use Claude API | P2 |

---

## 4. Technical Specification

### 4.1 Suggestion Algorithm

The suggestion system uses a multi-layer approach:

**Layer 1: Rule-Based Grouping (Fast, No AI)**
```typescript
// Always runs first
function basicGrouping(trades: Trade[]): SuggestionGroup[] {
  // 1. Group by ticker
  const byTicker = groupBy(trades, 'ticker');

  // 2. Within ticker, group by date proximity (7-day window)
  // 3. Within date group, identify:
  //    - Same strategy = potential scaling
  //    - Different expiry = potential roll
  //    - Opposite direction = potential close

  return groups;
}
```

**Layer 2: Pattern Detection (Moderate, No AI)**
```typescript
function detectPatterns(groups: SuggestionGroup[]): EnhancedGroup[] {
  for (const group of groups) {
    // Detect roll: same ticker, same type, different expiry
    if (isRollPattern(group)) {
      group.pattern = 'ROLL';
      group.confidence += 20;
    }

    // Detect scaling: same everything, different quantity
    if (isScalingPattern(group)) {
      group.pattern = 'SCALING';
      group.confidence += 15;
    }

    // Detect adjustment: same ticker, modified strikes
    if (isAdjustmentPattern(group)) {
      group.pattern = 'ADJUSTMENT';
      group.confidence += 15;
    }

    // Detect open/close pair
    if (isOpenClosePair(group)) {
      group.pattern = 'POSITION_LIFECYCLE';
      group.confidence += 25;
    }
  }

  return groups;
}
```

**Layer 3: AI Enhancement (Optional, Uses Claude)**
```typescript
async function aiEnhance(groups: SuggestionGroup[]): Promise<EnhancedGroup[]> {
  // Only for groups with confidence < 70%
  // Uses Claude to:
  // - Validate grouping makes sense
  // - Generate better thesis names
  // - Identify non-obvious relationships
  // - Suggest direction with reasoning

  const prompt = buildAnalysisPrompt(groups);
  const response = await claude.analyze(prompt);
  return mergeAiInsights(groups, response);
}
```

### 4.2 Confidence Scoring

| Factor | Points | Description |
|--------|--------|-------------|
| Same ticker | +30 | Base requirement |
| Within 7 days | +20 | Temporal proximity |
| Within 3 days | +10 | (additional) Very close |
| Same strategy type | +15 | e.g., both iron condors |
| Roll pattern detected | +20 | Same structure, different expiry |
| Open/close pair | +25 | Matching open and close |
| Existing thesis match | +15 | Matches existing thesis ticker |
| AI validation | +10 | Claude confirms relationship |

**Confidence Thresholds:**
- 85-100%: High confidence, auto-expand suggestion
- 60-84%: Medium confidence, show suggestion
- 40-59%: Low confidence, show as "possible"
- < 40%: Don't suggest

### 4.3 API Contract

#### POST /api/import/smart/suggest-links

Request:
```typescript
{
  batchId: string;
  trades: {
    id: string;
    ticker: string;
    strategyType: StrategyType;
    openedAt: string;      // ISO date
    closedAt?: string;
    debitCredit: number;
    realizedPL?: number;
    status: ThesisTradeStatus;
    legs?: string;
  }[];
  options?: {
    includeExisting: boolean;  // Check database for matches
    useAi: boolean;            // Enable AI enhancement
    minConfidence: number;     // Filter threshold (default: 40)
  };
}
```

Response:
```typescript
{
  success: boolean;
  data: {
    suggestions: LinkSuggestion[];
    existingMatches?: ExistingTradeMatch[];
    processingTime: number;  // ms
    aiUsed: boolean;
  };
}

interface LinkSuggestion {
  id: string;                    // Unique suggestion ID
  confidence: number;            // 0-100
  tradeIds: string[];            // Import trade IDs to link
  pattern: SuggestionPattern;
  reason: string;                // Human-readable explanation
  suggestedName: string;         // e.g., "AAPL Dec 2024 Bullish"
  suggestedDirection: ThesisDirection;
  suggestedActions?: {           // Recommended trade actions
    tradeId: string;
    action: TradeAction;
  }[];
}

interface ExistingTradeMatch {
  importTradeId: string;
  existingTradeId: string;
  existingThesisId?: string;
  existingThesisName?: string;
  matchConfidence: number;
  matchReason: string;
}

type SuggestionPattern =
  | 'SAME_TICKER'
  | 'ROLL'
  | 'SCALING'
  | 'ADJUSTMENT'
  | 'POSITION_LIFECYCLE'
  | 'MULTI_LEG'
  | 'AI_INFERRED';
```

### 4.4 Name Generation

**Template-based naming:**
```typescript
function generateThesisName(group: TradeGroup): string {
  const { ticker, direction, timeframe, pattern } = analyzeGroup(group);

  // Templates:
  // "{TICKER} {MONTH} {YEAR} {DIRECTION}"
  // "{TICKER} {PATTERN} {TIMEFRAME}"
  // "{TICKER} {STRATEGY} Play"

  const templates = [
    `${ticker} ${month} ${year} ${direction}`,
    `${ticker} ${pattern} Trade`,
    `${ticker} ${strategy} Strategy`,
  ];

  return selectBestTemplate(templates, group);
}

// Examples:
// "AAPL Dec 2024 Bullish"
// "NVDA Roll Trade"
// "TSLA Iron Condor Strategy"
```

### 4.5 File Structure

```
src/
├── lib/
│   └── suggestions/
│       ├── index.ts              # Main export
│       ├── basicGrouping.ts      # Layer 1
│       ├── patternDetection.ts   # Layer 2
│       ├── aiEnhancement.ts      # Layer 3
│       ├── confidenceScoring.ts  # Scoring logic
│       ├── nameGeneration.ts     # Thesis name templates
│       └── existingMatcher.ts    # Database matching
├── app/
│   └── api/
│       └── import/
│           └── smart/
│               └── suggest-links/
│                   └── route.ts
└── tests/
    └── unit/
        └── suggestions/
            ├── basicGrouping.test.ts
            ├── patternDetection.test.ts
            └── confidenceScoring.test.ts
```

---

## 5. UI/UX Specification

### 5.1 Suggestion Card

```
┌─────────────────────────────────────────────────────────────┐
│  💡 AAPL Dec 2024 Bullish                     85% confident │
│  ───────────────────────────────────────────────────────── │
│                                                             │
│  Pattern: Position Lifecycle (Open → Roll → Open)           │
│                                                             │
│  Included trades:                                           │
│  • Dec 15: Iron Condor (+$245)         → INITIAL            │
│  • Dec 18: Roll to Jan expiry (-$50)   → ROLL               │
│  • Dec 22: Still open                  → (current)          │
│                                                             │
│  Why: Same ticker within 7 days, detected roll pattern      │
│       based on matching structure with later expiration.    │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│       [Dismiss]                              [Accept]        │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Confidence Indicator

```
High (85-100%):   ████████████████████  ✓ High confidence
Medium (60-84%):  ████████████████░░░░    Medium confidence
Low (40-59%):     ████████░░░░░░░░░░░░    Possible match
```

### 5.3 Existing Trade Match

```
┌─────────────────────────────────────────────────────────────┐
│  🔗 Existing Trade Match                      72% confident │
│  ───────────────────────────────────────────────────────── │
│                                                             │
│  Your import:                                               │
│  • Dec 20: AAPL Put Spread (+$120)                          │
│                                                             │
│  Matches existing:                                          │
│  • Dec 10: AAPL Call (+$89) in "AAPL Q4 Earnings"          │
│                                                             │
│  Why: Same ticker, existing thesis is still active,         │
│       trade within thesis timeframe.                        │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│       [Keep Separate]                 [Link to Thesis]      │
└─────────────────────────────────────────────────────────────┘
```

### 5.4 Pattern Icons

| Pattern | Icon | Description |
|---------|------|-------------|
| SAME_TICKER | 🏷️ | Basic ticker grouping |
| ROLL | 🔄 | Roll to new expiration |
| SCALING | 📊 | Adding to or reducing position |
| ADJUSTMENT | ⚙️ | Strike or strategy adjustment |
| POSITION_LIFECYCLE | 📈 | Open through close |
| MULTI_LEG | 🔀 | Complex multi-leg strategy |
| AI_INFERRED | 🤖 | AI detected relationship |

---

## 6. Definition of Done

### 6.1 Feature Complete Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| DOD-040 | API returns suggestions for grouped trades | Integration test |
| DOD-041 | Same-ticker trades are grouped | Unit test |
| DOD-042 | Date proximity affects grouping | Unit test |
| DOD-043 | Roll patterns are detected | Unit test |
| DOD-044 | Confidence scores are calculated correctly | Unit test |
| DOD-045 | Human-readable reasons are generated | Unit test |
| DOD-046 | Thesis names are suggested | Unit test |
| DOD-047 | Direction is inferred from strategies | Unit test |
| DOD-048 | Existing trade matches are found | Integration test |
| DOD-049 | Suggestions appear in UI (PRD-003) | E2E test |
| DOD-050 | Accept creates link group | E2E test |
| DOD-051 | Dismiss removes suggestion | E2E test |
| DOD-052 | API completes in < 3 seconds | Performance test |

### 6.2 Quality Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| QC-040 | No false positives for unrelated tickers | Unit test |
| QC-041 | Roll detection accuracy > 90% | Unit test with fixtures |
| QC-042 | Name generation produces valid names | Unit test |
| QC-043 | Confidence scores are consistent | Unit test |
| QC-044 | API handles empty trade list | Unit test |
| QC-045 | API handles single trade | Unit test |

---

## 7. Test Requirements

### 7.1 Unit Tests

**File:** `tests/unit/suggestions/basicGrouping.test.ts`

| Test ID | Description |
|---------|-------------|
| UT-040 | Groups trades by ticker |
| UT-041 | Separates trades > 14 days apart |
| UT-042 | Keeps trades within 7 days together |
| UT-043 | Handles single trade per ticker |
| UT-044 | Handles multiple tickers correctly |

**File:** `tests/unit/suggestions/patternDetection.test.ts`

| Test ID | Description |
|---------|-------------|
| UT-045 | Detects roll pattern (same strikes, different expiry) |
| UT-046 | Detects scaling pattern (same strategy, different size) |
| UT-047 | Detects open/close pair |
| UT-048 | Does not falsely detect roll for unrelated trades |
| UT-049 | Handles mixed patterns in one group |

**File:** `tests/unit/suggestions/confidenceScoring.test.ts`

| Test ID | Description |
|---------|-------------|
| UT-050 | Same ticker adds 30 points |
| UT-051 | Within 7 days adds 20 points |
| UT-052 | Roll pattern adds 20 points |
| UT-053 | Scores cap at 100 |
| UT-054 | Multiple factors combine correctly |

**File:** `tests/unit/suggestions/nameGeneration.test.ts`

| Test ID | Description |
|---------|-------------|
| UT-055 | Generates name with ticker and month |
| UT-056 | Includes direction in name |
| UT-057 | Handles unknown direction gracefully |
| UT-058 | Truncates very long names |

### 7.2 Integration Tests

**File:** `tests/integration/suggest-links-api.test.ts`

| Test ID | Description |
|---------|-------------|
| IT-040 | API returns suggestions for valid trades |
| IT-041 | API handles empty trade list |
| IT-042 | API respects minConfidence filter |
| IT-043 | API finds existing trade matches when enabled |
| IT-044 | API completes within timeout |
| IT-045 | API requires authentication |
| IT-046 | API validates request body |

### 7.3 Fixture-Based Tests

**File:** `tests/fixtures/suggestion-scenarios.ts`

| Scenario | Expected Result |
|----------|-----------------|
| 3 AAPL trades in 5 days | 1 group, high confidence |
| AAPL + NVDA trades same day | 2 groups, separate |
| Roll pattern (same strikes, +30 days) | Detected as ROLL |
| Open trade + close trade | Detected as POSITION_LIFECYCLE |
| 10 unrelated tickers | 10 separate groups or no suggestions |
| Trade matching existing thesis | existingMatches populated |

### 7.4 E2E Tests

**File:** `playwright/ai-suggestions.test.ts`

| Test ID | Description |
|---------|-------------|
| E2E-040 | Suggestions appear after upload |
| E2E-041 | Accept suggestion creates link group |
| E2E-042 | Dismiss removes suggestion from list |
| E2E-043 | Link to existing thesis works |
| E2E-044 | Multiple suggestions can be accepted |

---

## 8. Dependencies

| Dependency | Purpose | Status |
|------------|---------|--------|
| PRD-003 Trade Linking Panel | Displays suggestions | Required |
| Anthropic Claude API | AI enhancement (optional) | Exists |
| Prisma | Database queries for existing matches | Exists |

---

## 9. Algorithm Examples

### 9.1 Roll Detection

**Input:**
```
Trade 1: AAPL 180C, expiry Dec 20, opened Dec 10
Trade 2: AAPL 180C, expiry Jan 17, opened Dec 18
```

**Analysis:**
- Same ticker: ✓ (+30)
- Same strike: ✓ (pattern indicator)
- Later expiry: ✓ (roll indicator)
- Within 8 days: ✓ (+20)
- Roll pattern: ✓ (+20)

**Output:**
```json
{
  "confidence": 70,
  "pattern": "ROLL",
  "reason": "Same strike (180C) rolled from Dec 20 to Jan 17 expiration",
  "suggestedName": "AAPL Dec 2024 Call Roll",
  "suggestedActions": [
    { "tradeId": "1", "action": "INITIAL" },
    { "tradeId": "2", "action": "ROLL" }
  ]
}
```

### 9.2 Position Lifecycle

**Input:**
```
Trade 1: AAPL Iron Condor, opened Dec 10, status OPEN
Trade 2: AAPL Iron Condor, opened Dec 10, closed Dec 22, status CLOSED
```

**Analysis:**
- Same ticker: ✓ (+30)
- Same strategy: ✓ (+15)
- Same open date: ✓ (likely same position)
- Open + Close pair: ✓ (+25)

**Output:**
```json
{
  "confidence": 70,
  "pattern": "POSITION_LIFECYCLE",
  "reason": "Iron Condor opened Dec 10, closed Dec 22 - full position lifecycle",
  "suggestedName": "AAPL Dec Iron Condor",
  "suggestedActions": [
    { "tradeId": "1", "action": "INITIAL" },
    { "tradeId": "2", "action": "CLOSE" }
  ]
}
```

---

## 10. Future Considerations

- Machine learning model trained on user's accept/dismiss patterns
- Cross-ticker correlation detection (pairs trades, hedges)
- Seasonal pattern recognition
- P/L-based grouping suggestions
- Integration with broker APIs for better context
- User preference learning (e.g., "always group AAPL trades")
