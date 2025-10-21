# Product Roadmap

> **Product Philosophy:** AI Trader Journal is first and foremost a sophisticated AI-powered trading journal. The volatility analysis and market data features exist to auto-enrich journal entries with context, not as the primary product. The real value comes from AI pattern recognition that helps traders understand what actually works for their individual trading style.

## MVP Features (Current Phase)

### Core Journal Features (Primary Value - 80%)

1. [ ] **Quick Journal Entry System** — Frictionless entry creation with text input (30-second flow), voice note recording with transcription, screenshot upload and attachment. Entries can exist independently or be linked to tickers. Support multiple entry types: Trade Ideas, Actual Trades, Reflections, Market Observations. Include one-tap mood/conviction tagging and auto-save drafts. `L` `CRITICAL`

2. [ ] **AI Text Analysis Engine** — NLP-based sentiment extraction from journal text with emotional keyword detection (FOMO, nervous, confident, revenge, uncertain, etc.). Automatically infer conviction levels from language patterns. Auto-tag entries based on content analysis. Store all analysis metadata with entries for pattern recognition. `XL` `CRITICAL`

3. [ ] **Weekly Insights Dashboard** — Automated behavioral pattern summaries showing emotional trends, most common mistakes, and recurring patterns. Provide personalized feedback like "You exit winners early when using word 'nervous' in entries" or "High conviction trades have 68% win rate". Make journaling rewarding through visible, actionable feedback. `L` `CRITICAL`

4. [ ] **Basic Pattern Recognition** — Statistical analysis correlating conviction levels with trade outcomes. Track emotional patterns over time and identify recurring keywords in winning vs losing trades. Surface simple insights about what conditions/mindsets lead to better results. `M`

### Market Data Foundation (Contextual Enrichment - 20%)

5. [ ] **Ticker Analysis & Auto-Population** — Quick ticker search with one-click market snapshot attachment to journal entries. Auto-fetch current price, manual IV entry with validation, and auto-calculated HV20/HV30. Lightweight, fast, mobile-optimized. Snapshots are optional context, not required fields. `M`

6. [ ] **IV/HV Comparison Card** — Visual display of IV vs HV20/HV30 with color-coded indicators showing whether options are overpriced or undervalued. Include IV/HV ratio with plain-English interpretation. Responsive mobile design. Can exist standalone or attached to journal entries. `S`

7. [ ] **Real Market Data Integration** — Replace mock data system with yfinance API (or alternative) for fetching historical price data needed for HV calculations. Implement caching strategy, error handling, and rate limiting. Essential foundation for accurate volatility analysis. `M`

### Supporting Features

8. [ ] **Journal Search & Filter** — Full-text search across all journal entries. Filter by date range, tags, ticker, entry type, mood, and P&L status (for actual trades). Multiple sort options with saved filter presets for common queries. `M`

9. [ ] **Risk-Based Position Sizing Calculator** — Interactive calculator accepting account size, risk percentage, and option premium to recommend contract quantity. Include preset risk levels (1%, 2%, 5%), visual risk gauge, and ability to save parameters with trade entries. `S`

10. [ ] **Tags & Notes Management** — Create, edit, and delete custom tags with organization by category. Add timestamped notes to any journal entry. Link related entries together (e.g., link Trade Idea → Actual Trade → Post-Mortem). `S`

11. [ ] **Mobile Responsive Design Polish** — Refine mobile-first UI to ensure optimal experience on iOS/Android devices. Focus on touch targets for one-tap journaling, readable typography, efficient voice/text/photo entry, and performance optimization for mobile networks. `M`

## Phase 2: Enhanced Analytics & Data

12. [ ] **Trade Performance Dashboard** — Overview dashboard showing aggregate P&L, win rate, average return, and performance breakdown by tag/strategy. Include charts visualizing performance over time and by volatility regime. `L`

13. [ ] **Advanced Pattern Recognition** — Deep analysis of historical entries to identify complex patterns in winning vs losing trades based on entry conditions (IV/HV ratios, days to expiration, strike selection) combined with journal sentiment data. Surface insights as actionable recommendations. `XL`

14. [ ] **IV/HV Historical Charts** — Interactive charts showing IV and HV trends over time for specific tickers. Allow users to see how current IV/HV compares to historical ranges (30-day, 90-day, 1-year). `M`

15. [ ] **Options Chain Display** — Fetch and display options chain data with bid/ask spreads, open interest, volume, and liquidity indicators. Mobile-optimized table/card view with expiration filtering. Attach to journal entries for post-trade analysis. `L`

16. [ ] **AI Pre-Trade Review** — Before executing a trade, AI analyzes your entry rationale against historical patterns and flags potential concerns: "You've noted 'might be late' on 4 losing trades this month" or "This setup matches your highest win-rate pattern". `L`

17. [ ] **CSV/Markdown Import** — Import legacy journal data from CSV files and Markdown notes. Include field mapping UI, preview before import, validation, duplicate detection, and rollback capability. `M`

## Phase 3: Intelligence & Automation

18. [ ] **Go/No-Go Precheck System** — Pre-trade validation with configurable rules checking liquidity thresholds, extreme IV levels, wide bid/ask spreads, and upcoming events (earnings). Display warnings with override capability and reasoning capture. `L`

19. [ ] **Volatility Threshold Alerts** — Allow users to set custom IV/HV ratio thresholds for specific tickers (e.g., alert when AAPL IV/HV > 1.3). Send notifications when conditions are met. Include alert management dashboard. `L`

20. [ ] **Multi-Leg Trade Support** — Support for complex options strategies (spreads, iron condors, butterflies) with leg-by-leg entry and aggregate risk analysis. Visual representation of strategy payoff diagrams. `XL`

21. [ ] **Voice-to-Trade AI Assistant** — Natural language processing to create journal entries and trades from voice commands: "I'm thinking about selling a put spread on SPY because IV is elevated and I'm seeing support at 420". AI extracts ticker, strategy, rationale, and conviction. `XL`

---

## Notes

- **MVP Priority:** Core AI journal features (#1-4) are CRITICAL and must be completed first. These differentiate this product from simple trade trackers.
- **Tech Foundation:** Real API integration (#7) enables accurate HV calculations but is secondary to getting the journaling UX right.
- **Feedback Loop:** Weekly insights (#3) make journaling rewarding and drive daily engagement - essential for MVP.
- **Data as Context:** IV/HV analysis (#5-6) auto-enriches entries but shouldn't require tedious manual data entry.
- **Phase 2 Focus:** Advanced pattern recognition and additional market data once core journaling loop is proven.
- **Phase 3 Focus:** Proactive features and automation that leverage accumulated journal data.
