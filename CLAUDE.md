# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Trader Journal is a mobile-first trading psychology journal with AI-powered behavioral analysis. The application allows traders to:
- Journal trade ideas, reflections, and market observations with AI sentiment analysis
- Detect cognitive biases and emotional patterns in trading decisions
- Track weekly insights with personalized feedback on behavior patterns
- Analyze emotional trends and conviction levels over time
- Frictionless capture via voice memos and screenshots
- Proactive engagement during market stress periods
- Long-term pattern recognition across trading behavior

**Current Focus:** Phase 5 - Mobile Deployment (PWA, Capacitor, App Store)
**Tech Stack:** Next.js 14 (App Router) • TypeScript • Tailwind CSS • Prisma • PostgreSQL (Supabase) • shadcn/ui • Claude (Anthropic) + OpenAI Whisper • date-fns • yfinance (Python)

## Product Strategy: Solving the Motivation Gap

### The Core Problem

Based on user research, traders stop journaling exactly when it would help most:
- During market drawdowns
- When emotionally disengaged
- When their portfolio is underperforming

This is the **"Motivation Gap"**: the inverse relationship between the value of journaling and the motivation to do it.

### Solution: Multi-Pronged Approach

1. **Reduce Friction** - Voice memos, screenshots, quick capture (no required fields)
2. **Proactive Engagement** - Reach out during difficult market periods
3. **Pattern Recognition** - Surface behavioral insights over time
4. **Context Surfacing** - Auto-fetch relevant market data and history

### Target User Profile

**Options traders and active investors** who:
- Have high-beta portfolios that feel pain during market corrections
- Want to improve their trading psychology through self-awareness
- Struggle to maintain journaling habits during drawdowns
- Need frictionless capture (voice from bed, screenshots of charts)

**What they lack:** A journal that reaches out when it matters most and recognizes their patterns.

### Competitive Positioning

**We are NOT competing on:**
- ❌ Real-time data quality (user has their own feeds)
- ❌ Execution speed (they use professional brokers)
- ❌ Market scanning/alerts (not our focus)

**We ARE competing on:**
- ✅ **Frictionless capture** - Voice memos, screenshots, quick text with auto-inference
- ✅ **Proactive engagement** - Market-triggered check-ins during drawdowns
- ✅ **Pattern recognition** - "You stop journaling during corrections"
- ✅ **Historical context** - "From your past self" during similar market conditions
- ✅ **Behavioral insights** - AI-powered bias detection and trend analysis

### The Moat (Hard to Replicate)

**Easy for competitors:**
- Basic P/L tracking (Robinhood does this)
- Simple journaling (Notion template)
- Market data feeds (anyone can pay for these)

**Hard for competitors (our advantages):**
1. **Proactive Engagement Engine** - Reaching out during market stress, not just passive recording
2. **Behavioral Pattern Database** - Learning user-specific patterns over months of data
3. **Context-Aware Insights** - Surfacing relevant past entries at the right moment
4. **Multi-Modal Capture** - Voice + screenshots + text with unified AI analysis

### Value Proposition

> "The journal that reaches out when you need it most and shows you patterns you can't see"

**Not:** Another passive journaling app you abandon during drawdowns
**But:** An active partner in trading psychology improvement

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

# Options Data Service (Python)
python options_service.py              # Start FastAPI service (port 8000)
uvicorn options_service:app --reload   # Alternative with hot reload
```

## Options Data Service

**Python FastAPI microservice** providing options chain data via yfinance (free, 15-20 min delayed).

### Architecture

```
Next.js → Python FastAPI → yfinance → Yahoo Finance
```

### Local Development

**1. Install Python dependencies:**
```bash
pip install -r requirements.txt
```

**2. Start service (port 8000):**
```bash
uvicorn options_service:app --reload
```

**3. Configure Next.js:**
Add to `.env.local`:
```bash
OPTIONS_SERVICE_URL=http://localhost:8000
```

**4. Test endpoints:**
- Health: `http://localhost:8000/health`
- Docs: `http://localhost:8000/docs`
- Expirations: `http://localhost:8000/api/options/expirations?ticker=AAPL`
- Chain: `http://localhost:8000/api/options/chain?ticker=AAPL&expiration=2025-11-21`

### Production Deployment

**Recommended:** Railway.app (~$5/month)

See `OPTIONS_SERVICE_DEPLOYMENT.md` for full deployment guide.

**Environment variable for Next.js production:**
```bash
OPTIONS_SERVICE_URL=https://your-service.railway.app
```

### API Endpoints

**Next.js API Routes (proxy to Python service):**
- `GET /api/options/health` - Service health check
- `GET /api/options/expirations?ticker=AAPL` - Get expiration dates
- `GET /api/options/chain?ticker=AAPL&expiration=2025-11-21` - Full options chain
- `GET /api/options/chain?ticker=AAPL&expiration=2025-11-21&minStrike=170&maxStrike=180` - Filtered chain

### Caching Strategy

