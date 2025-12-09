# PRD: Conversational AI Trading Coach

## Overview

**Problem Statement:**
Traders often need real-time guidance when making decisions, processing emotions after losses, or interpreting their behavioral patterns. Static insights lack the interactive depth needed for meaningful self-reflection and behavior change.

**Solution:**
A conversational AI coach that understands the user's trading history, emotional patterns, and market context to provide personalized guidance through natural dialogue.

**Success Metrics:**
- 60%+ of users engage with coach weekly
- Average conversation length > 3 exchanges
- User-rated helpfulness > 4/5
- Measurable improvement in bias frequency over 30 days
- Reduced emotional entries during market stress

---

## LLM Architecture

**Single Provider: OpenAI (GPT-5 Family)**

| Task | Model | Reasoning |
|------|-------|-----------|
| Conversation | GPT-5 | Complex reasoning, empathetic responses |
| Context retrieval | text-embedding-3-small | Semantic search of journal |
| Quick suggestions | GPT-5 Nano | Pre-trade checklist prompts |

**Why GPT-5 for Conversation:**
- Best at nuanced, empathetic responses
- Strong reasoning about trading psychology
- Maintains conversation coherence
- Handles complex multi-turn dialogues

---

## User Stories

### Reactive Coaching
1. As a trader who just took a loss, I want to talk through what happened with an AI that knows my patterns, so I can process the emotion constructively.
2. As a trader reviewing my weekly insights, I want to ask questions about specific patterns the AI identified.
3. As a trader seeing a bias alert, I want to understand why this bias keeps appearing and how to address it.

### Proactive Coaching
4. As a trader about to enter a trade, I want the coach to ask me relevant questions based on my past mistakes.
5. As a trader who hasn't journaled in a week, I want the coach to check in and help me reflect.
6. As a trader during a market correction, I want guidance on managing emotions based on my historical reactions.

### Learning & Growth
7. As a trader, I want the coach to teach me about specific biases using examples from my own journal.
8. As a trader, I want to set goals with the coach and track progress over time.
9. As a trader, I want the coach to celebrate my improvements and pattern-breaking moments.

---

## Feature Specifications

### 1. Chat Interface

**Core Components:**
```
┌─────────────────────────────────────────┐
│  ← Back        Trading Coach        [?] │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 🧠 Coach                            ││
│  │ I noticed you journaled about NVDA  ││
│  │ with "UNCERTAIN" mood. Your last 3  ││
│  │ NVDA entries also showed uncertainty.││
│  │ What's driving that feeling?         ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ You                            2m ago││
│  │ I keep second-guessing the entry    ││
│  │ point. Even when it moves my way,   ││
│  │ I wonder if I should've waited.     ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 🧠 Coach                            ││
│  │ That sounds like analysis paralysis. ││
│  │ Looking at your journal, you had    ││
│  │ this same feeling on Oct 15th...    ││
│  │ [View Entry]                        ││
│  │                                      ││
│  │ What helped you that time?          ││
│  └─────────────────────────────────────┘│
│                                         │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐│
│  │ Type a message...                   ││
│  └─────────────────────────────────────┘│
│  [Suggested: "Tell me more about..."]   │
│  [Suggested: "What should I do next?"]  │
└─────────────────────────────────────────┘
```

**Features:**
- Full-screen chat interface
- Message bubbles with timestamps
- Coach avatar/icon
- Suggested responses (quick replies)
- Entry references (clickable links to journal entries)
- Typing indicator during AI response
- Auto-scroll to latest message

### 2. Context-Aware Responses

**System Prompt Structure:**
```typescript
function buildCoachSystemPrompt(userId: string): string {
  const userProfile = await getUserProfile(userId);
  const recentEntries = await getRecentEntries(userId, 14); // 2 weeks
  const insights = await getWeeklyInsights(userId);
  const openPositions = await getOpenPositions(userId);

  return `You are an AI trading psychology coach for ${userProfile.name}.

