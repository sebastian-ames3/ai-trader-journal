# PRD-001: Smart Import Wizard

**Version:** 1.0
**Created:** 2024-12-27
**Status:** Draft
**Feature Branch:** `claude/file-upload-handling-BLQMo`

---

## 1. Overview

### 1.1 Summary

The Smart Import Wizard is a new import experience that replaces the batch-oriented OptionStrat Import Wizard with a user-centric, card-based review flow. Users upload trading data (CSV/Excel), review each trade individually with swipeable cards, optionally link related trades into theses, and confirm the import with full control over the final data.

### 1.2 Problem Statement

The current import wizard:
- Batch imports trades without granular review
- Doesn't allow per-trade editing before import
- Lacks intuitive trade linking/grouping capabilities
- Provides no opportunity to add notes during import
- Can incorrectly split or group trades without user verification

### 1.3 Goals

1. Give users full control over each imported trade
2. Enable per-trade editing, notes, and labeling before commit
3. Provide intuitive trade linking for multi-leg or related positions
4. Suggest intelligent groupings while respecting user decisions
5. Create a mobile-friendly, swipeable card-based UX

### 1.4 Non-Goals

- Broker API integration (future scope)
- Real-time trade sync (future scope)
- Excel formula preservation (only data extraction)

---

## 2. User Stories

### 2.1 Core Import Flow

| ID | Story | Priority |
|----|-------|----------|
| US-001 | As a trader, I want to upload my OptionStrat CSV export so I can import my trades | P0 |
| US-002 | As a trader, I want to review each trade individually before importing so I can verify accuracy | P0 |
| US-003 | As a trader, I want to edit trade details (ticker, strategy, dates, P/L) before importing so I can correct any parsing errors | P0 |
| US-004 | As a trader, I want to add notes to each trade during import so I can capture context while it's fresh | P1 |
| US-005 | As a trader, I want to skip trades I don't want to import so I have control over my data | P0 |
| US-006 | As a trader, I want to see a summary before final import so I can confirm my choices | P0 |

### 2.2 Trade Linking

| ID | Story | Priority |
|----|-------|----------|
| US-007 | As a trader, I want to link related trades into a single thesis so I can track multi-leg positions together | P0 |
| US-008 | As a trader, I want the system to suggest which trades might be related so I don't miss obvious groupings | P1 |
| US-009 | As a trader, I want to link new imports to my existing trades so I can maintain position continuity | P1 |
| US-010 | As a trader, I want to specify trade actions (INITIAL, ADD, ROLL, CLOSE) when linking so my trade timeline is accurate | P1 |

### 2.3 UX

| ID | Story | Priority |
|----|-------|----------|
| US-011 | As a trader, I want to swipe through trades quickly so I can review many trades efficiently | P1 |
| US-012 | As a trader, I want to undo a skip/approve action so I can correct mistakes | P1 |
| US-013 | As a trader, I want to see my progress through the import so I know how much is left | P0 |

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-001 | System SHALL accept CSV files in OptionStrat export format | P0 |
| FR-002 | System SHALL parse and validate all trades before presenting for review | P0 |
| FR-003 | System SHALL present trades one at a time in a card-based UI | P0 |
| FR-004 | System SHALL allow editing of: ticker, strategy type, open date, close date, P/L, status, description | P0 |
| FR-005 | System SHALL allow adding notes (free text) to each trade | P0 |
| FR-006 | System SHALL support approve/skip actions for each trade | P0 |
| FR-007 | System SHALL track approved, skipped, and pending counts | P0 |
| FR-008 | System SHALL allow undo of the last action | P1 |
| FR-009 | System SHALL display a confirmation summary before import | P0 |
| FR-010 | System SHALL create ThesisTrade records for approved trades | P0 |
| FR-011 | System SHALL support trade linking (see PRD-003) | P0 |
| FR-012 | System SHALL support AI link suggestions (see PRD-004) | P1 |
| FR-013 | System SHOULD support Excel (.xlsx) file uploads | P2 |
| FR-014 | System SHALL cache parsed data for session duration | P0 |
| FR-015 | System SHALL validate user authentication before import | P0 |

### 3.2 Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-001 | Card swipe animations SHALL complete in < 300ms | P1 |
| NFR-002 | File parsing SHALL complete in < 5 seconds for files up to 1000 rows | P1 |
| NFR-003 | Import confirmation SHALL complete in < 10 seconds for 100 trades | P1 |
| NFR-004 | UI SHALL be responsive on mobile devices (min 375px width) | P1 |
| NFR-005 | Session data SHALL persist for 30 minutes of inactivity | P2 |

---

## 4. Technical Specification

