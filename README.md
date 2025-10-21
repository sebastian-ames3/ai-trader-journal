AI Trader Journal
A mobile-first options trading journal with intelligent IV/HV analysis and AI-powered insights.
Built with: Next.js 14 • TypeScript • Tailwind CSS • Prisma • SQLite
🎯 Features

📊 Real-time IV vs HV Comparison - Instantly see if options are overpriced or undervalued
📱 Mobile-First PWA - Trade journal that works seamlessly on your phone
💰 Risk-Based Position Sizing - Size positions by account risk, not arbitrary share counts
📝 Comprehensive Trade Journaling - Capture complete market context at entry
🤖 AI-Powered Insights - Learn from your trading patterns (coming soon)
🔒 Local-First Data - Your trades stay private on your device

🚀 Tech Stack

Framework: Next.js 14 (App Router)
Language: TypeScript
Styling: Tailwind CSS + shadcn/ui
Database: SQLite + Prisma ORM
State: TanStack Query + tRPC
Testing: Jest + Playwright

📋 Prerequisites

Node.js 20+
npm or yarn
Git

🛠️ Installation

Clone the repository

bash   git clone https://github.com/sebastian-ames3/ai-trader-journal.git
   cd ai-trader-journal

Install dependencies

bash   npm install

Set up environment variables

bash   cp .env.example .env.local

Set up the database

bash   npm run db:push
   npm run db:seed

Run the development server

bash   npm run dev

Open the app
Navigate to http://localhost:3000

🔧 Development
Branch Workflow
This project uses branch protection. All changes must go through pull requests:
bash# Create feature branch
git checkout -b feat/your-feature

# Make changes and commit
git add .
git commit -m "feat: your feature description"

# Push and create PR
git push origin feat/your-feature
Available Scripts
bashnpm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript compiler
npm run test         # Run tests
npm run db:studio    # Open Prisma Studio
Debug Mode
Run with debug logging:
bash# Windows PowerShell
$env:DEBUG=1; npm run dev

# macOS/Linux
DEBUG=1 npm run dev
🗂️ Project Structure
ai-trader-journal/
├── app/              # Next.js app router pages
├── components/       # React components
│   └── ui/          # shadcn/ui components
├── lib/             # Utility functions
├── prisma/          # Database schema and migrations
├── public/          # Static assets
└── tests/           # Test files
🔐 Privacy & Security
Your data is always private:

All trading data is stored locally in SQLite
Database files are gitignored and never uploaded
No cloud sync or external API calls for your journal data
You own your data and can export it anytime

This repository contains only the application code. Your personal trading journal entries remain private on your machine.
🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

Fork the repository
Create your feature branch (git checkout -b feat/amazing-feature)
Commit your changes (git commit -m 'feat: add amazing feature')
Push to the branch (git push origin feat/amazing-feature)
Open a Pull Request

📝 License
This project is licensed under the MIT License - see the LICENSE file for details.
🚧 Roadmap
Current Sprint (MVP)

 Project setup with Next.js 14 + TypeScript
 Database schema with Prisma + SQLite
 Ticker search with market data
 HV calculation engine
 Manual IV entry
 IV/HV comparison visualization

Next Up

 Options chain display
 Risk-based position sizing
 Trade journal with full snapshots
 CSV import for legacy journals

Future Features

 AI-powered trade analysis
 Pattern recognition
 Backtesting engine
 Multi-account support

💬 Support

Create an issue for bug reports or feature requests
Check existing issues before creating new ones