## Your Role
- Help traders improve their psychological edge
- Be empathetic but honest about patterns you observe
- Ask Socratic questions to promote self-reflection
- Reference specific entries from their journal when relevant
- Never give financial advice or trade recommendations

## User Profile
- Trading style: ${userProfile.tradingStyle || 'options-focused'}
- Top tickers: ${userProfile.topTickers.join(', ')}
- Most common bias: ${userProfile.topBias}
- Current streak: ${userProfile.journalStreak} days

## Recent Patterns
- Mood distribution (14 days): ${formatMoodDistribution(recentEntries)}
- Recent biases detected: ${formatBiases(recentEntries)}
- Conviction accuracy: ${calculateConvictionAccuracy(recentEntries)}%

## Weekly Insights Summary
${insights.personalizedInsights.join('\n')}

## Open Positions
${openPositions.map(p => `${p.ticker}: ${p.strategyType}, P/L: ${p.unrealizedPL}`).join('\n')}

## Guidelines
1. Start conversations by acknowledging recent activity
2. Reference specific entries by date when discussing patterns
3. Use their own words back to them when identifying patterns
4. Celebrate improvements and streak maintenance
5. Be direct about concerning patterns (increasing losses, emotional trading)
6. Suggest journaling when appropriate
7. End conversations with actionable next steps`;
}
```

### 3. Semantic Entry Retrieval

Use embeddings to find relevant past entries:

```typescript
async function findRelevantEntries(
  userId: string,
  query: string,
  limit: number = 5
): Promise<Entry[]> {
  // Generate embedding for the query
  const queryEmbedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query
  });

  // Semantic search using pgvector
  const entries = await prisma.$queryRaw`
    SELECT *,
           1 - (embedding <=> ${queryEmbedding.data[0].embedding}::vector) as similarity
    FROM "Entry"
    WHERE "userId" = ${userId}
      AND embedding IS NOT NULL
    ORDER BY embedding <=> ${queryEmbedding.data[0].embedding}::vector
    LIMIT ${limit}
  `;

  return entries;
}
```

**When to Retrieve:**
- User mentions a ticker → find entries mentioning that ticker
- User mentions an emotion → find entries with similar mood
- User asks about a pattern → find entries demonstrating that pattern
- User mentions a date/time period → find entries from that period

### 4. Conversation Memory

**Short-term (Session):**
```typescript
interface ConversationSession {
  id: string;
  userId: string;
  messages: Message[];
  context: {
    topicsDiscussed: string[];
    entriesReferenced: string[];
    emotionalTone: 'supportive' | 'challenging' | 'celebratory';
    actionItems: string[];
  };
  startedAt: Date;
  lastMessageAt: Date;
}
```

**Long-term (Persisted):**
```prisma
model CoachSession {
  id          String   @id @default(cuid())
  userId      String

  messages    Json     // Array of messages
  summary     String?  // AI-generated session summary

  // Context
  topicsDiscussed   String[]
  entriesReferenced String[]
  actionItems       String[]

  // Outcomes
  userRating        Int?     // 1-5
  userFeedback      String?

  startedAt   DateTime @default(now())
  endedAt     DateTime?

  @@index([userId])
}

model CoachGoal {
  id          String   @id @default(cuid())
  userId      String

  goal        String   // e.g., "Reduce FOMO trades"
  metric      String?  // e.g., "FOMO bias count"
  targetValue Float?   // e.g., < 2 per week

  status      GoalStatus @default(ACTIVE)
  progress    Float      @default(0)

  startedAt   DateTime @default(now())
  completedAt DateTime?

  @@index([userId, status])
}

enum GoalStatus {
  ACTIVE
  COMPLETED
  ABANDONED
}
```

### 5. Proactive Engagement Triggers

