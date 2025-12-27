# PRD-003: Trade Linking Panel

**Version:** 1.0
**Created:** 2024-12-27
**Status:** Draft
**Parent PRD:** PRD-001 (Smart Import Wizard)
**Feature Branch:** `claude/file-upload-handling-BLQMo`

---

## 1. Overview

### 1.1 Summary

The Trade Linking Panel is an expandable interface that allows users to group related trades into a single thesis during import. It enables linking newly imported trades with each other and with existing trades in the database, supporting proper trade action sequencing (INITIAL → ADD → ROLL → CLOSE).

### 1.2 Problem Statement

Traders often execute multiple trades as part of a single thesis or strategy:
- Opening an initial position, then adding to it
- Rolling options to a later expiration
- Scaling in/out of positions over time
- Adjusting positions in response to market moves

Without proper linking, these related trades appear as disconnected entries, making it difficult to:
- Track the overall P/L of a strategy
- Review decision-making across a position's lifecycle
- Identify patterns in position management

### 1.3 Goals

1. Enable grouping of related trades under a single thesis
2. Support linking new imports to existing database trades
3. Allow specifying trade action types (INITIAL, ADD, ROLL, etc.)
4. Provide clear visualization of the trade relationship
5. Make linking optional and non-blocking in the import flow

---

## 2. User Stories

| ID | Story | Priority |
|----|-------|----------|
| US-030 | As a trader, I want to link related import trades together so they share a thesis | P0 |
| US-031 | As a trader, I want to link new imports to my existing trades so I maintain position continuity | P0 |
| US-032 | As a trader, I want to name the thesis when creating a link group so I can identify it later | P0 |
| US-033 | As a trader, I want to specify trade actions (INITIAL, ADD, ROLL) so the timeline is accurate | P1 |
| US-034 | As a trader, I want to see which trades the system suggests linking so I don't miss obvious groups | P1 |
| US-035 | As a trader, I want to unlink a trade from a group if I made a mistake | P1 |
| US-036 | As a trader, I want to skip linking entirely if none of my trades are related | P0 |
| US-037 | As a trader, I want to see a preview of how linked trades will appear | P2 |

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-030 | Panel SHALL display all approved import trades available for linking | P0 |
| FR-031 | Panel SHALL allow selecting multiple trades to form a link group | P0 |
| FR-032 | Panel SHALL allow searching/filtering existing trades by ticker | P0 |
| FR-033 | Panel SHALL display existing trades for the relevant ticker(s) | P0 |
| FR-034 | Panel SHALL allow linking to existing trades | P0 |
| FR-035 | Panel SHALL require a thesis name for new link groups | P0 |
| FR-036 | Panel SHALL allow specifying thesis direction (BULLISH, BEARISH, NEUTRAL, VOLATILE) | P1 |
| FR-037 | Panel SHALL allow specifying trade action for each linked trade | P1 |
| FR-038 | Panel SHALL auto-suggest action based on trade characteristics | P2 |
| FR-039 | Panel SHALL show AI-suggested link groups (see PRD-004) | P1 |
| FR-040 | Panel SHALL allow removing a trade from a link group | P1 |
| FR-041 | Panel SHALL allow deleting an entire link group | P1 |
| FR-042 | Panel SHALL validate that link groups have at least 2 trades | P0 |
| FR-043 | Panel SHALL prevent linking a trade to multiple groups | P0 |
| FR-044 | Panel SHALL have a "Skip Linking" option to proceed without linking | P0 |
| FR-045 | Panel SHALL persist link group state during session | P0 |

### 3.2 Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-030 | Panel expansion animation SHALL complete in < 200ms | P1 |
| NFR-031 | Existing trade search SHALL return results in < 1 second | P1 |
| NFR-032 | Panel SHALL support 100+ trades without performance degradation | P1 |
| NFR-033 | Panel SHALL be usable on mobile devices (touch-friendly) | P1 |

---

## 4. Technical Specification

### 4.1 Component Interface

