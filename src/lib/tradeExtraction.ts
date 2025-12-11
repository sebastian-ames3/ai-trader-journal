/**
 * Trade Data Extraction Service
 *
 * Uses Claude Vision (Sonnet) to extract trade data from screenshots.
 * Supports multiple screenshot formats: OptionStrat, ThinkorSwim, TastyTrade, etc.
 *
 * Extracted data includes:
 * - Ticker symbol
 * - Strategy type (spread, condor, etc.)
 * - Strike prices
 * - Expiration date
 * - Premium/price
 * - Greeks (delta, theta, gamma, vega)
 * - IV, HV, IV rank/percentile
 * - Underlying price
 * - P/L information
 * - Breakeven prices
 */

import {
  getClaude,
  CLAUDE_MODELS,
  parseJsonResponse,
  isClaudeConfigured,
} from '@/lib/claude';
import { StrategyType } from '@prisma/client';

/**
 * Extracted trade data from screenshot analysis
 */
export interface ExtractedTradeData {
  ticker?: string;
  strategyType?: StrategyType;
  strategyDescription?: string;
  strikes?: {
    strike: number;
    type: 'CALL' | 'PUT';
    action: 'BUY' | 'SELL';
  }[];
  expiration?: string;
  premium?: number;
  premiumType?: 'DEBIT' | 'CREDIT';
  quantity?: number;
  greeks?: {
    delta?: number;
    theta?: number;
    gamma?: number;
    vega?: number;
  };
  iv?: number;
  hv?: number;
  ivRank?: number;
  ivPercentile?: number;
  underlyingPrice?: number;
  currentPL?: number;
  maxProfit?: number;
  maxLoss?: number;
  breakevens?: number[];
  platform?: string;
  confidence: number;
  rawExtraction?: string;
}

/**
 * Response from the extraction API
 */
export interface ExtractionResult {
  success: boolean;
  data?: ExtractedTradeData;
  error?: string;
  processingTimeMs?: number;
}

const VISION_SYSTEM_PROMPT = `You are a trading screenshot analyzer. Your task is to extract structured trade data from screenshots of trading platforms.

Look for and extract:
- Ticker symbol
- Strategy type (spread, condor, etc.)
- Strike prices with type (call/put) and action (buy/sell)
- Expiration date
- Premium/price
- Greeks (delta, theta, gamma, vega) if shown
- IV, HV, IV rank/percentile if shown
- Underlying price
- P/L information
- Breakeven prices
- Platform name if identifiable

Return as JSON. If a field is not visible in the screenshot, omit it.
Be specific about what you can see vs. what you are inferring.
Include a confidence score (0-1) for your overall extraction accuracy.`;

const EXTRACTION_USER_PROMPT = `Extract trading data from this screenshot. Look for:
- Ticker symbol
- Strategy type (spread, condor, etc.)
- Strike prices
- Expiration date
- Premium/price
- Greeks (delta, theta, gamma, vega) if shown
- IV, HV, IV rank/percentile if shown
- Underlying price
- P/L information
- Breakeven prices

Return as JSON with this structure:
{
  "ticker": "AAPL",
  "strategyType": "IRON_CONDOR",
  "strategyDescription": "Iron Condor",
  "strikes": [
    { "strike": 180, "type": "PUT", "action": "SELL" },
    { "strike": 175, "type": "PUT", "action": "BUY" },
    { "strike": 190, "type": "CALL", "action": "SELL" },
    { "strike": 195, "type": "CALL", "action": "BUY" }
  ],
  "expiration": "2024-12-20",
  "premium": 2.50,
  "premiumType": "CREDIT",
  "quantity": 1,
  "greeks": {
    "delta": 0.05,
    "theta": -0.12,
    "gamma": 0.02,
    "vega": 0.08
  },
  "iv": 35.5,
  "hv": 28.2,
  "ivRank": 45,
  "ivPercentile": 52,
  "underlyingPrice": 185.50,
  "currentPL": 125.00,
  "maxProfit": 250.00,
  "maxLoss": 250.00,
  "breakevens": [177.50, 192.50],
  "platform": "TastyTrade",
  "confidence": 0.85
}

If a field is not visible, omit it from the response.
For strategyType, use one of: LONG_CALL, LONG_PUT, SHORT_CALL, SHORT_PUT, CALL_SPREAD, PUT_SPREAD, IRON_CONDOR, IRON_BUTTERFLY, STRADDLE, STRANGLE, CALENDAR, DIAGONAL, RATIO, BUTTERFLY, STOCK, COVERED_CALL, CASH_SECURED_PUT, CUSTOM

Return ONLY the JSON object, no markdown formatting.`;

