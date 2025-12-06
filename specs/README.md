# Product Specifications

This folder contains PRDs (Product Requirement Documents) for the next phase of AI Trader Journal development.

---

## The Core Problem: The Motivation Gap

Based on user research, traders stop journaling exactly when it would help most:
- During market drawdowns
- When emotionally disengaged
- When their portfolio is underperforming

**The solution is a multi-pronged approach:**
1. **Reduce friction** - Voice memos, screenshots, quick capture
2. **Proactive engagement** - Reach out during difficult market periods
3. **Pattern recognition** - Surface behavioral insights over time
4. **Context surfacing** - Auto-fetch relevant market data and history

---

## Architecture Decision: Single Provider (OpenAI)

After extensive research comparing OpenAI, Anthropic (Claude), and Google (Gemini), we chose a **single-provider architecture** using OpenAI's GPT-5 family.

### Why Single Provider?

| Multi-Provider | Single Provider (Chosen) |
|----------------|-------------------------|
| 3 SDKs to maintain | 1 SDK |
| 3 different error patterns | Consistent handling |
| 3 API keys for users | 1 API key |
| Variable reliability | Excellent reliability |
| ~$0.85/month | **~$0.50/month** |

### OpenAI Model Selection

| Model | Cost (per 1M tokens) | Use For |
|-------|---------------------|---------|
| **GPT-5 Nano** | $0.05 / $0.40 | Entry analysis, quick inference |
| **GPT-5 Mini** | $0.25 / $2.00 | Vision (screenshots) |
| **GPT-5** | $1.25 / $10.00 | Weekly insights, pattern analysis |
| **Whisper** | $0.006/min | Voice transcription |
| **text-embedding-3-small** | $0.02 | Semantic similarity |

**Key insight:** GPT-5 Nano ($0.05/$0.40) is actually **cheaper than Gemini Flash** while keeping everything in one ecosystem with excellent reliability.

---

## Specifications

| # | Document | Focus | Monthly Cost |
|---|----------|-------|--------------|
| 1 | [Frictionless Capture](./01-frictionless-capture.md) | Voice, screenshots, quick-entry | ~$0.35 |
| 2 | [Proactive Engagement](./02-proactive-engagement.md) | Notifications, motivation gap | ~$0.04 |
| 3 | [Pattern Recognition](./03-pattern-recognition.md) | Behavioral patterns | ~$0.12 |
| 4 | [Context Surfacing](./04-context-surfacing.md) | Market data, history | ~$0.06 |
| | **TOTAL** | | **~$0.57/month** |

## Implementation Tasks

See [TASKS.md](./TASKS.md) for the complete breakdown with code examples.

---

## Recommended Implementation Order

```
Phase 1: Foundation (MVP)
├── Voice recording + Whisper transcription
├── Quick capture with auto-inference (GPT-5 Nano)
├── Daily reflection notifications (in-app)
└── Basic ticker context

Phase 2: Engagement
├── Screenshot analysis (GPT-5 Mini vision)
├── Push notifications
├── Market condition alerts
└── "From Your Past Self" (embeddings)

Phase 3: Intelligence
├── Full pattern recognition (GPT-5)
├── Monthly behavioral reports
├── Real-time pattern alerts
└── Strategy-specific context

Phase 4: Polish
├── Pattern breaking recognition
├── Outcome tracking
└── A/B testing refinements
```

---

## Key User Insights Driving These Specs

| User Said | Feature Response |
|-----------|------------------|
| "I stop journaling during drawdowns" | Proactive engagement with market alerts |
| "I want to voice memo from bed" | Frictionless capture with Whisper |
| "Organize automatically, not manually" | GPT-5 Nano auto-inference |
| "Show me my past self" | Embedding-based similarity search |
| "Help me notice what I can't see" | GPT-5 pattern detection |

---

## Cost Summary

**Total estimated monthly cost: ~$0.57**

| Component | Cost |
|-----------|------|
| Whisper (50 voice memos) | $0.30 |
| GPT-5 Nano (routine tasks) | $0.05 |
| GPT-5 Mini (screenshots) | $0.02 |
| GPT-5 (insights, patterns) | $0.18 |
| Embeddings | $0.02 |
| yfinance (market data) | $0.00 |
| Cloudflare R2 (storage) | Free tier |
| Vercel Cron | Free tier |

Compare to multi-provider approach: ~$0.85/month with more complexity.

---

## Technical Prerequisites

Before implementing:

1. **OpenAI API Key** - Already configured (OPENAI_API_KEY)
2. **Cloudflare R2** - For media storage (voice/images)
3. **pgvector Extension** - Enable in Supabase for embeddings
4. **VAPID Keys** - For push notifications

---

## MVP Definition

**Must have for first release:**
- [ ] Voice recording + transcription
- [ ] Quick capture with auto-inference
- [ ] Daily reflection prompt (in-app)
- [ ] Basic ticker context panel
- [ ] Bias frequency in weekly insights

**Not in MVP (post-launch):**
- Screenshot analysis
- Push notifications
- Market condition alerts
- Full pattern recognition
- Historical context with embeddings

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Entries during drawdowns | 2x increase |
| Voice/screenshot usage | 30%+ of entries |
| Notification engagement | 40%+ |
| Pattern insights shown | 80% of users (30+ entries) |
| Context rated "helpful" | 60%+ |

---

## File Structure

```
specs/
├── README.md                    # This file
├── 01-frictionless-capture.md   # Voice, screenshots, quick capture
├── 02-proactive-engagement.md   # Notifications, market alerts
├── 03-pattern-recognition.md    # Behavioral patterns
├── 04-context-surfacing.md      # Market data, ticker history
└── TASKS.md                     # Implementation task list
```
