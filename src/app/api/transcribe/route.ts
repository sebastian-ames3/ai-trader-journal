/**
 * Audio Transcription API Route
 *
 * POST /api/transcribe
 * Transcribes audio files using either AssemblyAI or OpenAI Whisper.
 *
 * Provider Selection:
 * - Set TRANSCRIPTION_PROVIDER env var to "assemblyai" or "whisper" (default: whisper)
 * - Or pass ?provider=assemblyai or ?provider=whisper in the request
 *
 * AssemblyAI advantages:
 * - Better proper noun recognition (stock tickers like AAPL, NVDA)
 * - 30% fewer hallucinations
 * - Built-in word boost for trading terminology
 *
 * Whisper advantages:
 * - Slightly better at alphanumerics (strike prices)
 * - Proven reliability
 *
 * Request: multipart/form-data with 'audio' file
 * Response: { text: string, duration?: number, provider: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import {
  transcribeFileWithAssemblyAI,
  isAssemblyAIConfigured,
} from '@/lib/assemblyai';
import { requireAuth } from '@/lib/auth';

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

// Trading-specific vocabulary prompt for Whisper
const TRADING_PROMPT = `Trading journal entry. May include stock tickers like AAPL, NVDA, SPY, QQQ, TSLA, AMD, GOOGL, META, MSFT, AMZN.
May include options terminology like calls, puts, iron condor, iron butterfly, vertical spread, covered call, cash-secured put, theta, delta, gamma, vega, implied volatility, IV, historical volatility, HV, strike price, expiration, premium, bid, ask, spreads, straddle, strangle.
May include trading terms like support, resistance, breakout, breakdown, moving average, RSI, MACD, volume, price action, trend, consolidation, pullback, rally, correction, bear market, bull market, drawdown.`;

// Maximum file size: 25MB
const MAX_FILE_SIZE = 25 * 1024 * 1024;

type TranscriptionProvider = 'whisper' | 'assemblyai';

/**
 * Determine which transcription provider to use
 */
function getProvider(requestProvider?: string | null): TranscriptionProvider {
  // Request-level override takes priority
  if (requestProvider === 'assemblyai' || requestProvider === 'whisper') {
    return requestProvider;
  }

  // Environment variable default
  const envProvider = process.env.TRANSCRIPTION_PROVIDER?.toLowerCase();
  if (envProvider === 'assemblyai') {
    return 'assemblyai';
  }

  return 'whisper'; // Default fallback
}

/**
 * Transcribe using OpenAI Whisper
 */
async function transcribeWithWhisper(
  audioFile: File,
  duration?: number
): Promise<{ text: string; duration?: number }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const openai = getOpenAIClient();

  const transcription = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file: audioFile,
    language: 'en',
    prompt: TRADING_PROMPT,
    response_format: 'json',
  });

  return {
    text: transcription.text,
    duration,
  };
}

/**
 * Transcribe using AssemblyAI
 */
async function transcribeWithAssemblyAIProvider(
  audioFile: File
): Promise<{ text: string; duration?: number; confidence?: number }> {
  if (!isAssemblyAIConfigured()) {
    throw new Error('AssemblyAI API key not configured');
  }

  const result = await transcribeFileWithAssemblyAI(audioFile);

  return {
    text: result.text,
    duration: result.duration,
    confidence: result.confidence,
  };
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    // Get provider from query params
    const { searchParams } = new URL(request.url);
    const requestProvider = searchParams.get('provider');
    const provider = getProvider(requestProvider);

    // Validate provider is configured
    if (provider === 'assemblyai' && !isAssemblyAIConfigured()) {
      // Fall back to Whisper if AssemblyAI not configured
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(
          { error: 'No transcription provider configured' },
          { status: 503 }
        );
      }
      // Log fallback and continue with Whisper
      console.warn('AssemblyAI not configured, falling back to Whisper');
    }

    if (provider === 'whisper' && !process.env.OPENAI_API_KEY) {
      // Try AssemblyAI as fallback
      if (isAssemblyAIConfigured()) {
        console.warn('OpenAI not configured, falling back to AssemblyAI');
      } else {
        return NextResponse.json(
          { error: 'No transcription provider configured' },
          { status: 503 }
        );
      }
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

    const isValidType = validTypes.some((t) =>
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

    // Get duration from form data if provided (for Whisper)
    const durationStr = formData.get('duration');
    const duration = durationStr
      ? parseInt(durationStr.toString(), 10)
      : undefined;

    // Determine actual provider to use (with fallback logic)
    let actualProvider = provider;
    if (provider === 'assemblyai' && !isAssemblyAIConfigured()) {
      actualProvider = 'whisper';
    } else if (provider === 'whisper' && !process.env.OPENAI_API_KEY) {
      actualProvider = 'assemblyai';
    }

    // Perform transcription
    let result: { text: string; duration?: number; confidence?: number };

    if (actualProvider === 'assemblyai') {
      result = await transcribeWithAssemblyAIProvider(audioFile);
    } else {
      result = await transcribeWithWhisper(audioFile, duration);
    }

    return NextResponse.json({
      text: result.text,
      duration: result.duration,
      confidence: result.confidence,
      provider: actualProvider,
    });
  } catch (error) {
    console.error('Transcription error:', error);

    // Handle specific errors
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

    // AssemblyAI errors
    if (error instanceof Error) {
      if (error.message.includes('ASSEMBLYAI_API_KEY')) {
        return NextResponse.json(
          { error: 'AssemblyAI API key not configured' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to transcribe audio',
      },
      { status: 500 }
    );
  }
}
