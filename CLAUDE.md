# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Trader Journal is a mobile-first trading psychology journal with AI-powered behavioral analysis. The application allows traders to:
- Journal trade ideas, reflections, and market observations with AI sentiment analysis
- Detect cognitive biases and emotional patterns in trading decisions
- Track weekly insights with personalized feedback on behavior patterns
- Analyze emotional trends and conviction levels over time
- (Phase 2) Track options trades with comprehensive market context and IV/HV analysis

**Current Focus:** MVP journal and psychology features (Phase 1)
**Tech Stack:** Next.js 14 (App Router) • TypeScript • Tailwind CSS • Prisma • PostgreSQL (Supabase) • shadcn/ui • OpenAI GPT-4o-mini • date-fns

## Design System & UI Standards

### UX/UI Principles

**Six Core Principles:**
1. **Insight-Driven Design**: Surface insights proactively (above-the-fold), inverted pyramid hierarchy
2. **Low-Friction Interaction**: One-tap core actions (FAB pattern), thumb-reachable on mobile
3. **Progressive Disclosure**: Start with summary, reveal detail on demand, smart defaults
4. **Trust & Reliability**: Consistent color-coding (green=gains, red=losses), data with context
5. **Habit Formation**: Positive reinforcement (streaks, achievements), frictionless quick capture
6. **Mobile-First Patterns**: Card-based UI, swipe gestures, PWA with offline support

**Design Persona:** Senior Product Designer focused on mobile-first psychology applications. Prioritize trust/emotional safety, scannable information, 44x44px touch targets, WCAG 2.1 AA compliance, sub-2s loads, 60fps interactions.

### Style Tokens

**Key Colors (HSL):**
```css
--primary: 0 0% 9%;              /* #171717 - main actions */
--background: 0 0% 100%;          /* #FFFFFF */
--foreground: 0 0% 3.9%;          /* #0A0A0A */
--destructive: 0 84.2% 60.2%;     /* #EF4444 */
--border: 0 0% 89.8%;             /* #E5E5E5 */

/* Sentiment Colors */
--sentiment-positive: 142 76% 36%; /* #16A34A - green */
--sentiment-negative: 0 84% 60%;   /* #EF4444 - red */
--sentiment-neutral: 0 0% 45%;     /* #737373 - gray */

/* Entry Type Colors */
--type-trade-idea: 217 91% 60%;    /* #3B82F6 - blue */
--type-trade: 142 76% 36%;         /* #16A34A - green */
--type-reflection: 262 83% 58%;    /* #A855F7 - purple */
--type-observation: 25 95% 53%;    /* #F97316 - orange */
```

**Typography:** Inter font, 16px base, scale: 12/14/16/18/20/24px, weights: 400/500/600/700

**Spacing:** Tailwind default (4/8/16/24/32/48px grid)

**Component Sizing:** Touch targets min 44x44px, Button heights 36/40/48px, Input 40px, Card padding 16px

**Default Viewports:** Mobile 390x844 (iPhone 14 Pro primary), Tablet 1024x768, Desktop 1366x768

### Core Components

**shadcn/ui primitives:** Button, Card, Badge, Input, Textarea (min 200px), Select, Label

**Feature components:** SearchFilters, TickerEntry, Entry cards, FAB (56x56px)

### UI Acceptance Checklist

**Visual:** Colors match tokens, 16px body text, consistent spacing (no arbitrary values), 8px border-radius, correct badge colors

**Layout:** No horizontal scroll on mobile, touch targets ≥44px, proper stacking, no overlap/clipping

**Interactions:** Focus/hover states, loading/error states, success feedback

**Accessibility:** WCAG 2.1 AA contrast (4.5:1 body, 3:1 large), alt text, labels, semantic HTML, keyboard nav

**Performance:** Zero console errors, no React warnings, optimized images

**Mobile-specific (390x844):** 120px min textarea, native selects, 56px submit button, 44x44px back nav

### Playwright Workflows

**Quick commands (use frequently):**
- `/mobile-check` - Fast mobile validation (use after every UI change)
- `/fix-console` - Auto-fix JavaScript errors (run before commits)
- `/accessibility` - WCAG AA compliance check (run before releases)

**Target:** A-grade on mobile (90-100%), zero console errors, WCAG AA compliance, ≥44px touch targets

## Development Commands

```bash
# Development
npm run dev          # Start dev server on localhost:3000
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript check

# Testing (requires dev server + PowerShell)
npm run test:all        # All integration tests
npm run test:api        # Entry API tests
npm run test:ai         # AI analysis tests (requires OPENAI_API_KEY)
npm run test:insights   # Weekly insights tests
npm run test:search     # Search & filter tests
npm run test:tags       # Auto-tagging tests (requires OPENAI_API_KEY)

# Database
npm run db:push      # Push schema (dev only)
npm run db:studio    # Open Prisma Studio
npx prisma migrate dev --name [name]     # Create migration
npx prisma migrate deploy                # Apply migrations (production)
```

