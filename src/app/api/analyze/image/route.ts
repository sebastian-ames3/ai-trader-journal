/**
 * Image Analysis API Route
 *
 * POST /api/analyze/image
 * Analyzes chart screenshots and trading images using GPT-4o-mini vision.
 *
 * Request: { imageUrl: string }
 * Response: ImageAnalysis object with extracted information
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Lazy-initialize OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });
  }
  return openaiClient;
}

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
}`;

export async function POST(request: NextRequest) {
  try {
    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
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

    // Get OpenAI client
    const openai = getOpenAIClient();

    // Call GPT-4o-mini with vision
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Good vision at balanced cost
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: CHART_ANALYSIS_PROMPT,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high', // Use high detail for better chart analysis
              },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
      temperature: 0.3, // Lower temperature for more consistent analysis
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'No analysis generated' },
        { status: 500 }
      );
    }

    // Parse and return the analysis
    try {
      const analysis = JSON.parse(content);
      return NextResponse.json(analysis);
    } catch {
      // If parsing fails, return the raw content as summary
      return NextResponse.json({
        summary: content,
        ticker: null,
        chartType: null,
        timeframe: null,
        patterns: [],
        indicators: [],
        keyLevels: {},
      });
    }
  } catch (error) {
    console.error('Image analysis error:', error);

    // Handle specific OpenAI errors
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        return NextResponse.json(
          { error: 'Invalid OpenAI API key' },
          { status: 401 }
        );
      }
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
      if (error.status === 400) {
        return NextResponse.json(
          { error: 'Invalid image or request. Please try a different image.' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    );
  }
}
