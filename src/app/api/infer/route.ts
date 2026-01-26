/**
 * Auto-Inference API Route
 *
 * POST /api/infer
 * Automatically infers entry metadata from content using Claude Haiku.
 * Used for Quick Capture mode where users don't need to fill in fields.
 *
 * Request: { content: string }
 * Response: {
 *   entryType: 'IDEA' | 'DECISION' | 'REFLECTION' | 'OBSERVATION',
 *   mood: 'CONFIDENT' | 'NERVOUS' | 'EXCITED' | 'UNCERTAIN' | 'NEUTRAL',
 *   conviction: 'LOW' | 'MEDIUM' | 'HIGH',
 *   ticker: string | null,
 *   sentiment: 'positive' | 'negative' | 'neutral'
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import {
  getClaude,
  CLAUDE_MODELS,
  parseJsonResponse,
  isClaudeConfigured,
  handleClaudeError,
} from '@/lib/claude';
import { requireAuth } from '@/lib/auth';

// Response type
export interface InferenceResult {
  entryType: 'IDEA' | 'DECISION' | 'REFLECTION' | 'OBSERVATION';
  mood: 'CONFIDENT' | 'NERVOUS' | 'EXCITED' | 'UNCERTAIN' | 'NEUTRAL';
  conviction: 'LOW' | 'MEDIUM' | 'HIGH';
  ticker: string | null;
  sentiment: 'positive' | 'negative' | 'neutral';
}

const INFERENCE_PROMPT = `Analyze this trading journal entry and infer the following metadata. Return ONLY valid JSON.

{
  "entryType": "IDEA" | "DECISION" | "REFLECTION" | "OBSERVATION",
  "mood": "CONFIDENT" | "NERVOUS" | "EXCITED" | "UNCERTAIN" | "NEUTRAL",
  "conviction": "LOW" | "MEDIUM" | "HIGH",
  "ticker": "AAPL" | null,
  "sentiment": "positive" | "negative" | "neutral"
}

RULES:
1. entryType:
   - IDEA: Contains "thinking about", "might buy/sell", "looking at", future tense, potential trades
   - DECISION: Contains "just bought/sold", "entered/exited", "filled at", past tense execution, documenting an action taken
   - REFLECTION: Contains "looking back", "learned", "should have", past analysis, lessons learned
   - OBSERVATION: General market notes, sector commentary, neither trade-specific nor reflective

2. mood:
   - CONFIDENT: Strong, assured language ("definitely", "clear", "certain", "strong conviction")
   - NERVOUS: Worried, anxious ("worried", "concerned", "nervous", "uneasy")
   - EXCITED: Enthusiastic ("excited", "great opportunity", "can't wait", "bullish")
   - UNCERTAIN: Doubtful ("not sure", "maybe", "questioning", "on the fence")
   - NEUTRAL: Analytical, objective, matter-of-fact

3. conviction:
   - HIGH: Strong certainty ("definitely", "very confident", "strong conviction", "certain")
   - MEDIUM: Moderate confidence ("likely", "probably", "good chance", "seems like")
   - LOW: Low confidence ("might", "maybe", "not sure", "considering")

4. ticker:
   - Extract the primary ticker symbol mentioned (e.g., "AAPL", "NVDA", "SPY")
   - If multiple tickers, use the primary one being discussed
   - null if no specific ticker mentioned

5. sentiment:
   - positive: Optimistic, bullish, confident tone
   - negative: Pessimistic, bearish, worried tone
   - neutral: Objective, analytical, balanced tone

Entry:`;

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    // Check for Anthropic API key
    if (!isClaudeConfigured()) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 503 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Limit content length to prevent abuse
    const truncatedContent = content.slice(0, 2000);

    // Get Claude client
    const claude = getClaude();

    // Call Claude Haiku for inference
    const response = await claude.messages.create({
      model: CLAUDE_MODELS.FAST, // Haiku for fast, cheap inference
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: `${INFERENCE_PROMPT}\n"${truncatedContent}"`,
        },
      ],
      system:
        'You are a trading journal assistant. Analyze entries and return metadata in JSON format only. No markdown formatting.',
    });

    // Parse the JSON response
    const parsed = parseJsonResponse<{
      entryType?: string;
      mood?: string;
      conviction?: string;
      ticker?: string;
      sentiment?: string;
    }>(response);

    if (!parsed) {
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    // Validate and normalize the response
    const result: InferenceResult = {
      entryType: validateEntryType(parsed.entryType),
      mood: validateMood(parsed.mood),
      conviction: validateConviction(parsed.conviction),
      ticker: validateTicker(parsed.ticker),
      sentiment: validateSentiment(parsed.sentiment),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Inference error:', error);

    // Handle Anthropic API errors
    if (error instanceof Anthropic.APIError) {
      const { status, message } = handleClaudeError(error);
      return NextResponse.json({ error: message }, { status });
    }

    return NextResponse.json(
      { error: 'Failed to infer metadata' },
      { status: 500 }
    );
  }
}

// Validation helpers

function validateEntryType(
  value: unknown
): 'IDEA' | 'DECISION' | 'REFLECTION' | 'OBSERVATION' {
  const validTypes = ['IDEA', 'DECISION', 'REFLECTION', 'OBSERVATION'];
  if (typeof value === 'string' && validTypes.includes(value)) {
    return value as 'IDEA' | 'DECISION' | 'REFLECTION' | 'OBSERVATION';
  }
  return 'OBSERVATION'; // Default
}

function validateMood(
  value: unknown
): 'CONFIDENT' | 'NERVOUS' | 'EXCITED' | 'UNCERTAIN' | 'NEUTRAL' {
  const validMoods = ['CONFIDENT', 'NERVOUS', 'EXCITED', 'UNCERTAIN', 'NEUTRAL'];
  if (typeof value === 'string' && validMoods.includes(value)) {
    return value as 'CONFIDENT' | 'NERVOUS' | 'EXCITED' | 'UNCERTAIN' | 'NEUTRAL';
  }
  return 'NEUTRAL'; // Default
}

function validateConviction(value: unknown): 'LOW' | 'MEDIUM' | 'HIGH' {
  const validLevels = ['LOW', 'MEDIUM', 'HIGH'];
  if (typeof value === 'string' && validLevels.includes(value)) {
    return value as 'LOW' | 'MEDIUM' | 'HIGH';
  }
  return 'MEDIUM'; // Default
}

function validateTicker(value: unknown): string | null {
  if (typeof value === 'string' && value.length > 0 && value.length <= 5) {
    // Clean and uppercase the ticker
    return value.toUpperCase().replace(/[^A-Z]/g, '') || null;
  }
  return null;
}

function validateSentiment(
  value: unknown
): 'positive' | 'negative' | 'neutral' {
  const validSentiments = ['positive', 'negative', 'neutral'];
  if (typeof value === 'string' && validSentiments.includes(value)) {
    return value as 'positive' | 'negative' | 'neutral';
  }
  return 'neutral'; // Default
}