**Trigger Conditions:**
```typescript
const COACH_TRIGGERS = {
  // After emotional entry
  emotionalEntry: {
    condition: (entry: Entry) =>
      ['ANXIOUS', 'FRUSTRATED', 'FEARFUL', 'EUPHORIC'].includes(entry.mood),
    message: "I noticed you're feeling {{mood}}. Would you like to talk through what's going on?",
    delay: 0  // Immediate
  },

  // After loss streak
  lossStreak: {
    condition: async (userId: string) => {
      const recent = await getRecentTrades(userId, 5);
      return recent.filter(t => t.outcome === 'LOSS').length >= 3;
    },
    message: "I see you've had a few tough trades. How are you processing this? I'm here if you want to talk.",
    delay: '1h'
  },

  // Bias pattern emerging
  biasAlert: {
    condition: async (userId: string, bias: string) => {
      const recentBiases = await getRecentBiases(userId, 7);
      return recentBiases.filter(b => b === bias).length >= 3;
    },
    message: "I've noticed {{bias}} showing up in your recent entries. Want to explore why this keeps happening?",
    delay: '24h'
  },

  // Pre-trade check-in
  preTradeCheckIn: {
    condition: (entry: Entry) => entry.type === 'TRADE_IDEA' && entry.conviction === 'HIGH',
    message: "Before you enter this trade, can we do a quick psychology check?",
    delay: 0
  },

  // Journal silence
  journalSilence: {
    condition: async (userId: string) => {
      const lastEntry = await getLastEntry(userId);
      return daysSince(lastEntry.createdAt) >= 3;
    },
    message: "Hey, it's been a few days since you journaled. How have your trades been going?",
    delay: '72h'
  }
};
```

### 6. Pre-Trade Psychology Check

**Structured Check-in Flow:**
```
┌─────────────────────────────────────────┐
│  Pre-Trade Check-In                     │
├─────────────────────────────────────────┤
│                                         │
│  🧠 Before entering this NVDA position, │
│  let's do a quick check...              │
│                                         │
│  1. What's your emotional state?        │
│     [😌 Calm] [😤 Excited] [😰 Anxious] │
│                                         │
│  2. Is this trade in your plan?         │
│     [Yes, planned] [No, opportunistic]  │
│                                         │
│  3. What's your exit strategy?          │
│     [Defined] [Flexible] [None yet]     │
│                                         │
│  4. If this goes against you, will you: │
│     [Cut loss at X] [Add more] [Hold]   │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Based on your answers, I notice you're │
│  entering without a defined exit. Your  │
│  past 3 trades without exits resulted   │
│  in larger-than-planned losses.         │
│                                         │
│  [Continue Anyway] [Define Exit First]  │
│                                         │
└─────────────────────────────────────────┘
```

### 7. Goal Setting & Tracking

```typescript
interface GoalTemplate {
  id: string;
  name: string;
  description: string;
  metric: string;
  suggestedTarget: number;
  timeframe: 'weekly' | 'monthly';
}

const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    id: 'reduce-fomo',
    name: 'Reduce FOMO Trades',
    description: 'Enter fewer trades driven by fear of missing out',
    metric: 'fomo_bias_count',
    suggestedTarget: 2,
    timeframe: 'weekly'
  },
  {
    id: 'journal-consistency',
    name: 'Maintain Journal Streak',
    description: 'Journal consistently on trading days',
    metric: 'journal_streak',
    suggestedTarget: 10,
    timeframe: 'weekly'
  },
  {
    id: 'conviction-accuracy',
    name: 'Improve Conviction Accuracy',
    description: 'Increase accuracy of HIGH conviction trades',
    metric: 'high_conviction_win_rate',
    suggestedTarget: 60,
    timeframe: 'monthly'
  },
  {
    id: 'emotional-awareness',
    name: 'Recognize Emotional States',
    description: 'Accurately identify mood before trading',
    metric: 'mood_accuracy_correlation',
    suggestedTarget: 70,
    timeframe: 'monthly'
  }
];
```

---

## API Endpoints

### Chat Management

