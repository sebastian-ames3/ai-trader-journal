import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UpdateType } from '@prisma/client';

/**
 * GET /api/theses/[id]/updates
 * Get all updates for a thesis
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check if thesis exists
    const existingThesis = await prisma.tradingThesis.findUnique({
      where: { id }
    });

    if (!existingThesis) {
      return NextResponse.json(
        { error: 'Thesis not found' },
        { status: 404 }
      );
    }

    const updates = await prisma.thesisUpdate.findMany({
      where: { thesisId: id },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json({ updates });
  } catch (error) {
    console.error('Error fetching thesis updates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thesis updates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/theses/[id]/updates
 * Add an update to a thesis
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate required fields
    if (!body.type || !body.content) {
      return NextResponse.json(
        { error: 'Type and content are required' },
        { status: 400 }
      );
    }

    // Validate type enum
    if (!Object.values(UpdateType).includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid update type. Must be THESIS_STRENGTHENED, THESIS_WEAKENED, THESIS_CHANGED, or NOTE' },
        { status: 400 }
      );
    }

    // Check if thesis exists
    const existingThesis = await prisma.tradingThesis.findUnique({
      where: { id }
    });

    if (!existingThesis) {
      return NextResponse.json(
        { error: 'Thesis not found' },
        { status: 404 }
      );
    }

    // Create update
    const update = await prisma.thesisUpdate.create({
      data: {
        thesisId: id,
        type: body.type,
        content: body.content,
        entryId: body.entryId || null
      }
    });

    return NextResponse.json(update, { status: 201 });
  } catch (error) {
    console.error('Error creating thesis update:', error);
    return NextResponse.json(
      { error: 'Failed to create thesis update' },
      { status: 500 }
    );
  }
}
