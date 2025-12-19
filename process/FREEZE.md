# Feature Freeze (Scope Control)

## Purpose
Define what is in v1, what is deferred, and what must work. Prevents scope creep.

---

## Ship Scope (v1)

### Core Features (Complete)
- Journal entry creation (text, voice, image)
- AI sentiment/bias analysis
- Weekly insights generation
- Thesis-based trade management with P/L
- AI trading coach with goals
- Social sharing with mentor features
- Customizable dashboard (14 widget types)

### PRD 1: Digitization & Import (In Progress)
- Journal page OCR scanning (handwritten -> digital)
- OptionStrat CSV bulk import
- Auto-linking entries to trades

---

## Deferred (Explicitly Out of Scope for v1)

- Native iOS/Android app (Capacitor)
- PWA splash screen images (using placeholders)
- yfinance Railway deployment
- Push notifications (VAPID keys not configured)
- pgvector semantic search
- Multi-user authentication (single-user for v1)
- Offline sync beyond basic PWA caching

---

## Non-Negotiables (Must Work for v1)

1. **Entry creation** - User can create entry in <30 seconds via any method
2. **AI analysis** - Every entry gets sentiment/bias analysis
3. **Trade logging** - Trades can be logged with P/L calculations
4. **Data persistence** - All data survives page refresh
5. **Mobile viewport** - App is usable on 390x844 screen
6. **Build passes** - `npm run build` succeeds without errors

---

## Scope Change Process
If a feature is needed that is not in Ship Scope:
1. Add it to this file under "Proposed Additions"
2. Get explicit approval before implementing
3. Create a spec before any code changes

## Proposed Additions
(None currently)