### 4.1 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (New)                           │
├─────────────────────────────────────────────────────────────┤
│  Page: /journal/import/smart                                │
│  Components:                                                │
│    - SmartImportWizard (orchestrator)                       │
│    - FileUploadStep                                         │
│    - TradeReviewStep (contains TradeReviewCard)             │
│    - TradeLinkingStep (contains TradeLinkingPanel)          │
│    - ConfirmationStep                                       │
│    - ImportCompleteStep                                     │
│  State: useSmartImportStore (Zustand)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Enhanced)                       │
├─────────────────────────────────────────────────────────────┤
│  Existing:                                                  │
│    - POST /api/import/csv/upload (reuse)                    │
│  New/Modified:                                              │
│    - POST /api/import/smart/confirm                         │
│    - POST /api/import/smart/suggest-links                   │
│    - GET  /api/trades?ticker=X&userId=Y (for linking)       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (Existing)                      │
├─────────────────────────────────────────────────────────────┤
│  Models: ThesisTrade, TradingThesis, User                   │
│  New fields: None required                                  │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 State Management

```typescript
interface SmartImportState {
  // Upload phase
  file: File | null;
  batchId: string | null;

  // Parsed trades
  trades: ParsedTrade[];

  // Review phase
  currentIndex: number;
  decisions: Map<string, TradeDecision>; // tradeId -> decision

  // Linking phase
  linkGroups: LinkGroup[];

  // Actions
  uploadFile: (file: File) => Promise<void>;
  approveTrade: (tradeId: string, edits?: TradeEdits) => void;
  skipTrade: (tradeId: string) => void;
  undoLast: () => void;
  createLinkGroup: (tradeIds: string[], thesisName: string) => void;
  confirmImport: () => Promise<ImportResult>;
}

interface TradeDecision {
  action: 'approve' | 'skip';
  edits?: TradeEdits;
  notes?: string;
  linkedTo?: string; // thesisId or linkGroupId
  tradeAction?: TradeAction; // INITIAL, ADD, ROLL, etc.
}
```

### 4.3 API Contracts

#### POST /api/import/smart/confirm

Request:
```typescript
{
  batchId: string;
  decisions: {
    tradeId: string;
    action: 'approve' | 'skip';
    edits?: {
      ticker?: string;
      strategyType?: StrategyType;
      openedAt?: string;
      closedAt?: string;
      debitCredit?: number;
      realizedPL?: number;
      status?: ThesisTradeStatus;
      description?: string;
    };
    notes?: string;
    thesisId?: string;        // Link to existing thesis
    newThesisName?: string;   // Create new thesis
    tradeAction?: TradeAction;
  }[];
  linkGroups?: {
    name: string;
    ticker: string;
    direction: ThesisDirection;
    tradeIds: string[];
  }[];
}
```

Response:
```typescript
{
  success: boolean;
  data: {
    imported: number;
    skipped: number;
    thesesCreated: number;
    tradeIds: string[];
    thesisIds: string[];
  };
  errors?: { tradeId: string; error: string }[];
}
```

### 4.4 File Structure

```
src/
├── app/
│   └── journal/
│       └── import/
│           └── smart/
│               └── page.tsx
├── components/
│   └── import/
│       ├── smart/
│       │   ├── SmartImportWizard.tsx
│       │   ├── FileUploadStep.tsx
│       │   ├── TradeReviewStep.tsx
│       │   ├── TradeLinkingStep.tsx
│       │   ├── ConfirmationStep.tsx
│       │   └── ImportCompleteStep.tsx
│       ├── TradeReviewCard.tsx (see PRD-002)
│       └── TradeLinkingPanel.tsx (see PRD-003)
├── stores/
│   └── smartImportStore.ts
└── app/
    └── api/
        └── import/
            └── smart/
                ├── confirm/
                │   └── route.ts
                └── suggest-links/
                    └── route.ts
```

---

## 5. UI/UX Specification

### 5.1 Wizard Flow

```
[1. Upload] → [2. Review] → [3. Link] → [4. Confirm] → [5. Complete]
    ●            ○            ○            ○              ○
```

### 5.2 Step Details

**Step 1: Upload**
- Drag-and-drop zone with file type indicators
- "Choose File" button alternative
- Supported formats: CSV (P0), XLSX (P2)
- Error display for invalid files
- Progress indicator during parsing

**Step 2: Review (Card-based)**
- See PRD-002 for TradeReviewCard specification
- Progress indicator: "5 of 23 trades"
- Swipe left = Skip, Swipe right = Approve
- Tap to expand for editing
- Undo button for last action

**Step 3: Link (Optional)**
- See PRD-003 for TradeLinkingPanel specification
- Show AI suggestions (PRD-004)
- Allow manual grouping
- Skip button if no linking desired

**Step 4: Confirm**
- Summary statistics:
  - Trades to import: X
  - Trades skipped: Y
  - New theses: Z
  - Linked to existing: W
- Expandable list of all approved trades
- "Back" to make changes
- "Import All" to confirm

**Step 5: Complete**
- Success message with counts
- Links to view imported trades
- Option to import more
- Option to go to journal

### 5.3 Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| < 640px (mobile) | Full-width cards, touch swipe |
| 640-1024px (tablet) | Centered cards, touch/mouse |
| > 1024px (desktop) | Centered cards with keyboard nav |

---

## 6. Definition of Done

