import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeEntryText, SAFE_ANALYSIS_DEFAULTS } from '@/lib/aiAnalysis';
import { isClaudeConfigured } from '@/lib/claude';

/**
 * POST /api/entries/[id]/analyze
 * Analyze a journal entry using AI and update analysis fields
 *
 * The analysis uses Zod validation and graceful degradation:
 * - Invalid AI responses are caught and replaced with safe defaults
 * - Entries are always updated (with real analysis or defaults)
 * - Low confidence (0) indicates analysis failed/used defaults
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch the entry
    const entry = await prisma.entry.findUnique({
      where: { id }
    });

    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    // Check if Claude is configured before attempting analysis
    if (!isClaudeConfigured()) {
      // Update with defaults and inform client
      const updatedEntry = await prisma.entry.update({
        where: { id },
        data: {
          sentiment: SAFE_ANALYSIS_DEFAULTS.sentiment,
          emotionalKeywords: SAFE_ANALYSIS_DEFAULTS.emotionalKeywords,
          detectedBiases: SAFE_ANALYSIS_DEFAULTS.detectedBiases,
          convictionInferred: SAFE_ANALYSIS_DEFAULTS.convictionInferred,
          aiTags: SAFE_ANALYSIS_DEFAULTS.aiTags
        },
        include: {
          tags: true
        }
      });

      return NextResponse.json({
        ...updatedEntry,
        analysisConfidence: 0,
        analysisStatus: 'unavailable',
        message: 'AI analysis is not configured. Entry saved with default values.'
      });
    }

    // Run AI analysis - this now returns safe defaults instead of throwing
    const analysis = await analyzeEntryText(
      entry.content,
      entry.mood || undefined,
      entry.conviction || undefined
    );

    // Update entry with analysis results (could be real analysis or defaults)
    const updatedEntry = await prisma.entry.update({
      where: { id },
      data: {
        sentiment: analysis.sentiment,
        emotionalKeywords: analysis.emotionalKeywords,
        detectedBiases: analysis.detectedBiases,
        convictionInferred: analysis.convictionInferred,
        aiTags: analysis.aiTags
      },
      include: {
        tags: true
      }
    });

    // Determine analysis status based on confidence
    const analysisStatus = analysis.confidence === 0
      ? 'failed'
      : analysis.confidence < 0.3
        ? 'low_confidence'
        : 'success';

    return NextResponse.json({
      ...updatedEntry,
      analysisConfidence: analysis.confidence,
      analysisStatus,
      ...(analysisStatus === 'failed' && {
        message: 'Analysis failed. Entry saved with default values. You can retry later.'
      })
    });

  } catch (error) {
    // This should rarely happen now since analyzeEntryText catches most errors
    console.error('Unexpected error in analyze endpoint:', error);

    return NextResponse.json(
      { error: 'Failed to analyze entry' },
      { status: 500 }
    );
  }
}
