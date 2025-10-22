import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeEntryText } from '@/lib/aiAnalysis';

/**
 * POST /api/entries/[id]/analyze
 * Analyze a journal entry using AI and update analysis fields
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Fetch the entry
    const entry = await prisma.entry.findUnique({
      where: { id: params.id }
    });

    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    // Run AI analysis
    const analysis = await analyzeEntryText(
      entry.content,
      entry.mood || undefined,
      entry.conviction || undefined
    );

    // Update entry with analysis results
    const updatedEntry = await prisma.entry.update({
      where: { id: params.id },
      data: {
        sentiment: analysis.sentiment,
        emotionalKeywords: analysis.emotionalKeywords,
        detectedBiases: analysis.detectedBiases,
        convictionInferred: analysis.convictionInferred
      },
      include: {
        tags: true
      }
    });

    return NextResponse.json({
      ...updatedEntry,
      analysisConfidence: analysis.confidence
    });

  } catch (error) {
    console.error('Error analyzing entry:', error);

    // Check if it's an API key error
    if (error instanceof Error && error.message.includes('OPENAI_API_KEY')) {
      return NextResponse.json(
        { error: 'AI analysis is not configured. Please set OPENAI_API_KEY.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to analyze entry' },
      { status: 500 }
    );
  }
}
