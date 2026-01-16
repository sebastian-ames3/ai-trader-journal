import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ThesisStatus } from '@prisma/client';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/theses/[id]
 * Get a single thesis with all related data
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
    const thesis = await prisma.tradingThesis.findUnique({
      where: { id },
      include: {
        thesisTrades: {
          orderBy: { openedAt: 'desc' },
          include: {
            attachments: true
          }
        },
        updates: {
          orderBy: { date: 'desc' }
        },
        attachments: true
      }
    });

    if (!thesis || thesis.userId !== user.id) {
      return NextResponse.json(
        { error: 'Thesis not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(thesis);
  } catch (error) {
    console.error('Error fetching thesis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thesis' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/theses/[id]
 * Update a thesis
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();

    // Check if thesis exists and verify ownership
    const existingThesis = await prisma.tradingThesis.findUnique({
      where: { id }
    });

    if (!existingThesis || existingThesis.userId !== user.id) {
      return NextResponse.json(
        { error: 'Thesis not found' },
        { status: 404 }
      );
    }

    // Validate status if provided
    if (body.status && !Object.values(ThesisStatus).includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid thesis status' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: {
      name?: string;
      originalThesis?: string;
      status?: ThesisStatus;
    } = {};

    if (body.name) updateData.name = body.name;
    if (body.originalThesis) updateData.originalThesis = body.originalThesis;
    if (body.status) updateData.status = body.status;

    // Update thesis
    const thesis = await prisma.tradingThesis.update({
      where: { id },
      data: updateData,
      include: {
        thesisTrades: {
          orderBy: { openedAt: 'desc' },
          take: 5
        },
        updates: {
          orderBy: { date: 'desc' },
          take: 5
        },
        _count: {
          select: {
            thesisTrades: true,
            updates: true
          }
        }
      }
    });

    return NextResponse.json(thesis);
  } catch (error) {
    console.error('Error updating thesis:', error);
    return NextResponse.json(
      { error: 'Failed to update thesis' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/theses/[id]
 * Delete a thesis and all related data
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
    // Check if thesis exists and verify ownership
    const existingThesis = await prisma.tradingThesis.findUnique({
      where: { id }
    });

    if (!existingThesis || existingThesis.userId !== user.id) {
      return NextResponse.json(
        { error: 'Thesis not found' },
        { status: 404 }
      );
    }

    // Delete thesis (cascades to trades, updates, attachments)
    await prisma.tradingThesis.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting thesis:', error);
    return NextResponse.json(
      { error: 'Failed to delete thesis' },
      { status: 500 }
    );
  }
}
