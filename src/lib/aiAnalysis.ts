/**
 * AI Text Analysis Service
 *
 * Uses OpenAI GPT-4 to analyze journal entry text and extract:
 * - Sentiment (positive/negative/neutral)
 * - Emotional keywords
 * - Cognitive biases
 * - Inferred conviction level
 *
 * Phase 1: Basic sentiment and emotion analysis
 * Phase 2: Auto-tagging and strategy detection
 */

import OpenAI from 'openai';
import { ConvictionLevel } from '@prisma/client';

// Lazy-initialize OpenAI client to allow env vars to be loaded first
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });
  }
  return openaiClient;
}

export interface AnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  emotionalKeywords: string[];
  detectedBiases: string[];
  convictionInferred: ConvictionLevel | null;
  confidence: number; // 0-1 score of AI confidence in analysis
}

/**
 * Analyzes journal entry text using OpenAI GPT-4
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

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  // Build the analysis prompt
  const prompt = buildAnalysisPrompt(content, userMood, userConviction);

  try {
    // Get OpenAI client (lazy initialization)
    const openai = getOpenAIClient();

    // Call OpenAI API with JSON mode
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a trading psychology analyst. Extract psychological insights from trading journal entries. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Lower temperature for more consistent analysis
      max_tokens: 500
    });

    // Parse the response
    const responseText = completion.choices[0]?.message?.content || '{}';
    return parseAnalysisResponse(responseText);

  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw new Error(`Failed to analyze entry text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Builds the analysis prompt for OpenAI
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
  "confidence": 0.0 to 1.0
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

Return ONLY the JSON object.`;
}

/**
 * Parses OpenAI's JSON response into AnalysisResult
 */
function parseAnalysisResponse(responseText: string): AnalysisResult {
  try {
    const parsed = JSON.parse(responseText);

    // Validate and normalize the response
    return {
      sentiment: validateSentiment(parsed.sentiment),
      emotionalKeywords: Array.isArray(parsed.emotionalKeywords)
        ? parsed.emotionalKeywords.slice(0, 10) // Limit to 10 keywords
        : [],
      detectedBiases: Array.isArray(parsed.detectedBiases)
        ? parsed.detectedBiases.slice(0, 5) // Limit to 5 biases
        : [],
      convictionInferred: validateConviction(parsed.convictionInferred),
      confidence: typeof parsed.confidence === 'number'
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.5
    };

  } catch (error) {
    console.error('Error parsing AI response:', error);
    console.error('Response text:', responseText);

    // Return safe defaults on parse error
    return {
      sentiment: 'neutral',
      emotionalKeywords: [],
      detectedBiases: [],
      convictionInferred: null,
      confidence: 0
    };
  }
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
    conviction?: string
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
            confidence: 0
          }
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Wait 1 second before next batch (except on last batch)
    if (i + 5 < entries.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}