## Architecture & Key Concepts

### Database Schema (Prisma)

PostgreSQL with Prisma ORM. Schema in `prisma/schema.prisma`:

**Models:** Trade, Entry, Snapshot, Note (legacy), Tag, Settings

**Entry Model (Core):**
- **Types:** TRADE_IDEA (pre-trade), TRADE (executed), REFLECTION (post-trade), OBSERVATION (general)
- **Core fields:** content (TEXT), mood (14 states), conviction (LOW/MEDIUM/HIGH), ticker (optional), tradeId, snapshotId
- **AI fields:** sentiment, emotionalKeywords, detectedBiases (9 types), convictionInferred, aiTags (53 tags from 6 categories)
- **Relationships:** Optional link to Trade/Snapshot, many Tags (many-to-many)
- **Indexes:** Date DESC, ticker, type, mood, conviction, trade

### AI Analysis (Issue #20)

**Service:** `src/lib/aiAnalysis.ts`
- `analyzeEntryText()`: Single entry analysis
- `batchAnalyzeEntries()`: Rate-limited batch (5/batch, 1s delay)

**API:**
- `POST /api/entries/[id]/analyze`: Single entry
- `POST /api/entries/analyze-batch`: Batch (body: `{ entryIds?: string[], analyzeAll?: boolean }`)

**Output:** sentiment, emotionalKeywords, detectedBiases, convictionInferred, confidence, aiTags (3-7 from taxonomy)

**Config:** Requires `OPENAI_API_KEY`, GPT-4o-mini, ~$0.0007/entry

### Auto-Tagging (Issue #22)

53 tags across 6 categories: Trade Type/Strategy (13), Market View (8), Entry Catalyst (10), Psychological State (12), Risk Assessment (8), Outcome Context (5)

Auto-generated 3-7 tags per entry. Filter: `GET /api/entries?tag=bullish,long-call`

### Weekly Insights (Issue #21)

**Service:** `src/lib/weeklyInsights.ts` - `generateWeeklyInsights(weekOffset)` (0 = current, -1 = last week, up to -52)

**API:** `GET /api/insights/weekly?week={offset}`

**Features:** Statistics, emotional trends (sentiment breakdown, top keywords, mood distribution), cognitive patterns (biases, conviction), personalized insights, week-over-week comparison

**UI:** `/insights` page with week selector

### Search & Filters (Issue #24)

**Component:** `src/components/SearchFilters.tsx` - Collapsible panel, URL params, filter chips, one-click clear

**API:** `GET /api/entries` with query params:
- Filters: search, type, ticker, mood, conviction, sentiment, bias (multi), tag (multi), dateFrom, dateTo
- Pagination: limit (default 50, max 100), offset

**Response:** `{ entries: [...], pagination: { total, limit, offset, hasMore } }`

### API Routes Summary

**Entry CRUD:** GET/POST `/api/entries`, GET/PUT/DELETE `/api/entries/[id]`

**AI:** POST `/api/entries/[id]/analyze`, POST `/api/entries/analyze-batch`

**Insights:** GET `/api/insights/weekly?week={offset}`

**Phase 2:** Ticker data (mock), IV persistence

### Component Architecture

- **UI primitives:** `src/components/ui/` (shadcn/ui)
- **Feature components:** SearchFilters, TickerEntry, HvCard (Phase 2), ManualIvForm (Phase 2), IvBadge (Phase 2)

### Utilities

- **Prisma Client:** `src/lib/prisma.ts` (singleton pattern)
- **Logger:** `src/lib/logger.ts` (enabled with `DEBUG=1`)
- **Path Alias:** `@/*` → `./src/*`

## Critical Warnings

### 🚨 Must Use Windows PowerShell

**WSL has networking issues** - database connections fail from WSL bash.

**✅ GOOD:**
```powershell
# PowerShell - proper Supabase access
npm run dev
npm run test:all
```

**❌ BAD:**
```bash
# WSL bash - WILL FAIL
npm run test:all
```

### Testing Workflow

1. Start dev server in PowerShell: `npm run dev`
2. Run tests in separate PowerShell terminal: `npm run test:*`
3. Ensure `.env` has `OPENAI_API_KEY` for AI tests

### Environment Variables

Required in `.env` (never commit):
- `DATABASE_URL`: Supabase PostgreSQL with `?pgbouncer=true` (port 6543)
- `OPENAI_API_KEY`: For AI analysis
- `DEBUG=1`: Optional debug logging

### Database Migrations

**Dev:** `npx prisma migrate dev --name [name]` (creates migration)
**Production:** `npx prisma migrate deploy` (applies migrations)
**Avoid in production:** `npm run db:push` (no migration history)

### Git Workflow

Main branch protected. Use feature branches: `git checkout -b feat/your-feature`

## Code Style Guidelines

**API Routes:** Validate inputs → Build query → Return structured response

