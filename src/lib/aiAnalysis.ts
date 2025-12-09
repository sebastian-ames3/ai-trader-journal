/**
 * AI Text Analysis Service
 *
 * Uses Claude Haiku for fast, efficient analysis of journal entry text:
 * - Sentiment (positive/negative/neutral)
 * - Emotional keywords
 * - Cognitive biases
 * - Inferred conviction level
 * - Auto-generated tags
 */

import { ConvictionLevel } from '@prisma/client';
import {
  getClaude,
  CLAUDE_MODELS,
  parseJsonResponse,
  isClaudeConfigured,
} from '@/lib/claude';

export interface AnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  emotionalKeywords: string[];
  detectedBiases: string[];
  convictionInferred: ConvictionLevel | null;
  confidence: number; // 0-1 score of AI confidence in analysis
  aiTags: string[]; // Auto-generated tags from taxonomy
}

/**
 * Analyzes journal entry text using Claude Haiku
 * @param content - The journal entry text to analyze
 * @param userMood - Optional user-selected mood for comparison
 * @param userConviction - Optional user-selected conviction for comparison
 */
export async function analyzeEntryText(
  content: string,
  userMood?: string,
  userConviction?: string
): Promise<AnalysisResult> {
  // Validate inputs
  if (!content || content.trim().length === 0) {
    throw new Error('Content cannot be empty');
  }

  if (!isClaudeConfigured()) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  // Build the analysis prompt
  const prompt = buildAnalysisPrompt(content, userMood, userConviction);

  try {
    const claude = getClaude();

    const response = await claude.messages.create({
      model: CLAUDE_MODELS.FAST, // Haiku for fast, cheap analysis
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      system:
        'You are a trading psychology analyst. Extract psychological insights from trading journal entries. Always respond with valid JSON only, no markdown formatting.',
    });

    // Parse the JSON response
    const parsed = parseJsonResponse<RawAnalysisResponse>(response);
    return parseAnalysisResponse(parsed);
  } catch (error) {
    console.error('Error calling Claude API:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    throw new Error(
      `Failed to analyze entry text: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

interface RawAnalysisResponse {
  sentiment?: string;
  emotionalKeywords?: string[];
  detectedBiases?: string[];
  convictionInferred?: string;
  confidence?: number;
  aiTags?: string[];
}

/**
 * Builds the analysis prompt for Claude
 */
function buildAnalysisPrompt(
  content: string,
  userMood?: string,
  userConviction?: string
): string {
  return `Analyze this trading journal entry and extract psychological insights.

JOURNAL ENTRY:
"""
${content}
"""

${userMood ? `USER'S SELF-REPORTED MOOD: ${userMood}` : ''}
${userConviction ? `USER'S SELF-REPORTED CONVICTION: ${userConviction}` : ''}

Respond with ONLY valid JSON in this exact format:
{
  "sentiment": "positive" | "negative" | "neutral",
  "emotionalKeywords": ["keyword1", "keyword2", ...],
  "detectedBiases": ["bias1", "bias2", ...],
  "convictionInferred": "LOW" | "MEDIUM" | "HIGH" | null,
  "confidence": 0.0 to 1.0,
  "aiTags": ["tag1", "tag2", ...]
}

INSTRUCTIONS:
1. SENTIMENT: Classify overall emotional tone
   - "positive": Confident, optimistic, calm, disciplined
   - "negative": Anxious, fearful, frustrated, defeated
   - "neutral": Analytical, objective, matter-of-fact

2. EMOTIONAL KEYWORDS: Extract 3-7 emotion-related words found or implied in the text
   Examples: "nervous", "confident", "FOMO", "revenge", "uncertain", "excited", "fearful", "greedy", "patient", "impulsive", "disciplined", "anxious", "calm", "frustrated"

3. DETECTED BIASES: Identify cognitive biases if present (max 5):
   - "confirmation_bias": Seeking data that confirms existing belief
   - "recency_bias": Overweighting recent events
   - "loss_aversion": Fear of losses dominating decision-making
   - "overconfidence": Excessive certainty without supporting evidence
   - "fomo": Fear of missing out driving decision
   - "revenge_trading": Trying to recover losses emotionally
   - "anchoring": Fixated on specific price/outcome
   - "herd_mentality": Following crowd without independent analysis
   - "outcome_bias": Judging decision by result rather than process

4. CONVICTION INFERRED: Based on language certainty and decisiveness
   - "HIGH": Strong, decisive language ("definitely", "certain", "clear")
   - "MEDIUM": Moderate confidence ("likely", "probably", "seems")
   - "LOW": Uncertain language ("maybe", "not sure", "questioning")
   - null: If conviction level is unclear

5. CONFIDENCE: Your confidence in this analysis (0.0-1.0)
   - 0.8-1.0: Very clear emotional content
   - 0.5-0.8: Moderate emotional content
   - 0.0-0.5: Minimal emotional content or very analytical entry

6. AI_TAGS: Extract 3-7 relevant tags from this taxonomy based on entry content:

   TRADE TYPE/STRATEGY:
   - long-call, long-put, options, spreads, covered-call, cash-secured-put
   - vertical-spread, iron-condor, iron-butterfly, straddle, strangle
   - wheel-strategy, earnings-play

   MARKET VIEW:
   - bullish, bearish, neutral, high-volatility, low-volatility
   - trending, range-bound, uncertain-market

   ENTRY CATALYST:
   - technical-analysis, chart-pattern, support-resistance, moving-average
   - fundamental-analysis, news-catalyst, earnings, sector-rotation
   - market-correlation, indicator-signal

   PSYCHOLOGICAL STATE:
   - disciplined, patient, well-researched, emotional, rushed
   - impulse-trade, overthinking, stressed, focused, distracted
   - confident-execution, hesitant

   RISK ASSESSMENT:
   - defined-risk, undefined-risk, position-sized, stop-loss-planned
   - profit-target-set, risk-reward-favorable, hedged, concentrated-position

   OUTCOME CONTEXT:
   - learning-experience, mistake-identified, good-process, bad-process, needs-review

   Rules:
   - Only use tags from the taxonomy above
   - Select 3-7 most relevant tags
   - Consider: strategy mentioned, market view, emotional state, process quality
   - Prioritize tags that add searchable context

Return ONLY the JSON object, no markdown formatting.`;
}

/**
 * Parses Claude's JSON response into AnalysisResult
 */
function parseAnalysisResponse(parsed: RawAnalysisResponse | null): AnalysisResult {
  if (!parsed) {
    // Return safe defaults on parse error
    return {
      sentiment: 'neutral',
      emotionalKeywords: [],
      detectedBiases: [],
      convictionInferred: null,
      confidence: 0,
      aiTags: [],
    };
  }

  return {
    sentiment: validateSentiment(parsed.sentiment),
    emotionalKeywords: Array.isArray(parsed.emotionalKeywords)
      ? parsed.emotionalKeywords.slice(0, 10)
      : [],
    detectedBiases: Array.isArray(parsed.detectedBiases)
      ? parsed.detectedBiases.slice(0, 5)
      : [],
    convictionInferred: validateConviction(parsed.convictionInferred),
    confidence:
      typeof parsed.confidence === 'number'
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.5,
    aiTags: Array.isArray(parsed.aiTags) ? parsed.aiTags.slice(0, 7) : [],
  };
}

/**
 * Validates sentiment value
 */
function validateSentiment(value: unknown): 'positive' | 'negative' | 'neutral' {
  if (value === 'positive' || value === 'negative' || value === 'neutral') {
    return value;
  }
  return 'neutral';
}

/**
 * Validates conviction level
 */
function validateConviction(value: unknown): ConvictionLevel | null {
  if (value === 'LOW' || value === 'MEDIUM' || value === 'HIGH') {
    return value as ConvictionLevel;
  }
  return null;
}

/**
 * Analyzes multiple entries in batch (for historical analysis)
 * Rate-limited to avoid API throttling
 * @param entries - Array of { id, content, mood, conviction }
 */
export async function batchAnalyzeEntries(
  entries: Array<{
    id: string;
    content: string;
    mood?: string;
    conviction?: string;
  }>
): Promise<Array<{ id: string; analysis: AnalysisResult }>> {
  const results: Array<{ id: string; analysis: AnalysisResult }> = [];

  // Process in batches of 5 with 1 second delay between batches
  // This prevents rate limiting
  for (let i = 0; i < entries.length; i += 5) {
    const batch = entries.slice(i, i + 5);

    const batchPromises = batch.map(async (entry) => {
      try {
        const analysis = await analyzeEntryText(
          entry.content,
          entry.mood,
          entry.conviction
        );
        return { id: entry.id, analysis };
      } catch (error) {
        console.error(`Failed to analyze entry ${entry.id}:`, error);
        // Return neutral analysis on error
        return {
          id: entry.id,
          analysis: {
            sentiment: 'neutral' as const,
            emotionalKeywords: [],
            detectedBiases: [],
            convictionInferred: null,
            confidence: 0,
            aiTags: [],
          },
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Wait 1 second before next batch (except on last batch)
    if (i + 5 < entries.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}
