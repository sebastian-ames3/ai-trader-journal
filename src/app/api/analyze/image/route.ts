/**
 * Image Analysis API Route
 *
 * POST /api/analyze/image
 * Analyzes chart screenshots and trading images using Claude Sonnet vision.
 *
 * Request: { imageUrl: string }
 * Response: ImageAnalysis object with extracted information
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getClaude,
  CLAUDE_MODELS,
  isClaudeConfigured,
  parseJsonResponse,
  handleClaudeError,
} from '@/lib/claude';

// Chart analysis prompt
const CHART_ANALYSIS_PROMPT = `Analyze this trading chart or screenshot. Extract the following information if visible:

1. Ticker symbol (if visible)
2. Chart type (candlestick, line, bar, etc.)
3. Timeframe (daily, hourly, 5-min, etc.)
4. Technical patterns (support/resistance, trend lines, formations like head and shoulders, flags, wedges)
5. Indicators shown (RSI, MACD, moving averages, Bollinger Bands, etc.)
6. Key price levels (support, resistance, targets)
7. Brief summary of what the chart shows

If this is not a chart but another trading-related image (order confirmation, position screenshot, etc.), extract relevant information like:
- Ticker
- Position details
- P/L information
- Order type

Return your analysis as JSON in this exact format:
{
  "ticker": "AAPL" or null,
  "chartType": "candlestick" or null,
  "timeframe": "daily" or null,
  "patterns": ["bull flag", "above 50 SMA"],
  "indicators": ["RSI: 62", "MACD: bullish crossover"],
  "keyLevels": {
    "support": 185,
    "resistance": 195
  },
  "summary": "Brief description of what the image shows"
}

Return ONLY valid JSON, no markdown formatting.`;

interface ChartAnalysis {
  ticker: string | null;
  chartType: string | null;
  timeframe: string | null;
  patterns: string[];
  indicators: string[];
  keyLevels: {
    support?: number;
    resistance?: number;
  };
  summary: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check for Anthropic API key
    if (!isClaudeConfigured()) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 503 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(imageUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid image URL' },
        { status: 400 }
      );
    }

    // Get Claude client
    const claude = getClaude();

    // Call Claude Sonnet with vision
    const response = await claude.messages.create({
      model: CLAUDE_MODELS.BALANCED,
      max_tokens: 1000,
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
              text: CHART_ANALYSIS_PROMPT,
            },
          ],
        },
      ],
    });

    // Parse the JSON response
    const analysis = parseJsonResponse<ChartAnalysis>(response);

    if (!analysis) {
      return NextResponse.json(
        { error: 'Failed to parse analysis response' },
        { status: 500 }
      );
    }

    // Return normalized response
    return NextResponse.json({
      ticker: analysis.ticker || null,
      chartType: analysis.chartType || null,
      timeframe: analysis.timeframe || null,
      patterns: Array.isArray(analysis.patterns) ? analysis.patterns : [],
      indicators: Array.isArray(analysis.indicators) ? analysis.indicators : [],
      keyLevels: analysis.keyLevels || {},
      summary: analysis.summary || '',
    });
  } catch (error) {
    console.error('Image analysis error:', error);

    // Use centralized error handler
    const { status, message } = handleClaudeError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
