# GitHub Issues to Create/Update

## New Issues to Create

### Issue #11: Quick Journal Entry System
**Labels:** `enhancement`, `critical`

**Description:**
Frictionless journal entry creation that makes daily journaling actually enjoyable and takes 30 seconds instead of 5 minutes.

**Acceptance Criteria:**
- [ ] Text entry with minimal friction (auto-save drafts)
- [ ] Voice note recording with transcription
- [ ] Screenshot upload and attachment
- [ ] Entries can exist independently (no ticker required)
- [ ] Optional ticker linkage for context
- [ ] Entry type selection: Trade Ideas, Actual Trades, Reflections, Market Observations
- [ ] One-tap mood tagging (confident, nervous, excited, uncertain)
- [ ] One-tap conviction level (low, medium, high)
- [ ] Mobile-optimized input (large touch targets)
- [ ] Entry preview before save
- [ ] Edit/delete existing entries

**Priority:** CRITICAL - This is the core differentiator. Users must want to journal daily.

**Size:** Large (L)

---

### Issue #12: AI Text Analysis Engine
**Labels:** `enhancement`, `critical`, `ai`

**Description:**
NLP-based analysis that extracts insights from journal text to power pattern recognition and personalized feedback.

**Acceptance Criteria:**
- [ ] Sentiment extraction (positive, negative, neutral)
- [ ] Emotional keyword detection (FOMO, nervous, confident, revenge, uncertain, greed, fear, etc.)
- [ ] Conviction level inference from language patterns
- [ ] Auto-tagging based on content analysis
- [ ] Store analysis metadata with each entry
- [ ] Identify strategy mentions (spreads, strangles, iron condors, etc.)
- [ ] Flag cognitive biases in language
- [ ] API endpoint for analyzing entry text
- [ ] Batch analysis for historical entries

**Technical Considerations:**
- Consider using OpenAI API, Anthropic Claude, or open-source NLP libraries
- Store analysis results in database for pattern recognition
- Run analysis async to avoid blocking entry creation

**Priority:** CRITICAL - This powers all AI insights features

**Size:** Extra Large (XL)

---

### Issue #13: Weekly Insights Dashboard
**Labels:** `enhancement`, `critical`, `ai`

**Description:**
Automated behavioral pattern summaries that make journaling rewarding by showing what actually works for the user's trading style.

**Acceptance Criteria:**
- [ ] Weekly summary view showing entry count, trade count, P&L
- [ ] Emotional trend analysis (most common emotions this week)
- [ ] Pattern highlights: "High conviction trades: 68% win rate"
- [ ] Recurring mistake detection
- [ ] Personalized feedback: "You exit winners early when using word 'nervous'"
- [ ] Comparison to previous weeks (improving/declining patterns)
- [ ] Most profitable mindsets/conditions
- [ ] Visual charts for emotional trends
- [ ] Email/push notification with weekly summary (optional)
- [ ] Export weekly report as PDF

**Priority:** CRITICAL - Feedback loop makes journaling rewarding and drives engagement

**Size:** Large (L)

---

### Issue #14: Basic Pattern Recognition
**Labels:** `enhancement`, `ai`

**Description:**
Statistical analysis correlating journal patterns with trading outcomes to surface what conditions lead to better results.

**Acceptance Criteria:**
- [ ] Correlate conviction levels → trade outcomes
- [ ] Track emotional keywords in winning vs losing trades
- [ ] Identify recurring patterns over time
- [ ] Simple statistical insights displayed on dashboard
- [ ] Filter patterns by date range
- [ ] Minimum threshold for pattern significance (e.g., 10+ trades)
- [ ] Visual representation of patterns (charts/graphs)
- [ ] Export pattern analysis

**Examples of Insights:**
- "When you tag 'high conviction', win rate is 73%"
- "Trades entered with word 'FOMO' in notes: 12% win rate"
- "Your best trades happen when IV/HV > 1.2 AND conviction = high"

**Priority:** Medium - Builds on AI analysis engine

**Size:** Medium (M)

---

### Issue #15: Ticker Analysis & Auto-Population
**Labels:** `enhancement`

**Description:**
Quick ticker search with one-click market snapshot attachment to journal entries. Auto-fetches key data to enrich entries without tedious manual input.

**Acceptance Criteria:**
- [ ] Fast ticker search with autocomplete
- [ ] One-click to attach market snapshot to entry
- [ ] Auto-fetch: current price, change %, volume
- [ ] Manual IV entry with validation (0.1%-400%)
- [ ] Auto-calculate HV20 and HV30
- [ ] Display IV/HV comparison inline
- [ ] Snapshot timestamp
- [ ] Snapshots are OPTIONAL (entries can exist without tickers)
- [ ] Lightweight, fast loading on mobile
- [ ] Cache ticker data for performance

**Important:** This replaces the previous "Trade Entry & Snapshot" (#7) with a lighter, journal-first approach.

**Priority:** Medium - Provides context but not required for every entry

**Size:** Medium (M)

---

## Existing Issues to Update

### Issue #7: Trade Entry & Snapshot
**Action:** Add label `superseded` and update description

**New Description:**
⚠️ **SUPERSEDED BY #15**

This issue has been replaced by **#15 - Ticker Analysis & Auto-Population** which takes a lighter, journal-first approach.

---

### Issue #5: Options Chain Display
**Action:** Add label `phase-2`

---

### Issue #8: Go/No-Go Precheck System
**Action:** Add label `phase-2`

---

### Issue #10: CSV/Markdown Import
**Action:** Add label `phase-2`

---

## Quick Actions

**Create all issues via GitHub Web UI:**
1. Go to https://github.com/sebastian-ames3/ai-trader-journal/issues/new
2. Copy/paste each issue above
3. Add the specified labels
4. Click "Submit new issue"

**Or install GitHub CLI:**
```bash
# Windows (using winget)
winget install --id GitHub.cli

# Then authenticate
gh auth login

# Then run the script
bash scripts/update-github-issues.sh
```
