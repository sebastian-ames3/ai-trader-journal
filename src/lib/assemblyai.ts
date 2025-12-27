/**
 * AssemblyAI Client Utility
 *
 * Provides audio transcription using AssemblyAI's Universal-2 model.
 * Key advantages over Whisper:
 * - Better proper noun recognition (stock tickers)
 * - 30% fewer hallucinations
 * - Similar pricing (~$0.0062/minute)
 */

import { AssemblyAI } from 'assemblyai';
import type { TranscribeParams } from 'assemblyai';

// Lazy-initialized AssemblyAI client
let assemblyAIClient: AssemblyAI | null = null;

/**
 * Get the AssemblyAI client (lazy initialization)
 */
export function getAssemblyAI(): AssemblyAI {
  if (!assemblyAIClient) {
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) {
      throw new Error('ASSEMBLYAI_API_KEY environment variable is not set');
    }
    assemblyAIClient = new AssemblyAI({ apiKey });
  }
  return assemblyAIClient;
}

/**
 * Check if AssemblyAI is configured
 */
export function isAssemblyAIConfigured(): boolean {
  return !!process.env.ASSEMBLYAI_API_KEY;
}

/**
 * Trading-specific word boost list for better ticker/term recognition
 */
export const TRADING_WORD_BOOST = [
  // Popular tickers
  'AAPL', 'NVDA', 'SPY', 'QQQ', 'TSLA', 'AMD', 'GOOGL', 'META', 'MSFT', 'AMZN',
  'NFLX', 'COIN', 'PLTR', 'SOFI', 'HOOD', 'GME', 'AMC', 'BABA', 'NIO', 'RIVN',
  // Options terminology
  'calls', 'puts', 'iron condor', 'iron butterfly', 'vertical spread',
  'covered call', 'cash secured put', 'theta', 'delta', 'gamma', 'vega',
  'implied volatility', 'IV', 'historical volatility', 'HV', 'strike price',
  'expiration', 'premium', 'bid', 'ask', 'spread', 'straddle', 'strangle',
  'in the money', 'ITM', 'out of the money', 'OTM', 'at the money', 'ATM',
  // Trading terms
  'support', 'resistance', 'breakout', 'breakdown', 'moving average',
  'RSI', 'MACD', 'volume', 'price action', 'trend', 'consolidation',
  'pullback', 'rally', 'correction', 'bear market', 'bull market', 'drawdown',
  'stop loss', 'take profit', 'risk reward', 'position size',
];

export interface TranscriptionResult {
  text: string;
  confidence?: number;
  words?: Array<{
    text: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  duration?: number;
}

/**
 * Transcribe audio using AssemblyAI Universal-2
 *
 * @param audioData - Audio file as Buffer or URL string
 * @param options - Optional transcription parameters
 * @returns Transcription result
 */
export async function transcribeWithAssemblyAI(
  audioData: Buffer | string,
  options?: {
    languageCode?: string;
  }
): Promise<TranscriptionResult> {
  const client = getAssemblyAI();

  const params: TranscribeParams = {
    audio: audioData,
    language_code: options?.languageCode || 'en',
    word_boost: TRADING_WORD_BOOST,
    boost_param: 'high', // Strong boost for trading terms
  };

  const transcript = await client.transcripts.transcribe(params);

  if (transcript.status === 'error') {
    throw new Error(transcript.error || 'Transcription failed');
  }

  return {
    text: transcript.text || '',
    confidence: transcript.confidence ?? undefined,
    words: transcript.words?.map((w) => ({
      text: w.text,
      start: w.start,
      end: w.end,
      confidence: w.confidence,
    })),
    duration: transcript.audio_duration ?? undefined,
  };
}

/**
 * Transcribe audio from a File object (for API routes)
 */
export async function transcribeFileWithAssemblyAI(
  file: File
): Promise<TranscriptionResult> {
  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return transcribeWithAssemblyAI(buffer);
}
