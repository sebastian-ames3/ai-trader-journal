# CLAUDE.md

Guidance for Claude Code working with this repository.

## Project Overview

**AI Trader Journal** - Mobile-first trading psychology journal with AI-powered behavioral analysis.

**Stack:** Next.js 14 (App Router) | TypeScript | Tailwind CSS | Prisma | PostgreSQL (Supabase) | shadcn/ui | Claude + Whisper | date-fns | yfinance (Python)

**Current Phase:** 5 - Mobile Deployment (PWA, Capacitor, App Store)

### Core Features
- Journal entries with AI sentiment/bias detection
- Weekly insights with behavior pattern analysis
- Voice memos, screenshots, quick capture
- Thesis-based trade management with P/L tracking
- AI trading coach with goal setting
- Social sharing with mentor/accountability features
- Customizable dashboard with 14 widget types

## Quick Commands

```bash
npm run dev              # Dev server (:3000)
npm run build            # Production build
npm run typecheck        # TypeScript check
npm run lint             # ESLint
npm run db:push          # Push schema (dev)
npm run db:studio        # Prisma Studio
npx prisma migrate dev   # Create migration
```

**Testing (requires dev server + PowerShell):**
```bash
npm run test:all         # All tests
/mobile-check            # UI validation
/fix-console             # Auto-fix JS errors
/accessibility           # WCAG AA check
```

## Architecture

### Database Models (Prisma)
| Model | Purpose |
|-------|---------|
| Entry | Journal entries (TRADE_IDEA, TRADE, REFLECTION, OBSERVATION) |
| TradingThesis | Thesis with trades, updates, P/L |
| CoachSession/Message | AI coach conversations |
| CoachGoal/Prompt | Goals and proactive prompts |
| ShareLink | Shareable links with redaction |
| DashboardLayout | Custom widget layouts |
| MentorRelationship | Mentor access management |
| AccountabilityPair | Partner features |

### Key Directories
```
src/
├── app/                 # Next.js pages & API routes
│   ├── api/            # REST endpoints
│   ├── coach/          # AI coach pages
│   ├── sharing/        # Share management
│   └── theses/         # Trade thesis pages
├── components/
│   ├── ui/             # shadcn primitives
│   ├── coach/          # Coach components
│   ├── dashboard/      # Dashboard widgets
│   ├── sharing/        # Sharing components
│   └── trades/         # Trade components
└── lib/
    ├── aiAnalysis.ts   # Entry analysis
    ├── coach.ts        # Coach logic
    ├── dashboard.ts    # Widget definitions
    ├── sharing.ts      # Share link logic
    ├── thesisPatterns.ts # Pattern detection
    └── tradeExtraction.ts # Screenshot extraction
```

### API Routes
| Category | Endpoints |
|----------|-----------|
| Entries | `/api/entries`, `/api/entries/[id]`, `/api/entries/[id]/analyze` |
| Insights | `/api/insights/weekly` |
| Theses | `/api/theses`, `/api/theses/[id]`, `/api/theses/[id]/close` |
| Coach | `/api/coach/chat`, `/api/coach/goals`, `/api/coach/prompts`, `/api/coach/sessions` |
| Sharing | `/api/share/links`, `/api/mentors/*`, `/api/accountability/*` |
| Dashboard | `/api/dashboard/layouts`, `/api/dashboard/widgets`, `/api/dashboard/templates` |
| Patterns | `/api/patterns/theses`, `/api/patterns/reminders`, `/api/trades/extract` |

### LLM Strategy
| Model | Use Case | Cost/1M |
|-------|----------|---------|
| Claude Haiku 3.5 | Quick inference, routine | $0.25/$1.25 |
| Claude Sonnet 4 | Analysis, vision | $3/$15 |
| Claude Opus 4.5 | Deep pattern analysis | $15/$75 |
| OpenAI Whisper | Voice transcription | $0.006/min |

## Design System

**Mobile-first (390x844)** | 44px touch targets | WCAG 2.1 AA | 16px base text

**Colors:** Primary #171717 | Positive #16A34A | Negative #EF4444 | Neutral #737373

**Entry Types:** TRADE_IDEA (blue) | TRADE (green) | REFLECTION (purple) | OBSERVATION (orange)

## Environment Variables

```bash
DATABASE_URL=           # Supabase PostgreSQL (?pgbouncer=true)
ANTHROPIC_API_KEY=      # Claude API
OPENAI_API_KEY=         # Whisper only
OPTIONS_SERVICE_URL=    # yfinance Python service (optional)
DEBUG=1                 # Debug logging (optional)
```

## Critical Notes

1. **Use PowerShell** - WSL has Supabase networking issues
2. **Path alias:** `@/*` maps to `./src/*`
3. **Git workflow:** Feature branches → PR → main
4. **Commit format:**
   ```
   Description

   [Generated with Claude Code](https://claude.com/claude-code)
   Co-Authored-By: Claude <noreply@anthropic.com>
   ```

## Implementation Status

| Phase | Status | Key Features |
|-------|--------|--------------|
| 1 - MVP | Complete | Entry API, AI analysis, weekly insights, search/filters, auto-tagging, streak tracking |
| 2 - Engagement | Complete | Voice capture, market monitoring, pattern detection, context surfacing |
| 3 - UX/UI | Complete | Modern design system, glassmorphism, animations, WCAG compliance |
| 4 - Power User | Complete | AI coach, social sharing, custom dashboard, thesis patterns |
| 5 - Mobile | Current | PWA optimization, Capacitor migration, App Store submission |

**Specs:** `specs/01-11*.md` | **Verification:** `agent-os/specs/validation-screenshots/`

## Known Issues

1. WSL networking fails with Supabase - use PowerShell
2. Legacy files with TS warnings: `src/lib/cache.ts`, `src/lib/yahooFinance.ts`, `src/lib/polygonClient.ts`
3. yfinance service needs Railway deployment for production
4. R2, VAPID keys, pgvector not yet configured

## Page Routes

| Page | URL |
|------|-----|
| Dashboard | `/` |
| Journal | `/journal` |
| New Entry | `/new` |
| Entry Detail | `/entries/[id]` |
| Theses List | `/theses` |
| Thesis Detail | `/theses/[id]` |
| Thesis Patterns | `/theses/patterns` |
| AI Coach | `/coach` |
| Coach Goals | `/coach/goals` |
| Sharing Hub | `/sharing` |
| Mentor Dashboard | `/sharing/mentor` |
| Dashboard Settings | `/dashboard/settings` |
| Insights | `/insights` |
| Settings | `/settings` |
