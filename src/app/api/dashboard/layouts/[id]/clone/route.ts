import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateWidgetId, WidgetInstance } from '@/lib/dashboard';

interface RouteParams {
  params: { id: string };
}

/**
 * POST /api/dashboard/layouts/[id]/clone
 * Clone an existing layout
 *
 * Request body (optional):
 * - name?: string (defaults to "Copy of [original name]")
 * - description?: string
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Find the source layout
    const sourceLayout = await prisma.dashboardLayout.findUnique({
      where: { id: params.id },
    });

    if (!sourceLayout) {
      return NextResponse.json(
        { error: 'Layout not found' },
        { status: 404 }
      );
    }

    // Parse optional body
    let body: { name?: string; description?: string } = {};
    try {
      body = await request.json();
    } catch {
      // No body provided, use defaults
    }

    // Generate new widget IDs for the cloned widgets
    const sourceWidgets = sourceLayout.widgets as unknown as WidgetInstance[];
    const clonedWidgets = sourceWidgets.map((widget) => ({
      ...widget,
      widgetId: generateWidgetId(),
    }));

    // Create the cloned layout
    const clonedLayout = await prisma.dashboardLayout.create({
      data: {
        name: body.name?.trim() || `Copy of ${sourceLayout.name}`,
        description: body.description?.trim() || sourceLayout.description,
        widgets: clonedWidgets as unknown as object,
        isDefault: false,
        isActive: false,
        isPublic: false,
        shareSlug: null,
      },
    });

    return NextResponse.json(clonedLayout, { status: 201 });
  } catch (error) {
    console.error('Error cloning dashboard layout:', error);
    return NextResponse.json(
      { error: 'Failed to clone dashboard layout' },
      { status: 500 }
    );
  }
}
