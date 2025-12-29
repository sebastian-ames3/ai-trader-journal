import { EntryMood } from '@prisma/client';
import { parseISO } from 'date-fns';
import { getClaude, CLAUDE_MODELS } from '@/lib/claude';

export interface OCRResult {
  content: string; // Transcribed markdown text
  date: string | null; // ISO 8601
  tickers: string[]; // ['AAPL', 'SPY']
  mood: EntryMood | null; // 'CONFIDENT' | 'NERVOUS' | etc.
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number; // 0-1
  rawExtraction?: string; // Debug info
}

/**
 * Extract handwritten journal data from image using Claude Vision
 * @param imageUrl - R2 URL of the journal page image
 * @returns Parsed journal data
 */
export async function extractJournalData(
  imageUrl: string
): Promise<OCRResult> {
  try {
    const claude = getClaude();
    const response = await claude.messages.create({
      model: CLAUDE_MODELS.BALANCED,
      max_tokens: 2048,
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
              text: `You are analyzing a handwritten trading journal page. Extract the following information:

**IMPORTANT INSTRUCTIONS:**
1. Transcribe ALL handwritten text, preserving structure and formatting
2. Identify the date (formats: "10/24/24", "Oct 24", "October 24, 2024", etc.)
3. Extract all ticker symbols mentioned (formats: $AAPL, AAPL, aapl)
4. Infer the trader's emotional state from tone and keywords
5. Determine overall sentiment of the entry
6. Provide a confidence score (0-1) for the transcription quality

**Return response in this exact JSON format:**
{
  "content": "Full transcribed text in markdown...",
  "date": "2024-10-24" or null,
  "tickers": ["AAPL", "SPY"],
  "mood": "CONFIDENT" | "NERVOUS" | "EXCITED" | "UNCERTAIN" | "NEUTRAL" | null,
  "sentiment": "positive" | "negative" | "neutral",
  "confidence": 0.92,
  "reasoning": "Brief explanation of mood/sentiment inference"
}

**Mood mapping guidelines:**
- CONFIDENT: Phrases like "strong conviction", "clear setup", "high probability"
- NERVOUS: "anxious", "uncertain", "risky", "worried", "scared"
- EXCITED: "pumped", "big opportunity", "can't wait", "amazing setup"
- UNCERTAIN: "not sure", "maybe", "conflicted", "mixed signals"
- NEUTRAL: Objective observations without emotional language

**Important:**
- If handwriting is unclear, do your best and lower the confidence score
- If no date found, return null for date
- If no tickers mentioned, return empty array
- Extract tickers even if just referenced in text (e.g., "Apple is looking strong" → AAPL)
- Preserve ALL trading-related details: prices, strikes, expirations, P/L, etc.

Return ONLY valid JSON, no other text.`,
            },
          ],
        },
      ],
    });

    // Parse Claude's response
    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in Claude response');
    }

    // Extract JSON from response (Claude might wrap it in markdown)
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in Claude response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Normalize tickers to uppercase
    const tickers = (parsed.tickers || []).map((t: string) =>
      t.replace(/^\$/, '').toUpperCase()
    );

    // Validate mood enum
    const validMoods: EntryMood[] = [
      'CONFIDENT',
      'NERVOUS',
      'EXCITED',
      'UNCERTAIN',
      'NEUTRAL',
    ];
    const mood =
      parsed.mood && validMoods.includes(parsed.mood)
        ? (parsed.mood as EntryMood)
        : null;

    // Parse and validate date
    let isoDate: string | null = null;
    if (parsed.date) {
      try {
        // Try parsing the extracted date
        const dateObj = parseISO(parsed.date);
        if (!isNaN(dateObj.getTime())) {
          isoDate = dateObj.toISOString();
        }
      } catch {
        // If parsing fails, leave as null
        console.warn('Failed to parse extracted date:', parsed.date);
      }
    }

    return {
      content: parsed.content || '',
      date: isoDate,
      tickers,
      mood,
      sentiment: parsed.sentiment || 'neutral',
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0)),
      rawExtraction: textContent.text,
    };
  } catch (error) {
    // Enhanced error logging for debugging
    console.error('OCR extraction failed:', {
      error,
      errorType: error?.constructor?.name,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      // Log Anthropic API specific error details if available
      ...(error && typeof error === 'object' && 'status' in error && {
        status: (error as { status?: number }).status,
        headers: (error as { headers?: unknown }).headers,
        error: (error as { error?: unknown }).error,
      }),
    });

    // Re-throw with original error details preserved
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const enhancedError = new Error(`Failed to extract journal data: ${errorMessage}`);
    (enhancedError as Error & { cause?: unknown }).cause = error;
    throw enhancedError;
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
