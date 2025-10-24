# Changelog

All notable changes to AI Trader Journal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **Strategic Product Pivot - Competitive Moat Refined** (2025-10-24)
  - **Target User:** Professional options traders with existing professional data feeds (ThinkorSwim, TastyTrade, 12+ screens)
  - **Core Value Prop:** "The only journal that understands how you actually trade options"
  - **Competitive Positioning:**
    - NOT competing on real-time data quality (users already have this)
    - NOT competing on execution speed (they use professional brokers)
    - Competing on: Complex strategy intelligence, adjustment tracking, multi-leg P/L attribution
  - **The Moat (Hard to Replicate):**
    - Strategy Detection Engine: Recognizing 100+ multi-leg structures (iron condors → butterflies)
    - Position Continuity: Tracking positions as they evolve through adjustments
    - Options-Specific Psychology: AI training on complex strategy decision patterns
    - Multi-Leg Attribution: P/L breakdown by leg, Greeks, IV crush, theta decay
  - **Data Provider Decision: yfinance Python microservice** (NOT Polygon.io $99/month)
    - Rationale: Users have real-time data; app is for post-trade reflection (15-20 min delay acceptable)
    - Cost: $5-10/month vs $99/month Polygon.io
    - Focus budget on strategy intelligence, not data quality
  - **New Phase 2 Priorities:**
    - Priority 1 (THE MOAT): Multi-leg position tracking, P/L attribution, strategy-specific psychology
    - Priority 2: Position risk metrics, Greeks calculation, DTE tracking
    - Priority 3: UX enhancements (voice notes, visualizations, etc.)
  - **Issue Reprioritization:**
    - Issue #52 (Position Risk Metrics): Elevated to HIGH priority
    - Issue #54 (IV vs HV Spread): Deprioritized (users have this data)
    - Issue #51 (Greeks): Black-Scholes sufficient (not market Greeks)
    - New issues TBD: Multi-leg entry, strategy detection, adjustment tracking, P/L attribution
  - Updated `CLAUDE.md` with Product Strategy & Competitive Moat section

