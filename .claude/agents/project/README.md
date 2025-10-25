---
name: "Project Agents README"
---

# AI Trader Journal - Project Specialist Agents

This directory contains 7 specialized AI agents designed specifically for building the AI Trader Journal product. These agents bring domain expertise beyond the general-purpose agents in `agent-os/`.

## Why Specialized Agents?

The general `agent-os` agents (api-engineer, ui-designer, etc.) handle generic development tasks. These project-specific agents bring **deep domain expertise** for:
- AI/NLP integration patterns
- Trading psychology insights
- Financial API quirks
- Mobile-first UX patterns
- Voice/media processing
- Behavioral analytics methods

## The 7 Specialist Agents

### 1. **AI/NLP Integration Specialist** 🧠 `CRITICAL`
**File:** `ai-nlp-specialist.md`

**Expertise:**
- Sentiment analysis and emotion detection
- LLM integration (OpenAI, Anthropic, open-source)
- Prompt engineering for trading insights
- Cost optimization for AI APIs
- Keyword and pattern detection

**Use for:**
- Issue #12: AI Text Analysis Engine
- Issue #13: Weekly Insights Dashboard
- Issue #14: Basic Pattern Recognition
- Any NLP or LLM integration

**Why it's valuable:** NLP for trading psychology is a niche domain. This agent knows how to extract meaningful behavioral insights while minimizing API costs.

---

### 2. **Voice & Media Processing Specialist** 🎤 `HIGH PRIORITY`
**File:** `voice-media-specialist.md`

**Expertise:**
- Speech-to-text integration (Whisper, Google, etc.)
- Audio compression and storage
- Image optimization for mobile
- Progressive upload strategies
- Media format handling

**Use for:**
- Issue #11: Quick Journal Entry System (voice notes)
- Screenshot upload features
- Any audio/video/image processing

**Why it's valuable:** Voice transcription and media handling is complex with many edge cases (formats, compression, costs, browser compatibility). This agent navigates the tradeoffs.

---

### 3. **Behavioral Analytics Engineer** 📊 `HIGH PRIORITY`
**File:** `behavioral-analytics-engineer.md`

**Expertise:**
- Statistical correlation analysis
- Pattern detection with significance testing
- Time-series behavioral analysis
- Insight generation algorithms
- Avoiding false positives

**Use for:**
- Issue #13: Weekly Insights Dashboard
- Issue #14: Basic Pattern Recognition
- Issue #16: AI Pre-Trade Review
- Any statistical analysis of trading behavior

**Why it's valuable:** It's easy to find random patterns in small datasets. This agent ensures insights are statistically significant and actually meaningful.

---

### 4. **Financial Data Integration Specialist** 💹 `MEDIUM PRIORITY`
**File:** `financial-data-specialist.md`

**Expertise:**
- yfinance and alternative API integration
- Volatility calculations (HV, IV)
- Options chain data parsing
- Caching strategies for market data
- Handling API failures and rate limits

**Use for:**
- Issue #7: Real Market Data Integration
- Issue #15: Ticker Analysis & Auto-Population
- Options chain features
- HV/IV calculation optimization

**Why it's valuable:** Financial APIs are notoriously unreliable. This agent knows the quirks, fallback strategies, and cost optimizations.

---

### 5. **Mobile-First UX Specialist** 📱 `MEDIUM PRIORITY`
**File:** `mobile-ux-specialist.md`

**Expertise:**
- Touch-optimized interfaces
- 30-second entry flows
- One-tap interactions
- PWA optimization
- Mobile performance

**Use for:**
- Issue #11: Quick Journal Entry System
- Issue #11: Mobile Responsive Design Polish
- Any UI prioritizing mobile experience

**Why it's valuable:** "30-second journaling" is a core promise. This agent knows mobile patterns (bottom sheets, FABs, swipe gestures) that make rapid entry possible.

---

### 6. **Trading Psychology & Product Advisor** 🧘 `VALUABLE`
**File:** `trading-psychology-advisor.md`

**Expertise:**
- Cognitive biases in trading
- Behavioral feedback design
- What insights drive behavior change
- Avoiding counterproductive feedback
- Habit formation strategies

**Use for:**
- Issue #12: AI Analysis (which biases to detect)
- Issue #13: Weekly Insights (phrasing feedback)
- Issue #14: Pattern Recognition (which patterns matter)
- Validating product decisions

