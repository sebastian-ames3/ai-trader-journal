# AI Trader Journal - Product Review Prompt

You are Claude Code with access to this GitHub repository. Your task is to perform a comprehensive PRODUCT REVIEW of the personal trading journal app "AI Trader Journal."

## HARD CONSTRAINTS (NON-NEGOTIABLE)

- REVIEW ONLY. Do not modify source code, configuration, infra, or docs in the repo.
- Do not refactor, do not implement fixes, do not open PRs, do not commit.
- You may read files, run tests/lints in a read-only manner, and generate NEW OUTPUT FILE(S) that contain the review report only.
- Do not provide step-by-step implementation instructions; findings and recommendations only.

---

## PRODUCT CONTEXT (FROZEN)

**Product Name:** AI Trader Journal

**Purpose:**
A mobile-first trading psychology journal that helps traders capture thoughts with minimal friction, receive AI-powered insights on behavioral patterns, track trades under thesis-based groupings, and improve through pattern recognition and AI coaching.

**Primary User:**
The developer themselves — an active options trader who wants to:
- Capture journal entries in <30 seconds (voice, text, screenshots)
- Surface behavioral patterns and cognitive biases automatically
- Track trades grouped by thesis with accurate P/L
- Get AI coaching on trading psychology
- Maintain journaling consistency through streaks and accountability

**Core Value Proposition:**
1. Frictionless capture (voice, text, photo, OCR scanning)
2. AI-powered psychological analysis (sentiment, biases, conviction)
3. Thesis-based trade management with P/L tracking
4. Behavioral pattern recognition over time
5. AI trading coach for psychology guidance

**Current State:**
- Core application complete (Phases 1-4)
- PWA with offline support
- Active development on Smart Import Wizard (trade digitization)
- Authentication via Supabase
- Deployed on Vercel

**v1 Non-Goals:**
- Multi-user SaaS features (pricing, teams, admin)
- Broker API integrations (Schwab, TastyTrade)
- Real-time trade sync
- Cross-platform native apps

**Design Philosophy:**
- Mobile-first (assume 80%+ mobile usage)
- AI should add value, not just exist — efficiency over comprehensiveness
- Personal tool quality bar: "would I enjoy using this daily?"

**Success Metrics:**
- Entry capture in <30 seconds
- AI analysis adds actionable, accurate insight
- Weekly insights surface real behavioral patterns
- Trade P/L tracking is accurate and useful
- Mobile UX is smooth and intuitive

**Dominant Risks:**
1. **Accuracy** — AI pattern detection and bias identification must be reliable, not hallucinated
2. **Usability** — Mobile UX must be smooth; friction kills journaling habits
3. **Functionality** — Features must work correctly and completely

---

## WHAT YOU MUST PRODUCE (DELIVERABLES)

Create ONE primary report formatted to be easily exported to .docx:

**Required:**
- Create: `./review/ai_trader_journal_review.md`
  (Write it with clean headings, short paragraphs, and bullet lists; no giant code dumps.)

**Optional (ONLY IF TOOLING EXISTS LOCALLY):**
- If pandoc is available, also generate: `./review/ai_trader_journal_review.docx`
- If pandoc is not available, do NOT install anything; just produce the .md.

---

## REVIEW DOMAINS (YOU MUST COVER ALL)

### 1) Mobile UX & Usability (HIGHEST PRIORITY)

- First-run experience: Can a user understand value in 60 seconds?
- Entry capture flow: Is <30 second capture achievable? Test all paths (text, voice, photo)
- Touch targets: Are they 44x44px minimum? Thumb-friendly placement?
- Navigation: Is it intuitive? Can you reach key features in 2 taps?
- Form UX: Input fields, keyboards, date pickers — are they mobile-optimized?
- Gesture support: Swipe actions, pull-to-refresh, bottom sheets
- Offline behavior: Does it gracefully handle connectivity loss?
- Loading states: Are there proper skeletons/spinners? No jarring layout shifts?
- Error states: Are errors clear and recoverable on mobile?
- PWA quality: Install prompt, home screen icon, splash screen, app-like feel

### 2) Functionality & Completeness

- Journal entry CRUD: Create, read, update, delete — all working?
- Voice capture: Recording, transcription, playback — reliable?
- Image capture: Photo upload, AI analysis, storage — working?
- Trade management: Thesis CRUD, trade linking, P/L calculations — accurate?
- Import wizard: CSV parsing, card review, trade linking — functional?
- AI analysis: Sentiment, biases, tags — consistent and useful?
- Coach feature: Conversation flow, context awareness — working?
- Insights: Weekly/monthly generation — accurate and valuable?
- Search & filters: Do they work correctly? Performance acceptable?
- Settings: Do all settings persist and apply correctly?
- Notifications: Push setup, delivery, engagement tracking

### 3) AI Accuracy & Efficiency

- **Sentiment analysis**: Is it accurate? Does it match entry tone?
- **Bias detection**: Are detected biases real or hallucinated?
- **Conviction inference**: Does it align with entry language?
- **Auto-tagging**: Are tags relevant and from the taxonomy?
- **Weekly insights**: Do they reflect actual patterns or generic advice?
- **Coach responses**: Are they contextual or generic? Do they reference real entries?
- **Pattern recognition**: Are detected patterns valid and actionable?
- **AI overkill audit**: Where is AI used that rules would suffice? Flag unnecessary LLM calls.
- **Prompt quality**: Are prompts well-structured? Do they constrain hallucination?
- **Fallback behavior**: What happens when AI fails? Graceful degradation?

