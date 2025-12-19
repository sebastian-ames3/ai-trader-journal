# Architecture Overview

## Directory Structure
```
src/
├── app/                 # Next.js App Router pages & API routes
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
    ├── journalOCR.ts   # OCR extraction (PRD 1)
    ├── autoLinking.ts  # Trade linking (PRD 1)
    └── tradeExtraction.ts # Screenshot extraction
```

## Database Models (Prisma)
| Model | Purpose |
|-------|---------|
| Entry | Journal entries (TRADE_IDEA, TRADE, REFLECTION, OBSERVATION) |
| TradingThesis | Thesis with trades, updates, P/L |
| ThesisTrade | Individual trades linked to thesis |
| CoachSession/Message | AI coach conversations |
| CoachGoal/Prompt | Goals and proactive prompts |
| ShareLink | Shareable links with redaction |
| DashboardLayout | Custom widget layouts |

## API Routes
| Category | Primary Endpoints |
|----------|-------------------|
| Entries | `/api/entries`, `/api/entries/[id]` |
| Theses | `/api/theses`, `/api/theses/[id]` |
| Coach | `/api/coach/chat`, `/api/coach/goals` |
| Sharing | `/api/share/links`, `/api/mentors/*` |
| Dashboard | `/api/dashboard/layouts` |
| OCR | `/api/journal/ocr` (PRD 1) |

## LLM Usage
| Model | Use Case |
|-------|----------|
| Claude Haiku 3.5 | Quick inference, routine analysis |
| Claude Sonnet 4 | Vision/OCR, deep analysis |
| OpenAI Whisper | Voice transcription |

## Key Constraints
- Mobile-first (390x844 viewport)
- 44px touch targets
- WCAG 2.1 AA compliance
- Supabase PostgreSQL (use pgbouncer)
- PowerShell required (WSL has Supabase issues)
