# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Trader Journal is a mobile-first options trading journal with intelligent IV/HV analysis. The application allows traders to:
- Track options trades with comprehensive market context
- Calculate and compare Historical Volatility (HV) vs Implied Volatility (IV)
- Manually enter IV data and persist it to the database
- Analyze whether options are overpriced or undervalued based on IV/HV ratios
- Size positions based on account risk rather than arbitrary share counts
- Journal trade ideas, reflections, and market observations

**Tech Stack:** Next.js 14 (App Router) • TypeScript • Tailwind CSS • Prisma • PostgreSQL • shadcn/ui

## Development Commands

```bash
# Development
npm run dev          # Start Next.js dev server on localhost:3000
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript compiler (no emit)
npm run format       # Format code with Prettier

# Testing
npm run test         # Run Jest tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report

# Database
npm run db:push      # Push schema changes to database
npm run db:seed      # Seed database with initial data
npm run db:studio    # Open Prisma Studio (database GUI)

# Migrations (recommended for production)
npx prisma migrate dev --name [migration_name]  # Create and apply migration in dev
npx prisma migrate deploy                        # Apply migrations in production

# Environment Setup
cp .env.example .env.local  # Create environment file
npm run postinstall  # Generate Prisma client (runs automatically after install)
```

## Architecture & Key Concepts

### Database Schema (Prisma)

The application uses PostgreSQL with Prisma ORM. The schema is defined in `prisma/schema.prisma`:

- **Trade**: Core model storing trade details, market conditions, and IV/HV metrics at entry
- **Entry**: Standalone journal entries for trade ideas, reflections, observations, and trade documentation
- **Snapshot**: Captures complete market state at trade entry including IV data, HV calculations, Greeks, and options chain data
- **Note**: Journal notes attached to trades (legacy - being superseded by Entry model)
- **Tag**: Categorization tags for both trades and entries
- **Settings**: User preferences for risk management and thresholds

**Important:** The schema uses PostgreSQL (not SQLite as initially mentioned in README). Environment requires `DATABASE_URL` connection string.

#### Entry Model

The **Entry** model is a flexible journal entry system that supports multiple use cases:

**Entry Types:**
- `TRADE_IDEA`: Pre-trade thoughts and analysis (most common)
- `TRADE`: Documentation of actual executed trades (links to Trade model)
- `REFLECTION`: Post-trade analysis and lessons learned
- `OBSERVATION`: General market observations and notes

**Core Fields (Phase 1):**
- `content`: Main journal text (TEXT field, supports full-text search)
- `mood`: Trader's emotional state (CONFIDENT, NERVOUS, EXCITED, UNCERTAIN, NEUTRAL)
- `conviction`: Confidence level in the idea (LOW, MEDIUM, HIGH)
- `ticker`: Optional ticker symbol (entries don't require a ticker)
- `tradeId`: Optional link to Trade record
- `snapshotId`: Optional link to market conditions snapshot

**Future Fields (Phase 2):**
- `audioUrl`: For voice notes (Issue #19)
- `imageUrls`: For screenshots (Issue #19)
- AI analysis fields (Issue #20): `sentiment`, `emotionalKeywords`, `detectedBiases`, `aiTags`, `convictionInferred`

**Relationships:**
- Entry can optionally link to Trade (many-to-one)
- Entry can optionally link to Snapshot (one-to-one)
- Entry has many Tags (many-to-many via `_EntryTags` join table)
- Trade has many Entries (one-to-many: idea → execution → reflection)

**Cascading Behavior:**
- If Trade is deleted, Entry's `tradeId` is set to NULL (preserves journal entry)
- If Snapshot is deleted, Entry's `snapshotId` is set to NULL

**Query Patterns:**
The Entry model is indexed for common queries:
- Date DESC (most recent first)
- Ticker symbol
- Entry type
- Mood
- Conviction level
- Associated trade

**Validation Rules:**
- TRADE type entries should have a `tradeId` (enforce at application level)
- Content field is required
- Type field is required
- All other fields are optional

### Volatility Calculation System

The application implements a sophisticated volatility analysis pipeline:

1. **Historical Volatility (HV)**: `src/lib/hv.ts`
   - Calculated using close-to-close log returns: `HV = stdev(ln(P_t/P_{t-1})) * sqrt(252) * 100`
   - Supports both HV20 (20-day) and HV30 (30-day) calculations
   - Requires minimum data points (20 or 30 prices respectively)
   - Annualized for 252 trading days
   - Returns percentage values (e.g., 28.5%)

2. **Implied Volatility (IV)**: `src/lib/iv.ts`
   - Manual entry system with validation (0.1% - 400% range)
   - Accepts inputs like "28", "28.5", or "28.5%"
   - Stored as decimals in database (28.5% → 0.285)
   - Displayed as percentages with optional term days
   - Default term: 30 days

3. **IV Persistence**: `src/lib/persistIV.ts`
   - Saves IV data to Snapshot model
   - Links IV to specific trades via tradeId
   - Tracks source ("manual"), term days, and timestamp

### Data Fetching & Mock System

Currently uses mock data (`src/lib/data.ts`) for price fetching:
- `fetchDailyCloses()` generates realistic price movements
- Designed to be replaced with actual yfinance integration
- Mock data varies by ticker (AAPL, GOOGL, SPY, etc.)

### API Routes

- `GET /api/ticker?q={query}`: Search for ticker symbols (currently mock data)
- `GET /api/ticker/[symbol]`: Get detailed ticker information
- `POST /api/iv/manual`: Persist manually entered IV data

### Component Architecture

- **UI Components**: `src/components/ui/` contains shadcn/ui primitives (Button, Card, Input, Select, etc.)
- **Feature Components**:
  - `TickerEntry.tsx`: Main ticker search and selection interface
  - `HvCard.tsx`: Displays HV20 and HV30 calculations
  - `ManualIvForm.tsx`: IV manual entry form with validation
  - `IvBadge.tsx`: Visual indicator for IV/HV comparison

### Prisma Client Singleton

`src/lib/prisma.ts` implements a singleton pattern to prevent multiple Prisma Client instances in development:
- Reuses client instance in development mode
- Creates fresh instance in production
- Includes debug logging for connection troubleshooting

### Logger System

`src/lib/logger.ts` provides conditional logging:
- Enabled when `DEBUG=1` environment variable is set
- Used throughout HV/IV calculation pipeline
- Logs calculation steps, validation errors, and data flow

## Path Aliases

TypeScript is configured with path alias `@/*` → `./src/*`

Example: `import { calculateHV } from '@/lib/hv'`

## Important Notes

1. **Database Provider**: Schema uses PostgreSQL (not SQLite). Ensure `DATABASE_URL` points to a valid PostgreSQL instance.

2. **IV/HV Storage Convention**:
   - IV stored as decimal in database (0.285 for 28.5%)
   - Convert using `pctToDecimal()` and `decimalToPct()` from `src/lib/iv.ts`

3. **HV Calculation Requirements**:
   - Minimum 20 prices for HV20
   - Minimum 30 prices for HV30
   - All prices must be positive, finite numbers
   - Returns null if insufficient or invalid data

4. **Branch Protection**: Main branch is protected. All changes must go through pull requests from feature branches (e.g., `feat/your-feature`).

5. **Mock Data**: Current implementation uses mock data for ticker search and price fetching. This is intentional for MVP development and should be replaced with real API integration later.

6. **Database Migrations**: Migration files are stored in `prisma/migrations/`. Use `npx prisma migrate dev` for development and `npx prisma migrate deploy` for production. The `db:push` command is available for rapid prototyping but doesn't create migration history.
