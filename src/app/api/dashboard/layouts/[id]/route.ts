import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateWidgetId, isValidWidgetType, WidgetInstance } from '@/lib/dashboard';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/dashboard/layouts/[id]
 * Get a specific dashboard layout by ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const layout = await prisma.dashboardLayout.findUnique({
      where: { id },
    });

    if (!layout) {
      return NextResponse.json(
        { error: 'Layout not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(layout);
  } catch (error) {
    console.error('Error fetching dashboard layout:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard layout' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/dashboard/layouts/[id]
 * Update a dashboard layout
 *
 * Request body:
 * - name?: string
 * - description?: string
 * - widgets?: WidgetInstance[]
 * - isPublic?: boolean
 * - shareSlug?: string
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    // Check if layout exists
    const existingLayout = await prisma.dashboardLayout.findUnique({
      where: { id },
    });

    if (!existingLayout) {
      return NextResponse.json(
        { error: 'Layout not found' },
        { status: 404 }
      );
    }

    // Cannot modify default layouts directly
    if (existingLayout.isDefault) {
      return NextResponse.json(
        { error: 'Cannot modify default layouts. Clone it first.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    // Validate and set name
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim() === '') {
        return NextResponse.json(
          { error: 'Name must be a non-empty string' },
          { status: 400 }
        );
      }
      updateData.name = body.name.trim();
    }

    // Set description
    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null;
    }

    // Validate and set widgets
    if (body.widgets !== undefined) {
      if (!Array.isArray(body.widgets)) {
        return NextResponse.json(
          { error: 'Widgets must be an array' },
          { status: 400 }
        );
      }

      // Validate each widget
      for (const widget of body.widgets) {
        if (!widget.widgetType || !isValidWidgetType(widget.widgetType)) {
          return NextResponse.json(
            { error: `Invalid widget type: ${widget.widgetType}` },
            { status: 400 }
          );
        }
        if (!widget.position) {
          return NextResponse.json(
            { error: 'Widget position is required' },
            { status: 400 }
          );
        }
      }

      // Ensure all widgets have IDs
      const widgets = body.widgets.map((w: WidgetInstance) => ({
        ...w,
        widgetId: w.widgetId || generateWidgetId(),
        config: w.config || {},
      }));

      updateData.widgets = widgets as unknown as object;
    }

    // Set sharing options
    if (body.isPublic !== undefined) {
      updateData.isPublic = Boolean(body.isPublic);
    }

    if (body.shareSlug !== undefined) {
      // Validate slug uniqueness
      if (body.shareSlug) {
        const existingSlug = await prisma.dashboardLayout.findUnique({
          where: { shareSlug: body.shareSlug },
        });
        if (existingSlug && existingSlug.id !== id) {
          return NextResponse.json(
            { error: 'Share slug already in use' },
            { status: 400 }
          );
        }
      }
      updateData.shareSlug = body.shareSlug || null;
    }

    // Update the layout
    const layout = await prisma.dashboardLayout.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(layout);
  } catch (error) {
    console.error('Error updating dashboard layout:', error);
    return NextResponse.json(
      { error: 'Failed to update dashboard layout' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/dashboard/layouts/[id]
 * Delete a dashboard layout
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    // Check if layout exists
    const existingLayout = await prisma.dashboardLayout.findUnique({
      where: { id },
    });

    if (!existingLayout) {
      return NextResponse.json(
        { error: 'Layout not found' },
        { status: 404 }
      );
    }

    // Cannot delete default layouts
    if (existingLayout.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default layouts' },
        { status: 400 }
      );
    }

    // If this is the active layout, we need to activate another one
    if (existingLayout.isActive) {
      // Find another layout to activate
      const anotherLayout = await prisma.dashboardLayout.findFirst({
        where: {
          id: { not: id },
        },
        orderBy: [
          { isDefault: 'desc' },
          { updatedAt: 'desc' },
        ],
      });

      if (anotherLayout) {
        await prisma.dashboardLayout.update({
          where: { id: anotherLayout.id },
          data: { isActive: true },
        });
      }
    }

    // Delete the layout
    await prisma.dashboardLayout.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting dashboard layout:', error);
    return NextResponse.json(
      { error: 'Failed to delete dashboard layout' },
      { status: 500 }
    );
  }
}
