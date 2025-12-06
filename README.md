# AI Trader Journal

A mobile-first trading psychology journal with AI-powered behavioral analysis.

**The Core Problem:** Traders stop journaling exactly when it would help most - during market drawdowns, when emotionally disengaged, or when their portfolio is underperforming.

**Our Solution:** Frictionless capture + proactive engagement + pattern recognition.

## Features

### Phase 1 (Current - MVP)

- **AI-Powered Entry Analysis** - Sentiment detection, bias identification, emotional keywords
- **Weekly Insights Dashboard** - Behavioral trends, cognitive patterns, personalized feedback
- **Smart Auto-Tagging** - 53 tags across 6 categories, automatically applied
- **Search & Filters** - Full-text search, multi-filter support, date ranges
- **Journaling Streaks** - Habit formation with celebration system
- **Mobile-First PWA** - Works seamlessly on your phone

### Phase 2 (Planned)

- **Voice Memos** - Record from bed, Whisper transcription
- **Screenshot Analysis** - Chart analysis with GPT-5 Mini vision
- **Quick Capture** - No required fields, auto-inference of mood/type/ticker
- **Proactive Engagement** - Market-triggered check-ins during drawdowns
- **Pattern Recognition** - "You stop journaling during corrections"
- **Historical Context** - "From your past self" during similar conditions

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL (Supabase) + Prisma ORM |
| AI | OpenAI GPT-5 Family (~$0.57/month) |
| Market Data | yfinance Python microservice (free) |
| Hosting | Vercel (frontend) + Railway (Python) |

## Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- PostgreSQL database (Supabase recommended)
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/sebastian-ames3/ai-trader-journal.git
cd ai-trader-journal

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL and OPENAI_API_KEY

# Push database schema
npm run db:push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Options Data Service (Optional)

For market data context:

```bash
# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI service
uvicorn options_service:app --reload
```

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript compiler
npm run test:all     # Run all integration tests (PowerShell required)
npm run db:studio    # Open Prisma Studio
```

### Branch Workflow

Main branch is protected. All changes go through pull requests:

```bash
git checkout -b feat/your-feature
# Make changes, test, commit
gh pr create
```

### Windows Note

Use PowerShell for all npm commands. WSL has networking issues with Supabase.

## Project Structure

```
ai-trader-journal/
├── app/                    # Next.js app router pages
├── components/             # React components
│   └── ui/                # shadcn/ui primitives
├── lib/                   # Utilities and services
├── prisma/                # Database schema
├── specs/                 # Phase 2 PRDs and tasks
│   ├── README.md          # Specs overview
│   ├── 01-frictionless-capture.md
│   ├── 02-proactive-engagement.md
│   ├── 03-pattern-recognition.md
│   ├── 04-context-surfacing.md
│   └── TASKS.md           # Implementation checklist
└── tests/                 # Integration tests
```

## AI Architecture

Single-provider OpenAI architecture for simplicity and reliability:

| Model | Use Case | Cost |
|-------|----------|------|
| GPT-5 Nano | Entry analysis, quick inference | $0.05/1M tokens |
| GPT-5 Mini | Screenshot analysis (vision) | $0.25/1M tokens |
| GPT-5 | Weekly insights, pattern detection | $1.25/1M tokens |
| Whisper | Voice transcription | $0.006/min |
| Embeddings | Semantic similarity | $0.02/1M tokens |

**Total estimated cost: ~$0.57/month** for moderate usage.

## Roadmap

### Phase 1 - MVP (Current)
- [x] Entry schema & API
- [x] AI text analysis
- [x] Weekly insights dashboard
- [x] Search & filters
- [x] Auto-tagging system
- [x] Dashboard homepage
- [x] FAB for quick entry
- [x] Journaling streaks
- [x] Empty states & onboarding

### Phase 2 - Engagement Features
- [ ] Voice recording + Whisper transcription
- [ ] Quick capture with auto-inference
- [ ] Screenshot analysis (GPT-5 Mini vision)
- [ ] Daily reflection prompts
- [ ] Market condition alerts (SPY ±2%, VIX >25)
- [ ] Push notifications
- [ ] "From Your Past Self" (embeddings)
- [ ] Pattern recognition
- [ ] Monthly behavioral reports

### Phase 3 - Power User Features
- [ ] Complex strategy intelligence
- [ ] Social/mentor sharing
- [ ] Custom dashboard builder
- [ ] Conversational AI coach

## Contributing

Contributions welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- Create an [issue](https://github.com/sebastian-ames3/ai-trader-journal/issues) for bugs or features
- Check existing issues before creating new ones