```typescript
// Start or continue conversation
POST /api/coach/chat
{
  sessionId?: string;      // Omit to start new session
  message: string;
  context?: {
    currentEntry?: string; // Entry ID being discussed
    currentPosition?: string;
    trigger?: string;      // What triggered this conversation
  };
}
Response: {
  sessionId: string;
  response: {
    content: string;
    suggestions: string[];
    references: EntryReference[];
    actionItems?: string[];
  };
}

// Get conversation history
GET /api/coach/sessions
Response: {
  sessions: CoachSession[];
}

// Get specific session
GET /api/coach/sessions/:id
Response: {
  session: CoachSession;
  messages: Message[];
}

// End and rate session
POST /api/coach/sessions/:id/end
{
  rating?: number;        // 1-5
  feedback?: string;
}
```

### Goal Management

```typescript
// Create goal
POST /api/coach/goals
{
  goal: string;
  metric?: string;
  targetValue?: number;
}

// Get active goals
GET /api/coach/goals
Response: {
  goals: CoachGoal[];
}

// Update goal progress
POST /api/coach/goals/:id/progress
{
  progress: number;
  note?: string;
}

// Complete/abandon goal
POST /api/coach/goals/:id/status
{
  status: 'COMPLETED' | 'ABANDONED';
  reflection?: string;
}
```

### Proactive Triggers

```typescript
// Get pending coach prompts
GET /api/coach/prompts
Response: {
  prompts: {
    trigger: string;
    message: string;
    context: object;
    createdAt: string;
  }[];
}

// Dismiss prompt
POST /api/coach/prompts/:id/dismiss
```

---

## Conversation Flow Examples

### Example 1: Post-Loss Processing

```
User: I just got stopped out of my NVDA calls. Lost $500.

Coach: I see you closed the NVDA 140C position. Losing $500 is never easy.
Looking at your entry from 3 days ago, you mentioned feeling "CONFIDENT"
and had HIGH conviction. What changed between then and now?

User: The stock just didn't move like I expected. Maybe I sized too big.

Coach: That's an honest assessment. Looking at your history, when you
enter HIGH conviction trades above 2% of your portfolio, your win rate
drops to 45% (vs 62% for smaller sizes).

Is position sizing something you'd like to work on? We could set a goal
around that.

User: Yeah, I keep making this mistake.

Coach: Let's make it concrete. What if we set a goal: "Keep position
sizes under 2% for the next 2 weeks"? I can check in with you before
trades that would exceed this.

[Set Goal] [Maybe Later]
```

### Example 2: Pattern Recognition

```
User: Why do I keep losing money on TSLA?

Coach: Great question. Let me look at your TSLA entries...

I found 8 TSLA-related entries over the past 3 months. Here's what I notice:

1. **Timing**: 5 of 8 entries were made on high-IV days (IV rank > 70%)
2. **Direction**: You bought calls 7 times, puts once
3. **Mood**: 6 entries showed "EXCITED" or "EUPHORIC" mood

Your P/L on TSLA: -$1,200

Compare this to your AAPL trades (similar count): +$800, with more
balanced mood entries and better IV timing.

[View TSLA Entries] [View AAPL Entries]

What do you think is driving the difference?
```

### Example 3: Pre-Trade Check

```
Coach: I see you're considering a NVDA iron condor. Before you enter,
let's do a quick check...

Based on your history:
- Your iron condors have a 68% win rate ✓
- But your losses average 2x your wins ⚠️
- You tend to hold too long when threatened

Three questions:
1. What will make you exit early if one side is tested?
2. At what P/L % will you take profits?
3. How does current IV compare to your profitable IC trades?

User: Good points. I'll set my exit at 50% profit or if delta goes above 30.

Coach: That's a clear plan. Your best IC results came from exiting
at 40-50% profit. I'll note this for your trade journal.

[Create Trade Idea Entry]
```

---

## Technical Architecture

### Message Processing Pipeline

