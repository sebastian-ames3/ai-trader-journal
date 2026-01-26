/**
 * Trade Detection Service
 *
 * Detects trade activity in journal entry text and voice transcriptions.
 * Uses Claude for intelligent extraction of:
 * - Ticker symbols
 * - Trade actions (open, close, add, reduce)
 * - Trade outcomes (win, loss, breakeven)
 * - Approximate P/L amounts
 *
 * Uses Zod for schema validation to ensure consistent AI responses.
 */

import { z } from 'zod';
import {
  getClaude,
  CLAUDE_MODELS,
  parseJsonResponse,
  isClaudeConfigured,
} from '@/lib/claude';
import type { TradeOutcome } from '@/lib/constants/taxonomy';

/**
 * Minimum content length for trade detection.
 * Short entries don't provide enough context for reliable detection.
 */
export const MIN_CONTENT_LENGTH_FOR_DETECTION = 15;

/**
 * Default confidence threshold for showing trade detection prompts.
 * Only detections with confidence >= this value trigger the prompt.
 */
export const TRADE_DETECTION_CONFIDENCE_THRESHOLD = 0.75;

/**
 * Trade action types
 */
export type TradeAction = 'OPEN' | 'CLOSE' | 'ADD' | 'REDUCE';

/**
 * Trade detection signals extracted from content
 */
export interface TradeSignals {
  ticker: string | null;
  tickerConfidence: number;
  action: TradeAction | null;
  actionConfidence: number;
  outcome: TradeOutcome | null;
  outcomeConfidence: number;
  approximatePnL: number | null;
  pnlConfidence: number;
}

/**
 * Complete trade detection result
 */
export interface TradeDetectionResult {
  detected: boolean;
  confidence: number;
  signals: TradeSignals;
  evidenceQuote: string | null;
}

/**
 * Safe default for failed detection
 */
export const EMPTY_DETECTION_RESULT: TradeDetectionResult = {
  detected: false,
  confidence: 0,
  signals: {
    ticker: null,
    tickerConfidence: 0,
    action: null,
    actionConfidence: 0,
    outcome: null,
    outcomeConfidence: 0,
    approximatePnL: null,
    pnlConfidence: 0,
  },
  evidenceQuote: null,
};

/**
 * Zod schema for AI trade detection response
 */
const TradeDetectionResponseSchema = z.object({
  detected: z.boolean().catch(false),
  confidence: z.number().min(0).max(1).catch(0),
  ticker: z.string().nullable().catch(null),
  tickerConfidence: z.number().min(0).max(1).catch(0),
  action: z.enum(['OPEN', 'CLOSE', 'ADD', 'REDUCE']).nullable().catch(null),
  actionConfidence: z.number().min(0).max(1).catch(0),
  outcome: z.enum(['WIN', 'LOSS', 'BREAKEVEN']).nullable().catch(null),
  outcomeConfidence: z.number().min(0).max(1).catch(0),
  approximatePnL: z.number().nullable().catch(null),
  pnlConfidence: z.number().min(0).max(1).catch(0),
  evidenceQuote: z.string().max(100).nullable().catch(null),
});

type TradeDetectionResponse = z.infer<typeof TradeDetectionResponseSchema>;

/**
 * System prompt for trade detection
 */
const TRADE_DETECTION_SYSTEM_PROMPT = `You are a trade detection assistant for a trading journal app. Your job is to analyze journal entries and detect if the user is describing a completed trade action.

IMPORTANT: Only detect COMPLETED trade actions, not intentions, ideas, or plans.

Detection signals to look for:

ACTION INDICATORS (required for detection):
- Closing: "closed", "sold", "exited", "got out", "cut", "stopped out", "took profit", "hit stop"
- Opening: "bought", "opened", "entered", "initiated", "started position"
- Adding: "added to", "scaled in", "bought more", "increased position"
- Reducing: "trimmed", "scaled out", "reduced", "sold some", "partial exit"

OUTCOME INDICATORS (for closed trades):
- Win: "profit", "gain", "winner", "worked out", "hit target", "+$", "made money", "green"
- Loss: "loss", "loser", "stopped out", "took the L", "-$", "lost", "red", "underwater"
- Breakeven: "scratched", "breakeven", "flat", "got out even", "wash"

TICKER DETECTION:
- Look for 1-5 uppercase letters that appear to be stock tickers
- Common formats: $AAPL, AAPL, aapl
- Must be in trading context (near action/outcome words)

P/L EXTRACTION:
- Look for dollar amounts with +/- signs
- Patterns: "+$150", "-$50", "profit of $200", "loss of 100", "made 500"
- Return as signed number (positive for profit, negative for loss)

DO NOT DETECT as trades:
- Trade ideas or plans ("thinking about buying", "might sell")
- General market observations
- Reflections without specific action ("looking back at my AAPL trade")
- Questions or hypotheticals

Return JSON with your analysis.`;

/**
 * User prompt template for trade detection
 */
