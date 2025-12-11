# Changelog

All notable changes to AI Trader Journal. Format based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased] - Phase 5

### Planned
- PWA optimization and enhancement
- Capacitor migration (optional)
- App Store submission (iOS/Android)

---

## [0.4.0] - 2024-12-10

### Phase 4 - Power User Features (PR #84)

**AI Trading Coach**
- `/coach` page - Conversational AI coach with context from entries
- `/coach/goals` page - Goal setting and progress tracking
- `/api/coach/*` - Chat, sessions, goals, and prompts endpoints
- `src/lib/coach.ts` - Coach logic with context building
- Components: CoachChat, GoalForm, GoalProgress, CoachPromptCard

**Social/Mentor Sharing**
- `/sharing` page - Share link management hub
- `/sharing/mentor` page - Mentor dashboard
- `/share/[slug]` page - Public share view
- `/api/share/links/*` - Share link management
- `/api/mentors/*` - Mentor relationships and comments
- `/api/accountability/*` - Partner features (invite, accept, nudge)
- `src/lib/sharing.ts` - Sharing logic with redaction
- Components: ShareModal, MentorDashboard, AccountabilityWidget

**Custom Dashboard**
- `/dashboard/settings` page - Dashboard configuration
- `/api/dashboard/*` - Layouts, widgets, templates endpoints
- `src/lib/dashboard.ts` - 14 widget types, templates, grid system
- Components: DashboardGrid, Widget, LayoutSwitcher, AddWidgetPanel
- Widgets: Streak, WeeklyInsights, RecentEntries, MoodTrend, BiasTracker, etc.

**Thesis Phase 3 - Pattern Recognition**
- `/theses/patterns` page - Pattern insights
- `/api/patterns/*` - Pattern analysis and reminders
- `/api/trades/extract` - Screenshot extraction via Claude vision
- `src/lib/thesisPatterns.ts` - Pattern detection
- `src/lib/tradeExtraction.ts` - Trade data extraction
- Components: ScreenshotExtractor, AIReminders, ThesisPatternCard

**Database Additions**
- CoachSession, CoachMessage, CoachGoal, CoachPrompt
- ShareLink, MentorRelationship, MentorComment, AccountabilityPair
- DashboardLayout, LayoutTemplate, WidgetConfig

---

## [0.3.0] - 2024-12-08

### Phase 3 - UX/UI Design System

**Design Foundation (PR #71, #74)**
- Modern color system with glassmorphism
- Bottom navigation with center FAB
- Card-based layouts with proper spacing

**Core Components (PR #71)**
- Redesigned entry cards with type badges
- Mood selector with 14 states
- Conviction slider, glass header, streak card

**Polish & Accessibility (PR #78, #79, #80)**
- Page transitions with framer-motion
- Button ripple effects, success animations
- Pull-to-refresh gesture
- WCAG 2.1 AA compliance (skip links, focus indicators)
- Performance optimization with React.memo

**Thesis Trade Management Phase 1-2 (PR #76, #82)**
- TradingThesis, ThesisTrade, ThesisUpdate models
- Thesis list/detail pages with P/L tracking
- Enhanced trade logging form with 18 strategy types
- Trade timeline with visual indicators
- Voice recording for trade reasoning

---

## [0.2.0] - 2024-12-01

### Phase 2 - Engagement & Capture Features (PR #65-68)

**Frictionless Capture**
- Voice recording infrastructure
- Quick capture with auto-inference
- Media storage foundation

**Proactive Engagement**
- Market condition monitoring (SPY, VIX triggers)
- Journal silence detection
- In-app notification banners

**Pattern Recognition**
- Bias frequency analysis
- Market condition correlation
- Behavioral pattern detection

**Context Surfacing**
- Ticker detection with context panel
- Strategy insight integration
- Historical entry context

**LLM Migration (PR #73)**
- Migrated from OpenAI GPT-4o to Claude (Haiku/Sonnet/Opus)
- Retained OpenAI Whisper for transcription

---

## [0.1.0] - 2024-11-15

### Phase 1 - MVP Features

**Core Functionality**
- Entry schema and CRUD API
- AI text analysis (sentiment, bias detection)
- Auto-tagging system (53 tags, 6 categories)
- Weekly insights dashboard
- Search and filter system

**User Experience**
- Dashboard homepage with snapshot
- FAB for quick entry
- Streak tracking with celebrations
- Empty states and onboarding
- Mobile-first responsive design

**Technical Foundation**
- Next.js 14 App Router
- Prisma with PostgreSQL (Supabase)
- Claude AI integration
- TypeScript throughout

---

## Version Summary

| Version | Date | Phase | Key Features |
|---------|------|-------|--------------|
| 0.4.0 | 2024-12-10 | Phase 4 | AI coach, sharing, custom dashboard, patterns |
| 0.3.0 | 2024-12-08 | Phase 3 | UX redesign, thesis management, accessibility |
| 0.2.0 | 2024-12-01 | Phase 2 | Voice capture, engagement, pattern detection |
| 0.1.0 | 2024-11-15 | Phase 1 | MVP - entries, AI analysis, insights |
