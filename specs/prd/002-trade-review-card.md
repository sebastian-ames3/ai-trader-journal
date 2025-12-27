# PRD-002: Trade Review Card

**Version:** 1.0
**Created:** 2024-12-27
**Status:** Draft
**Parent PRD:** PRD-001 (Smart Import Wizard)
**Feature Branch:** `claude/file-upload-handling-BLQMo`

---

## 1. Overview

### 1.1 Summary

The Trade Review Card is a swipeable, mobile-first component for reviewing individual trades during the import process. It displays trade details, allows inline editing, supports note-taking, and provides quick approve/skip actions via swipe gestures or buttons.

### 1.2 Problem Statement

Current import flows show trades in tables, which:
- Are difficult to review on mobile devices
- Don't encourage careful per-trade review
- Make editing cumbersome (modals, separate forms)
- Don't support adding context (notes) during import

### 1.3 Goals

1. Create a visually clear, scannable trade card
2. Support natural swipe gestures for approve/skip
3. Enable inline editing without leaving the card
4. Allow note-taking within the card context
5. Work beautifully on mobile, tablet, and desktop

---

## 2. User Stories

| ID | Story | Priority |
|----|-------|----------|
| US-020 | As a trader, I want to see key trade info at a glance so I can quickly verify accuracy | P0 |
| US-021 | As a trader, I want to swipe right to approve a trade so I can move quickly through reviews | P0 |
| US-022 | As a trader, I want to swipe left to skip a trade so I can exclude unwanted trades | P0 |
| US-023 | As a trader, I want to tap a card to expand and edit details so I can fix parsing errors | P0 |
| US-024 | As a trader, I want to add notes without expanding the full edit form so I can quickly capture context | P1 |
| US-025 | As a trader, I want visual feedback when I swipe so I know what action I'm taking | P0 |
| US-026 | As a trader, I want to see if a trade has potential links so I can group related trades | P1 |
| US-027 | As a trader, I want approve/skip buttons for desktop use so I don't need swipe gestures | P1 |

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-020 | Card SHALL display: ticker, strategy, open date, close date, P/L, status | P0 |
| FR-021 | Card SHALL display leg details when available | P1 |
| FR-022 | Card SHALL support swipe-right gesture for approve | P0 |
| FR-023 | Card SHALL support swipe-left gesture for skip | P0 |
| FR-024 | Card SHALL show visual indicator during swipe (color, icon) | P0 |
| FR-025 | Card SHALL expand to show edit form on tap/click | P0 |
| FR-026 | Edit form SHALL allow modification of all editable fields | P0 |
| FR-027 | Card SHALL have a notes input field (visible without expanding) | P1 |
| FR-028 | Card SHALL show "potential links" indicator when related trades exist | P1 |
| FR-029 | Card SHALL have approve/skip buttons for non-touch devices | P1 |
| FR-030 | Card SHALL show position in queue (e.g., "5 of 23") | P0 |
| FR-031 | Swipe threshold SHALL be configurable (default: 100px) | P2 |
| FR-032 | Card SHALL animate off-screen when action is taken | P0 |

### 3.2 Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-020 | Swipe animation SHALL complete in < 200ms | P1 |
| NFR-021 | Card entry animation SHALL complete in < 150ms | P1 |
| NFR-022 | Card SHALL render in < 16ms (60fps capable) | P1 |
| NFR-023 | Touch targets SHALL be minimum 44x44px | P0 |
| NFR-024 | Card SHALL be accessible (ARIA labels, keyboard nav) | P1 |

---

## 4. Technical Specification

### 4.1 Component Interface

