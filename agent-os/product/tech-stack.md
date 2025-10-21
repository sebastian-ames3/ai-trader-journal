# Tech Stack

## Framework & Runtime
- **Application Framework:** Next.js 14 (App Router)
- **Language/Runtime:** TypeScript / Node.js
- **Package Manager:** npm

## Frontend
- **JavaScript Framework:** React (via Next.js)
- **CSS Framework:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Path Aliases:** `@/*` resolves to `./src/*`

## Database & Storage
- **Database:** PostgreSQL
- **ORM/Query Builder:** Prisma
- **Caching:** Not yet implemented (planned for API rate limiting)

## Data & APIs
- **Price Data:** Mock data system (to be replaced with yfinance or financial data API)
- **Ticker Search:** Mock data system (to be replaced with real ticker search API)

## Testing & Quality
- **Test Framework:** Jest
- **Test Utilities:** React Testing Library (implied by Next.js setup)
- **Linting/Formatting:** ESLint, Prettier
- **Type Checking:** TypeScript compiler

## Development Tools
- **Debugging:** Conditional logger system (`src/lib/logger.ts`) enabled via `DEBUG=1` environment variable
- **Database GUI:** Prisma Studio (via `npm run db:studio`)
- **Git Workflow:** Branch protection on main; feature branches required for PRs

## Deployment & Infrastructure
- **Hosting:** Not yet configured (Next.js supports Vercel, AWS, Railway, etc.)
- **CI/CD:** Not yet configured
- **Environment Variables:** `.env.local` for local development, `.env.example` as template

## Third-Party Services
- **Authentication:** Not yet implemented (planned feature)
- **Email:** Not yet implemented
- **Monitoring:** Not yet implemented (Sentry or similar planned for production)
- **Financial Data API:** Not yet integrated (yfinance or alternative planned)

## Architecture Patterns

### Database Schema
- **Models:** Trade, Snapshot, Note, Tag, Settings
- **Singleton Pattern:** Prisma Client uses singleton to prevent multiple instances in development

### Volatility Calculation
- **HV Calculation:** `src/lib/hv.ts` - Close-to-close log returns methodology
- **IV Management:** `src/lib/iv.ts` - Manual entry with validation and conversion utilities
- **IV Persistence:** `src/lib/persistIV.ts` - Save IV data to Snapshot model

### Data Conventions
- **IV/HV Storage:** IV stored as decimal in database (0.285 for 28.5%), converted via `pctToDecimal()` and `decimalToPct()` utilities
- **Annualization:** HV annualized for 252 trading days
- **Validation:** IV range 0.1% - 400%; minimum 20 prices for HV20, 30 for HV30

### API Routes
- `GET /api/ticker?q={query}` - Ticker search (currently mock)
- `GET /api/ticker/[symbol]` - Ticker details (currently mock)
- `POST /api/iv/manual` - Persist manual IV entry

## Key Dependencies
- **next:** 14.x - React framework with App Router
- **react:** 18.x - UI library
- **typescript:** 5.x - Type safety
- **prisma:** Latest - Database ORM
- **@prisma/client:** Latest - Prisma runtime client
- **tailwindcss:** Latest - Utility-first CSS framework
- **@radix-ui/*:** Various - Headless UI primitives for shadcn/ui
- **zod:** (Implied for validation) - Schema validation library

## Future Considerations
- **Real-time data:** WebSocket integration for live price updates
- **Caching layer:** Redis for API response caching and rate limit management
- **Authentication:** NextAuth.js or Auth0 for user authentication
- **Monitoring:** Sentry for error tracking, Vercel Analytics for performance
- **CI/CD:** GitHub Actions for automated testing and deployment
