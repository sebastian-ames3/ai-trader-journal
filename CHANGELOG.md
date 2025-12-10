# Changelog

All notable changes to AI Trader Journal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- **Mood Selector Touch Targets** (2025-12-10)
  - Added explicit min-width/min-height constraints to ensure WCAG 2.1 AA compliance (44x44px minimum)
  - Touch targets now guaranteed: compact variant 64×80px, expanded variant 56×64px

### Added
- **Spec 06 Phase 2 - Trade Logging Features** (2025-12-10, PR #82)
  - Enhanced trade logging form with full fields
    - Action type selector (INITIAL, ADD, REDUCE, ROLL, CONVERT, CLOSE, ASSIGNED, EXERCISED)
    - Strategy type dropdown (18 options strategies)
    - Description with voice recording support
    - Debit/Credit and quantity inputs
    - Expiration date picker
    - Reasoning note textarea
    - File attachment upload UI
  - Trade timeline component (`TradeTimeline.tsx`)
    - Visual timeline with action-specific icons and colors
    - Shows trade details, P/L, quantity, timestamps
    - Displays reasoning notes and attachment counts
    - Oldest-to-newest chronological ordering
  - Voice recording integration for trade descriptions
    - Reuses existing `VoiceRecorder` component
    - Transcription fills description field
  - Updated thesis detail page to use timeline component
  - New dedicated `/theses/[id]/log-trade` page for logging trades

- **Spec 11 Playwright Verification** (2025-12-10)
  - All 6 micro-interaction and accessibility features verified via Playwright
  - Screenshots and verification reports saved to `agent-os/specs/11-ux-ui-design-system/verification/`
  - WCAG 2.1 AA compliance confirmed
  - Spec 11: UX/UI Design System now 100% complete

- **Accessibility Improvements - WCAG 2.1 AA** (2025-12-10, PR #80)
  - Skip-to-content link for keyboard navigation
    - Hidden by default, visible on focus (Tab key)
    - Jumps directly to main content area
  - Enhanced focus-visible indicators globally
    - Amber ring with offset for all focusable elements
    - Only shows on keyboard navigation, not mouse clicks
  - Emoji accessibility improvements
    - Added role="img" and aria-label to decorative emojis
    - StreakCard fire/sparkle emojis now accessible to screen readers

- **Micro-Interactions & Animations** (2025-12-09, PR #79)
  - Page transition animations with framer-motion fade/slide
    - Created `template.tsx` for smooth route transitions
    - Respects `prefers-reduced-motion` accessibility setting
  - Button ripple effects on tap for tactile feedback
    - CSS-based ripple animation
    - Applied to all Button components
  - Success animations for positive feedback
    - `SuccessCheckmark` component with animated SVG checkmark
    - `Confetti` component with celebration particles
    - `useStreakConfetti` hook for milestone celebrations
    - Integrated into StreakCard for streak milestones
  - Pull-to-refresh gesture on mobile
    - `PullToRefresh` component with touch handling
    - Visual rotation indicator with refresh icon
    - Integrated into journal page
    - Disabled during loading states

- **Performance Optimization** (2025-12-09, PR #78)
  - Lighthouse audit and performance baseline documentation
  - React.memo optimization for list items (EntryCard, ThesisCard)
  - Bundle analyzer setup (@next/bundle-analyzer)
  - Virtual scrolling for long lists (react-window)

- **Thesis-Based Trade Management** (2025-12-09, PR #76)
  - Create trading theses with name, ticker, direction (Bullish/Bearish/Neutral/Volatile)
  - Track trades under each thesis (INITIAL, ADD, REDUCE, ROLL, CONVERT, CLOSE, etc.)
  - Real-time P/L aggregation (Realized P/L, Capital Deployed, ROC)
  - Thesis updates with type indicators (Strengthened, Weakened, Changed, Note)
  - Close thesis workflow with outcome (WIN/LOSS/BREAKEVEN) and lessons learned
  - Active Theses section on dashboard homepage
  - 18 integration tests for full API coverage

- **Implementation Tracking** (2025-12-09)
  - Added IMPLEMENTATION-TODO.md for tracking incomplete features across all specs
  - Comprehensive audit of PRDs vs implemented features

- **Phase 2 Engagement & Capture Features** (2025-12-09, PRs #65-68)
  - **Frictionless Capture System (PR #65):**
    - Voice recording infrastructure with MediaRecorder API
    - Quick capture mode with minimal UI (no required fields)
    - Auto-inference using GPT-5 Nano (mood, type, ticker detection)
    - Media storage foundation for voice memos and screenshots
  - **Proactive Engagement System (PR #66):**
    - Market condition monitoring (SPY ±2%, VIX >25 triggers)
    - Journal silence detection (7+ days without entries)
    - In-app notification banners for market alerts
    - Trade idea follow-up reminders
  - **Pattern Recognition Engine (PR #67):**
    - Bias frequency analysis across entries
    - Market condition correlation (behavior during drawdowns)
    - Behavioral pattern detection and surfacing
    - Pattern breaking recognition ("You journaled during a correction!")
  - **Context Surfacing System (PR #68):**
    - Automatic ticker detection from entry content
    - Ticker context panel (price, historical entries)
    - Strategy insight integration
    - Historical entry context surfacing

- **Phase 3 Product Specifications** (specs/ folder)
  - `specs/05-phase1-polish.md` - Guided Entry Mode, PWA, Performance
  - `specs/06-trade-management.md` - Thesis-based trade management (journal-first approach)
  - `specs/07-ai-coach.md` - Conversational AI trading coach
  - `specs/08-social-sharing.md` - Mentor/accountability sharing features
  - `specs/09-custom-dashboard.md` - Drag-and-drop widget dashboard
  - `specs/10-mobile-deployment.md` - PWA enhancement, Capacitor, App Store
  - `specs/11-ux-ui-design-system.md` - Modern mobile-first UI overhaul

- **UX/UI Design System Planning** (Phase 1B)
  - Design inspiration from Day One, Reflectly, 5 Minute Journal
  - Dark-first theme with amber accents (#0D0D0D, #F5A623)
  - Bottom navigation with center FAB pattern
  - Glassmorphism cards (20px radius, soft shadows)
  - Micro-interactions and celebration animations
  - Calendar week strip navigation

### Changed
- **Codebase Cleanup for Production Readiness** (2025-12-09, commit 9f7b1f3)
  - Removed unused code and legacy files
  - Improved code organization
  - Production build optimizations

- **Architecture Decision: Journal-First Trade Management**
  - Removed over-engineered options analytics (Black-Scholes, Greeks engine, P/L curves)
  - Added thesis-based trade grouping (user defines relationships)
  - Screenshot data extraction via GPT-4o-mini vision
  - Pattern learning from user's own historical data
  - AI reminders of past lessons when entering similar trades

- **Strategic Product Pivot - Motivation Gap Solution** (2025-12-05)
  - **Core Problem:** Traders stop journaling exactly when it would help most (drawdowns, emotional disengagement)
  - **New Value Prop:** "The journal that reaches out when you need it most and shows you patterns you can't see"
  - **Solution - Multi-Pronged Approach:**
    1. Reduce Friction: Voice memos, screenshots, quick capture (no required fields)
    2. Proactive Engagement: Reach out during difficult market periods
    3. Pattern Recognition: Surface behavioral insights over time
    4. Context Surfacing: Auto-fetch relevant market data and history
  - **Competitive Positioning:**
    - NOT competing on: real-time data quality, execution speed, market scanning
    - Competing on: Frictionless capture, proactive engagement, pattern recognition, historical context
  - **The Moat (Hard to Replicate):**
    - Proactive Engagement Engine: Reaching out during market stress, not passive recording
    - Behavioral Pattern Database: Learning user-specific patterns over months
    - Context-Aware Insights: Surfacing relevant past entries at the right moment
    - Multi-Modal Capture: Voice + screenshots + text with unified AI analysis
  - **New Phase 2 Features (see specs/ folder):**
    - Feature 1: Frictionless Capture (~$0.35/month) - Voice, screenshots, quick capture
    - Feature 2: Proactive Engagement (~$0.04/month) - Market alerts, check-ins
    - Feature 3: Pattern Recognition (~$0.12/month) - Behavioral patterns
    - Feature 4: Context Surfacing (~$0.06/month) - Ticker context, history
  - **LLM Architecture Decision: Single Provider (OpenAI GPT-5 Family)**
    - Rationale: One SDK, one API key, one bill, better UX than multi-provider
    - GPT-5 Nano ($0.05/$0.40): Entry analysis, quick inference
    - GPT-5 Mini ($0.25/$2.00): Vision/screenshots
    - GPT-5 ($1.25/$10.00): Weekly insights, pattern analysis
    - Whisper ($0.006/min): Voice transcription
    - text-embedding-3-small ($0.02): Semantic similarity
    - **Total estimated cost: ~$0.57/month**
  - Updated `CLAUDE.md` with new product direction
  - Updated `README.md` with current features and roadmap
  - Created Phase 2 PRDs in `specs/` folder
  - Supersedes previous "complex strategy intelligence" pivot (2025-10-24)

### Added
- **Phase 2 Product Specifications** (specs/ folder)
  - `specs/README.md` - Architecture decision overview
  - `specs/01-frictionless-capture.md` - Voice memos, screenshots, quick capture
  - `specs/02-proactive-engagement.md` - Market-triggered notifications
  - `specs/03-pattern-recognition.md` - Behavioral pattern detection
  - `specs/04-context-surfacing.md` - Ticker context, historical entries
  - `specs/TASKS.md` - Complete implementation task list with code examples

### Deprecated
- Previous "complex strategy intelligence" moat approach (moved to Phase 3)
- Multi-provider LLM architecture (replaced with single-provider OpenAI)

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
