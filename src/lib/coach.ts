/**
 * AI Trading Coach Service
 *
 * Provides conversational AI coaching for trading psychology using Claude Sonnet.
 * Includes context-aware responses, entry retrieval, and session management.
 */

import { prisma } from './prisma';
import {
  getClaude,
  CLAUDE_MODELS,
  extractTextContent,
  parseJsonResponse,
  isClaudeConfigured,
} from './claude';
import { Entry, CoachSession, CoachGoal, EntryMood, Prisma } from '@prisma/client';
import { subDays, format } from 'date-fns';

/**
 * Goal templates for common trading psychology objectives
 */
export const GOAL_TEMPLATES = [
  {
    id: 'reduce-fomo',
    name: 'Reduce FOMO Trades',
    description: 'Enter fewer trades driven by fear of missing out',
    metricType: 'bias_count',
    metricName: 'fomo',
    suggestedTarget: 2,
    timeframe: 'WEEKLY' as const,
  },
  {
    id: 'journal-consistency',
    name: 'Maintain Journal Streak',
    description: 'Journal consistently on trading days',
    metricType: 'streak',
    metricName: 'journal_streak',
    suggestedTarget: 10,
    timeframe: 'WEEKLY' as const,
  },
  {
    id: 'conviction-accuracy',
    name: 'Improve Conviction Accuracy',
    description: 'Increase accuracy of HIGH conviction trades',
    metricType: 'win_rate',
    metricName: 'high_conviction_win_rate',
    suggestedTarget: 60,
    timeframe: 'MONTHLY' as const,
  },
  {
    id: 'emotional-awareness',
    name: 'Recognize Emotional States',
    description: 'Accurately identify mood before trading',
    metricType: 'correlation',
    metricName: 'mood_accuracy_correlation',
    suggestedTarget: 70,
    timeframe: 'MONTHLY' as const,
  },
  {
    id: 'reduce-revenge-trading',
    name: 'Eliminate Revenge Trading',
    description: 'Avoid trading to recover losses emotionally',
    metricType: 'bias_count',
    metricName: 'revenge_trading',
    suggestedTarget: 0,
    timeframe: 'WEEKLY' as const,
  },
  {
    id: 'position-sizing',
    name: 'Consistent Position Sizing',
    description: 'Keep position sizes under 2% of portfolio',
    metricType: 'compliance',
    metricName: 'position_size_compliance',
    suggestedTarget: 100,
    timeframe: 'WEEKLY' as const,
  },
] as const;

export interface CoachMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface CoachContext {
  currentEntry?: string;
  currentPosition?: string;
  trigger?: string;
}

export interface EntryReference {
  entryId: string;
  excerpt: string;
  date: string;
  relevance: string;
}

export interface CoachResponse {
  content: string;
  suggestions: string[];
  references: EntryReference[];
  actionItems: string[];
}

interface UserContext {
  recentEntries: Entry[];
  moodDistribution: Record<string, number>;
  topBiases: Array<{ bias: string; count: number }>;
  currentStreak: number;
  activeGoals: CoachGoal[];
  topTickers: string[];
}

/**
 * Fetches user context for building the system prompt
 */