### Added
- **PWA Manifest & Offline-First Support** (Issue #36)
  - Progressive Web App manifest for installable app experience
    - App name, icons, theme colors, standalone display mode
    - iOS-specific metadata for Add to Home Screen
    - App shortcuts for quick entry creation
  - Service Worker with intelligent caching strategies
    - Static assets: Cache-first (HTML, CSS, JS, images)
    - API responses: Network-first with 10s timeout
    - Entry data: Network-first with 5-minute cache fallback
    - Font assets: Stale-while-revalidate strategy
  - Offline entry creation with IndexedDB queue
    - `offlineQueue.ts`: Dexie.js-based queue management
    - Auto-sync when connection restored
    - Retry logic with max 3 attempts per entry
    - Background sync API integration
  - Offline indicator component
    - Real-time online/offline status monitoring
    - Queued entries counter
    - Sync progress feedback
    - Toast notifications on sync complete/failure
  - Add to Home Screen prompt
    - Triggers after 3 visits or 1 week of use
    - Native install prompt on Android/Chrome
    - iOS-specific installation instructions
    - Dismissible with localStorage persistence
  - Custom hooks: `useOfflineEntry` for offline-aware entry creation
  - Icon generation system with sharp (192x192, 512x512 PNG)
  - PWA configuration in `next.config.mjs` with Workbox runtime caching
  - Mobile-first with WCAG 2.1 AA compliance
- **Empty States & First-Time User Onboarding** (Issue #38)
  - Insights page empty state when < 3 entries this week
    - Encouraging message with progress indicator
    - "Create Entry" and "Go to Journal" CTAs
    - Only shows on current week view
  - Journal page differentiated empty states
    - "No entries yet" state for first-time users
    - "No entries found" state for search/filter results
    - "Clear All Filters" button to reset search
  - First-time tips system with dismissible tooltips
    - Tip 1 (after 1st entry): Journal timing best practice
    - Tip 2 (after 2nd entry): AI analysis explanation
    - Tip 3 (after 5th entry): Weekly insights reminder
    - Persists dismissal state to localStorage
    - Smooth fade-in animation with blue-purple gradient
    - 44x44px touch targets on dismiss button
  - New components: `OnboardingTip.tsx`, `useOnboardingTips.ts` hook
  - WCAG 2.1 AA compliant with proper ARIA labels and roles
  - Mobile-first design with all touch targets ≥44px
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
- **Polygon.io Options Data Pipeline** (Issue #50, PR #60)
  - Replaced non-working yahoo-finance2 options integration with Polygon.io OPRA data
  - Installed `@polygon.io/client-js` SDK for official market data access
  - Created `/src/lib/polygonClient.ts` with optimized API architecture:
    - `getOptionsExpirations()` - Fetch expiration dates (1 API call, 1hr cache)
    - `getOptionsChain()` - Fetch contract metadata without pricing (2 API calls, 5min cache)
    - `getContractSnapshot()` - Fetch detailed pricing/Greeks for specific strikes (1 API call, 1min cache)
  - API Endpoints:
    - `GET /api/options/[ticker]` - List expirations for ticker
    - `GET /api/options/[ticker]?action=chain&expiration=YYYY-MM-DD` - Get options chain (required expiration)
    - `GET /api/options/[ticker]?action=chain&expiration=YYYY-MM-DD&minStrike=X&maxStrike=Y` - Filtered chain
    - `GET /api/options/contract/[symbol]` - Individual contract details with Greeks (e.g., O:AAPL251121C00170000)
  - **API Efficiency:** User-directed fetching (2-4 calls per trade entry) vs naive approach (40+ calls)
  - **Free Tier Compatible:** 5 calls/minute = 1 trade entry per minute
  - **Data Included:** Strike, bid/ask/last, volume, OI, IV, Greeks (Delta/Gamma/Theta/Vega), ITM status
  - Real-time OPRA data from all 17 US options exchanges
  - Strike range filtering support for efficient data fetching
  - See `OPTIONS_DATA_PROVIDERS_RESEARCH.md` for provider comparison analysis
- **Financial Analysis Feature Planning & Research** (Issues #51-55)
  - Issue #51: Greeks Calculation (use Polygon's provided Greeks)
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
- **Polygon.io SDK API Usage** (Issue #50 hotfix, commit 860ac0d)
  - Fixed incorrect SDK method calls in `src/lib/polygonClient.ts`
  - Corrected to use direct methods: `polygon.listOptionsContracts()`, `polygon.getSnapshots()`
  - Added API key validation to prevent undefined errors
  - Resolved TypeScript compilation errors
- **Prisma Import Error** (Issue #38)
  - Fixed `src/lib/streakTracking.ts` default import error
  - Changed to named import: `import { prisma } from './prisma'`
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
- **Issue #50:** Options Chain Integration & Data Pipeline - ✅ Completed (PR #60, commit 860ac0d)
- **Issue #34:** Journaling Streak Tracking & Celebration - ✅ Completed (commits 5433768, ca6b4d7)
- **Issue #4:** IV/HV Comparison Card - Superseded by Issue #54 (Carry Indicator with SELL/BUY signals)
- **Issue #5:** Options Chain Display - Superseded by Issue #50 (Full options chain integration)
- **Issue #6:** Risk-Based Position Sizing - Superseded by Issue #52 (Position risk metrics with strategy detection)
- **Issue #7:** Trade Entry & Snapshot - Superseded by Issues #50-55 (Comprehensive options trading features)

### Technical Notes
- **Polygon.io Integration:**
  - Free tier: 5 API calls/minute (sufficient for testing and MVP)
  - Paid tier ($99/mo Options Starter): Unlimited calls with real-time data
  - SDK uses direct method calls (not nested APIs like `.reference.optionsContracts()`)
  - Requires `POLYGON_API_KEY` environment variable
  - User-directed fetching architecture prevents rate limit issues (2-4 calls per trade vs 40+ naive approach)
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
