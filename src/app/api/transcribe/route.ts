/**
 * Audio Transcription API Route
 *
 * POST /api/transcribe
 * Transcribes audio files using OpenAI Whisper.
 *
 * NOTE: This is the ONLY AI endpoint that uses OpenAI instead of Claude.
 * Claude does not offer audio transcription, so we keep OpenAI Whisper
 * for voice memo transcription. All other AI features use Claude models.
 *
 * Request: multipart/form-data with 'audio' file
 * Response: { text: string, duration?: number }
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

// Trading-specific vocabulary prompt to improve transcription accuracy
const TRADING_PROMPT = `Trading journal entry. May include stock tickers like AAPL, NVDA, SPY, QQQ, TSLA, AMD, GOOGL, META, MSFT, AMZN.
May include options terminology like calls, puts, iron condor, iron butterfly, vertical spread, covered call, cash-secured put, theta, delta, gamma, vega, implied volatility, IV, historical volatility, HV, strike price, expiration, premium, bid, ask, spreads, straddle, strangle.
May include trading terms like support, resistance, breakout, breakdown, moving average, RSI, MACD, volume, price action, trend, consolidation, pullback, rally, correction, bear market, bull market, drawdown.`;

// Maximum file size: 25MB (Whisper limit)
const MAX_FILE_SIZE = 25 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 503 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const audioFile = formData.get('audio');

    if (!audioFile || !(audioFile instanceof File)) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (audioFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Audio file too large. Maximum size is 25MB.' },
        { status: 400 }
      );
    }

    // Validate content type
    const validTypes = [
      'audio/webm',
      'audio/mp4',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/x-m4a',
      'audio/mp3',
      'audio/flac',
    ];

    const isValidType = validTypes.some(t =>
      audioFile.type.includes(t.split('/')[1])
    );

    if (!isValidType && audioFile.type !== '') {
      return NextResponse.json(
        {
          error: `Invalid audio format. Supported: ${validTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Get OpenAI client
    const openai = getOpenAIClient();

    // Call Whisper API
    const transcription = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file: audioFile,
      language: 'en',
      prompt: TRADING_PROMPT,
      response_format: 'json',
    });

    // Get duration from form data if provided
    const durationStr = formData.get('duration');
    const duration = durationStr ? parseInt(durationStr.toString(), 10) : undefined;

    return NextResponse.json({
      text: transcription.text,
      duration,
    });
  } catch (error) {
    console.error('Transcription error:', error);

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
    }

    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