```typescript
interface TradeReviewCardProps {
  // Data
  trade: ParsedTrade;
  position: number;      // Current position (1-based)
  total: number;         // Total trades to review

  // Link suggestions
  suggestedLinks?: {
    count: number;
    preview: string;     // e.g., "2 other AAPL trades"
  };

  // Callbacks
  onApprove: (tradeId: string, edits?: TradeEdits, notes?: string) => void;
  onSkip: (tradeId: string) => void;
  onLinkRequest: (tradeId: string) => void;  // Opens linking panel

  // Configuration
  swipeThreshold?: number;  // Default: 100px
  enableKeyboard?: boolean; // Default: true on desktop
}

interface ParsedTrade {
  id: string;
  ticker: string;
  strategyType: StrategyType;
  strategyDisplay: string;  // Human-readable
  openedAt: Date;
  closedAt?: Date;
  debitCredit: number;
  realizedPL?: number;
  status: 'OPEN' | 'CLOSED' | 'EXPIRED';
  legs?: string;           // e.g., "175P/180P/190C/195C"
  description?: string;
  rawData?: Record<string, unknown>;  // Original CSV row
}

interface TradeEdits {
  ticker?: string;
  strategyType?: StrategyType;
  openedAt?: Date;
  closedAt?: Date;
  debitCredit?: number;
  realizedPL?: number;
  status?: 'OPEN' | 'CLOSED' | 'EXPIRED';
  description?: string;
}
```

### 4.2 State Management

```typescript
interface CardState {
  mode: 'view' | 'edit';
  swipeOffset: number;
  swipeDirection: 'left' | 'right' | null;
  isAnimatingOut: boolean;
  editFormData: TradeEdits;
  notes: string;
}
```

### 4.3 Gesture Handling

```typescript
// Using react-swipeable or similar
const swipeConfig = {
  trackMouse: true,         // Support mouse drag on desktop
  trackTouch: true,
  preventScrollOnSwipe: true,
  delta: 10,                // Min distance to start tracking
  rotationAngle: 0,
};

// Swipe thresholds
const SWIPE_THRESHOLD = 100;           // px to trigger action
const SWIPE_VELOCITY_THRESHOLD = 0.5;  // px/ms for quick swipes
```

### 4.4 Animation Specs

```typescript
const animations = {
  // Card entry (from bottom/right)
  entry: {
    duration: 150,
    easing: 'ease-out',
    transform: 'translateY(20px) -> translateY(0)',
    opacity: '0 -> 1',
  },

  // Swipe tracking (real-time)
  swipeTrack: {
    transform: `translateX(${offset}px)`,
    rotate: `${offset * 0.05}deg`,  // Subtle rotation
  },

  // Approve exit (right)
  approveExit: {
    duration: 200,
    easing: 'ease-in',
    transform: 'translateX(100vw) rotate(10deg)',
    opacity: '1 -> 0',
  },

  // Skip exit (left)
  skipExit: {
    duration: 200,
    easing: 'ease-in',
    transform: 'translateX(-100vw) rotate(-10deg)',
    opacity: '1 -> 0',
  },

  // Expand to edit
  expand: {
    duration: 200,
    easing: 'ease-out',
    height: 'auto',
  },
};
```

### 4.5 File Location

```
src/components/import/TradeReviewCard.tsx
src/components/import/TradeReviewCard.test.tsx
```

---

## 5. UI/UX Specification

### 5.1 Card Layout - View Mode

