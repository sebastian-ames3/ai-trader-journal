#!/bin/bash

# Script to create new GitHub issues and update existing ones for AI Trader Journal MVP
# Usage: ./scripts/update-github-issues.sh

REPO="sebastian-ames3/ai-trader-journal"

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "GitHub CLI (gh) is not installed."
    echo "Install it from: https://cli.github.com/"
    echo ""
    echo "Or use the GitHub web interface to manually create these issues."
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "Not authenticated with GitHub CLI."
    echo "Run: gh auth login"
    exit 1
fi

echo "Creating new issues for AI-first MVP features..."
echo ""

# Issue #11: Quick Journal Entry System
echo "Creating Issue #11: Quick Journal Entry System..."
gh issue create \
  --title "Quick Journal Entry System" \
  --label "enhancement,critical" \
  --body "## Description
Frictionless journal entry creation that makes daily journaling actually enjoyable and takes 30 seconds instead of 5 minutes.

## Acceptance Criteria
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

## Priority
CRITICAL - This is the core differentiator. Users must want to journal daily.

## Size
Large (L)" \
  --repo "$REPO"

# Issue #12: AI Text Analysis Engine
echo "Creating Issue #12: AI Text Analysis Engine..."
gh issue create \
  --title "AI Text Analysis Engine" \
  --label "enhancement,critical,ai" \
  --body "## Description
NLP-based analysis that extracts insights from journal text to power pattern recognition and personalized feedback.

## Acceptance Criteria
- [ ] Sentiment extraction (positive, negative, neutral)
- [ ] Emotional keyword detection (FOMO, nervous, confident, revenge, uncertain, greed, fear, etc.)
- [ ] Conviction level inference from language patterns
- [ ] Auto-tagging based on content analysis
- [ ] Store analysis metadata with each entry
- [ ] Identify strategy mentions (spreads, strangles, iron condors, etc.)
- [ ] Flag cognitive biases in language
- [ ] API endpoint for analyzing entry text
- [ ] Batch analysis for historical entries

## Technical Considerations
- Consider using OpenAI API, Anthropic Claude, or open-source NLP libraries
- Store analysis results in database for pattern recognition
- Run analysis async to avoid blocking entry creation

## Priority
CRITICAL - This powers all AI insights features

## Size
Extra Large (XL)" \
  --repo "$REPO"

# Issue #13: Weekly Insights Dashboard
echo "Creating Issue #13: Weekly Insights Dashboard..."
gh issue create \
  --title "Weekly Insights Dashboard" \
  --label "enhancement,critical,ai" \
  --body "## Description
Automated behavioral pattern summaries that make journaling rewarding by showing what actually works for the user's trading style.

## Acceptance Criteria
- [ ] Weekly summary view showing entry count, trade count, P&L
- [ ] Emotional trend analysis (most common emotions this week)
- [ ] Pattern highlights: \"High conviction trades: 68% win rate\"
- [ ] Recurring mistake detection
- [ ] Personalized feedback: \"You exit winners early when using word 'nervous'\"
- [ ] Comparison to previous weeks (improving/declining patterns)
- [ ] Most profitable mindsets/conditions
- [ ] Visual charts for emotional trends
- [ ] Email/push notification with weekly summary (optional)
- [ ] Export weekly report as PDF

## Priority
CRITICAL - Feedback loop makes journaling rewarding and drives engagement

## Size
Large (L)" \
  --repo "$REPO"

# Issue #14: Basic Pattern Recognition
echo "Creating Issue #14: Basic Pattern Recognition..."
gh issue create \
  --title "Basic Pattern Recognition" \
  --label "enhancement,ai" \
  --body "## Description
Statistical analysis correlating journal patterns with trading outcomes to surface what conditions lead to better results.

## Acceptance Criteria
- [ ] Correlate conviction levels → trade outcomes
- [ ] Track emotional keywords in winning vs losing trades
- [ ] Identify recurring patterns over time
- [ ] Simple statistical insights displayed on dashboard
- [ ] Filter patterns by date range
- [ ] Minimum threshold for pattern significance (e.g., 10+ trades)
- [ ] Visual representation of patterns (charts/graphs)
- [ ] Export pattern analysis

## Examples of Insights
- \"When you tag 'high conviction', win rate is 73%\"
- \"Trades entered with word 'FOMO' in notes: 12% win rate\"
- \"Your best trades happen when IV/HV > 1.2 AND conviction = high\"

## Priority
Medium - Builds on AI analysis engine

## Size
Medium (M)" \
  --repo "$REPO"

# Issue #15: Ticker Analysis & Auto-Population
echo "Creating Issue #15: Ticker Analysis & Auto-Population..."
gh issue create \
  --title "Ticker Analysis & Auto-Population" \
  --label "enhancement" \
  --body "## Description
Quick ticker search with one-click market snapshot attachment to journal entries. Auto-fetches key data to enrich entries without tedious manual input.

## Acceptance Criteria
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

## Important
This replaces the previous \"Trade Entry & Snapshot\" (#7) with a lighter, journal-first approach.

## Priority
Medium - Provides context but not required for every entry

## Size
Medium (M)" \
  --repo "$REPO"

echo ""
echo "✅ All new issues created!"
echo ""
echo "Now updating existing issues..."
echo ""

# Update Issue #7: Mark as superseded
echo "Updating Issue #7..."
gh issue edit 7 \
  --add-label "superseded" \
  --body "## ⚠️ SUPERSEDED BY #15

This issue has been replaced by **#15 - Ticker Analysis & Auto-Population** which takes a lighter, journal-first approach.

---

## Original Description
Create the trade entry form with full context snapshot capability.

## Original Acceptance Criteria
- Multi-leg trade support
- Capture all required fields per MVP spec
- Auto-populate from ticker analysis
- Tags and rationale text input
- Save complete snapshot to database
- Confirmation and review before save
- UUID generation for trades" \
  --repo "$REPO"

# Update Issue #8: Move to Phase 2
echo "Updating Issue #8 (Go/No-Go Precheck) - Moving to Phase 2..."
gh issue edit 8 \
  --add-label "phase-2" \
  --repo "$REPO"

# Update Issue #5: Move to Phase 2
echo "Updating Issue #5 (Options Chain) - Moving to Phase 2..."
gh issue edit 5 \
  --add-label "phase-2" \
  --repo "$REPO"

# Update Issue #10: Move to Phase 2
echo "Updating Issue #10 (CSV Import) - Moving to Phase 2..."
gh issue edit 10 \
  --add-label "phase-2" \
  --repo "$REPO"

echo ""
echo "✅ All issues updated!"
echo ""
echo "Summary of changes:"
echo "  • Created #11: Quick Journal Entry System (CRITICAL)"
echo "  • Created #12: AI Text Analysis Engine (CRITICAL)"
echo "  • Created #13: Weekly Insights Dashboard (CRITICAL)"
echo "  • Created #14: Basic Pattern Recognition"
echo "  • Created #15: Ticker Analysis & Auto-Population (replaces #7)"
echo "  • Updated #7: Marked as superseded"
echo "  • Updated #5, #8, #10: Moved to Phase 2"
echo ""
echo "View all issues: https://github.com/$REPO/issues"