async function getUserContext(): Promise<UserContext> {
  const fourteenDaysAgo = subDays(new Date(), 14);

  // Fetch recent entries from the last 14 days
  const recentEntries = await prisma.entry.findMany({
    where: {
      createdAt: {
        gte: fourteenDaysAgo,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  });

  // Calculate mood distribution
  const moodDistribution: Record<string, number> = {};
  recentEntries.forEach((entry) => {
    if (entry.mood) {
      moodDistribution[entry.mood] = (moodDistribution[entry.mood] || 0) + 1;
    }
  });

  // Calculate top biases
  const biasCount: Record<string, number> = {};
  recentEntries.forEach((entry) => {
    if (entry.detectedBiases && Array.isArray(entry.detectedBiases)) {
      entry.detectedBiases.forEach((bias: string) => {
        biasCount[bias] = (biasCount[bias] || 0) + 1;
      });
    }
  });

  const topBiases = Object.entries(biasCount)
    .map(([bias, count]) => ({ bias, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Get current streak from settings
  const settings = await prisma.settings.findFirst({
    where: { id: 'default' },
  });
  const currentStreak = settings?.currentStreak || 0;

  // Get active goals
  const activeGoals = await prisma.coachGoal.findMany({
    where: {
      status: 'ACTIVE',
    },
    orderBy: {
      startDate: 'desc',
    },
  });

  // Calculate top tickers
  const tickerCount: Record<string, number> = {};
  recentEntries.forEach((entry) => {
    if (entry.ticker) {
      tickerCount[entry.ticker] = (tickerCount[entry.ticker] || 0) + 1;
    }
  });

  const topTickers = Object.entries(tickerCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([ticker]) => ticker);

  return {
    recentEntries,
    moodDistribution,
    topBiases,
    currentStreak,
    activeGoals,
    topTickers,
  };
}

/**
 * Formats mood distribution for the system prompt
 */
function formatMoodDistribution(distribution: Record<string, number>): string {
  const entries = Object.entries(distribution);
  if (entries.length === 0) return 'No mood data available';

  return entries
    .sort((a, b) => b[1] - a[1])
    .map(([mood, count]) => `${mood}: ${count}`)
    .join(', ');
}

/**
 * Formats goals for the system prompt
 */
function formatGoals(goals: CoachGoal[]): string {
  if (goals.length === 0) return 'No active goals';

  return goals
    .map(
      (g) =>
        `- ${g.goal} (Progress: ${g.progress}%, Target: ${g.targetValue || 'N/A'})`
    )
    .join('\n');
}

/**
 * Builds the context-aware system prompt for the coach
 */
export async function buildCoachSystemPrompt(): Promise<string> {
  const context = await getUserContext();

  const topBiasStr =
    context.topBiases.length > 0
      ? context.topBiases.map((b) => `${b.bias} (${b.count}x)`).join(', ')
      : 'None detected';

  return `You are an AI trading psychology coach helping a trader improve their psychological edge.

## Your Role
- Help traders improve their psychological edge through self-reflection
- Be empathetic but honest about patterns you observe
- Ask Socratic questions to promote self-discovery
- Reference specific entries from their journal when relevant
- NEVER give financial advice or specific trade recommendations
- NEVER tell them to buy, sell, or hold any specific security
- Focus on psychology, emotions, process, and behavior patterns
- Celebrate improvements and pattern-breaking moments
- Suggest journaling when appropriate

## User Profile
- Trading style: Options-focused
- Top tickers: ${context.topTickers.length > 0 ? context.topTickers.join(', ') : 'Not enough data'}
- Most common biases: ${topBiasStr}
- Current journal streak: ${context.currentStreak} days

## Recent Patterns (Last 14 Days)
- Mood distribution: ${formatMoodDistribution(context.moodDistribution)}
- Total entries: ${context.recentEntries.length}

## Active Goals
${formatGoals(context.activeGoals)}

## Guidelines
1. Start conversations by acknowledging recent activity or emotions
2. Reference specific entries by date when discussing patterns
3. Use their own words back to them when identifying patterns
4. Celebrate improvements and streak maintenance
5. Be direct about concerning patterns (increasing losses, emotional trading)
6. Suggest journaling when appropriate
7. End conversations with actionable next steps
8. Keep responses concise but thoughtful (2-3 paragraphs max)

## Response Format
When referencing journal entries, use this format: [Entry: DATE - brief excerpt]
When suggesting action items, clearly label them.
Provide 2-3 suggested follow-up responses the user might want to explore.`;
}

/**
 * Finds relevant past entries based on the user's message
 * Uses keyword and content matching (vector search can be added later with pgvector)
 */
export async function findRelevantEntries(
  query: string,
  limit: number = 5
): Promise<Entry[]> {
  // Extract potential keywords from the query
  const keywords = query.toLowerCase().split(/\s+/).filter((word) => word.length > 3);

  // Look for ticker symbols (uppercase, 1-5 letters)
  const tickerMatch = query.match(/\b[A-Z]{1,5}\b/g);
  const tickers = tickerMatch || [];

  // Build search conditions
  const searchConditions: Prisma.EntryWhereInput[] = [];

  // Search by ticker
  if (tickers.length > 0) {
    searchConditions.push({
      ticker: {
        in: tickers,
      },
    });
  }

  // Search by content keywords
  if (keywords.length > 0) {
    searchConditions.push({
      content: {
        contains: keywords[0],
        mode: 'insensitive' as const,
      },
    });
  }

  // Check for mood-related queries
  const moodKeywords = [
    'anxious',
    'nervous',
    'confident',
    'uncertain',
    'excited',
    'neutral',
    'frustrated',
    'fearful',
    'calm',
  ];
  const mentionedMood = moodKeywords.find((m) =>
    query.toLowerCase().includes(m)
  );

  if (mentionedMood) {
    const moodMap: Record<string, EntryMood> = {
      anxious: 'NERVOUS',
      nervous: 'NERVOUS',
      confident: 'CONFIDENT',
      uncertain: 'UNCERTAIN',
      excited: 'EXCITED',
      neutral: 'NEUTRAL',
      frustrated: 'NERVOUS',
      fearful: 'NERVOUS',
      calm: 'CONFIDENT',
    };
    searchConditions.push({
      mood: moodMap[mentionedMood],
    });
  }

  // Check for bias-related queries
  const biasKeywords = [
    'fomo',
    'revenge',
    'overconfidence',
    'confirmation',
    'anchoring',
    'loss aversion',
    'recency',
    'herd',
  ];
  const mentionedBias = biasKeywords.find((b) =>
    query.toLowerCase().includes(b)
  );

  if (mentionedBias) {
    const biasMap: Record<string, string> = {
      fomo: 'fomo',
      revenge: 'revenge_trading',
      overconfidence: 'overconfidence',
      confirmation: 'confirmation_bias',
      anchoring: 'anchoring',
      'loss aversion': 'loss_aversion',
      recency: 'recency_bias',
      herd: 'herd_mentality',
    };
    searchConditions.push({
      detectedBiases: {
        has: biasMap[mentionedBias],
      },
    });
  }

  // If no specific conditions, get recent entries
  if (searchConditions.length === 0) {
    return prisma.entry.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  // Query with OR conditions
  const entries = await prisma.entry.findMany({
    where: {
      OR: searchConditions,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });

  return entries;
}

/**
 * Formats entries for context injection in the conversation
 */
function formatEntriesForContext(entries: Entry[]): string {
  if (entries.length === 0) return '';

  return entries
    .map((entry) => {
      const date = format(entry.createdAt, 'MMM d, yyyy');
      const excerpt =
        entry.content.length > 200
          ? entry.content.slice(0, 200) + '...'
          : entry.content;
      return `[${date}] (${entry.type}, ${entry.mood || 'no mood'}) ${excerpt}`;
    })
    .join('\n\n');
}

interface RawCoachResponse {
  content?: string;
  suggestions?: string[];
  entryReferences?: Array<{
    entryId: string;
    excerpt: string;
    date: string;
    relevance: string;
  }>;
  actionItems?: string[];
}

/**
 * Processes a user message and generates a coach response
 */
export async function processCoachMessage(
  sessionId: string | null,
  userMessage: string,
  context?: CoachContext
): Promise<{
  sessionId: string;
  response: CoachResponse;
  session: CoachSession;
}> {
  if (!isClaudeConfigured()) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  // Get or create session
  let session: CoachSession;
  if (sessionId) {
    const existing = await prisma.coachSession.findUnique({
      where: { id: sessionId },
    });
    if (!existing) {
      throw new Error('Session not found');
    }
    session = existing;
  } else {
    session = await prisma.coachSession.create({
      data: {
        messages: [],
        triggerType: context?.trigger || null,
        triggerEntryId: context?.currentEntry || null,
        topicsDiscussed: [],
        entriesReferenced: [],
        actionItems: [],
        goalsSet: [],
      },
    });
  }

  // Get existing messages from session (cast through unknown for JSON field)
  const existingMessages = (session.messages as unknown as CoachMessage[]) || [];

  // Build system prompt
  const systemPrompt = await buildCoachSystemPrompt();

  // Find relevant entries for context
  const relevantEntries = await findRelevantEntries(userMessage);
  const entriesContext = formatEntriesForContext(relevantEntries);

  // Build the user message with context
  let enhancedMessage = userMessage;
  if (entriesContext) {
    enhancedMessage += `\n\n[RELEVANT JOURNAL ENTRIES FOR CONTEXT:]\n${entriesContext}`;
  }
  if (context?.currentEntry) {
    enhancedMessage += `\n\n[Currently discussing entry ID: ${context.currentEntry}]`;
  }

  // Build conversation history for Claude
  const conversationHistory = existingMessages.slice(-20).map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  try {
    const claude = getClaude();

    const response = await claude.messages.create({
      model: CLAUDE_MODELS.BALANCED, // Sonnet for conversational quality
      max_tokens: 1000,
      system: `${systemPrompt}

IMPORTANT: Structure your response as JSON with this format:
{
  "content": "Your conversational response here",
  "suggestions": ["Suggested follow-up 1", "Suggested follow-up 2", "Suggested follow-up 3"],
  "entryReferences": [{"entryId": "id", "excerpt": "brief quote", "date": "date", "relevance": "why relevant"}],
  "actionItems": ["Action item 1", "Action item 2"]
}

Only include entryReferences if you're referencing specific entries.
Always provide 2-3 suggestions for follow-up questions.
Include actionItems when there are clear next steps for the user.`,
      messages: [
        ...conversationHistory,
        {
          role: 'user',
          content: enhancedMessage,
        },
      ],
    });

    // Try to parse structured response
    let coachResponse: CoachResponse;
    const parsed = parseJsonResponse<RawCoachResponse>(response);

    if (parsed && parsed.content) {
      coachResponse = {
        content: parsed.content,
        suggestions: parsed.suggestions || [],
        references: (parsed.entryReferences || []).map((ref) => ({
          entryId: ref.entryId || '',
          excerpt: ref.excerpt || '',
          date: ref.date || '',
          relevance: ref.relevance || '',
        })),
        actionItems: parsed.actionItems || [],
      };
    } else {
      // Fallback to plain text response
      const textContent = extractTextContent(response);
      coachResponse = {
        content: textContent,
        suggestions: [],
        references: [],
        actionItems: [],
      };
    }

    // Update session with new messages
    const newMessages: CoachMessage[] = [
      ...existingMessages,
      {
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
      },
      {
        role: 'assistant',
        content: coachResponse.content,
        timestamp: new Date().toISOString(),
      },
    ];

    // Update referenced entries - use Array.from for deduplication
    const referencedSet = new Set([
      ...session.entriesReferenced,
      ...relevantEntries.map((e) => e.id),
    ]);

    // Update action items - use Array.from for deduplication
    const actionItemsSet = new Set([
      ...session.actionItems,
      ...coachResponse.actionItems,
    ]);

    const updatedSession = await prisma.coachSession.update({
      where: { id: session.id },
      data: {
        messages: newMessages as unknown as Prisma.InputJsonValue,
        entriesReferenced: Array.from(referencedSet),
        actionItems: Array.from(actionItemsSet),
      },
    });

    return {
      sessionId: session.id,
      response: coachResponse,
      session: updatedSession,
    };
  } catch (error) {
    console.error('Error processing coach message:', error);
    throw error;
  }
}

/**
 * Generates a session summary using AI
 */
export async function generateSessionSummary(
  session: CoachSession
): Promise<string> {
  const messages = session.messages as unknown as CoachMessage[];
  if (!messages || messages.length === 0) return '';

  if (!isClaudeConfigured()) {
    return 'Session summary unavailable';
  }

  const conversationText = messages
    .map((m) => `${m.role === 'user' ? 'Trader' : 'Coach'}: ${m.content}`)
    .join('\n\n');

  try {
    const claude = getClaude();

    const response = await claude.messages.create({
      model: CLAUDE_MODELS.FAST, // Haiku for quick summary
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `Summarize this coaching conversation in 2-3 sentences, focusing on the main topic discussed and any insights or action items that emerged:

${conversationText}`,
        },
      ],
    });

    return extractTextContent(response);
  } catch (error) {
    console.error('Error generating session summary:', error);
    return 'Summary generation failed';
  }
}