```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────┐                                                    │
│  │ AAPL│  Iron Condor                              5 / 23   │
│  └─────┘  ───────────────────────────────────────────────── │
│                                                             │
│  📅 Opened: Dec 15, 2024                                    │
│  📅 Closed: Dec 22, 2024                                    │
│                                                             │
│  💰 P/L: +$245.00                          Status: CLOSED   │
│                                                             │
│  📋 Legs: 175P / 180P / 190C / 195C                         │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  📝 Notes:                                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Add notes about this trade...                         │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  💡 2 other AAPL trades this week  [Link Trades]            │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│       [✗ Skip]              [Edit]              [✓ Approve] │
│                                                             │
│        ← Swipe to Skip            Swipe to Approve →        │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Card Layout - Edit Mode (Expanded)

```
┌─────────────────────────────────────────────────────────────┐
│  Edit Trade                                        [Cancel] │
│  ───────────────────────────────────────────────────────── │
│                                                             │
│  Ticker:           Strategy:                                │
│  ┌──────────┐      ┌─────────────────────────────────────┐  │
│  │ AAPL     │      │ Iron Condor                    ▼   │  │
│  └──────────┘      └─────────────────────────────────────┘  │
│                                                             │
│  Open Date:                  Close Date:                    │
│  ┌──────────────────┐        ┌──────────────────┐           │
│  │ Dec 15, 2024     │        │ Dec 22, 2024     │           │
│  └──────────────────┘        └──────────────────┘           │
│                                                             │
│  Debit/Credit:               Realized P/L:                  │
│  ┌──────────────────┐        ┌──────────────────┐           │
│  │ -$150.00         │        │ +$245.00         │           │
│  └──────────────────┘        └──────────────────┘           │
│                                                             │
│  Status:                                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ CLOSED                                          ▼   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Description:                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Earnings play - expected low volatility...          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                          [Save & Approve]   │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Swipe Visual Feedback

**During Swipe Right (Approve):**
- Card background tints green
- Checkmark icon appears on left side
- Opacity increases with swipe distance
- "Approve" text fades in

**During Swipe Left (Skip):**
- Card background tints red/gray
- X icon appears on right side
- Opacity increases with swipe distance
- "Skip" text fades in

```
Swipe Right:                          Swipe Left:
┌─────────────────────┐               ┌─────────────────────┐
│ ✓     [CARD]       │               │       [CARD]     ✗  │
│ ███████████████     │               │     ███████████████ │
│ (green tint)        │               │        (gray tint)  │
└─────────────────────┘               └─────────────────────┘
```

### 5.4 Color Scheme

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Card background | white | slate-800 |
| Approve indicator | green-500 | green-400 |
| Skip indicator | slate-400 | slate-500 |
| P/L positive | green-600 | green-400 |
| P/L negative | red-600 | red-400 |
| Ticker badge | blue-100/blue-800 | blue-900/blue-200 |
| Link suggestion | amber-100 | amber-900 |

### 5.5 Responsive Behavior

| Width | Behavior |
|-------|----------|
| < 400px | Full-width card, stacked layout, larger touch targets |
| 400-640px | Full-width card, slightly more horizontal space |
| 640-1024px | Max-width 500px, centered |
| > 1024px | Max-width 500px, centered, keyboard hints visible |

### 5.6 Keyboard Navigation

| Key | Action |
|-----|--------|
| → or Enter | Approve trade |
| ← or Backspace | Skip trade |
| E | Enter edit mode |
| Escape | Cancel edit / Close expanded |
| Tab | Navigate form fields |

---

## 6. Definition of Done

### 6.1 Feature Complete Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| DOD-020 | Card displays all trade fields correctly | Manual test |
| DOD-021 | Swipe right triggers approve callback | Unit test |
| DOD-022 | Swipe left triggers skip callback | Unit test |
| DOD-023 | Swipe visual feedback appears correctly | Manual test |
| DOD-024 | Card expands to edit mode on tap | Manual test |
| DOD-025 | Edit form saves changes and triggers approve | Unit test |
| DOD-026 | Notes field captures input | Unit test |
| DOD-027 | Link suggestion appears when provided | Unit test |
| DOD-028 | Link button triggers callback | Unit test |
| DOD-029 | Position indicator shows correct values | Unit test |
| DOD-030 | Buttons work as alternative to swipe | Manual test |
| DOD-031 | Keyboard navigation works on desktop | Manual test |

### 6.2 Quality Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| QC-020 | Component renders without console errors | Unit test |
| QC-021 | Swipe animation is smooth (60fps) | Manual test, Chrome DevTools |
| QC-022 | Touch targets are 44x44px minimum | Manual measurement |
| QC-023 | ARIA labels present for accessibility | Unit test |
| QC-024 | Works on iOS Safari | Manual test |
| QC-025 | Works on Android Chrome | Manual test |
| QC-026 | Works on desktop Chrome/Firefox/Safari | Manual test |
| QC-027 | Dark mode renders correctly | Manual test |

