import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LAYOUT_TEMPLATES, generateWidgetId, WidgetInstance } from '@/lib/dashboard';
import { requireAuth } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/dashboard/templates/[id]/apply
 * Apply a template to create a new dashboard layout
 *
 * Request body (optional):
 * - name?: string (defaults to template name)
 * - description?: string
 * - activate?: boolean (set as active layout, default: false)
 *
 * This creates a new layout based on the template, with fresh widget IDs.
 * It also increments the usage count for database templates.
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const { id } = await params;

    // Parse optional body
    let body: { name?: string; description?: string; activate?: boolean } = {};
    try {
      body = await request.json();
    } catch {
      // No body provided, use defaults
    }

    // First, check if it's a built-in template
    const builtInTemplate = LAYOUT_TEMPLATES.find((t) => t.id === id);

    let templateName: string;
    let templateDescription: string | null;
    let templateWidgets: WidgetInstance[];

    if (builtInTemplate) {
      templateName = builtInTemplate.name;
      templateDescription = builtInTemplate.description;
      templateWidgets = builtInTemplate.widgets;
    } else {
      // Check database templates
      const dbTemplate = await prisma.layoutTemplate.findUnique({
        where: { id },
      });

      if (!dbTemplate) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }

      templateName = dbTemplate.name;
      templateDescription = dbTemplate.description;
      templateWidgets = dbTemplate.widgets as unknown as WidgetInstance[];

      // Increment usage count
      await prisma.layoutTemplate.update({
        where: { id },
        data: { usageCount: { increment: 1 } },
      });
    }

    // Generate fresh widget IDs
    const newWidgets = templateWidgets.map((widget) => ({
      ...widget,
      widgetId: generateWidgetId(),
    }));

    // If activating, deactivate other layouts first
    if (body.activate) {
      await prisma.dashboardLayout.updateMany({
        where: { userId: user.id, isActive: true },
        data: { isActive: false },
      });
    }

    // Create new layout from template
    const newLayout = await prisma.dashboardLayout.create({
      data: {
        userId: user.id,
        name: body.name?.trim() || templateName,
        description: body.description?.trim() || templateDescription,
        widgets: newWidgets as unknown as object,
        isDefault: false,
        isActive: body.activate === true,
      },
    });

    return NextResponse.json(newLayout, { status: 201 });
  } catch (error) {
    console.error('Error applying layout template:', error);
    return NextResponse.json(
      { error: 'Failed to apply layout template' },
      { status: 500 }
    );
  }
}