```typescript
async function processCoachMessage(
  userId: string,
  sessionId: string | null,
  userMessage: string,
  context?: MessageContext
): Promise<CoachResponse> {
  // 1. Get or create session
  const session = sessionId
    ? await getSession(sessionId)
    : await createSession(userId);

  // 2. Build context
  const systemPrompt = await buildCoachSystemPrompt(userId);
  const relevantEntries = await findRelevantEntries(userId, userMessage);
  const conversationHistory = session.messages.slice(-20); // Last 20 messages

  // 3. Generate response
  const response = await openai.chat.completions.create({
    model: 'gpt-5',
    messages: [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(m => ({
        role: m.role,
        content: m.content
      })),
      {
        role: 'user',
        content: buildUserMessage(userMessage, relevantEntries, context)
      }
    ],
    temperature: 0.7,
    max_tokens: 500
  });

  // 4. Extract references and suggestions
  const parsedResponse = parseCoachResponse(response.choices[0].message.content);

  // 5. Update session
  await updateSession(session.id, {
    messages: [
      ...session.messages,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: parsedResponse.content }
    ],
    entriesReferenced: [...session.entriesReferenced, ...parsedResponse.entryIds]
  });

  return parsedResponse;
}
```

### Embedding-Based Context

```typescript
// Generate embeddings for new entries
async function embedEntry(entry: Entry): Promise<void> {
  const textToEmbed = `
    ${entry.content}
    Type: ${entry.type}
    Mood: ${entry.mood}
    Ticker: ${entry.ticker || 'none'}
    Biases: ${entry.detectedBiases?.join(', ') || 'none'}
  `;

  const embedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: textToEmbed
  });

  await prisma.entry.update({
    where: { id: entry.id },
    data: { embedding: embedding.data[0].embedding }
  });
}
```

### Response Parsing

```typescript
interface ParsedCoachResponse {
  content: string;
  suggestions: string[];
  entryReferences: {
    entryId: string;
    excerpt: string;
    relevance: string;
  }[];
  actionItems: string[];
  goalSuggestion?: {
    goal: string;
    metric: string;
    target: number;
  };
}

function parseCoachResponse(rawResponse: string): ParsedCoachResponse {
  // Use structured output or parse markdown patterns
  // [Entry: xyz] → entry reference
  // **Action:** → action item
  // etc.
}
```

---

## Database Schema

```prisma
model CoachSession {
  id              String    @id @default(cuid())
  userId          String

  messages        Json      // Message[]

  // Session metadata
  triggerType     String?   // What started this session
  triggerEntryId  String?   // Related entry if any

  // Context tracked
  topicsDiscussed   String[]
  entriesReferenced String[]
  emotionalTone     String?

  // Outcomes
  actionItems     String[]
  goalsSet        String[]  // Goal IDs created

  // Feedback
  userRating      Int?
  userFeedback    String?
  wasHelpful      Boolean?

  startedAt       DateTime  @default(now())
  endedAt         DateTime?

  @@index([userId])
  @@index([startedAt])
}

model CoachGoal {
  id          String     @id @default(cuid())
  userId      String

  goal        String
  description String?

  // Measurement
  metricType  String?    // e.g., 'bias_count', 'win_rate'
  metricName  String?    // e.g., 'FOMO', 'HIGH_CONVICTION'
  targetValue Float?
  currentValue Float?

  // Timeline
  timeframe   GoalTimeframe @default(WEEKLY)
  startDate   DateTime   @default(now())
  endDate     DateTime?

  // Progress
  status      GoalStatus @default(ACTIVE)
  progress    Float      @default(0)
  checkIns    Json?      // Array of progress notes

  // Outcome
  completedAt DateTime?
  reflection  String?

  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([userId, status])
}

model CoachPrompt {
  id          String    @id @default(cuid())
  userId      String

  triggerType String    // e.g., 'emotional_entry', 'loss_streak'
  message     String
  context     Json?

  // State
  status      PromptStatus @default(PENDING)
  respondedAt DateTime?
  dismissedAt DateTime?

  createdAt   DateTime  @default(now())

  @@index([userId, status])
}

enum GoalTimeframe {
  DAILY
  WEEKLY
  MONTHLY
  QUARTERLY
}

enum GoalStatus {
  ACTIVE
  COMPLETED
  ABANDONED
  EXPIRED
}

enum PromptStatus {
  PENDING
  RESPONDED
  DISMISSED
}
```