### 6.1 Feature Complete Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| DOD-001 | User can upload CSV file and see parsed trades | Manual test |
| DOD-002 | User can swipe through trades (approve/skip) | Manual test |
| DOD-003 | User can edit any trade field before import | Manual test |
| DOD-004 | User can add notes to any trade | Manual test |
| DOD-005 | User can undo last approve/skip action | Manual test |
| DOD-006 | User can link trades into groups | Manual test |
| DOD-007 | User sees confirmation summary before import | Manual test |
| DOD-008 | Approved trades are created in database | Integration test |
| DOD-009 | Skipped trades are not created | Integration test |
| DOD-010 | Linked trades share the same thesisId | Integration test |
| DOD-011 | User edits are persisted to database | Integration test |
| DOD-012 | Notes are saved to reasoningNote field | Integration test |

### 6.2 Quality Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| QC-001 | All unit tests pass | `npm run test` |
| QC-002 | All integration tests pass | `npm run test:api` |
| QC-003 | All E2E tests pass | `npm run test:playwright` |
| QC-004 | No TypeScript errors | `npm run type-check` |
| QC-005 | No ESLint errors | `npm run lint` |
| QC-006 | Mobile responsive (375px+) | Manual test on device/emulator |
| QC-007 | Swipe animations < 300ms | Performance profiling |
| QC-008 | File parse < 5s for 1000 rows | Performance test |

### 6.3 Documentation Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| DC-001 | API endpoints documented | Code comments/JSDoc |
| DC-002 | Component props documented | TypeScript interfaces |
| DC-003 | State management documented | Code comments |

---

## 7. Test Requirements

### 7.1 Unit Tests

**File:** `tests/unit/smart-import.test.ts`

| Test ID | Description |
|---------|-------------|
| UT-001 | SmartImportWizard renders all steps |
| UT-002 | FileUploadStep accepts valid CSV |
| UT-003 | FileUploadStep rejects invalid file types |
| UT-004 | TradeReviewStep displays trade data correctly |
| UT-005 | Approve action updates state correctly |
| UT-006 | Skip action updates state correctly |
| UT-007 | Undo action restores previous state |
| UT-008 | Edit form validates required fields |
| UT-009 | Confirmation step shows correct counts |
| UT-010 | Link groups are correctly structured |

### 7.2 Integration Tests

**File:** `tests/integration/smart-import-api.test.ts`

| Test ID | Description |
|---------|-------------|
| IT-001 | POST /api/import/smart/confirm creates trades |
| IT-002 | POST /api/import/smart/confirm respects skip decisions |
| IT-003 | POST /api/import/smart/confirm applies edits |
| IT-004 | POST /api/import/smart/confirm saves notes |
| IT-005 | POST /api/import/smart/confirm creates link groups as theses |
| IT-006 | POST /api/import/smart/confirm links to existing theses |
| IT-007 | POST /api/import/smart/confirm handles partial failures |
| IT-008 | POST /api/import/smart/confirm requires authentication |
| IT-009 | POST /api/import/smart/suggest-links returns suggestions |
| IT-010 | Invalid batchId returns 400 error |

### 7.3 E2E Tests (Playwright)

**File:** `playwright/smart-import.test.ts`

| Test ID | Description |
|---------|-------------|
| E2E-001 | Complete import flow - upload to completion |
| E2E-002 | Skip all trades results in no imports |
| E2E-003 | Edit trade and verify changes persisted |
| E2E-004 | Add notes and verify saved |
| E2E-005 | Undo action works correctly |
| E2E-006 | Link trades and verify thesis created |
| E2E-007 | Mobile swipe gestures work |
| E2E-008 | Keyboard navigation works on desktop |
| E2E-009 | Back button returns to previous step |
| E2E-010 | Invalid file shows error message |

### 7.4 UI Tests

**File:** `tests/ui/smart-import-visual.test.ts`

| Test ID | Description |
|---------|-------------|
| UI-001 | Card renders correctly at mobile width (375px) |
| UI-002 | Card renders correctly at tablet width (768px) |
| UI-003 | Card renders correctly at desktop width (1280px) |
| UI-004 | Progress indicator updates correctly |
| UI-005 | Error states display correctly |
| UI-006 | Loading states display correctly |
| UI-007 | Swipe animation is smooth |
| UI-008 | Edit form fields are properly styled |
| UI-009 | Confirmation summary is readable |
| UI-010 | Success state displays correctly |

---

## 8. Dependencies

| Dependency | Type | PRD |
|------------|------|-----|
| TradeReviewCard | Component | PRD-002 |
| TradeLinkingPanel | Component | PRD-003 |
| AI Link Suggestions | Feature | PRD-004 |
| Existing CSV parser | Library | N/A (exists) |
| Zustand | State management | N/A (add if needed) |

---

## 9. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Swipe gestures conflict with scroll | Medium | Medium | Use dedicated swipe library (react-swipeable) |
| Large imports slow down UI | Low | High | Virtualize trade list, batch database operations |
| State loss on page refresh | Medium | Medium | Persist state to sessionStorage |
| Mobile keyboard covers edit form | Medium | Low | Scroll form into view on focus |

---

## 10. Future Considerations

- Excel file support (P2)
- Broker API imports (Schwab, TastyTrade)
- Bulk edit mode for power users
- Import templates for custom CSV formats
- Import history and re-import from previous