**Why it's valuable:** Technical correctness ≠ helpful feedback. This agent ensures AI insights are psychologically meaningful and drive actual improvement.

---

### 7. **Research Specialist** 🔍 `KNOWLEDGE MULTIPLIER`
**File:** `research-specialist.md`

**Expertise:**
- Deep technical research
- API and library comparisons
- Academic literature reviews
- Competitive analysis
- Best practices synthesis

**Use for:**
- Supporting ALL other agents when they need research
- Comparing technical options before decisions
- Finding academic papers on trading psychology, NLP, etc.
- Evaluating alternatives to current approaches

**Why it's valuable:** Acts as the knowledge base for all other agents. When any specialist needs deep domain knowledge, they invoke the Research Specialist.

---

## How to Use These Agents

### Option 1: Direct Invocation (from your prompts)
```
I need help implementing voice transcription for journal entries.
Please invoke the Voice & Media Processing Specialist agent.
```

### Option 2: Agent-to-Agent Collaboration
Specialist agents can invoke each other:
```
AI/NLP Specialist working on sentiment analysis might invoke:
→ Research Specialist: "Compare sentiment analysis models"
→ Trading Psychology Advisor: "Validate these detected biases"
```

### Option 3: During Planning
```
Before implementing Issue #12, invoke:
- AI/NLP Specialist (for technical approach)
- Research Specialist (for API comparisons)
- Trading Psychology Advisor (for which biases to detect)
```

## Agent Collaboration Map

```
                    Research Specialist
                            ↓
                    (provides research to)
                            ↓
        ┌───────────────────┼───────────────────┐
        ↓                   ↓                   ↓
  AI/NLP Specialist   Financial Data    Voice/Media
        ↓                Specialist         Specialist
        ↓                                       ↓
  Behavioral Analytics                   Mobile UX
        ↓                                  Specialist
        ↓
  Trading Psychology
      Advisor
```

## When to Use Which Agent

| Task | Primary Agent | Supporting Agents |
|------|--------------|-------------------|
| Sentiment analysis | AI/NLP Specialist | Research, Trading Psychology |
| Voice transcription | Voice/Media Specialist | Research |
| Pattern detection | Behavioral Analytics | Trading Psychology, AI/NLP |
| Market data API | Financial Data | Research |
| Quick entry UX | Mobile UX | Voice/Media |
| Weekly insights | Behavioral Analytics | AI/NLP, Trading Psychology |
| Validate feedback | Trading Psychology | Research |
| Compare APIs | Research Specialist | (invoked by others) |

## Success Metrics

These agents are successful if:
- **Technical decisions are better informed** (less trial-and-error)
- **Domain expertise prevents common pitfalls** (e.g., false pattern detection)
- **Implementation time is faster** (agent knows the tradeoffs already)
- **Product quality is higher** (psychologically meaningful insights, not just technically correct)
- **Costs are optimized** (agents know cost tradeoffs for APIs, models)

## Files Location

```
.claude/agents/project/
├── README.md (this file)
├── ai-nlp-specialist.md
├── voice-media-specialist.md
├── behavioral-analytics-engineer.md
├── financial-data-specialist.md
├── mobile-ux-specialist.md
├── trading-psychology-advisor.md
└── research-specialist.md
```

## Agent vs General Development

| Scenario | Use General Agent | Use Specialist Agent |
|----------|-------------------|---------------------|
| Basic CRUD API | api-engineer | - |
| Sentiment analysis | - | AI/NLP Specialist |
| Standard form UI | ui-designer | - |
| 30-second entry flow | - | Mobile UX Specialist |
| Database schema | database-engineer | - |
| Pattern recognition | - | Behavioral Analytics |
| Market data caching | - | Financial Data |

**Rule of thumb:** Use specialists for domain-specific challenges, general agents for standard development tasks.

## Next Steps

1. **Familiarize yourself** with each agent's capabilities
2. **Invoke specialists proactively** during planning phases
3. **Let agents collaborate** - they can call each other
4. **Iterate on agent definitions** - add learnings as you go
5. **Measure impact** - are specialized agents actually helping?

---

*These agents are designed to accelerate development of AI Trader Journal by bringing deep domain expertise to each technical challenge. Use them liberally during planning and implementation.*
