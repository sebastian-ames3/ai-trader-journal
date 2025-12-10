# Implementation To-Do List

**Last Updated:** 2025-12-09
**Status:** Active Development

This document tracks all incomplete features across all PRDs/specs. As features are completed, they should be marked done with the date and PR number.

---

## Quick Status Summary

| Spec | Status | Completion |
|------|--------|------------|
| Spec 05: Phase 1 MVP Polish | COMPLETE | 100% |
| Spec 06: Trade Management Phase 1 | COMPLETE | 100% |
| Spec 11: UX/UI Design System | MOSTLY COMPLETE | 90% |
| Spec 12: Claude Migration | COMPLETE | 100% |
| Specs 01-04: Phase 2 Features | COMPLETE | 100% |

---

## HIGH PRIORITY - Performance & Polish

### Performance Optimization (Spec 05 Remaining) - COMPLETE

- [x] **PERF-1**: Run Lighthouse audit and document baseline (PR #78)
  - Recorded FCP, LCP, TTI, bundle size
  - File: `PERFORMANCE-BASELINE.md`

- [x] **PERF-2**: Implement Next.js Image optimization (PR #78)
  - Audited img tags - only user-uploaded previews (blob URLs, can't use next/image)
  - No static images need optimization

- [x] **PERF-3**: Add React.memo to entry card list items (PR #78)
  - Added React.memo to EntryCard, SwipeableEntryCard, ThesisCard
  - Optimizes re-renders on journal and theses pages

- [x] **PERF-4**: Bundle analyzer setup (PR #78)
  - Installed @next/bundle-analyzer
  - Identified large dependencies (framer-motion main culprit)
  - Documented findings in PERFORMANCE-BASELINE.md

- [x] **PERF-5**: Virtual scrolling for long lists (PR #78)
  - Implemented VirtualizedEntryList with react-window
  - Threshold: 20+ entries for virtualization

---

## MEDIUM PRIORITY - UX Polish

### Micro-Interactions (Spec 11 Remaining)

- [ ] **MICRO-1**: Page transition animations
  - Fade/slide between routes
  - Loading states during navigation

- [ ] **MICRO-2**: Button ripple effects
  - Add tactile feedback on tap
  - Use CSS animations

- [ ] **MICRO-3**: Success animations
  - Checkmark animation on save
  - Confetti on streak milestones (7, 30, etc.)

- [ ] **MICRO-4**: Pull-to-refresh gesture
  - Mobile refresh indicator
  - Haptic feedback (if supported)

### Accessibility Improvements

- [ ] **A11Y-1**: Complete WCAG 2.1 AA audit
  - Contrast ratios verification
  - Focus indicators
  - Screen reader testing

- [ ] **A11Y-2**: Keyboard navigation paths
  - Tab order verification
  - Modal focus trapping
  - Escape key handling

---

## LOW PRIORITY - Future Features (Spec 06 Phase 2+)

### Screenshot Data Extraction

- [ ] **EXTRACT-1**: Screenshot data extraction API
  - POST /api/extract endpoint
  - Claude vision for trade screenshots
  - Support: OptionStrat, ThinkorSwim, order confirmations

- [ ] **EXTRACT-2**: Extraction preview UI
  - Show extracted data before saving
  - Allow user to edit/correct
  - Confidence indicators

- [ ] **EXTRACT-3**: Auto-fill trade form from screenshot
  - Parse extracted data
  - Pre-populate form fields

### Pattern Learning

- [ ] **LEARN-1**: Pattern learning from closed theses
  - Analyze WIN/LOSS patterns
  - IV/HV correlations
  - Direction accuracy tracking

- [ ] **LEARN-2**: AI reminders of past lessons
  - Surface relevant lessons on new thesis
  - "From past theses" section

---

## NOT STARTED - Phase 4+ Features

### Spec 07: AI Trading Coach

- [ ] **COACH-1**: Chat interface component
- [ ] **COACH-2**: Message API endpoint
- [ ] **COACH-3**: System prompt with user context
- [ ] **COACH-4**: Conversation persistence
- [ ] **COACH-5**: Pre-trade check-in flow

### Spec 08: Social/Mentor Sharing

- [ ] **SHARE-1**: ShareLink database schema
- [ ] **SHARE-2**: Share link creation API
- [ ] **SHARE-3**: Public share viewer page
- [ ] **SHARE-4**: Redaction logic (P/L, tickers, dates)
- [ ] **SHARE-5**: Mentor invite system

### Spec 09: Custom Dashboard

- [ ] **GRID-1**: Install @dnd-kit for drag-and-drop
- [ ] **GRID-2**: DashboardGrid component
- [ ] **GRID-3**: Widget wrapper component
- [ ] **GRID-4**: DashboardLayout database model
- [ ] **WIDGET-1**: Refactor existing widgets

### Spec 10: Mobile Deployment

- [ ] **PWA-E1**: Audit web manifest completeness
- [ ] **PWA-E2**: iOS-specific meta tags
- [ ] **PWA-E3**: App Store screenshots
- [ ] **CAP-1**: Initialize Capacitor (optional)

---

## Completed Features Log

### 2025-12-09 (PR #76)
- [x] Spec 06 Phase 1: Database schema (TradingThesis, ThesisTrade, etc.)
- [x] Spec 06 Phase 1: API routes (theses CRUD, trades CRUD, updates, close)
- [x] Spec 06 Phase 1: Theses list page with filtering
- [x] Spec 06 Phase 1: New thesis form with direction selector
- [x] Spec 06 Phase 1: Thesis detail page with:
  - P/L summary card
  - Original thesis display
  - Trades timeline with action badges
  - Updates section with type indicators
  - Add Trade modal
  - Add Update modal
  - Close Thesis modal with outcome
  - Delete confirmation
- [x] Spec 06 Phase 1: Dashboard integration (Active Theses section)
- [x] Spec 06 Phase 1: Integration tests (18 tests)

### Previous Releases
- [x] Spec 05: Inline Quick Edit (InlineEditModal) - PR #75
- [x] Spec 05: PWA/Offline Support - PR #75
- [x] Spec 05: Guided Entry Mode - PR #71
- [x] Spec 11: Bottom Navigation - PR #71
- [x] Spec 11: Modern Card variants - PR #71
- [x] Spec 11: Mood Selector redesign - PR #71
- [x] Spec 11: Streak Card with milestones - PR #71
- [x] Spec 11: Entry Card timeline style - PR #71
- [x] Spec 12: Claude LLM Migration - PR #73
- [x] Specs 01-04: Phase 2 Engagement & Capture - PR #72
  - Voice recording with Whisper
  - Quick capture with auto-inference
  - Image capture with Claude vision
  - Pattern recognition engine
  - Context surfacing system
  - Proactive engagement banners

---

## Testing Requirements

### Before Each PR

1. **Type Check**
   ```bash
   npm run typecheck
   ```

2. **Build**
   ```bash
   npm run build
   ```

3. **Run Relevant Tests**
   ```bash
   npm run test:theses    # For thesis features
   npm run test:api       # For API changes
   npm run test:all       # Full suite
   ```

4. **Mobile UI Check** (when Playwright available)
   ```bash
   /mobile-check          # Playwright mobile validation
   ```

5. **Console Errors** (when Playwright available)
   ```bash
   /fix-console           # Fix any JS errors
   ```

### Before Release

1. **Accessibility Audit**
   ```bash
   /accessibility
   ```

2. **Lighthouse Audit**
   - Record LCP, FCP, TTI scores
   - Ensure LCP < 2.5s

3. **Cross-Browser Testing**
   - Chrome (desktop + mobile)
   - Safari (desktop + iOS)
   - Firefox

---

## File Update Checklist

When completing a feature:

1. [ ] Mark task as done in this file with date
2. [ ] Update `CLAUDE.md` if architecture/patterns changed
3. [ ] Update `CHANGELOG.md` with user-facing changes
4. [ ] Commit with descriptive message
5. [ ] Push to feature branch
6. [ ] Create PR with test plan
7. [ ] Merge only after tests pass

---

## Current Sprint Focus

**Sprint Goal:** Performance & Polish Sprint

**Focus Areas:**
1. Lighthouse audit and baseline
2. Image optimization
3. Accessibility improvements

**Definition of Done:**
- LCP < 2.5s
- WCAG 2.1 AA compliance
- Zero console errors
- All tests passing
