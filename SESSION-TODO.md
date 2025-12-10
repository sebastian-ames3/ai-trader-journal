# Next Session To-Do

**Last Updated:** December 9, 2025
**Current Branch:** `feat/thesis-trade-management`
**Status:** Spec 06 Phase 1 Complete - Ready for PR

---

## Session Summary (What We Just Completed)

### Spec 06: Thesis-Based Trade Management - Phase 1 MVP

**Database Schema:**
- [x] TradingThesis model (name, ticker, direction, originalThesis, status, P/L aggregates)
- [x] ThesisTrade model (action, description, debitCredit, status, extractedData)
- [x] ThesisUpdate model (type, content, date)
- [x] ThesisAttachment and ThesisTradeAttachment models
- [x] All enums (ThesisDirection, ThesisStatus, ThesisOutcome, TradeAction, etc.)

**API Routes:**
- [x] `GET/POST /api/theses` - List and create theses
- [x] `GET/PATCH/DELETE /api/theses/[id]` - Get, update, delete thesis
- [x] `POST /api/theses/[id]/close` - Close thesis with outcome
- [x] `POST /api/theses/[id]/updates` - Add thesis updates
- [x] `GET/POST /api/trades` - List and create thesis trades
- [x] `GET/PATCH/DELETE /api/trades/[id]` - Get, update, delete trade

**UI Pages:**
- [x] `/theses` - List page with Active/Closed/All filtering
- [x] `/theses/new` - Create new thesis form with direction selector
- [x] `/theses/[id]` - Detail page with:
  - P/L summary card (Realized, Capital Deployed, ROC)
  - Original thesis display
  - Trades timeline with action badges
  - Updates section with type indicators
  - Modal dialogs for closing, adding trades, adding updates
  - Delete confirmation

**Dashboard Integration:**
- [x] Active Theses section on home page
- [x] Empty state with CTA for first thesis
- [x] Quick access to thesis list and details

**Tests:**
- [x] 18 integration tests (all passing)
- [x] TypeScript compiles with no errors
- [x] Build passes

---

## Remaining for Spec 06 (Future Phases)

### Phase 2: Trade Logging Enhancements
- [ ] Voice recording for trade descriptions
- [ ] Screenshot upload and attachment
- [ ] AI extraction from screenshots (Claude Vision)

### Phase 3: P/L Aggregation
- [ ] Auto-update thesis P/L when trades change
- [ ] Realized vs unrealized tracking
- [ ] ROC calculation refinements

### Phase 4: Pattern Learning
- [ ] Thesis pattern analysis API
- [ ] AI reminders based on past theses
- [ ] Learning from thesis outcomes

---

## Quick Start Commands

```bash
# Start dev server
npm run dev

# Run thesis tests
npm run test:theses

# Type check
npm run typecheck

# Build
npm run build
```

---

## Files Created/Modified

### New Files:
- `prisma/schema.prisma` - Added thesis models and enums
- `src/app/api/theses/route.ts` - Theses list/create API
- `src/app/api/theses/[id]/route.ts` - Thesis CRUD API
- `src/app/api/theses/[id]/close/route.ts` - Close thesis API
- `src/app/api/theses/[id]/updates/route.ts` - Thesis updates API
- `src/app/api/trades/route.ts` - Trades list/create API
- `src/app/api/trades/[id]/route.ts` - Trade CRUD API
- `src/app/theses/page.tsx` - Theses list page
- `src/app/theses/new/page.tsx` - New thesis form
- `src/app/theses/[id]/page.tsx` - Thesis detail page
- `tests/api-theses.test.ts` - Integration tests

### Modified Files:
- `src/app/page.tsx` - Added Active Theses section to dashboard
- `package.json` - Added test:theses script

---

## Open PRs
- None yet - ready to create PR for Spec 06 Phase 1

## Recent Merges
- PR #75: Spec 05 Phase 1 MVP Polish - Inline Quick Edit & PWA
- PR #74: UX/UI polish - consistent styling and touch targets
- PR #73: Claude LLM migration
- PR #72: Phase 2 engagement and capture features
- PR #71: UX/UI Phase 1 Polish (1C-1F)
