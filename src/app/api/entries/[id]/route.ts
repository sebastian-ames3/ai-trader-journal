import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EntryType, EntryMood, ConvictionLevel } from '@prisma/client';
import { analyzeEntryText } from '@/lib/aiAnalysis';
import { isClaudeConfigured } from '@/lib/claude';
import { requireAuth } from '@/lib/auth';

/**
 * Calculate similarity between two strings using word-based Jaccard index
 */
function calculateSimilarity(str1: string, str2: string): number {
  // Handle empty strings
  if (str1.length === 0 && str2.length === 0) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;

  // Simple word-based similarity (Jaccard index)
  const words1 = str1.toLowerCase().split(/\s+/);
  const words2 = str2.toLowerCase().split(/\s+/);

  const set1 = new Set(words1);
  const set2 = new Set(words2);

  const intersection = Array.from(set1).filter(x => set2.has(x));
  const unionSize = set1.size + set2.size - intersection.length;

  return intersection.length / unionSize;
}

/**
 * Determine if content change is significant enough to warrant re-analysis
 */
function isSignificantChange(oldContent: string, newContent: string): boolean {
  // If content length changed by more than 50 characters
  if (Math.abs(newContent.length - oldContent.length) > 50) {
    return true;
  }

  // If similarity is less than 80%
  const similarity = calculateSimilarity(oldContent, newContent);
  if (similarity < 0.8) {
    return true;
  }

  return false;
}

/**
 * GET /api/entries/[id]
 * Get a single journal entry by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

    const { id } = await params;
    const entry = await prisma.entry.findUnique({
      where: {
        id
      },
      include: {
        tags: true,
        trade: true,
        thesisTrade: {
          include: {
            thesis: {
              select: {
                id: true,
                name: true,
                ticker: true,
              }
            }
          }
        },
        snapshot: true
      }
    });

    if (!entry || entry.userId !== user.id) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Error fetching entry:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entry' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/entries/[id]
 * Update a journal entry
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();

    // Check if entry exists and verify ownership
    const existingEntry = await prisma.entry.findUnique({
      where: { id }
    });

    if (!existingEntry || existingEntry.userId !== user.id) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    // Validate type enum if provided
    if (body.type && !Object.values(EntryType).includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid entry type' },
        { status: 400 }
      );
    }

    // Validate mood enum if provided
    if (body.mood && !Object.values(EntryMood).includes(body.mood)) {
      return NextResponse.json(
        { error: 'Invalid mood value' },
        { status: 400 }
      );
    }

    // Validate conviction enum if provided
    if (body.conviction && !Object.values(ConvictionLevel).includes(body.conviction)) {
      return NextResponse.json(
        { error: 'Invalid conviction value' },
        { status: 400 }
      );
    }

    // Check if content changed significantly and re-run AI analysis
    let aiAnalysisData = {};
    const contentChanged = body.content && existingEntry.content !== body.content;

    if (contentChanged && isSignificantChange(existingEntry.content, body.content)) {
      // Re-run AI analysis for significant content changes
      if (isClaudeConfigured()) {
        try {
          const analysis = await analyzeEntryText(body.content, body.mood, body.conviction);
          aiAnalysisData = {
            sentiment: analysis.sentiment,
            emotionalKeywords: analysis.emotionalKeywords,
            detectedBiases: analysis.detectedBiases,
            convictionInferred: analysis.convictionInferred,
            aiTags: analysis.aiTags,
          };
        } catch (error) {
          // Log but don't fail the update if AI analysis fails
          console.error('AI re-analysis failed:', error);
        }
      }
    }

    // Handle thesisTradeId - explicitly allow null to unlink
    const thesisTradeUpdate = 'thesisTradeId' in body
      ? { thesisTradeId: body.thesisTradeId || null }
      : {};

    // Handle createdAt update if provided
    const createdAtUpdate = body.createdAt
      ? { createdAt: new Date(body.createdAt) }
      : {};

    // Update entry
    const entry = await prisma.entry.update({
      where: {
        id
      },
      data: {
        type: body.type,
        content: body.content,
        mood: body.mood || null,
        conviction: body.conviction || null,
        ticker: body.ticker || null,
        ...thesisTradeUpdate,
        ...createdAtUpdate,
        ...aiAnalysisData,
      },
      include: {
        tags: true,
        trade: true,
        thesisTrade: {
          include: {
            thesis: {
              select: {
                id: true,
                name: true,
                ticker: true,
              }
            }
          }
        }
      }
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Error updating entry:', error);
    return NextResponse.json(
      { error: 'Failed to update entry' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/entries/[id]
 * Soft delete a journal entry (sets deletedAt timestamp)
 * Entry can be restored within 30 days via POST /api/entries/[id]/restore
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

    const { id } = await params;
    // Check if entry exists and verify ownership
    const existingEntry = await prisma.entry.findUnique({
      where: { id }
    });

    if (!existingEntry || existingEntry.userId !== user.id) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    // Soft delete - set deletedAt timestamp instead of actually deleting
    const deletedEntry = await prisma.entry.update({
      where: { id },
      data: {
        deletedAt: new Date()
      },
      select: {
        id: true,
        deletedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      entry: deletedEntry,
      message: 'Entry moved to trash. You can undo this action.'
    });
  } catch (error) {
    console.error('Error deleting entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete entry' },
      { status: 500 }
    );
  }
}
