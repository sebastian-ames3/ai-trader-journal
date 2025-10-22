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
  confidence: number,             // 0-1 confidence score
  aiTags: string[]                // Auto-generated tags from taxonomy (3-7 tags)
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

### Auto-Tagging System (Issue #22 - Implemented)

Automatically generates relevant tags for journal entries using AI analysis to improve searchability and pattern recognition:

**Tag Taxonomy (53 tags across 6 categories):**

1. **Trade Type/Strategy (13 tags)**
   - `long-call`, `long-put`, `options`, `spreads`, `covered-call`, `cash-secured-put`
   - `vertical-spread`, `iron-condor`, `iron-butterfly`, `straddle`, `strangle`
   - `wheel-strategy`, `earnings-play`

2. **Market View (8 tags)**
   - `bullish`, `bearish`, `neutral`, `high-volatility`, `low-volatility`
   - `trending`, `range-bound`, `uncertain-market`

3. **Entry Catalyst (10 tags)**
   - `technical-analysis`, `chart-pattern`, `support-resistance`, `moving-average`
   - `fundamental-analysis`, `news-catalyst`, `earnings`, `sector-rotation`
   - `market-correlation`, `indicator-signal`

4. **Psychological State (12 tags)**
   - `disciplined`, `patient`, `well-researched`, `emotional`, `rushed`
   - `impulse-trade`, `overthinking`, `stressed`, `focused`, `distracted`
   - `confident-execution`, `hesitant`

5. **Risk Assessment (8 tags)**
   - `defined-risk`, `undefined-risk`, `position-sized`, `stop-loss-planned`
   - `profit-target-set`, `risk-reward-favorable`, `hedged`, `concentrated-position`

6. **Outcome Context (5 tags)**
   - `learning-experience`, `mistake-identified`, `good-process`, `bad-process`, `needs-review`

**How It Works:**
- AI analyzes entry content and generates 3-7 relevant tags from the taxonomy
- Tags are stored in the `aiTags` field (string array)
- Tags update automatically when entry is analyzed or re-analyzed
- Enhances search/filter capabilities and pattern recognition

**API Integration:**
- Tags are automatically generated by `analyzeEntryText()` and `batchAnalyzeEntries()`
- No separate API endpoint needed - tags included in analysis response
- Filter entries by tags: `GET /api/entries?tag=bullish,long-call`

**UI Features:**
- Tags displayed in journal entry cards with blue badges
- Multi-select tag filter in search interface
- URL-shareable filtered views

**Test Coverage:**
- 7 integration tests covering tag generation, persistence, and filtering
- Test suite: `tests/auto-tagging.test.ts`
- Run with: `npm run test:tags` (requires dev server + OPENAI_API_KEY)

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
    - `tag` - Filter by AI-generated tags (comma-separated, supports multiple)
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
8. **AI Tags**: Multi-select from 53 auto-generated tags (new!)
9. **Date Range**: Filter by creation date (dateFrom/dateTo)
10. **Pagination**: Limit and offset for result sets

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

## Common Pitfalls & Warnings

### Database Connections
**❌ BAD:** Running tests from WSL bash
```bash
# This WILL FAIL - database connections timeout in WSL
npm run test:all
```

**✅ GOOD:** Always use Windows PowerShell for dev server and tests
```powershell
# This works - PowerShell has proper network access to Supabase
npm run dev
npm run test:all
```

### Testing Workflow
**❌ BAD:** Running integration tests without dev server
```powershell
npm run test:all  # Tests will fail - API endpoints not available
```

**✅ GOOD:** Start dev server first, then run tests
```powershell
# Terminal 1 (PowerShell)
npm run dev

# Terminal 2 (PowerShell)
npm run test:all
```

### AI Analysis
**❌ BAD:** Calling AI endpoints without API key
```typescript
// Will fail with authentication error
const result = await analyzeEntryText(content);
```

