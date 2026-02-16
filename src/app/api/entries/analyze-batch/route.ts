import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { batchAnalyzeEntries } from '@/lib/aiAnalysis';

/**
 * POST /api/entries/analyze-batch
 * Batch analyze multiple journal entries for the authenticated user
 *
 * Request body:
 * {
 *   "entryIds": ["id1", "id2", ...] // Optional - if not provided, analyzes all unanalyzed entries
 *   "limit": 50 // Optional - max entries to analyze (default 50)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { user } = auth;

    const body = await request.json();
    const { entryIds, limit = 50 } = body;

    // Fetch entries to analyze, scoped to user
    let entries;

    if (entryIds && Array.isArray(entryIds)) {
      // Analyze specific entries owned by this user
      entries = await prisma.entry.findMany({
        where: {
          id: { in: entryIds },
          userId: user.id
        },
        select: {
          id: true,
          content: true,
          mood: true,
          conviction: true
        }
      });
    } else {
      // Analyze unanalyzed entries (where sentiment is null) for this user
      entries = await prisma.entry.findMany({
        where: {
          userId: user.id,
          sentiment: null
        },
        select: {
          id: true,
          content: true,
          mood: true,
          conviction: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: Math.min(limit, 100) // Cap at 100 for safety
      });
    }

    if (entries.length === 0) {
      return NextResponse.json({
        message: 'No entries to analyze',
        analyzed: 0
      });
    }

    // Run batch analysis
    const results = await batchAnalyzeEntries(
      entries.map(e => ({
        id: e.id,
        content: e.content,
        mood: e.mood || undefined,
        conviction: e.conviction || undefined
      }))
    );

    // Update all entries with analysis results
    const updatePromises = results.map(({ id, analysis }) =>
      prisma.entry.update({
        where: { id },
        data: {
          sentiment: analysis.sentiment,
          emotionalKeywords: analysis.emotionalKeywords,
          detectedBiases: analysis.detectedBiases,
          convictionInferred: analysis.convictionInferred,
          aiTags: analysis.aiTags
        }
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      message: `Successfully analyzed ${results.length} entries`,
      analyzed: results.length,
      results: results.map(r => ({
        id: r.id,
        sentiment: r.analysis.sentiment,
        confidence: r.analysis.confidence
      }))
    });

  } catch (error) {
    console.error('Error in batch analysis:', error);

    // Check if it's an API key error
    if (error instanceof Error && error.message.includes('ANTHROPIC_API_KEY')) {
      return NextResponse.json(
        { error: 'AI analysis is not configured. Please set ANTHROPIC_API_KEY.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to batch analyze entries' },
      { status: 500 }
    );
  }
}