**Components:** Props interface → Early returns → Event handlers → Render

**Error Handling:** Specific messages, proper HTTP status codes (400/404/500)

**Type Safety:** Use Prisma types, avoid `any`

## Playwright Design Workflows

**Iterative loop:** Make changes → `/mobile-check` → Fix → `/fix-console` → Repeat

**Before commit:** `@agent design-review --target=[page]` → Fix HIGH issues

**Before PR:** `/accessibility` on changed pages → 3 viewport design-review → Attach screenshots

## MCP Integration

**Available servers** (configured in `.mcp.json`):

1. **Playwright MCP:** Browser automation, screenshots, UI testing
2. **Git MCP:** History search, blame, commit analysis
3. **PostgreSQL MCP:** Direct database queries (requires `SUPABASE_PASSWORD` in `.env`)

**Use cases:** Playwright for UI verification, Git for code history, PostgreSQL for data exploration (prefer Prisma in app code)

## Implementation Status

### ✅ Phase 1 - MVP Features (Completed)
- Entry Schema & API (Issue #23)
- AI Text Analysis (Issue #20)
- Weekly Insights Dashboard (Issue #21)
- Search & Filters (Issue #24)
- Auto-Tagging System (Issue #22)
- Dashboard Homepage with Actionable Snapshot (Issue #32)
- Floating Action Button for Quick Entry (Issue #33)
- Journaling Streak Tracking & Celebration System (Issue #34)
- Empty States & First-Time User Onboarding (Issue #38)

### 🎯 Phase 1 - MVP Polish (Pending - See GitHub Issues)

**Medium:** Guided Entry Mode (#35), PWA/Offline (#36), Dark Mode (#37), Performance (#39)

**Low:** Inline Quick Edit (#40)

### 🔮 Phase 2 - Options Trading & Advanced Features

**Options Data Pipeline (Issues #50-55) - Infrastructure Ready**

Issue #50 research completed - `yahoo-finance2` (Node.js) does NOT support options data. Two viable paths:

**Recommended Path (MVP):** Python yfinance microservice
- Cost: $0-10/month (free data + hosting)
- Architecture: FastAPI Python service → yfinance → Yahoo Finance
- Deployment: Railway/Render/Fly.io free tier
- Dev Time: 5-10 hours
- See `OPTIONS_DATA_PROVIDERS_RESEARCH.md` for full analysis

**Production Path:** Polygon.io Options API
- Cost: $99/month (Options Starter tier)
- Official OPRA data from all 17 US exchanges
- Real-time with SLA guarantees
- Migration: 2-3 hours from yfinance

**Infrastructure Completed:**
- ✅ Prisma schema: expirationDate, strikePrice, optionType, entry/exit prices, P/L tracking
- ✅ TypeScript interfaces: OptionsContract, OptionsChain
- ✅ API route structure: `/api/options/[ticker]?action=expirations|chain`
- ✅ 5-minute caching strategy

**Pending Issues (depend on #50):**
- Issue #51: Greeks Calculation (Black-Scholes: Delta, Gamma, Theta, Vega)
- Issue #52: Position Risk Metrics (max loss/profit/breakeven, strategy auto-detection)
- Issue #53: DTE Tracking & Expiration Management
- Issue #54: IV vs HV Spread - Carry Indicator (volatility selling signals)
- Issue #55: Current Position P/L (live mark-to-market)

**Other Phase 2 Features:**
- Conversational AI Coach (#41)
- Voice Notes & Screenshots (#49)
- Linked Notes & Knowledge Graph (#42)
- Advanced Visualizations (#44)
- Swipe Gestures (#46)
- Push Notifications (#47)
- Data Export & GDPR (#48)

### 🚀 Phase 3 - Power User Features

Social/Mentor Sharing (#43), Custom Dashboard Builder (#45)

## Known Issues

1. **WSL Networking:** Database connections fail from WSL. Use PowerShell.
2. **Pre-existing TypeScript/ESLint:** `src/lib/cache.ts`, `src/lib/yahooFinance.ts` (Phase 2 files)
3. **Build Warnings:** React hooks deps, unescaped entities, empty interfaces (non-critical)
4. **Pending Database Migration:** Options chain fields added to schema but not yet migrated. Run in PowerShell: `npx prisma migrate dev --name add_options_chain_fields`
5. **Options Data Provider:** `yahoo-finance2` (Node.js) lacks options support. Need to implement Python yfinance microservice or use paid provider (Polygon.io, Alpha Vantage)

## Quick Reference

**Create feature:**
```bash
git checkout -b feat/your-feature
npm run dev  # PowerShell
# Develop, test, lint
git commit -m "Description

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
gh pr create
```

**Test suite:**
```powershell
npm run dev           # Terminal 1
npm run test:all      # Terminal 2
```

**UI validation:**
```bash
/mobile-check         # After every UI change
/fix-console          # Before commit
/accessibility        # Before release
```