**✅ GOOD:** Verify `.env` has OPENAI_API_KEY before AI operations
```bash
# Check .env file contains:
OPENAI_API_KEY=sk-proj-...
```

### Environment Files
**❌ BAD:** Committing `.env` file to git
```bash
git add .env  # NEVER DO THIS - contains secrets
```

**✅ GOOD:** Use `.env.example` as template, keep `.env` local
```bash
cp .env.example .env  # Create local copy
# Edit .env with actual values
# .env is already in .gitignore
```

### Prisma Schema Changes
**❌ BAD:** Pushing schema changes without migration in production
```bash
npm run db:push  # No migration history, risky for production
```

**✅ GOOD:** Use migrations for production-ready changes
```bash
npx prisma migrate dev --name add_new_field
npx prisma migrate deploy  # For production
```

## Code Style Guidelines

### API Route Pattern
**✅ GOOD:** Validate inputs first, single responsibility, clear error handling
```typescript
// src/app/api/entries/route.ts
export async function GET(request: NextRequest) {
  // 1. Parse and validate inputs
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  // 2. Build query
  const entries = await prisma.entry.findMany({
    where: buildWhereClause(searchParams),
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  // 3. Return structured response
  return NextResponse.json({ entries, pagination: { limit, total } });
}
```

**❌ AVOID:** Mixing validation, business logic, and response formatting
```typescript
// Don't do everything in one block without structure
export async function GET(request: NextRequest) {
  const entries = await prisma.entry.findMany({
    where: {
      content: {
        contains: new URL(request.url).searchParams.get('search') || undefined
      }
    }
  });
  return NextResponse.json(entries);
}
```

### Component Organization
**✅ GOOD:** Props interface, early returns, clear sections
```typescript
interface SearchFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  initialFilters?: FilterState;
}

export function SearchFilters({ onFilterChange, initialFilters }: SearchFiltersProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters || {});

  // Early return for loading state
  if (isLoading) return <Skeleton />;

  // Event handlers
  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  // Render
  return (
    <div className="space-y-4">
      {/* Component JSX */}
    </div>
  );
}
```

### Error Handling
**✅ GOOD:** Specific error messages, proper HTTP status codes
```typescript
if (!entryId || typeof entryId !== 'string') {
  return NextResponse.json(
    { error: 'Invalid entry ID format' },
    { status: 400 }
  );
}

try {
  const entry = await prisma.entry.findUnique({ where: { id: entryId } });
  if (!entry) {
    return NextResponse.json(
      { error: 'Entry not found' },
      { status: 404 }
    );
  }
} catch (error) {
  console.error('Database error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

### Type Safety
**✅ GOOD:** Use proper TypeScript types, avoid `any`
```typescript
import { Entry, EntryType, Mood } from '@prisma/client';

interface CreateEntryData {
  content: string;
  type: EntryType;
  mood?: Mood;
  ticker?: string;
}
```

**❌ AVOID:** Using `any` or loose typing
```typescript
function processEntry(data: any) {  // Avoid this
  // Type safety lost
}
```

## Context Management

### When to Use `/clear`
Clear the conversation context in these situations:
- After completing a major feature (3+ files changed, tests passing)
- When switching between unrelated tasks (e.g., UI work → database migrations)
- After 50+ message exchanges in a single session
- When responses become less focused or reference outdated context
- Before starting a new feature branch

### File Reference Best Practices
- **Use tab-completion** for exact file paths to avoid typos
- **Reference specific line numbers** when discussing bugs or changes
  - Example: "The issue is in `src/lib/aiAnalysis.ts:142`"
- **Provide full error messages** - don't truncate stack traces
- **Include relevant context** - show surrounding code when debugging

### Effective Prompting
**✅ GOOD:** Specific, actionable requests with context
```
"Add a new filter to the SearchFilters component for filtering by date range.
The filter should use shadcn/ui DatePicker components and update the URL
query parameters like the existing filters. Follow the pattern used for the
mood filter."
```

**❌ AVOID:** Vague requests without context
```
"Add a date filter"
```

## Git Worktrees for Parallel Development

This project has git worktrees configured for parallel Claude Code workflows:

### Available Worktrees
```bash
# List all worktrees
git worktree list

