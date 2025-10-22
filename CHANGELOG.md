# Changelog

All notable changes to AI Trader Journal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Dashboard Homepage with Actionable Snapshot** (Issue #32, commit 4dab91f)
  - At-a-glance view of streak, recent entries, and insights
  - Quick entry button for frictionless journaling
  - Mobile-first card-based layout
  - Integration with streak tracking system
- **Floating Action Button (FAB)** (Issue #33, commit 3806ca4)
  - Global quick-add button for rapid entry creation
  - 56x56px touch target, fixed bottom-right position
  - One-tap access to new journal entry flow
  - Follows mobile-first design principles
- **Journaling Streak Tracking & Celebration System** (Issue #34, commits 5433768, ca6b4d7)
  - Current streak counter with grace day logic (allows 1 missed day)
  - Longest streak tracking for motivation
  - Total entries counter
  - Milestone celebrations at 3, 7, 14, 30, 60, 90, 180, 365 days
  - Settings model integration for persistent tracking
  - Error handling to prevent blocking entry creation
- **Financial Analysis Feature Planning & Research** (Issues #50-55)
  - Issue #50: Options Chain Integration - Infrastructure complete, data source research finished
    - TypeScript interfaces: OptionsContract, OptionsChain
    - Prisma schema updates: expirationDate, strikePrice, optionType, entry/exit prices, P/L tracking
    - API route structure: `/api/options/[ticker]?action=expirations|chain`
    - Caching strategy: 5-minute TTL for options data
    - Provider research: Python yfinance (free) vs Polygon.io ($99/mo) vs Alpha Vantage ($100-250/mo)
    - **Key finding:** `yahoo-finance2` (Node.js) does NOT support options data
    - **Recommended path:** Python yfinance microservice for MVP ($0-10/mo), migrate to Polygon.io for production
    - See `OPTIONS_DATA_PROVIDERS_RESEARCH.md` for full analysis
  - Issue #51: Greeks Calculation (Black-Scholes: Delta, Gamma, Theta, Vega)
  - Issue #52: Position Risk Metrics (max loss/profit/breakeven, strategy auto-detection)
  - Issue #53: DTE Tracking & Expiration Management (color-coded alerts, theta visibility)
  - Issue #54: IV vs HV Spread - Carry Indicator (SELL/BUY/NEUTRAL signals for vol sellers)
  - Issue #55: Current Position P/L (live mark-to-market, daily updates)
- **Real Yahoo Finance API Integration**
  - Replaced mock data system with `yahoo-finance2` npm package
  - Created `/src/lib/yahooFinance.ts` with real API integration
  - Created `/src/lib/cache.ts` with intelligent TTL-based caching system:
    - 1-hour cache during market hours (9:30 AM - 4:00 PM ET)
    - 24-hour cache outside market hours
    - Simple in-memory Map-based cache with automatic eviction
  - Created `/src/app/api/prices/route.ts` for client-side price data fetching
  - Real historical price data fetching with Yahoo Finance
  - Real ticker search with exchange and type filtering
  - Real quote data with market cap, volume, 52-week high/low
  - Comprehensive error handling with automatic fallback to mock data
  - Retry logic and stale data fallback on API failures
- Environment variable `USE_MOCK_DATA=true` to enable mock data for testing
- 7 specialized AI agents for domain-specific development:
  - AI/NLP Integration Specialist (sentiment analysis, LLM integration)
  - Voice & Media Processing Specialist (transcription, image handling)
  - Behavioral Analytics Engineer (statistical pattern detection)
  - Financial Data Integration Specialist (market data APIs, HV/IV calculations)
  - Mobile-First UX Specialist (30-second entry flows, touch optimization)
  - Trading Psychology & Product Advisor (behavioral feedback design)
  - Research Specialist (knowledge multiplier for all agents)
- Agent collaboration guide (`/.claude/agents/project/README.md`)
- GitHub issue creation script (`/scripts/update-github-issues.sh`)
- GitHub issue reference document (`/GITHUB_ISSUES_TO_CREATE.md`)
- CHANGELOG.md for tracking project changes
- **Options Data Provider Research Document** (`OPTIONS_DATA_PROVIDERS_RESEARCH.md`)
  - Comprehensive analysis of 7+ options data providers
  - Pricing comparison matrix (free vs paid tiers)
  - Technical implementation paths for yfinance microservice vs Polygon.io
  - Recommendations by use case (MVP, production, brokerage integration)
  - Decision framework for Issue #50 implementation

### Changed
- **Data Layer Architecture**: Refactored to support real API integration
  - Updated `/src/lib/data.ts` to use real Yahoo Finance API with mock fallback
  - Updated `/src/app/api/ticker/route.ts` to use real ticker search
  - Updated `/src/app/api/ticker/[symbol]/route.ts` to use real quote data
  - Refactored `/src/components/ui/HvCard.tsx` to fetch data via API route (prevents client-side Node.js module issues)
- **Caching Strategy**: Implemented smart caching based on market hours
  - Price data cached for 1 hour during trading hours, 24 hours otherwise
  - Ticker info cached for 24 hours
  - Search results cached for 1 hour
  - Automatic stale data fallback when API is unavailable
- **Product Strategy**: Refined mission to emphasize AI journal-first approach (80% AI journaling, 20% vol analysis)
- Updated `agent-os/product/mission.md` to focus on solving journaling friction and behavioral pattern recognition
- Restructured `agent-os/product/roadmap.md` with AI features marked as CRITICAL priority
- Reorganized MVP features into three categories:
  - Core Journal Features (Primary Value - 80%)
  - Market Data Foundation (Contextual Enrichment - 20%)
  - Supporting Features
- Moved options chain display, go/no-go precheck, and CSV import to Phase 2

### Fixed
- **Streak Tracking Error Handling** (commit ca6b4d7)
  - Added all required Settings fields (defaultRisk, accountSize, liquidityThreshold, ivThreshold) to upsert operations
  - Added try-catch error handling to prevent entry creation from failing if streak tracking errors occur
  - Return default values on error to ensure entry creation always succeeds
  - Log errors for debugging without blocking the user flow
- **Options Chain Integration Type Errors** (Issue #50)
  - Fixed TypeScript type assertion for yahoo-finance2 expirations array
  - Added proper type guards for options chain data transformation

### Deprecated
- Mock data system (now used only as fallback when `USE_MOCK_DATA=true` or when Yahoo Finance API fails)

### Closed Issues (Completed/Superseded)
- **Issue #34:** Journaling Streak Tracking & Celebration - ✅ Completed (commits 5433768, ca6b4d7)
- **Issue #4:** IV/HV Comparison Card - Superseded by Issue #54 (Carry Indicator with SELL/BUY signals)
- **Issue #5:** Options Chain Display - Superseded by Issue #50 (Full options chain integration)
- **Issue #6:** Risk-Based Position Sizing - Superseded by Issue #52 (Position risk metrics with strategy detection)
- **Issue #7:** Trade Entry & Snapshot - Superseded by Issues #50-55 (Comprehensive options trading features)

### Technical Notes
- Yahoo Finance free API has rate limits - aggressive caching implemented to minimize API calls
- `yahoo-finance2` package uses Deno shims which require Node.js modules, so it must only be used server-side
- TypeScript type conflicts in `yahoo-finance2` resolved with `@ts-expect-error` annotations and interface casting
- Build process validates TypeScript and ESLint successfully

---

## [0.1.0] - 2025-01-XX (Pre-MVP)

### Added
- Initial project setup with Next.js 14 (App Router)
- TypeScript configuration with path aliases (`@/*`)
- Tailwind CSS with shadcn/ui component library
- Prisma ORM with PostgreSQL database schema:
  - Trade model (core trade data)
  - Snapshot model (market state at entry)
  - Note model (journal notes)
  - Tag model (categorization)
  - Settings model (user preferences)
- Historical Volatility (HV) calculation system:
  - HV20 and HV30 calculations using close-to-close log returns
  - Validation for minimum data points
  - Annualized returns (252 trading days)
- Implied Volatility (IV) system:
  - Manual entry with validation (0.1% - 400% range)
  - Decimal storage, percentage display
  - IV persistence to database
- Mock data system for development:
  - Ticker search mock (`/src/lib/data.ts`)
  - Price fetching mock
  - Realistic price movements by ticker
- UI Components:
  - TickerEntry component (search and selection)
  - HvCard component (HV20/HV30 display)
  - ManualIvForm component (IV entry with validation)
  - IvBadge component (IV/HV comparison indicator)
- API Routes:
  - `GET /api/ticker?q={query}` - Ticker search
  - `GET /api/ticker/[symbol]` - Ticker details
  - `POST /api/iv/manual` - Persist IV data
- Utility libraries:
  - Logger system (`/src/lib/logger.ts`) with conditional debug logging
  - Prisma client singleton (`/src/lib/prisma.ts`)
  - HV calculations (`/src/lib/hv.ts`)
  - IV utilities (`/src/lib/iv.ts`)
  - IV persistence (`/src/lib/persistIV.ts`)
- AgentOS integration:
  - Product planning agents (spec-initializer, product-planner, etc.)
  - Development agents (api-engineer, ui-designer, database-engineer, etc.)
  - Verification agents (implementation-verifier, frontend-verifier, etc.)
  - Product documentation (`/agent-os/product/`)
  - Coding standards (`/agent-os/standards/`)
- Development tooling:
  - ESLint configuration
  - Prettier configuration
  - Jest testing setup
  - TypeScript strict mode
- Documentation:
  - README.md with project overview
  - CLAUDE.md with development guidance
  - Tech stack documentation (`/agent-os/product/tech-stack.md`)

### Fixed
- Prisma client singleton pattern to prevent multiple instances in development

---

## Guidelines for Updating This Changelog

### When to Update
- **Before committing**: Add entries to `[Unreleased]` section as you make changes
- **Before releases**: Move `[Unreleased]` items to a new version section
- **After completing issues**: Document what was added/changed

### Categories

**Added** - New features, components, files, or capabilities
```markdown
- Voice note recording and transcription (Issue #11)
- AI sentiment analysis engine (Issue #12)
- Weekly insights dashboard (Issue #13)
```

**Changed** - Changes to existing functionality
```markdown
- Improved ticker search performance (reduced latency from 500ms to 100ms)
- Updated IV/HV card to show interpretation text
- Refactored HV calculation for better error handling
```

**Deprecated** - Features that will be removed in future versions
```markdown
- Mock data system (will be replaced with real API in v0.2.0)
```

**Removed** - Features that have been removed
```markdown
- Removed legacy CSV export format
- Removed unused Chart.js dependency
```

**Fixed** - Bug fixes
```markdown
- Fixed HV calculation error when price data has gaps
- Fixed IV validation allowing values over 400%
- Fixed mobile layout overflow on small screens
```

**Security** - Security-related changes
```markdown
- Updated dependencies to patch security vulnerabilities
- Added rate limiting to API endpoints
- Improved input validation for SQL injection prevention
```

### Format Example

```markdown
## [0.2.0] - 2025-02-15

### Added
- Quick Journal Entry System (Issue #11)
  - Text entry with auto-save drafts
  - Voice note recording via Whisper API
  - Screenshot upload with compression
  - One-tap mood and conviction tagging
  - Entry types: Trade Ideas, Actual Trades, Reflections
- AI Text Analysis Engine (Issue #12)
  - OpenAI GPT-4 integration for sentiment analysis
  - Emotional keyword detection (FOMO, nervous, confident, etc.)
  - Conviction level inference from language
  - Auto-tagging based on content
  - Async processing to avoid blocking UI

### Changed
- Replaced mock data with yfinance API for real market data
- Optimized HV calculation performance (3x faster)
- Redesigned ticker search with autocomplete

### Fixed
- Fixed IV persistence error on trade save
- Fixed mobile keyboard covering input fields
- Fixed HV calculation failing for tickers with splits

### Security
- Added authentication via NextAuth.js
- Implemented rate limiting on API endpoints
```

---

## Version History

- **[Unreleased]** - Specialized agents, refined product strategy
- **[0.1.0]** - Initial setup, mock data system, HV/IV calculations, database schema
