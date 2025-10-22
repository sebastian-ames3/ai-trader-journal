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
npm run test            # Run Jest tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage report
npm run test:api        # Integration tests for Entry API
npm run test:ai         # Integration tests for AI text analysis
npm run test:insights   # Integration tests for Weekly Insights

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

**Core Fields:**
- `content`: Main journal text (TEXT field, supports full-text search)
- `mood`: Trader's emotional state (CONFIDENT, NERVOUS, EXCITED, UNCERTAIN, NEUTRAL, FRUSTRATED, CALM, ANXIOUS, OPTIMISTIC, FEARFUL, GREEDY, PATIENT, IMPULSIVE, DISCIPLINED)
- `conviction`: Confidence level in the idea (LOW, MEDIUM, HIGH)
- `ticker`: Optional ticker symbol (entries don't require a ticker)
- `tradeId`: Optional link to Trade record
- `snapshotId`: Optional link to market conditions snapshot

**AI Analysis Fields (Implemented):**
- `sentiment`: AI-detected emotional tone (positive, negative, neutral)
- `emotionalKeywords`: Array of emotion-related words extracted from text
- `detectedBiases`: Array of cognitive biases identified (confirmation_bias, recency_bias, loss_aversion, overconfidence, fomo, revenge_trading, anchoring, herd_mentality, outcome_bias)
- `convictionInferred`: AI-inferred conviction level based on language certainty (LOW, MEDIUM, HIGH)

**Future Fields (Phase 2):**
- `audioUrl`: For voice notes (Issue #19)
- `imageUrls`: For screenshots (Issue #19)
- `aiTags`: Auto-generated tags (Phase 2)

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

### AI Text Analysis (Issue #20 - Implemented)

The application uses **OpenAI GPT-4o-mini** to analyze journal entry text and extract psychological insights:

**Service:** `src/lib/aiAnalysis.ts`
- `analyzeEntryText()`: Analyzes single entry for sentiment, emotions, biases, conviction
- `batchAnalyzeEntries()`: Rate-limited batch processing (5 entries/batch, 1s delay)

**API Endpoints:**
- `POST /api/entries/[id]/analyze`: Analyze and update a single entry
- `POST /api/entries/analyze-batch`: Batch analyze multiple entries
  - Body: `{ entryIds: string[] }` - analyze specific entries
  - Body: `{ analyzeAll: true }` - analyze all unanalyzed entries

**Analysis Output:**
```typescript
{
  sentiment: 'positive' | 'negative' | 'neutral',
  emotionalKeywords: string[],  // ['confident', 'anxious', 'FOMO', etc.]
  detectedBiases: string[],      // ['confirmation_bias', 'fomo', etc.]
  convictionInferred: 'LOW' | 'MEDIUM' | 'HIGH' | null,
  confidence: number              // 0-1 confidence score
}
```

**Key Features:**
- Lazy client initialization (handles environment variable loading)
- JSON mode for structured responses
- Low temperature (0.3) for consistent analysis
- Automatic validation and normalization of AI responses
- Safe fallbacks on parsing errors

**Environment:**
- Requires `OPENAI_API_KEY` in `.env`
- Cost: ~$0.0007 per entry analysis

**Future Enhancement (Issue #25):**
- Perplexity AI for market context enrichment (Phase 2)
- Will supplement OpenAI analysis with real-time market data and news context

### Weekly Insights Dashboard (Issue #21 - Implemented)

Provides traders with personalized feedback and pattern detection based on journal entries:

**Service:** `src/lib/weeklyInsights.ts`
- `generateWeeklyInsights(weekOffset)`: Aggregates and analyzes data for any week
  - `weekOffset=0`: Current week
  - `weekOffset=-1`: Last week
  - Supports up to 52 weeks of history

**API Endpoint:**
- `GET /api/insights/weekly?week={offset}`: Get insights for specified week
  - Validates offset range (0 to -52)
  - Returns comprehensive insights object

**Analytics Features:**
1. **Basic Statistics**: Total entries, trade ideas, reflections, observations
2. **Emotional Trends**:
   - Dominant sentiment (positive/negative/neutral)
   - Sentiment breakdown counts
   - Top 5 emotional keywords with frequency
   - Mood frequency distribution
3. **Cognitive Patterns**:
   - Detected biases with frequency
   - Conviction distribution (high/medium/low)
4. **Personalized Insights**: AI-generated feedback based on patterns:
   - "Your mindset was predominantly positive this week (5 positive entries)"
   - "Watch out for FOMO - detected 3 times this week"
   - "Only 2 entries this week. More frequent journaling reveals better patterns"
5. **Week-over-Week Comparison** (current week only):
   - Entries change percentage
   - Sentiment trend (improving/declining/stable)
   - New biases detected this week

**Dashboard UI:** `/insights`
- Week selector (This Week, Last Week, 2 Weeks Ago)
- Statistics cards
- Emotional Trends visualization
- Cognitive Patterns display
- Personalized Insights list
- Mobile-first responsive design

**Dependencies:**
- `date-fns`: Week calculations (startOfWeek, endOfWeek, subWeeks, format)

### Data Fetching & Mock System

Currently uses mock data (`src/lib/data.ts`) for price fetching:
- `fetchDailyCloses()` generates realistic price movements
- Designed to be replaced with actual yfinance integration
- Mock data varies by ticker (AAPL, GOOGL, SPY, etc.)

### API Routes

**Entry Management:**
- `GET /api/entries`: List entries with optional search and filters
  - **Query Parameters:**
    - `search` - Full-text search on content (case-insensitive)
    - `type` - Filter by entry type (TRADE_IDEA, TRADE, REFLECTION, OBSERVATION)
    - `ticker` - Filter by ticker symbol (case-insensitive)
    - `mood` - Filter by mood (CONFIDENT, NERVOUS, EXCITED, etc.)
    - `conviction` - Filter by conviction level (LOW, MEDIUM, HIGH)
    - `sentiment` - Filter by AI sentiment (positive, negative, neutral)
    - `bias` - Filter by cognitive biases (comma-separated, supports multiple)
    - `dateFrom` - ISO date string (entries created after this date)
    - `dateTo` - ISO date string (entries created before this date)
    - `limit` - Max results per page (default: 50)
    - `offset` - Pagination offset (default: 0)
  - **Response:**
    ```json
    {
      "entries": [...],
      "pagination": {
        "total": 100,
        "limit": 50,
        "offset": 0,
        "hasMore": true
      }
    }
    ```
- `POST /api/entries`: Create new entry
- `GET /api/entries/[id]`: Get single entry
- `PUT /api/entries/[id]`: Update entry
- `DELETE /api/entries/[id]`: Delete entry

**AI Analysis:**
- `POST /api/entries/[id]/analyze`: Analyze single entry with AI
- `POST /api/entries/analyze-batch`: Batch analyze entries
  - Body: `{ entryIds?: string[], analyzeAll?: boolean }`

**Weekly Insights:**
- `GET /api/insights/weekly?week={offset}`: Get weekly insights
  - `week=0`: Current week
  - `week=-1`: Last week
  - `week=-2`: 2 weeks ago (up to -52)

**Ticker Data (Mock - Phase 2):**
- `GET /api/ticker?q={query}`: Search for ticker symbols
- `GET /api/ticker/[symbol]`: Get detailed ticker information

**IV Persistence (Phase 2):**
- `POST /api/iv/manual`: Persist manually entered IV data

### Search & Filters (Issue #24 - Implemented)

The application provides comprehensive search and filtering capabilities for journal entries:

**Search Component:** `src/components/SearchFilters.tsx`
- Full-text search across entry content
- Multi-filter support with collapsible advanced filters panel
- Visual filter chips for cognitive biases
- URL query parameter integration for shareable filtered views
- Active filter count badge
- One-click filter clearing

**API Implementation:** `src/app/api/entries/route.ts`
- Query string parsing with validation
- Prisma where clause builder
- Pagination support with total count
- Case-insensitive search and matching
- Array-based bias filtering with `hasSome`

**Journal Page Integration:** `src/app/journal/page.tsx`
- Real-time filter state management
- URL synchronization for bookmarkable searches
- Results count display
- AI analysis badges in entry cards (sentiment, biases)
- Reverse chronological ordering

**Supported Filters:**
1. **Text Search**: Case-insensitive content search
2. **Entry Type**: TRADE_IDEA, TRADE, REFLECTION, OBSERVATION
3. **Ticker**: Symbol filter (case-insensitive)
4. **Mood**: 14 emotional states (CONFIDENT, NERVOUS, etc.)
5. **Conviction**: LOW, MEDIUM, HIGH
6. **Sentiment**: AI-detected positive/negative/neutral
7. **Biases**: Multi-select from 9 cognitive biases
8. **Date Range**: Filter by creation date (dateFrom/dateTo)
9. **Pagination**: Limit and offset for result sets

**Test Coverage:**
- 18 integration tests covering all filter combinations
- Test suite: `tests/api-search-filters.test.ts`
- Run with: `npm run test:search`

### Component Architecture

- **UI Components**: `src/components/ui/` contains shadcn/ui primitives (Button, Card, Input, Select, etc.)
- **Feature Components**:
  - `SearchFilters.tsx`: Comprehensive search and filter interface for journal entries
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

1. **Database Provider**:
   - Uses **Supabase PostgreSQL** with connection pooling
   - `DATABASE_URL` must include `?pgbouncer=true` parameter for connection pooling (port 6543)
   - Example: `postgresql://user:pass@db.xxx.supabase.co:6543/postgres?pgbouncer=true`

2. **Development Environment - CRITICAL**:
   - **WSL has networking issues with Supabase** - database connections fail from WSL bash
   - **Must use Windows PowerShell** for all development and testing
   - Run `npm run dev` from PowerShell, not WSL
   - Run all test commands from PowerShell
   - Git operations can be done from either environment

3. **Testing Requirements**:
   - All integration tests (`test:api`, `test:ai`, `test:insights`, `test:search`) require:
     1. Dev server running on `localhost:3000`
     2. Database connection (must run from PowerShell)
     3. `OPENAI_API_KEY` in `.env` file (for AI tests)
   - Tests use `dotenv` to load environment variables
   - Tests perform real database operations and API calls

4. **AI Analysis**:
   - Requires `OPENAI_API_KEY` environment variable
   - Uses GPT-4o-mini model (cost-effective)
   - Lazy client initialization to handle env var loading
   - ~$0.0007 per entry analysis

5. **IV/HV Storage Convention** (Phase 2):
   - IV stored as decimal in database (0.285 for 28.5%)
   - Convert using `pctToDecimal()` and `decimalToPct()` from `src/lib/iv.ts`

6. **HV Calculation Requirements** (Phase 2):
   - Minimum 20 prices for HV20
   - Minimum 30 prices for HV30
   - All prices must be positive, finite numbers
   - Returns null if insufficient or invalid data

7. **Branch Protection**:
   - Main branch is protected
   - All changes must go through pull requests from feature branches (e.g., `feat/your-feature`)
   - Use semantic branch names: `feat/`, `fix/`, `docs/`, etc.

8. **Mock Data**:
   - Current implementation uses mock data for ticker search and price fetching
   - Intentional for MVP development (Phase 1 focus is journal/psychology)
   - Will be replaced with real API integration in Phase 2

9. **Database Migrations**:
   - Migration files stored in `prisma/migrations/`
   - Use `npx prisma migrate dev` for development
   - Use `npx prisma migrate deploy` for production
   - `db:push` available for rapid prototyping but doesn't create migration history

10. **Environment Variables**:
    - `DATABASE_URL`: Supabase PostgreSQL connection string with pgbouncer
    - `OPENAI_API_KEY`: Required for AI text analysis
    - `DEBUG=1`: Enable debug logging (optional)
    - Store in `.env` file (never commit this file)

## Implementation Status

### ✅ Phase 1 - MVP Journal Features (Current Focus)

**Completed:**
- ✅ **Entry Schema & API** (Issue #23)
  - Full CRUD operations for journal entries
  - Entry types: TRADE_IDEA, TRADE, REFLECTION, OBSERVATION
  - Mood and conviction tracking
  - Comprehensive integration tests

- ✅ **AI Text Analysis** (Issue #20)
  - OpenAI GPT-4o-mini integration
  - Sentiment analysis (positive/negative/neutral)
  - Emotional keyword extraction
  - Cognitive bias detection (9 bias types)
  - Conviction inference from language patterns
  - Batch analysis with rate limiting
  - Comprehensive test suite (9 tests)

- ✅ **Weekly Insights Dashboard** (Issue #21)
  - Analytics service with week-based aggregation
  - Emotional trend analysis
  - Cognitive pattern detection
  - Personalized insights generation
  - Week-over-week comparison
  - Responsive dashboard UI
  - Comprehensive test suite (10 tests)

- ✅ **Search & Filters** (Issue #24)
  - Full-text search on entry content
  - Multi-filter support (type, ticker, mood, conviction, sentiment, biases, date range)
  - Collapsible advanced filters panel with shadcn/ui components
  - URL query parameter integration for shareable filtered views
  - Pagination support (limit/offset)
  - AI analysis badges in entry cards
  - Comprehensive test suite (18 tests)

**In Progress:**
- None (ready for next feature)

**Pending Phase 1:**
- ⏳ Auto-tagging system (Issue #22)
- ⏳ Voice notes & screenshots (Issue #19)

### 🔮 Phase 2 - Financial Data Integration (Future)

**Planned:**
- Perplexity AI for market context enrichment (Issue #25)
- Yahoo Finance integration for real-time data
- Historical Volatility (HV) calculations
- Implied Volatility (IV) tracking
- Options trade tracking with Greeks
- Trade outcome correlation with emotions
- Financial performance metrics

**Note:** Phase 2 features are on hold until MVP journal features are complete and validated with users.

## Development Workflow

1. **Create Feature Branch:**
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Develop (in Windows PowerShell):**
   ```powershell
   npm run dev           # Start dev server
   npm run test:api      # Run tests as you develop
   npm run lint          # Check for linting issues
   npm run typecheck     # Verify TypeScript types
   ```

3. **Commit Changes:**
   ```bash
   git add .
   git commit -m "Add feature description

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

4. **Push and Create PR:**
   ```bash
   git push -u origin feat/your-feature-name
   gh pr create --title "Feature Title" --body "Description..."
   ```

5. **Review and Merge:**
   - Review changes in GitHub
   - Merge PR to main
   - Pull latest changes: `git checkout main && git pull`

## Testing Strategy

**Integration Tests:**
- Located in `tests/` directory
- Use real database and API calls
- Require dev server running
- Must run from Windows PowerShell

**Test Coverage:**
- Entry API: 11 tests covering CRUD operations, validation, error handling
- AI Analysis: 9 tests covering sentiment, bias detection, API endpoints
- Weekly Insights: 10 tests covering analytics, aggregation, personalization
- Search & Filters: 18 tests covering all filter types, pagination, combined filters

**Running Tests:**
```powershell
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run tests
npm run test:api        # Entry API tests
npm run test:ai         # AI analysis tests (requires OPENAI_API_KEY)
npm run test:insights   # Weekly insights tests
npm run test:search     # Search & filter tests
```

## Known Issues

1. **WSL Networking**: Database connections fail from WSL bash. Always use Windows PowerShell.

2. **TypeScript/ESLint Errors** (Pre-existing):
   - `src/lib/cache.ts`: Has `any` type and unused variable warnings
   - `src/lib/yahooFinance.ts`: Has multiple TypeScript/ESLint issues
   - These are Phase 2 files and will be addressed when implementing financial features

3. **Build Warnings**:
   - React Hooks exhaustive-deps warning in `src/app/journal/[id]/page.tsx`
   - Unescaped entity in `src/app/journal/new/page.tsx`
   - Empty interface in `src/components/ui/textarea.tsx`
   - Non-critical, will be cleaned up in future refactoring