Intelligent market-aware caching:
- Market hours (9:30 AM - 4:00 PM): 5 minutes
- After hours: 1 hour
- Weekends: 24 hours
- Expirations: 1 hour (don't change often)

### Cost Analysis

- **Development:** $0/month (local)
- **Production:** ~$5-10/month (Railway hosting)
- **Data:** $0/month (yfinance is free)
- **Savings vs Polygon.io:** $94/month ($1,128/year)

### Migration to Polygon.io (Future)

When ready for real-time data:
1. Sign up for Polygon.io Options Starter ($99/month)
2. Update Python service to use Polygon SDK (~2-3 hours)
3. No frontend changes required (same API contract)

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

## LLM Architecture: Claude (Anthropic) + OpenAI Whisper

We use **Claude models** for all text and vision analysis, with **OpenAI Whisper** for audio transcription (Claude doesn't offer transcription).

### Why Claude?

| Feature | Claude Advantage |
|---------|-----------------|
| Reasoning quality | Superior for trading psychology analysis |
| Vision capabilities | Excellent chart/screenshot understanding |
| Tiered pricing | Haiku (cheap) → Sonnet (balanced) → Opus (deep) |
| Consistency | Single SDK, predictable behavior |
| Cost efficiency | ~25% cheaper than equivalent OpenAI models |

### Model Tiering Strategy

| Model | Model ID | Cost (per 1M tokens) | Use For |
|-------|----------|---------------------|---------|
| **Claude Haiku 3.5** | `claude-3-5-haiku-latest` | $0.25 / $1.25 | Quick inference, ticker validation, routine tasks |
| **Claude Sonnet 4** | `claude-sonnet-4-20250514` | $3 / $15 | Entry analysis, vision, insights |
| **Claude Opus 4.5** | `claude-opus-4-5-20251101` | $15 / $75 | Deep pattern analysis, monthly reports |
| **OpenAI Whisper** | `whisper-1` | $0.006/min | Voice transcription (only OpenAI feature used) |

### Model Constants

```typescript
// src/lib/claude.ts
export const CLAUDE_MODELS = {
  FAST: 'claude-3-5-haiku-latest',      // Quick, cheap - routine tasks
  BALANCED: 'claude-sonnet-4-20250514', // Vision, analysis
  DEEP: 'claude-opus-4-5-20251101',     // Complex reasoning
} as const;
```

### Monthly Cost Estimate

| Component | Cost |
|-----------|------|
| Whisper (50 voice memos) | $0.30 |
| Claude Haiku (routine tasks) | $0.05 |
| Claude Sonnet (analysis, vision) | $0.15 |
| Claude Opus (deep analysis) | $0.10 |
| yfinance (market data) | $0.00 |
| Cloudflare R2 (storage) | Free tier |
| Vercel Cron | Free tier |
| **Total** | **~$0.60/month** |

### AI Analysis (Issue #20)

**Service:** `src/lib/aiAnalysis.ts`
- `analyzeEntryText()`: Single entry analysis
- `batchAnalyzeEntries()`: Rate-limited batch (5/batch, 1s delay)

**API:**
- `POST /api/entries/[id]/analyze`: Single entry
- `POST /api/entries/analyze-batch`: Batch (body: `{ entryIds?: string[], analyzeAll?: boolean }`)

**Output:** sentiment, emotionalKeywords, detectedBiases, convictionInferred, confidence, aiTags (3-7 from taxonomy)

**Config:** Requires `ANTHROPIC_API_KEY`, Claude Haiku for routine analysis, ~$0.0005/entry

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
- `ANTHROPIC_API_KEY`: For Claude AI analysis (Haiku, Sonnet, Opus)
- `OPENAI_API_KEY`: For Whisper audio transcription only
- `DEBUG=1`: Optional debug logging

**Phase 2 (when implementing):**
- `R2_ENDPOINT`: Cloudflare R2 endpoint
- `R2_ACCESS_KEY`: Cloudflare R2 access key
- `R2_SECRET_KEY`: Cloudflare R2 secret key
- `R2_BUCKET`: Cloudflare R2 bucket name
- `R2_PUBLIC_URL`: Cloudflare R2 public URL
- `VAPID_PUBLIC_KEY`: For push notifications
- `VAPID_PRIVATE_KEY`: For push notifications
- `OPTIONS_SERVICE_URL`: yfinance Python service URL

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
- Codebase cleanup for production readiness

### ✅ Phase 2 - Engagement & Capture Features (Completed)

**Frictionless Capture System (PR #65):**
- [x] Voice recording infrastructure
- [x] Quick capture with auto-inference (Claude Haiku)
- [x] Media storage foundation

**Proactive Engagement System (PR #66):**
- [x] Market condition monitoring (SPY, VIX triggers)
- [x] Journal silence detection
- [x] In-app notification banners

**Pattern Recognition Engine (PR #67):**
- [x] Bias frequency analysis
- [x] Market condition correlation
- [x] Behavioral pattern detection

**Context Surfacing System (PR #68):**
- [x] Ticker detection with context panel
- [x] Strategy insight integration
- [x] Historical entry context

**Claude LLM Migration (PR #73):**
- [x] Migrated from OpenAI GPT-4o to Claude (Haiku/Sonnet/Opus)
- [x] Tiered model selection for cost optimization
- [x] Kept OpenAI Whisper for audio transcription

**Full specifications:** See `specs/01-04*.md` for detailed PRDs.

### ✅ Phase 3 - UX/UI Design System (Completed)

**PRD:** `specs/11-ux-ui-design-system.md`

Modern mobile-first design overhaul inspired by Day One, Reflectly, and fintech apps:
- [x] Foundation: Color system, glassmorphism, tailwind tokens (PR #71, #74)
- [x] Navigation: Bottom nav with center FAB for mobile (PR #71)
- [x] Core Components: Modern cards, mood selector, entry cards (PR #71)
- [x] Dashboard Redesign: New layout, glass header, streak card (PR #71)
- [x] Forms & Inputs: Entry form, conviction slider (PR #71)
- [x] Polish: Micro-interactions, animations, skeletons (PR #79)
- [x] Accessibility: WCAG 2.1 AA compliance, skip link, focus indicators (PR #80)

**Additional Polish Items (Completed):**
- [x] Guided Entry Mode (PR #71)
- [x] Performance Optimization - Lighthouse audit, React.memo, virtual scrolling (PR #78)
- [x] Inline Quick Edit (PR #75)

**Verification:** Playwright-verified all features (screenshots in `agent-os/specs/11-ux-ui-design-system/verification/`)

### ✅ Thesis-Based Trade Management - Phase 1 (Completed)

**PRD:** `specs/06-trade-management.md`

- [x] Database schema (TradingThesis, ThesisTrade, ThesisUpdate) (PR #76)
- [x] API routes (theses CRUD, trades, updates, close) (PR #76)
- [x] Thesis list page with filtering (PR #76)
- [x] Thesis detail page with P/L summary, trades timeline, updates (PR #76)
- [x] Dashboard integration (Active Theses section) (PR #76)
- [x] 18 integration tests (PR #76)

### ✅ Thesis-Based Trade Management - Phase 2 (Completed)

**PRD:** `specs/06-trade-management.md`

- [x] Enhanced trade logging form with full fields (PR #82)
- [x] Trade timeline component with visual action indicators (PR #82)
- [x] Voice recording integration for trade reasoning (PR #82)
- [x] File attachment upload UI (PR #82)
- [x] Strategy type selection (18 options strategies) (PR #82)
- [x] Expiration date, quantity, and reasoning note fields (PR #82)

### ✅ Phase 4 - Power User Features (Completed)

**Thesis-Based Trade Management - Phase 3:** `specs/06-trade-management.md`
- [x] Screenshot data extraction via Claude vision (`src/lib/tradeExtraction.ts`)
- [x] Pattern learning from historical data (`src/lib/thesisPatterns.ts`)
- [x] AI reminders of past lessons (`/api/patterns/reminders`)

**AI Trading Coach:** `specs/07-ai-coach.md`
- [x] Conversational coach with context from entries (`/coach` page)
- [x] Coach chat API with streaming responses (`/api/coach/chat`)
- [x] Goal setting and progress tracking (`/coach/goals` page)
- [x] Proactive coach prompts system (`/api/coach/prompts`)

**Social/Mentor Sharing:** `specs/08-social-sharing.md`
- [x] Shareable entry links with redaction (`/sharing` page)
- [x] Mentor dashboard with commenting (`/api/mentors/dashboard`)
- [x] Accountability partner features (`/api/accountability/*`)
- [x] Share link management (`/api/share/links`)

**Custom Dashboard:** `specs/09-custom-dashboard.md`
- [x] Dashboard layouts API (`/api/dashboard/layouts`)
- [x] 14 widget types implemented (`src/lib/dashboard.ts`)
- [x] Layout templates system (`/api/dashboard/templates`)
- [x] Widget configuration management (`/api/dashboard/widgets`)

**Verification:** Playwright-verified all features (screenshots in `agent-os/specs/validation-screenshots/phase4-testing/`)

### 🚀 Phase 5 - Mobile Deployment

**PRD:** `specs/10-mobile-deployment.md`
- PWA enhancement and optimization
- Optional Capacitor migration
- App Store submission (iOS/Android)

## Known Issues

1. **WSL Networking:** Database connections fail from WSL. Use PowerShell.
2. **Pre-existing TypeScript/ESLint:** `src/lib/cache.ts`, `src/lib/yahooFinance.ts`, `src/lib/polygonClient.ts` (legacy Phase 2 files)
3. **Build Warnings:** React hooks deps, unescaped entities, empty interfaces (non-critical)
4. **yfinance Service:** Python FastAPI microservice implemented, needs Railway.app deployment for production
5. **Phase 2 Dependencies:** Cloudflare R2, VAPID keys, pgvector extension not yet configured (see specs/TASKS.md)

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
