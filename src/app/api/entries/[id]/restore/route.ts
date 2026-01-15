import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/**
 * POST /api/entries/[id]/restore
 * Restore a soft-deleted journal entry
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

    const { id } = await params;

    // Check if entry exists, is deleted, and belongs to user
    const existingEntry = await prisma.entry.findUnique({
      where: { id }
    });

    if (!existingEntry || existingEntry.userId !== user.id) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    if (!existingEntry.deletedAt) {
      return NextResponse.json(
        { error: 'Entry is not deleted' },
        { status: 400 }
      );
    }

    // Restore entry by clearing deletedAt
    const restoredEntry = await prisma.entry.update({
      where: { id },
      data: {
        deletedAt: null
      },
      include: {
        tags: true
      }
    });

    return NextResponse.json({
      success: true,
      entry: restoredEntry,
      message: 'Entry restored successfully'
    });
  } catch (error) {
    console.error('Error restoring entry:', error);
    return NextResponse.json(
      { error: 'Failed to restore entry' },
      { status: 500 }
    );
  }
}
