import Anthropic from '@anthropic-ai/sdk';
import { EntryMood } from '@prisma/client';
import { parseISO } from 'date-fns';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Use Haiku for fast OCR - 3-5x faster than Sonnet
const OCR_MODEL = 'claude-3-5-haiku-latest';
const METADATA_MODEL = 'claude-3-5-haiku-latest';

export interface OCRResult {
  content: string; // Transcribed markdown text
  date: string | null; // ISO 8601
  tickers: string[]; // ['AAPL', 'SPY']
  mood: EntryMood | null; // 'CONFIDENT' | 'NERVOUS' | etc.
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number; // 0-1
  rawExtraction?: string; // Debug info
}

interface TranscriptionResult {
  content: string;
  confidence: number;
}

interface MetadataResult {
  date: string | null;
  tickers: string[];
  mood: EntryMood | null;
  sentiment: 'positive' | 'negative' | 'neutral';
}

/**
 * Pass 1: Pure transcription using Haiku Vision
 * Focuses only on accurate text extraction - fast and reliable
 */
async function transcribeHandwriting(imageUrl: string): Promise<TranscriptionResult> {
  const response = await anthropic.messages.create({
    model: OCR_MODEL,
    max_tokens: 1024,
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
            text: `Transcribe this handwritten text exactly as written. Focus only on accurate text extraction.

**Trading journal context - expect these patterns:**
- Dates: "10/24/24", "Oct 24", "September 19, 2025"
- Tickers: $SPY, AAPL, QQQ (often with strike prices like "4500C", "450P")
- P/L figures: "+$500", "-$10K", "up 2.5%"
- Options terms: "iron butterfly", "OPEX", "theta decay", "delta", "strikes"
- Common abbreviations: "mkt" (market), "vol" (volume/volatility), "avg" (average)

**Instructions:**
- Preserve line breaks, paragraph structure, and any section headers
- Include strikethroughs as ~~text~~ if visible
- Note unclear words with [unclear] but attempt your best reading
- Preserve numbers exactly (prices, percentages, dates)

**Return JSON:**
{
  "content": "Full transcribed text preserving structure...",
  "confidence": 0.92
}

Return ONLY valid JSON.`,
          },
        ],
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in transcription response');
  }

  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON in transcription response');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    content: parsed.content || '',
    confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
  };
}

/**
 * Pass 2: Extract metadata from transcribed text using Haiku
 * Fast text analysis - no vision needed
 */
async function extractMetadata(transcribedText: string): Promise<MetadataResult> {
  const response = await anthropic.messages.create({
    model: METADATA_MODEL,
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `Extract trading journal metadata from this text:

"""
${transcribedText}
"""

**Extract:**
1. Date (convert to YYYY-MM-DD format, use current year if not specified)
2. Ticker symbols (normalize to uppercase, remove $ prefix)
3. Mood based on emotional language
4. Overall sentiment

**Mood mapping:**
- CONFIDENT: "conviction", "clear setup", "high probability", "knew it", "textbook"
- NERVOUS: "anxious", "risky", "worried", "scared", "uncomfortable"
- EXCITED: "pumped", "big opportunity", "amazing", "can't wait"
- UNCERTAIN: "not sure", "maybe", "conflicted", "mixed signals", "unsure"
- NEUTRAL: Objective observations, factual recounting without emotion

**Return JSON:**
{
  "date": "2025-09-19" or null,
  "tickers": ["SPY", "AAPL"],
  "mood": "CONFIDENT" | "NERVOUS" | "EXCITED" | "UNCERTAIN" | "NEUTRAL" | null,
  "sentiment": "positive" | "negative" | "neutral"
}

Return ONLY valid JSON.`,
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in metadata response');
  }

  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON in metadata response');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  // Normalize tickers
  const tickers = (parsed.tickers || []).map((t: string) =>
    t.replace(/^\$/, '').toUpperCase()
  );

  // Validate mood
  const validMoods: EntryMood[] = ['CONFIDENT', 'NERVOUS', 'EXCITED', 'UNCERTAIN', 'NEUTRAL'];
  const mood = parsed.mood && validMoods.includes(parsed.mood)
    ? (parsed.mood as EntryMood)
    : null;

  return {
    date: parsed.date || null,
    tickers,
    mood,
    sentiment: parsed.sentiment || 'neutral',
  };
}

/**
 * Extract handwritten journal data from image using two-pass OCR
 * Pass 1: Fast transcription with Haiku Vision (~3-5s)
 * Pass 2: Metadata extraction from text with Haiku (~1-2s)
 * Total: ~5-7s (down from 25-30s)
 *
 * @param imageUrl - R2 URL of the journal page image
 * @returns Parsed journal data
 */
export async function extractJournalData(
  imageUrl: string
): Promise<OCRResult> {
  try {
    // Pass 1: Transcribe the handwriting (vision task)
    const transcription = await transcribeHandwriting(imageUrl);

    // Pass 2: Extract metadata from text (text-only task, runs in parallel potential)
    const metadata = await extractMetadata(transcription.content);

    // Parse and validate date
    let isoDate: string | null = null;
    if (metadata.date) {
      try {
        const dateObj = parseISO(metadata.date);
        if (!isNaN(dateObj.getTime())) {
          isoDate = dateObj.toISOString();
        }
      } catch {
        console.warn('Failed to parse extracted date:', metadata.date);
      }
    }

    return {
      content: transcription.content,
      date: isoDate,
      tickers: metadata.tickers,
      mood: metadata.mood,
      sentiment: metadata.sentiment,
      confidence: transcription.confidence,
      rawExtraction: JSON.stringify({ transcription, metadata }),
    };
  } catch (error) {
    console.error('OCR extraction failed:', error);
    throw new Error(
      `Failed to extract journal data: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Validate OCR confidence and generate warnings
 */
export function validateOCRResult(result: OCRResult): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (result.confidence < 0.5) {
    warnings.push('Very low OCR confidence (<50%). Handwriting may be unclear.');
  } else if (result.confidence < 0.7) {
    warnings.push('Low OCR confidence (<70%). Please review transcription carefully.');
  }

  if (!result.date) {
    warnings.push('No date detected. Please set the entry date manually.');
  }

  if (result.tickers.length === 0) {
    warnings.push('No ticker symbols found in the journal entry.');
  }

  if (result.content.length < 10) {
    warnings.push('Very short transcription. The image may be unclear or contain little text.');
  }

  return {
    isValid: result.confidence >= 0.3, // Minimum threshold
    warnings,
  };
}