```typescript
interface TradeLinkingPanelProps {
  // Available trades to link (from current import)
  importedTrades: ApprovedTrade[];

  // AI suggestions (from PRD-004)
  suggestions?: LinkSuggestion[];

  // Current link groups
  linkGroups: LinkGroup[];

  // Callbacks
  onCreateGroup: (group: NewLinkGroup) => void;
  onUpdateGroup: (groupId: string, updates: Partial<LinkGroup>) => void;
  onDeleteGroup: (groupId: string) => void;
  onSkip: () => void;
  onComplete: () => void;

  // For fetching existing trades
  onSearchExisting: (ticker: string) => Promise<ExistingTrade[]>;
}

interface ApprovedTrade {
  id: string;
  ticker: string;
  strategyType: StrategyType;
  strategyDisplay: string;
  openedAt: Date;
  closedAt?: Date;
  debitCredit: number;
  realizedPL?: number;
  status: ThesisTradeStatus;
  notes?: string;
  // Linking state
  linkedGroupId?: string;
  assignedAction?: TradeAction;
}

interface ExistingTrade {
  id: string;
  ticker: string;
  strategyType: StrategyType;
  openedAt: Date;
  closedAt?: Date;
  realizedPL?: number;
  status: ThesisTradeStatus;
  thesisId?: string;
  thesisName?: string;
}

interface LinkGroup {
  id: string;
  name: string;
  ticker: string;
  direction: ThesisDirection;
  trades: LinkedTrade[];
  existingThesisId?: string;  // If linking to existing thesis
  isNew: boolean;
}

interface LinkedTrade {
  tradeId: string;
  source: 'import' | 'existing';
  action: TradeAction;
  order: number;  // For timeline ordering
}

interface NewLinkGroup {
  name: string;
  ticker: string;
  direction: ThesisDirection;
  tradeIds: string[];  // Import trade IDs
  existingTradeIds?: string[];  // Existing trade IDs
  existingThesisId?: string;
}

interface LinkSuggestion {
  confidence: number;  // 0-1
  reason: string;
  tradeIds: string[];
  suggestedName: string;
  suggestedDirection: ThesisDirection;
}

type TradeAction =
  | 'INITIAL'
  | 'ADD'
  | 'REDUCE'
  | 'ROLL'
  | 'CONVERT'
  | 'CLOSE'
  | 'ASSIGNED'
  | 'EXERCISED';

type ThesisDirection = 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'VOLATILE';
```

### 4.2 State Management

```typescript
interface LinkingPanelState {
  // View state
  mode: 'list' | 'create' | 'edit';
  selectedGroupId: string | null;
  expandedSuggestions: boolean;

  // Selection state (for creating/editing groups)
  selectedImportTrades: Set<string>;
  selectedExistingTrades: Set<string>;

  // Search state
  searchTicker: string;
  searchResults: ExistingTrade[];
  searchLoading: boolean;

  // Form state (for create/edit)
  formData: {
    name: string;
    ticker: string;
    direction: ThesisDirection;
  };
}
```

### 4.3 API Integration

#### GET /api/trades (existing, add query params)

```typescript
// Request
GET /api/trades?ticker=AAPL&status=OPEN,CLOSED&limit=20

// Response
{
  trades: ExistingTrade[];
  total: number;
}
```

#### POST /api/import/smart/suggest-links (see PRD-004)

### 4.4 File Location

```
src/components/import/TradeLinkingPanel.tsx
src/components/import/TradeLinkingPanel.test.tsx
src/components/import/LinkGroupCard.tsx
src/components/import/TradeSelector.tsx
```

---

## 5. UI/UX Specification

### 5.1 Panel States

**State 1: List View (Default)**
```
┌─────────────────────────────────────────────────────────────┐
│  Link Related Trades                                        │
│  ───────────────────────────────────────────────────────── │
│                                                             │
│  💡 SUGGESTIONS (2)                              [Expand ▼] │
│  ┌─────────────────────────────────────────────────────────┐
│  │ "AAPL Dec 2024" - 3 trades (85% confidence)   [Accept] │
│  │ "NVDA Earnings" - 2 trades (72% confidence)   [Accept] │
│  └─────────────────────────────────────────────────────────┘
│                                                             │
│  YOUR LINK GROUPS (1)                                       │
│  ┌─────────────────────────────────────────────────────────┐
│  │ 📁 AAPL Q4 Bullish                             [Edit]   │
│  │    3 trades · $245 total P/L                  [Delete]  │
│  └─────────────────────────────────────────────────────────┘
│                                                             │
│  UNLINKED TRADES (5)                                        │
│  ┌─────────────────────────────────────────────────────────┐
│  │ ☐ Dec 15 TSLA Put Spread      -$89                      │
│  │ ☐ Dec 16 MSFT Iron Condor     +$156                     │
│  │ ☐ Dec 18 AMD Call             +$234                     │
│  │ ☐ Dec 20 GOOG Put             -$45                      │
│  │ ☐ Dec 22 META Straddle        +$312                     │
│  └─────────────────────────────────────────────────────────┘
│                                                             │
│         [+ Create Link Group]                               │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│       [Skip Linking]                    [Continue →]        │
└─────────────────────────────────────────────────────────────┘
```

