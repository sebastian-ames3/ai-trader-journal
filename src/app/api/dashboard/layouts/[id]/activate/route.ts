import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: { id: string };
}

/**
 * POST /api/dashboard/layouts/[id]/activate
 * Set a layout as the active layout
 *
 * This deactivates any currently active layout and activates the specified one.
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Check if layout exists
    const layout = await prisma.dashboardLayout.findUnique({
      where: { id: params.id },
    });

    if (!layout) {
      return NextResponse.json(
        { error: 'Layout not found' },
        { status: 404 }
      );
    }

    // If already active, return as is
    if (layout.isActive) {
      return NextResponse.json(layout);
    }

    // Use a transaction to ensure atomicity
    const updatedLayout = await prisma.$transaction(async (tx) => {
      // Deactivate all layouts
      await tx.dashboardLayout.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      // Activate the specified layout
      return tx.dashboardLayout.update({
        where: { id: params.id },
        data: { isActive: true },
      });
    });

    return NextResponse.json(updatedLayout);
  } catch (error) {
    console.error('Error activating dashboard layout:', error);
    return NextResponse.json(
      { error: 'Failed to activate dashboard layout' },
      { status: 500 }
    );
  }
}