# Current setup:
# /mnt/c/.../ai-trader-journal         [main]           - Main development
# /mnt/c/.../ai-trader-journal-dev1    [wip/parallel-dev-1] - Parallel feature work
# /mnt/c/.../ai-trader-journal-dev2    [wip/parallel-dev-2] - Another parallel feature
# /mnt/c/.../ai-trader-journal-review  [wip/review]     - Code review & verification
```

### Use Cases

**Parallel Feature Development:**
```bash
# Terminal 1: Claude instance working on feature A
cd /mnt/c/.../ai-trader-journal-dev1
git checkout -b feat/new-export-feature
# Develop feature A

# Terminal 2: Claude instance working on feature B
cd /mnt/c/.../ai-trader-journal-dev2
git checkout -b feat/notification-system
# Develop feature B simultaneously
```

**Implementation + Verification:**
```bash
# Terminal 1: Claude implementing feature
cd /mnt/c/.../ai-trader-journal-dev1
# Write code, run tests

# Terminal 2: Different Claude instance reviewing
cd /mnt/c/.../ai-trader-journal-review
git fetch
git checkout feat/new-export-feature
# Review code, verify tests, check for issues
```

### Creating New Worktrees
```bash
# Create worktree for a new feature branch
git worktree add -b feat/your-feature ../ai-trader-journal-feat main

# Remove worktree when done
git worktree remove ../ai-trader-journal-feat
git branch -d feat/your-feature  # Delete branch if merged
```

### Worktree Best Practices
- Each worktree can run its own dev server on different ports
- Keep worktrees focused on specific tasks
- Clean up merged branches with `git worktree prune`
- Don't check out the same branch in multiple worktrees

## Model Context Protocol (MCP) Integration

This project uses MCP servers to enhance Claude Code's capabilities with specialized tools.

### Available MCP Servers

Configuration is stored in `.mcp.json` at the project root.

#### 1. Playwright MCP - UI Testing & Visual Verification
**Purpose:** Browser automation for testing and verifying UI implementations

**Capabilities:**
- Take screenshots of the running application
- Interact with UI elements (click, type, fill forms)
- Navigate between pages and test user workflows
- Verify responsive design at different viewport sizes
- Debug visual issues by seeing what users see
- Test JavaScript functionality in the browser
- Capture console logs and network requests

**Common Use Cases:**
```typescript
// Example: Verify journal entry form
1. Navigate to localhost:3000/journal/new
2. Take screenshot to verify layout
3. Fill form fields with test data
4. Click submit button
5. Verify entry appears in journal list
6. Take screenshot of result
```

**When to Use:**
- Implementing new UI components
- Verifying mobile responsiveness
- Testing user workflows end-to-end
- Debugging visual rendering issues
- Validating form behavior and validation

#### 2. Git MCP - Enhanced Repository Operations
**Purpose:** Advanced git operations beyond basic CLI commands

**Capabilities:**
- Search git history for specific changes
- Analyze commit patterns and authorship
- Run git blame to find when code was introduced
- Query repository structure and branch relationships
- Find all commits touching specific files
- Analyze code evolution over time

**Common Use Cases:**
- "When was the Entry model last modified?"
- "Who introduced the AI analysis feature?"
- "Show all commits related to authentication"
- "Find commits that modified API routes"

**When to Use:**
- Understanding code history and evolution
- Finding when bugs were introduced
- Analyzing feature development timeline
- Code archaeology and debugging

#### 3. PostgreSQL MCP - Direct Database Access
**Purpose:** Query and inspect Supabase PostgreSQL database directly

**Capabilities:**
- Run SELECT queries to inspect data
- Analyze table structure and relationships
- Check indexes and query performance
- Validate data integrity
- Export data for analysis
- Inspect schema without Prisma

**Common Use Cases:**
```sql
-- Check how many entries have AI analysis
SELECT
  COUNT(*) as total,
  COUNT(sentiment) as analyzed