**State 2: Create/Edit Group**
```
┌─────────────────────────────────────────────────────────────┐
│  ← Back                                Create Link Group    │
│  ───────────────────────────────────────────────────────── │
│                                                             │
│  Thesis Name:                                               │
│  ┌─────────────────────────────────────────────────────────┐
│  │ AAPL Q4 2024 Bullish Play                               │
│  └─────────────────────────────────────────────────────────┘
│                                                             │
│  Ticker:              Direction:                            │
│  ┌────────────┐       ┌────────────────────────────────┐    │
│  │ AAPL       │       │ BULLISH                    ▼   │    │
│  └────────────┘       └────────────────────────────────┘    │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  SELECT TRADES FROM IMPORT:                                 │
│  ┌─────────────────────────────────────────────────────────┐
│  │ ☑ Dec 15 AAPL Iron Condor  +$245        → INITIAL    ▼ │
│  │ ☑ Dec 18 AAPL Roll         -$50         → ROLL       ▼ │
│  │ ☐ Dec 20 AAPL Put Spread   +$120        → (select)     │
│  └─────────────────────────────────────────────────────────┘
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  LINK TO EXISTING TRADES:                      [Search 🔍]  │
│  ┌─────────────────────────────────────────────────────────┐
│  │ Search: AAPL                                            │
│  ├─────────────────────────────────────────────────────────┤
│  │ ☐ Dec 10 AAPL Call (+$89) - "AAPL Earnings"            │
│  │ ☐ Dec 5 AAPL Put (-$34) - Unlinked                     │
│  └─────────────────────────────────────────────────────────┘
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  PREVIEW:                                                   │
│  ┌─────────────────────────────────────────────────────────┐
│  │ Dec 15 ─●─ INITIAL: Iron Condor                         │
│  │         │                                               │
│  │ Dec 18 ─●─ ROLL: Adjustment                             │
│  │         │                                               │
│  │ Dec 22 ─●─ CLOSE (projected)                            │
│  └─────────────────────────────────────────────────────────┘
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│       [Cancel]                           [Create Group]     │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Trade Action Selector

```
┌────────────────────────────────┐
│ Select Action              ▼  │
├────────────────────────────────┤
│ ● INITIAL   (First position)  │
│ ○ ADD       (Increase size)   │
│ ○ REDUCE    (Decrease size)   │
│ ○ ROLL      (New expiration)  │
│ ○ CONVERT   (Change strategy) │
│ ○ CLOSE     (Exit position)   │
│ ○ ASSIGNED  (Option assigned) │
│ ○ EXERCISED (Option exercised)│
└────────────────────────────────┘
```

### 5.3 Direction Selector

```
┌────────────────────────────────┐
│ Direction                  ▼  │
├────────────────────────────────┤
│ ● BULLISH   📈                │
│ ○ BEARISH   📉                │
│ ○ NEUTRAL   ↔️                 │
│ ○ VOLATILE  📊                │
└────────────────────────────────┘
```

### 5.4 Timeline Preview

Visual representation of linked trades in chronological order:

```
     Dec 10        Dec 15        Dec 18        Dec 22
        │             │             │             │
        ●─────────────●─────────────●─────────────●
        │             │             │             │
    INITIAL         ADD          ROLL         CLOSE
   (+$89)        (+$245)       (-$50)          ?