---

## UI Components

### Coach Entry Point

```
┌─────────────────────────────────────────┐
│  Dashboard                              │
├─────────────────────────────────────────┤
│                                         │
│  [Weekly Insights Card]                 │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 🧠 Coach Prompt                     ││
│  │ "I noticed FOMO appearing in your  ││
│  │ recent entries. Want to discuss?"   ││
│  │                                      ││
│  │ [Chat Now]  [Dismiss]               ││
│  └─────────────────────────────────────┘│
│                                         │
│  [Recent Entries]                       │
│                                         │
└─────────────────────────────────────────┘
```

### Goal Progress Widget

```
┌─────────────────────────────────────────┐
│  Active Goals                     [+]   │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐│
│  │ 🎯 Reduce FOMO Trades              ││
│  │ Target: < 2/week                    ││
│  │ This week: 1 ████████░░ 50%        ││
│  │ Streak: 2 weeks on track           ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 📊 Position Sizing                 ││
│  │ Target: Keep under 2%               ││
│  │ Last 5 trades: ✓ ✓ ✓ ✗ ✓          ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

---

## Cost Estimates

| Component | Usage | Monthly Cost |
|-----------|-------|-------------|
| GPT-5 (conversations) | 100 exchanges | $0.50 |
| text-embedding-3-small | 500 searches | $0.01 |
| GPT-5 Nano (suggestions) | 200 prompts | $0.02 |
| **Total** | | **~$0.53/month** |

---

## Implementation Phases

### Phase 1: Core Chat (Week 1-2)
- [ ] Create chat interface component
- [ ] Implement message API endpoint
- [ ] Build system prompt with user context
- [ ] Add conversation persistence
- [ ] Create entry reference parsing

### Phase 2: Context & Retrieval (Week 2-3)
- [ ] Enable pgvector for embeddings
- [ ] Generate embeddings for existing entries
- [ ] Implement semantic search
- [ ] Add entry embedding on creation
- [ ] Create context injection for conversations

### Phase 3: Proactive Engagement (Week 3-4)
- [ ] Implement trigger detection system
- [ ] Create coach prompts database
- [ ] Build prompt display component
- [ ] Add trigger on entry creation
- [ ] Add trigger on session start

### Phase 4: Goals & Progress (Week 4-5)
- [ ] Create goals database schema
- [ ] Build goal setting UI
- [ ] Implement progress tracking
- [ ] Add goal check-in prompts
- [ ] Create progress visualization

### Phase 5: Pre-Trade Checks (Week 5-6)
- [ ] Design check-in flow
- [ ] Implement structured check component
- [ ] Connect to trade idea creation
- [ ] Add historical comparison
- [ ] Test and refine prompts

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI gives financial advice | High | Strong guardrails in system prompt; post-filter responses |
| Responses feel generic | Medium | Rich context injection; reference specific entries |
| User over-reliance on AI | Medium | Encourage self-reflection; Socratic method |
| Context window limits | Low | Summarize old sessions; prioritize recent context |

---

## Success Criteria

**MVP (Launch):**
- [ ] Chat interface functional
- [ ] Context-aware responses referencing journal entries
- [ ] Session persistence working
- [ ] Basic proactive prompts triggering

**Post-MVP (30 days):**
- [ ] 50%+ of active users try coach
- [ ] Average helpfulness rating > 4/5
- [ ] Goal completion rate > 30%
- [ ] Measurable reduction in bias frequency for engaged users
