import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_LAYOUT, generateWidgetId, isValidWidgetType, WidgetInstance } from '@/lib/dashboard';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/dashboard/layouts
 * List all dashboard layouts with the active layout indicated
 *
 * Returns: { layouts: DashboardLayout[], active: DashboardLayout | null }
 */
export async function GET() {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const layouts = await prisma.dashboardLayout.findMany({
      where: { userId: user.id },
      orderBy: [
        { isActive: 'desc' },
        { isDefault: 'desc' },
        { updatedAt: 'desc' },
      ],
    });

    const active = layouts.find((l) => l.isActive) || null;

    return NextResponse.json({
      layouts,
      active,
    });
  } catch (error) {
    console.error('Error fetching dashboard layouts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard layouts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dashboard/layouts
 * Create a new dashboard layout
 *
 * Request body:
 * - name: string (required)
 * - description?: string
 * - widgets?: WidgetInstance[] (defaults to DEFAULT_LAYOUT)
 * - copyFrom?: string (layout ID to copy from)
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const body = await request.json();

    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    let widgets: WidgetInstance[] = DEFAULT_LAYOUT;

    // If copying from another layout
    if (body.copyFrom) {
      const sourceLayout = await prisma.dashboardLayout.findFirst({
        where: { id: body.copyFrom, userId: user.id },
      });

      if (!sourceLayout) {
        return NextResponse.json(
          { error: 'Source layout not found' },
          { status: 404 }
        );
      }

      // Copy widgets with new IDs
      const sourceWidgets = sourceLayout.widgets as unknown as WidgetInstance[];
      widgets = sourceWidgets.map((w) => ({
        ...w,
        widgetId: generateWidgetId(),
      }));
    } else if (body.widgets && Array.isArray(body.widgets)) {
      // Validate provided widgets
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

      // Assign widget IDs if not provided
      widgets = body.widgets.map((w: WidgetInstance) => ({
        ...w,
        widgetId: w.widgetId || generateWidgetId(),
        config: w.config || {},
      }));
    }

    // Create the layout
    const layout = await prisma.dashboardLayout.create({
      data: {
        userId: user.id,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        widgets: widgets as unknown as object,
        isDefault: false,
        isActive: false,
      },
    });

    return NextResponse.json(layout, { status: 201 });
  } catch (error) {
    console.error('Error creating dashboard layout:', error);
    return NextResponse.json(
      { error: 'Failed to create dashboard layout' },
      { status: 500 }
    );
  }
}
