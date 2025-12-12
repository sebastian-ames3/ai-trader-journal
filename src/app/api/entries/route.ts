import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EntryType, EntryMood, ConvictionLevel, CaptureMethod, Prisma } from '@prisma/client';
import { updateStreakAfterEntry, getCelebrationMessage } from '@/lib/streakTracking';

export const dynamic = 'force-dynamic';

/**
 * GET /api/entries
 * List journal entries with optional filters
 *
 * Query Parameters:
 * - search: Full-text search on content
 * - type: Entry type (TRADE_IDEA, TRADE, REFLECTION, OBSERVATION)
 * - ticker: Ticker symbol
 * - mood: Emotional state
 * - conviction: Conviction level (LOW, MEDIUM, HIGH)
 * - sentiment: AI-detected sentiment (positive, negative, neutral)
 * - bias: Cognitive bias to filter by (supports multiple via comma-separated)
 * - tag: AI-generated tag to filter by (supports multiple via comma-separated)
 * - dateFrom: ISO date string (entries created after this date)
 * - dateTo: ISO date string (entries created before this date)
 * - limit: Max results (default: 50)
 * - offset: Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse filter parameters
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const ticker = searchParams.get('ticker');
    const mood = searchParams.get('mood');
    const conviction = searchParams.get('conviction');
    const sentiment = searchParams.get('sentiment');
    const biasParam = searchParams.get('bias');
    const tagParam = searchParams.get('tag');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build where clause
    const where: Prisma.EntryWhereInput = {};

    // Full-text search on content
    if (search) {
      where.content = {
        contains: search,
        mode: 'insensitive'
      };
    }

    // Entry type filter
    if (type && Object.values(EntryType).includes(type as EntryType)) {
      where.type = type as EntryType;
    }

    // Ticker filter (case-insensitive exact match)
    if (ticker) {
      where.ticker = {
        equals: ticker,
        mode: 'insensitive'
      };
    }

    // Mood filter
    if (mood && Object.values(EntryMood).includes(mood as EntryMood)) {
      where.mood = mood as EntryMood;
    }

    // Conviction filter
    if (conviction && Object.values(ConvictionLevel).includes(conviction as ConvictionLevel)) {
      where.conviction = conviction as ConvictionLevel;
    }

    // Sentiment filter
    if (sentiment && ['positive', 'negative', 'neutral'].includes(sentiment)) {
      where.sentiment = sentiment;
    }

    // Bias filter (supports multiple biases comma-separated)
    if (biasParam) {
      const biases = biasParam.split(',').map(b => b.trim());
      where.detectedBiases = {
        hasSome: biases
      };
    }

    // AI Tag filter (supports multiple tags comma-separated)
    if (tagParam) {
      const tags = tagParam.split(',').map(t => t.trim());
      where.aiTags = {
        hasSome: tags
      };
    }

    // Date range filters
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    // Fetch entries with filters and pagination
    const entries = await prisma.entry.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        tags: true
      },
      take: limit,
      skip: offset
    });

    // Get total count for pagination
    const total = await prisma.entry.count({ where });

    return NextResponse.json({
      entries,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + entries.length < total
      }
    });
  } catch (error) {
    console.error('Error fetching entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entries' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/entries
 * Create a new journal entry
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.type || !body.content) {
      return NextResponse.json(
        { error: 'Type and content are required' },
        { status: 400 }
      );
    }

    // Validate type enum
    if (!Object.values(EntryType).includes(body.type)) {
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

    // Validate captureMethod enum if provided
    if (body.captureMethod && !Object.values(CaptureMethod).includes(body.captureMethod)) {
      return NextResponse.json(
        { error: 'Invalid capture method value' },
        { status: 400 }
      );
    }

    // Validate imageUrls is an array if provided
    if (body.imageUrls && !Array.isArray(body.imageUrls)) {
      return NextResponse.json(
        { error: 'imageUrls must be an array' },
        { status: 400 }
      );
    }

    // Create entry with media fields
    const entry = await prisma.entry.create({
      data: {
        type: body.type,
        content: body.content,
        mood: body.mood || null,
        conviction: body.conviction || null,
        ticker: body.ticker || null,
        tradeId: body.tradeId || null,
        snapshotId: body.snapshotId || null,
        // Media fields (Phase 2 - Frictionless Capture)
        audioUrl: body.audioUrl || null,
        audioDuration: body.audioDuration ? parseInt(body.audioDuration, 10) : null,
        transcription: body.transcription || null,
        imageUrls: body.imageUrls || [],
        imageAnalyses: body.imageAnalyses || null,
        captureMethod: body.captureMethod || CaptureMethod.TEXT
      },
      include: {
        tags: true
      }
    });

    // Update streak tracking
    const streakData = await updateStreakAfterEntry();

    // Prepare celebration message if milestone reached
    let celebrationMessage: string | undefined;
    if (streakData.isNewMilestone && streakData.milestoneType && streakData.milestoneValue) {
      celebrationMessage = getCelebrationMessage(
        streakData.milestoneType,
        streakData.milestoneValue
      );
    }

    return NextResponse.json({
      entry,
      streak: {
        currentStreak: streakData.currentStreak,
        longestStreak: streakData.longestStreak,
        totalEntries: streakData.totalEntries,
        celebrationMessage
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating entry:', error);
    return NextResponse.json(
      { error: 'Failed to create entry' },
      { status: 500 }
    );
  }
}
