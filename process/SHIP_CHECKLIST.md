# Ship Checklist

## Definition of Shippable
All items below must be checked before shipping to production.

---

## Core Functionality
- [x] Entry creation works (text, voice, image)
- [x] AI analysis returns sentiment/bias
- [x] Weekly insights generate correctly
- [x] Thesis creation and trade logging works
- [x] AI coach chat responds appropriately
- [x] Dashboard renders with widgets
- [x] Share links generate and resolve

## PRD 1: Digitization & Import (Current Work)
- [x] Step 1: Foundation (Schema, OCR API, auto-linking API)
- [ ] Step 2: Journal Scanner UI
  - [ ] ImageCapture supports journal mode
  - [ ] OCR loading states work
  - [ ] Review modal shows OCR results
  - [ ] Link suggestions display correctly
- [ ] Step 3: CSV Import
- [ ] Step 4: Auto-Linking UI
- [ ] Step 5: Polish & Launch

## Build & Deploy
- [x] `npm run typecheck` passes
- [x] `npm run build` succeeds
- [ ] All console errors resolved
- [ ] No TypeScript errors in production build

## Testing
- [x] Baseline validation defined (typecheck + build)
- [x] Test requirements documented in LEARNINGS.md
- [ ] Smoke test exists for critical paths
- [ ] Manual verification of new features complete
- [ ] Mobile viewport tested (390x844)

## Documentation
- [x] CLAUDE.md updated with current state
- [ ] API changes documented
- [ ] User-facing help text accurate

---

## Blocked / Deferred
- PWA splash screen images (paused)
- Capacitor/native app (paused)
- yfinance Railway deployment (pending)