/**
 * Maps raw strategy string to StrategyType enum
 */
function mapStrategyType(rawType?: string): StrategyType | undefined {
  if (!rawType) return undefined;

  const typeMap: Record<string, StrategyType> = {
    LONG_CALL: 'LONG_CALL',
    LONG_PUT: 'LONG_PUT',
    SHORT_CALL: 'SHORT_CALL',
    SHORT_PUT: 'SHORT_PUT',
    CALL_SPREAD: 'CALL_SPREAD',
    PUT_SPREAD: 'PUT_SPREAD',
    IRON_CONDOR: 'IRON_CONDOR',
    IRON_BUTTERFLY: 'IRON_BUTTERFLY',
    STRADDLE: 'STRADDLE',
    STRANGLE: 'STRANGLE',
    CALENDAR: 'CALENDAR',
    DIAGONAL: 'DIAGONAL',
    RATIO: 'RATIO',
    BUTTERFLY: 'BUTTERFLY',
    STOCK: 'STOCK',
    COVERED_CALL: 'COVERED_CALL',
    CASH_SECURED_PUT: 'CASH_SECURED_PUT',
    CUSTOM: 'CUSTOM',
  };

  const normalized = rawType.toUpperCase().replace(/[^A-Z_]/g, '_');
  return typeMap[normalized] || 'CUSTOM';
}

/**
 * Validates and cleans extracted trade data
 */
function validateExtractionResponse(
  raw: Record<string, unknown> | null
): ExtractedTradeData {
  if (!raw) {
    return { confidence: 0 };
  }

  const result: ExtractedTradeData = {
    confidence: typeof raw.confidence === 'number' ? raw.confidence : 0.5,
  };

  if (typeof raw.ticker === 'string' && raw.ticker.length > 0) {
    result.ticker = raw.ticker.toUpperCase();
  }

  if (typeof raw.strategyType === 'string') {
    result.strategyType = mapStrategyType(raw.strategyType);
  }

  if (typeof raw.strategyDescription === 'string') {
    result.strategyDescription = raw.strategyDescription;
  }

  if (Array.isArray(raw.strikes)) {
    result.strikes = raw.strikes
      .filter(
        (s): s is { strike: number; type: string; action: string } =>
          typeof s === 'object' &&
          s !== null &&
          typeof s.strike === 'number' &&
          typeof s.type === 'string' &&
          typeof s.action === 'string'
      )
      .map((s) => ({
        strike: s.strike,
        type: s.type.toUpperCase() === 'PUT' ? 'PUT' : 'CALL',
        action: s.action.toUpperCase() === 'SELL' ? 'SELL' : 'BUY',
      }));
  }

  if (typeof raw.expiration === 'string') {
    result.expiration = raw.expiration;
  }

  if (typeof raw.premium === 'number') {
    result.premium = raw.premium;
  }

  if (
    typeof raw.premiumType === 'string' &&
    ['DEBIT', 'CREDIT'].includes(raw.premiumType.toUpperCase())
  ) {
    result.premiumType = raw.premiumType.toUpperCase() as 'DEBIT' | 'CREDIT';
  }

  if (typeof raw.quantity === 'number') {
    result.quantity = Math.round(raw.quantity);
  }

  if (typeof raw.greeks === 'object' && raw.greeks !== null) {
    const g = raw.greeks as Record<string, unknown>;
    result.greeks = {};
    if (typeof g.delta === 'number') result.greeks.delta = g.delta;
    if (typeof g.theta === 'number') result.greeks.theta = g.theta;
    if (typeof g.gamma === 'number') result.greeks.gamma = g.gamma;
    if (typeof g.vega === 'number') result.greeks.vega = g.vega;
    if (Object.keys(result.greeks).length === 0) delete result.greeks;
  }

  if (typeof raw.iv === 'number') result.iv = raw.iv;
  if (typeof raw.hv === 'number') result.hv = raw.hv;
  if (typeof raw.ivRank === 'number') result.ivRank = raw.ivRank;
  if (typeof raw.ivPercentile === 'number')
    result.ivPercentile = raw.ivPercentile;
  if (typeof raw.underlyingPrice === 'number')
    result.underlyingPrice = raw.underlyingPrice;
  if (typeof raw.currentPL === 'number') result.currentPL = raw.currentPL;
  if (typeof raw.maxProfit === 'number') result.maxProfit = raw.maxProfit;
  if (typeof raw.maxLoss === 'number') result.maxLoss = raw.maxLoss;

  if (Array.isArray(raw.breakevens)) {
    result.breakevens = raw.breakevens.filter(
      (b): b is number => typeof b === 'number'
    );
  }

  if (typeof raw.platform === 'string') {
    result.platform = raw.platform;
  }

  return result;
}

