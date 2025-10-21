# Changelog

All notable changes to AI Trader Journal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
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

### Changed
- **Product Strategy**: Refined mission to emphasize AI journal-first approach (80% AI journaling, 20% vol analysis)
- Updated `agent-os/product/mission.md` to focus on solving journaling friction and behavioral pattern recognition
- Restructured `agent-os/product/roadmap.md` with AI features marked as CRITICAL priority
- Reorganized MVP features into three categories:
  - Core Journal Features (Primary Value - 80%)
  - Market Data Foundation (Contextual Enrichment - 20%)
  - Supporting Features
- Moved options chain display, go/no-go precheck, and CSV import to Phase 2

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