```

### 5.5 Responsive Behavior

| Width | Behavior |
|-------|----------|
| < 640px | Stack all sections, full-width cards |
| 640-1024px | Two-column for trade selection |
| > 1024px | Side-by-side import + existing trades |

### 5.6 Color Coding

| Element | Color | Purpose |
|---------|-------|---------|
| Linked trade | blue-100 border | Shows trade is in a group |
| Selected trade | blue-500 bg | Currently selected for linking |
| Suggestion | amber-100 bg | AI suggestion highlight |
| Unlinked | gray-50 bg | Available for linking |
| Action: INITIAL | green-500 | First trade |
| Action: CLOSE | red-500 | Position closed |
| Action: ROLL | purple-500 | Rolled to new expiry |

---

## 6. Definition of Done

### 6.1 Feature Complete Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| DOD-030 | Panel displays all approved import trades | Manual test |
| DOD-031 | User can select multiple trades | Manual test |
| DOD-032 | User can create a new link group with name | Manual test |
| DOD-033 | User can specify thesis direction | Manual test |
| DOD-034 | User can assign trade actions to linked trades | Manual test |
| DOD-035 | User can search existing trades by ticker | Integration test |
| DOD-036 | User can link to existing trades | Manual test |
| DOD-037 | AI suggestions appear when available | Integration test |
| DOD-038 | User can accept an AI suggestion | Manual test |
| DOD-039 | User can edit a link group | Manual test |
| DOD-040 | User can delete a link group | Manual test |
| DOD-041 | User can remove a trade from a group | Manual test |
| DOD-042 | User can skip linking and proceed | Manual test |
| DOD-043 | Timeline preview shows correct order | Manual test |
| DOD-044 | Link groups persist in session state | Unit test |
| DOD-045 | Validation prevents single-trade groups | Unit test |

### 6.2 Quality Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| QC-030 | Component renders without errors | Unit test |
| QC-031 | Search returns results in < 1 second | Performance test |
| QC-032 | Panel handles 100+ trades smoothly | Performance test |
| QC-033 | Mobile touch interactions work | Manual test |
| QC-034 | ARIA labels present | Accessibility test |
| QC-035 | Keyboard navigation works | Manual test |

---

## 7. Test Requirements

### 7.1 Unit Tests

**File:** `src/components/import/TradeLinkingPanel.test.tsx`

| Test ID | Description |
|---------|-------------|
| UT-030 | Renders list of approved trades |
| UT-031 | Renders AI suggestions when provided |
| UT-032 | Selecting trade toggles selection state |
| UT-033 | Create group form validates required fields |
| UT-034 | Create group calls onCreateGroup with correct data |
| UT-035 | Edit group populates form with existing data |
| UT-036 | Delete group calls onDeleteGroup |
| UT-037 | Skip button calls onSkip |
| UT-038 | Continue button calls onComplete |
| UT-039 | Cannot create group with < 2 trades |
| UT-040 | Trade action dropdown changes assigned action |
| UT-041 | Direction dropdown changes group direction |
| UT-042 | Remove trade from group updates state |
| UT-043 | Accept suggestion creates group from suggestion |
| UT-044 | Timeline preview renders trades in date order |
| UT-045 | Linked trade cannot be selected for another group |

### 7.2 Integration Tests

**File:** `tests/integration/trade-linking.test.ts`

| Test ID | Description |
|---------|-------------|
| IT-030 | Search existing trades returns correct results |
| IT-031 | Link groups passed to confirm API correctly |
| IT-032 | Existing trades linked to new thesis |
| IT-033 | Link to existing thesis updates existing thesis |
| IT-034 | Trade actions persisted correctly |

### 7.3 UI Tests

**File:** `tests/ui/trade-linking-panel.test.ts`

| Test ID | Description |
|---------|-------------|
| UI-030 | Panel renders correctly at 375px |
| UI-031 | Panel renders correctly at 768px |
| UI-032 | Panel renders correctly at 1280px |
| UI-033 | Suggestion cards styled correctly |
| UI-034 | Link group cards styled correctly |
| UI-035 | Trade selection checkboxes visible |
| UI-036 | Action dropdown opens and selects |
| UI-037 | Direction dropdown opens and selects |
| UI-038 | Timeline preview renders correctly |
| UI-039 | Dark mode renders correctly |
| UI-040 | Expand/collapse animation smooth |

### 7.4 E2E Tests

**File:** `playwright/trade-linking.test.ts`

| Test ID | Description |
|---------|-------------|
| E2E-030 | Create link group from import trades |
| E2E-031 | Link import trade to existing trade |
| E2E-032 | Accept AI suggestion and verify group created |
| E2E-033 | Edit existing group and save changes |
| E2E-034 | Delete group and verify trades unlinked |
| E2E-035 | Skip linking and complete import |

---

## 8. Dependencies

| Dependency | Purpose | Status |
|------------|---------|--------|
| PRD-004 AI Suggestions | Provides link suggestions | Required |
| /api/trades | Fetch existing trades | Exists, may need query params |
| Zustand or Context | State management | TBD |
| @radix-ui/react-select | Dropdowns | Already in project |
| @radix-ui/react-checkbox | Trade selection | Already in project |

---

## 9. Edge Cases

| Case | Handling |
|------|----------|
| No approved trades | Show message, disable Create Group |
| All trades already linked | Show only link groups, hide unlinked section |
| Search returns no existing trades | Show "No trades found" message |
| Very long thesis name | Truncate with ellipsis, show full on hover |
| 50+ trades in one group | Virtualize trade list |
| Conflicting suggestions | Allow user to accept one, others adjust |
| Network error during search | Show error, allow retry |
| Session timeout | Warn user, offer to save progress |

---

## 10. Future Considerations

- Drag-and-drop reordering of trades in group
- Bulk action assignment (all INITIAL, then all CLOSE)
- Visual P/L aggregation in preview
- Link to trades from other import batches
- Smart action inference from trade characteristics
