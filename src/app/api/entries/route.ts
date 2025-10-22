import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EntryType, EntryMood, ConvictionLevel } from '@prisma/client';

/**
 * GET /api/entries
 * List all journal entries (reverse chronological order)
 */
export async function GET() {
  try {
    const entries = await prisma.entry.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        tags: true
      }
    });

    return NextResponse.json(entries);
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

    // Create entry
    const entry = await prisma.entry.create({
      data: {
        type: body.type,
        content: body.content,
        mood: body.mood || null,
        conviction: body.conviction || null,
        ticker: body.ticker || null,
        tradeId: body.tradeId || null,
        snapshotId: body.snapshotId || null
      },
      include: {
        tags: true
      }
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error('Error creating entry:', error);
    return NextResponse.json(
      { error: 'Failed to create entry' },
      { status: 500 }
    );
  }
}