---

## 7. Test Requirements

### 7.1 Unit Tests

**File:** `src/components/import/TradeReviewCard.test.tsx`

| Test ID | Description |
|---------|-------------|
| UT-020 | Renders trade data correctly |
| UT-021 | Displays position indicator (X of Y) |
| UT-022 | Calls onApprove when swiped right past threshold |
| UT-023 | Calls onSkip when swiped left past threshold |
| UT-024 | Does not trigger action if swipe below threshold |
| UT-025 | Shows approve indicator during right swipe |
| UT-026 | Shows skip indicator during left swipe |
| UT-027 | Expands to edit mode on click |
| UT-028 | Edit form populates with current values |
| UT-029 | Edit form validates required fields |
| UT-030 | Save triggers onApprove with edits |
| UT-031 | Cancel closes edit mode without triggering action |
| UT-032 | Notes input captures text |
| UT-033 | Notes included in onApprove callback |
| UT-034 | Link suggestion renders when provided |
| UT-035 | Link button triggers onLinkRequest |
| UT-036 | Approve button triggers onApprove |
| UT-037 | Skip button triggers onSkip |
| UT-038 | Keyboard right arrow triggers approve |
| UT-039 | Keyboard left arrow triggers skip |
| UT-040 | Keyboard E enters edit mode |

### 7.2 UI/Visual Tests

**File:** `tests/ui/trade-review-card.test.ts`

| Test ID | Description |
|---------|-------------|
| UI-020 | Card renders correctly at 375px width |
| UI-021 | Card renders correctly at 768px width |
| UI-022 | Card renders correctly at 1280px width |
| UI-023 | Positive P/L shows green |
| UI-024 | Negative P/L shows red |
| UI-025 | Swipe right shows green overlay |
| UI-026 | Swipe left shows gray overlay |
| UI-027 | Edit form renders all fields |
| UI-028 | Dark mode colors correct |
| UI-029 | Link suggestion badge styled correctly |
| UI-030 | Animations complete without jank |

### 7.3 Accessibility Tests

| Test ID | Description |
|---------|-------------|
| A11Y-020 | Card has appropriate role and labels |
| A11Y-021 | Swipe actions have accessible alternatives (buttons) |
| A11Y-022 | Edit form fields have labels |
| A11Y-023 | Focus management correct in edit mode |
| A11Y-024 | Color contrast meets WCAG AA |
| A11Y-025 | Screen reader announces trade info |

---

## 8. Dependencies

| Dependency | Purpose | Status |
|------------|---------|--------|
| react-swipeable | Swipe gesture handling | To add |
| framer-motion | Animations | Evaluate vs CSS |
| @radix-ui/react-collapsible | Expand/collapse | Already in project |
| tailwindcss | Styling | Already in project |

---

## 9. Implementation Notes

### 9.1 Swipe Library Selection

**Option A: react-swipeable**
- Lightweight, well-maintained
- Good touch/mouse support
- Provides velocity data

**Option B: framer-motion**
- More powerful animations
- Larger bundle size
- Built-in gesture support

**Recommendation:** Start with react-swipeable for gestures, CSS for animations. Add framer-motion only if CSS animations are insufficient.

### 9.2 Performance Considerations

- Use `transform` and `opacity` for animations (GPU accelerated)
- Avoid layout thrashing during swipe
- Debounce notes input (300ms)
- Lazy-load edit form fields

### 9.3 Edge Cases

| Case | Handling |
|------|----------|
| Very long ticker symbol | Truncate with ellipsis |
| Missing close date (open trade) | Show "Open" badge |
| Very long legs string | Wrap to multiple lines |
| Missing P/L data | Show "--" placeholder |
| Rapid swipe spam | Debounce actions, queue animations |