const TRADE_DETECTION_USER_PROMPT = `Analyze this journal entry for trade activity:

"""
{content}
"""

Return JSON:
{
  "detected": boolean,        // true if completed trade action detected
  "confidence": 0.0-1.0,      // overall confidence in detection
  "ticker": "AAPL" | null,    // extracted ticker symbol (uppercase)
  "tickerConfidence": 0.0-1.0,
  "action": "OPEN" | "CLOSE" | "ADD" | "REDUCE" | null,
  "actionConfidence": 0.0-1.0,
  "outcome": "WIN" | "LOSS" | "BREAKEVEN" | null,  // only for closing actions
  "outcomeConfidence": 0.0-1.0,
  "approximatePnL": number | null,  // signed: positive=profit, negative=loss
  "pnlConfidence": 0.0-1.0,
  "evidenceQuote": "max 100 char quote from text showing trade" | null
}

Return ONLY the JSON object, no explanation.`;

/**
 * Detect trade activity in content using AI
 *
 * @param content - Journal entry text or voice transcription
 * @returns Trade detection result with signals
 */
export async function detectTradeInContent(
  content: string
): Promise<TradeDetectionResult> {
  // Quick validation
  if (!content || content.trim().length < MIN_CONTENT_LENGTH_FOR_DETECTION) {
    return EMPTY_DETECTION_RESULT;
  }

  // Check if Claude is configured
  if (!isClaudeConfigured()) {
    console.warn('Trade detection skipped: ANTHROPIC_API_KEY not configured');
    return EMPTY_DETECTION_RESULT;
  }

  // Run quick pre-filter with regex to avoid unnecessary API calls
  if (!hasTradeSignals(content)) {
    return EMPTY_DETECTION_RESULT;
  }

  try {
    const claude = getClaude();

    const response = await claude.messages.create({
      model: CLAUDE_MODELS.FAST,
      max_tokens: 500,
      system: TRADE_DETECTION_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: TRADE_DETECTION_USER_PROMPT.replace('{content}', content),
        },
      ],
    });

    const parsed = parseJsonResponse<TradeDetectionResponse>(response);
    if (!parsed) {
      console.error('Failed to parse trade detection response');
      return EMPTY_DETECTION_RESULT;
    }

    // Validate with Zod
    const validated = TradeDetectionResponseSchema.parse(parsed);

    return {
      detected: validated.detected,
      confidence: validated.confidence,
      signals: {
        ticker: validated.ticker?.toUpperCase() || null,
        tickerConfidence: validated.tickerConfidence,
        action: validated.action,
        actionConfidence: validated.actionConfidence,
        outcome: validated.outcome as TradeOutcome | null,
        outcomeConfidence: validated.outcomeConfidence,
        approximatePnL: validated.approximatePnL,
        pnlConfidence: validated.pnlConfidence,
      },
      evidenceQuote: validated.evidenceQuote,
    };
  } catch (error) {
    console.error('Trade detection error:', error);
    return EMPTY_DETECTION_RESULT;
  }
}

/**
 * Quick regex-based pre-filter to check for trade signals
 * Avoids expensive AI calls for content that clearly has no trade activity
 */
function hasTradeSignals(content: string): boolean {
  const lowerContent = content.toLowerCase();

  // Action words that indicate a completed trade
  const actionPatterns = [
    /\b(closed|sold|exited|cut|stopped out|took profit|hit stop)\b/i,
    /\b(bought|opened|entered|initiated|started position)\b/i,
    /\b(added to|scaled in|bought more|increased position)\b/i,
    /\b(trimmed|scaled out|reduced|sold some|partial exit)\b/i,
  ];

  // Check for any action pattern
  const hasAction = actionPatterns.some((pattern) => pattern.test(lowerContent));

  // Need at least an action word to consider for detection
  return hasAction;
}

/**
 * Check if a detection result meets the confidence threshold
 */
export function meetsConfidenceThreshold(
  result: TradeDetectionResult,
  threshold: number = TRADE_DETECTION_CONFIDENCE_THRESHOLD
): boolean {
  return result.detected && result.confidence >= threshold;
}

/**
 * Format detection result for storage in database
 * Returns the data in the format expected by Entry.tradeDetectionData
 */
export function formatForStorage(result: TradeDetectionResult): object | null {
  if (!result.detected) {
    return null;
  }

  return {
    confidence: result.confidence,
    signals: result.signals,
    evidenceQuote: result.evidenceQuote,
    detectedAt: new Date().toISOString(),
  };
}

/**
 * Extract just the essential info for UI display
 */
export function formatForDisplay(result: TradeDetectionResult): {
  ticker: string | null;
  action: string | null;
  outcome: string | null;
  pnl: string | null;
} {
  if (!result.detected) {
    return { ticker: null, action: null, outcome: null, pnl: null };
  }

  const { signals } = result;

  return {
    ticker: signals.ticker,
    action: signals.action
      ? signals.action.charAt(0) + signals.action.slice(1).toLowerCase()
      : null,
    outcome: signals.outcome,
    pnl: signals.approximatePnL !== null
      ? (signals.approximatePnL >= 0 ? '+' : '') + `$${Math.abs(signals.approximatePnL)}`
      : null,
  };
}
