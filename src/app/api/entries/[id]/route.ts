import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EntryType, EntryMood, ConvictionLevel } from '@prisma/client';

/**
 * GET /api/entries/[id]
 * Get a single journal entry by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const entry = await prisma.entry.findUnique({
      where: {
        id: params.id
      },
      include: {
        tags: true,
        trade: true,
        snapshot: true
      }
    });

    if (!entry) {
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
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Check if entry exists
    const existingEntry = await prisma.entry.findUnique({
      where: { id: params.id }
    });

    if (!existingEntry) {
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

    // Update entry
    const entry = await prisma.entry.update({
      where: {
        id: params.id
      },
      data: {
        type: body.type,
        content: body.content,
        mood: body.mood || null,
        conviction: body.conviction || null,
        ticker: body.ticker || null
      },
      include: {
        tags: true
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
 * Delete a journal entry
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if entry exists
    const existingEntry = await prisma.entry.findUnique({
      where: { id: params.id }
    });

    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    // Delete entry
    await prisma.entry.delete({
      where: {
        id: params.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete entry' },
      { status: 500 }
    );
  }
}