### 4) Data Accuracy & Integrity

- P/L calculations: Are they correct for all trade types?
- Streak tracking: Does it calculate correctly with grace days?
- Date handling: Timezone issues? Off-by-one errors?
- Trade linking: Are links persisted and displayed correctly?
- Import deduplication: Does it prevent duplicate imports?
- Data consistency: Are related records updated atomically?

### 5) Performance

- Page load times: Are they acceptable on mobile (target <3s)?
- List rendering: Does it handle 100+ entries smoothly?
- API response times: Are they acceptable (<1s for most)?
- Bundle size: Is it reasonable for mobile? Code splitting working?
- Image optimization: Are uploaded images compressed?
- Caching: Is appropriate data cached?

### 6) Security & Privacy

- Authentication: Is Supabase auth properly implemented?
- API protection: Are all routes authenticated?
- Data isolation: Can users only access their own data?
- Sensitive data: Is financial/emotional data handled appropriately?
- API keys: Are they properly secured (not exposed client-side)?
- Input validation: Are inputs sanitized server-side?

### 7) Accessibility (Basic WCAG Scan)

- Color contrast: Does it meet AA standards?
- Focus states: Are they visible for keyboard navigation?
- Screen reader: Are ARIA labels present on interactive elements?
- Touch targets: 44x44px minimum for mobile
- Text sizing: Respects system font size preferences?

### 8) Code Quality & Maintainability

- TypeScript usage: Are types complete and accurate?
- Error handling: Are errors caught and handled appropriately?
- Code organization: Is the structure logical and consistent?
- Dead code: Are there unused components, routes, or functions?
- Test coverage: What's tested? What critical paths are untested?
- Console errors: Are there errors or warnings in development?

### 9) Reliability & Edge Cases

- Empty states: What happens with no data? First-time user experience?
- Error recovery: Can users recover from errors without data loss?
- Network failures: How does the app behave offline or with slow connections?
- Large data: How does it handle heavy users (1000+ entries)?
- Concurrent updates: Race condition risks?
- Session expiry: Graceful handling of auth timeouts?

---

## OUTPUT FORMAT (REPORT STRUCTURE)

Your report MUST include, in this exact order:

### 1. Executive Summary (max ~1 page)
- What it is
- What works well
- Overall assessment: **Ready for Daily Use / Needs Work / Major Issues**
- Top 3 issues (ranked by impact on daily usability)

### 2. Usability Assessment
- What's smooth
- What's frustrating
- Mobile-specific issues

### 3. Functionality Scorecard (0–3 scale per feature)
| Feature | Score | Notes |
|---------|-------|-------|
| Journal Entry Capture | 0-3 | |
| Voice Recording | 0-3 | |
| Image Capture | 0-3 | |
| Trade Management | 0-3 | |
| Import Wizard | 0-3 | |
| AI Analysis | 0-3 | |
| AI Coach | 0-3 | |
| Weekly Insights | 0-3 | |
| Search & Filters | 0-3 | |
| Settings & Preferences | 0-3 | |

**Scoring:**
- 3 = Works perfectly, delightful
- 2 = Works with minor issues
- 1 = Partially functional, frustrating
- 0 = Broken or missing

### 4. AI Efficiency Audit
- Where AI adds clear value
- Where AI may be overkill (could use rules instead)
- Accuracy concerns
- Cost/efficiency recommendations

### 5. Findings by Domain (sections 1–9 above)
For each domain:
- Summary (2-3 sentences)
- Issues found (severity: Critical / High / Medium / Low)
- Evidence pointers (file paths, functions, routes) — cite paths, do NOT paste large code

### 6. Critical Issues (Consolidated List)
Each issue must have:
- Severity (Critical / High / Medium / Low)
- Category (UX / Functionality / AI / Performance / Security / etc.)
- Location in repo (file path or route)
- User impact description
- What "fixed" looks like (definition only, no implementation steps)

### 7. Quick Wins
- Issues that would be easy to fix with high impact
- Low-hanging fruit for improving daily experience

### 8. Final Assessment
- **Ready for Daily Use** / **Needs Work** / **Major Issues**
- Summary of what would make it "daily driver" quality
- Risks being accepted if used as-is

---

## PROCESS INSTRUCTIONS (HOW TO WORK)

1. **Scan repo structure first:**
   - Identify pages, components, API routes, lib utilities
   - Map the user flows: capture → view → analyze → coach → insights

2. **Trace critical user flows:**
   - New entry capture (text, voice, photo)
   - View/edit existing entry
   - Create thesis, add trade
   - Import trades from CSV
   - View weekly insights
   - Coach conversation
   - Search and filter entries

3. **Check AI usage patterns:**
   - Map all LLM calls (grep for Claude/Anthropic usage)
   - Evaluate each: necessary vs. overkill
   - Check prompt quality and output validation

4. **Run existing tests/lints (optional, read-only):**
   - `npm run lint`
   - `npm run typecheck`
   - `npm run test` (if exists)

5. **Produce the report** to `./review/ai_trader_journal_review.md`

---

## TONE & STYLE

- Direct, practical feedback — no fluff
- Focus on daily usability impact
- Prioritize findings by "how much does this hurt daily use?"
- Be honest about what's good — acknowledge well-built features
- Internal quality review tone, not external marketing review

---

BEGIN NOW.

First, summarize repo architecture in 10 bullets (in your own working notes), then write the report to `./review/ai_trader_journal_review.md` (and .docx if pandoc exists).