/**
 * Extracts trade data from an image URL using Claude Vision
 *
 * @param imageUrl - URL of the screenshot to analyze
 * @returns Extraction result with trade data
 */
export async function extractTradeData(
  imageUrl: string
): Promise<ExtractionResult> {
  const startTime = Date.now();

  if (!imageUrl || imageUrl.trim().length === 0) {
    return {
      success: false,
      error: 'Image URL is required',
    };
  }

  if (!isClaudeConfigured()) {
    return {
      success: false,
      error: 'ANTHROPIC_API_KEY environment variable is not set',
    };
  }

  try {
    const claude = getClaude();

    const response = await claude.messages.create({
      model: CLAUDE_MODELS.BALANCED,
      max_tokens: 1500,
      system: VISION_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'url',
                url: imageUrl,
              },
            },
            {
              type: 'text',
              text: EXTRACTION_USER_PROMPT,
            },
          ],
        },
      ],
    });

    const parsed = parseJsonResponse<Record<string, unknown>>(response);
    const extractedData = validateExtractionResponse(parsed);

    return {
      success: true,
      data: extractedData,
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Error extracting trade data:', error);

    let errorMessage = 'Failed to extract trade data from image';
    if (error instanceof Error) {
      if (error.message.includes('Could not process image')) {
        errorMessage = 'Could not process the image. Please ensure the URL is accessible and points to a valid image.';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      error: errorMessage,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Extracts trade data from base64-encoded image data
 *
 * @param base64Data - Base64-encoded image data
 * @param mediaType - MIME type of the image
 * @returns Extraction result with trade data
 */
export async function extractTradeDataFromBase64(
  base64Data: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
): Promise<ExtractionResult> {
  const startTime = Date.now();

  if (!base64Data || base64Data.trim().length === 0) {
    return {
      success: false,
      error: 'Base64 image data is required',
    };
  }

  if (!isClaudeConfigured()) {
    return {
      success: false,
      error: 'ANTHROPIC_API_KEY environment variable is not set',
    };
  }

  try {
    const claude = getClaude();

    const response = await claude.messages.create({
      model: CLAUDE_MODELS.BALANCED,
      max_tokens: 1500,
      system: VISION_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: EXTRACTION_USER_PROMPT,
            },
          ],
        },
      ],
    });

    const parsed = parseJsonResponse<Record<string, unknown>>(response);
    const extractedData = validateExtractionResponse(parsed);

    return {
      success: true,
      data: extractedData,
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Error extracting trade data from base64:', error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to extract trade data from image',
      processingTimeMs: Date.now() - startTime,
    };
  }
}