FROM "Entry";

-- Find most common biases
SELECT
  bias,
  COUNT(*) as frequency
FROM "Entry",
  unnest("detectedBiases") as bias
GROUP BY bias
ORDER BY frequency DESC;

-- Analyze weekly entry volume
SELECT
  DATE_TRUNC('week', "createdAt") as week,
  COUNT(*) as entries
FROM "Entry"
GROUP BY week
ORDER BY week DESC;
```

**When to Use:**
- Debugging data issues
- Analyzing usage patterns
- Validating migrations
- Performance optimization
- Data exploration and insights

**Security Note:**
- Requires `SUPABASE_PASSWORD` environment variable in `.env`
- Uses connection pooling (pgbouncer) on port 6543
- Read-only queries recommended for safety
- Be cautious with UPDATE/DELETE operations

### MCP Configuration

**Environment Variables Required:**
```bash
# .env file
SUPABASE_PASSWORD=your_supabase_password  # For postgres MCP
```

**Testing MCP Servers:**
After adding `.mcp.json`, restart Claude Code to load the MCP servers. You can verify they're working by:
- Playwright: Request a screenshot of the app
- Git: Ask about commit history
- PostgreSQL: Request a database query

**Troubleshooting:**
- If MCP servers fail to start, check `.env` file has required variables
- Ensure `npx` is available and npm packages can be installed
- For Playwright: May need to run `npx playwright install` once
- For PostgreSQL: Verify `DATABASE_URL` is correct in `.env`

### MCP Best Practices

**When to Use MCP vs Direct Tools:**
- **Use Playwright MCP** when you need to verify UI visually or test user interactions
- **Use Git MCP** for complex history queries that would be tedious with `git log`
- **Use PostgreSQL MCP** for ad-hoc queries and data exploration (prefer Prisma for app code)

**Performance Considerations:**
- Playwright can be slow for screenshots - use sparingly
- PostgreSQL queries run against production-like environment - be mindful of query complexity
- Git MCP caches repository data - much faster than repeated git commands

**Safety Guidelines:**
- Never commit MCP server credentials to git
- Use environment variables for sensitive data
- Prefer read-only database operations
- Test Playwright workflows in development, not production

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
  - Multi-filter support (type, ticker, mood, conviction, sentiment, biases, AI tags, date range)
  - Collapsible advanced filters panel with shadcn/ui components
  - URL query parameter integration for shareable filtered views
  - Pagination support (limit/offset)
  - AI analysis badges in entry cards
  - Comprehensive test suite (18 tests)

- ✅ **Auto-Tagging System** (Issue #22)
  - AI-powered tag generation from 53-tag taxonomy
  - 6 categories: Strategy, Market View, Catalyst, Psychology, Risk, Outcome
  - 3-7 tags auto-generated per entry analysis
  - Multi-select tag filtering in search UI
  - Comprehensive test suite (7 tests)

**In Progress:**
- None (ready for next feature)

**Pending Phase 1:**
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
- Auto-Tagging: 7 tests covering tag generation, persistence, filtering, taxonomy validation

**Running Tests:**
```powershell
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run tests
npm run test:all        # Run all integration tests (requires OPENAI_API_KEY)
npm run test:api        # Entry API tests
npm run test:ai         # AI analysis tests (requires OPENAI_API_KEY)
npm run test:insights   # Weekly insights tests
npm run test:search     # Search & filter tests
npm run test:tags       # Auto-tagging tests (requires OPENAI_API_KEY)
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
