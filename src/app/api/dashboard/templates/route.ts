import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LAYOUT_TEMPLATES, generateWidgetId } from '@/lib/dashboard';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/templates
 * Get all available layout templates
 *
 * Returns templates from:
 * 1. Built-in templates defined in dashboard.ts
 * 2. Database templates (LayoutTemplate model)
 *
 * Templates are categorized:
 * - beginner: Simple layouts for new traders
 * - advanced: Comprehensive layouts with all features
 * - minimal: Clean, distraction-free layouts
 * - options-trader: Focus on positions and market conditions
 * - psychology: Deep dive into emotional patterns and biases
 */
export async function GET() {
  try {
    // Get database templates
    const dbTemplates = await prisma.layoutTemplate.findMany({
      where: { isActive: true },
      orderBy: [
        { usageCount: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Combine built-in templates with database templates
    // Built-in templates get fresh widget IDs each time
    const builtInTemplates = LAYOUT_TEMPLATES.map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      widgets: template.widgets.map((w) => ({
        ...w,
        widgetId: generateWidgetId(),
      })),
      thumbnail: template.thumbnail || null,
      isBuiltIn: true,
      usageCount: 0,
    }));

    // Format database templates
    const formattedDbTemplates = dbTemplates.map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      widgets: template.widgets,
      thumbnail: template.thumbnail,
      isBuiltIn: false,
      usageCount: template.usageCount,
    }));

    // Combine all templates
    const allTemplates = [...builtInTemplates, ...formattedDbTemplates];

    // Group by category
    const categories = ['beginner', 'minimal', 'advanced', 'options-trader', 'psychology'];
    const byCategory = categories.map((category) => ({
      category,
      templates: allTemplates.filter((t) => t.category === category),
    }));

    return NextResponse.json({
      templates: allTemplates,
      byCategory,
      totalCount: allTemplates.length,
    });
  } catch (error) {
    console.error('Error fetching layout templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch layout templates' },
      { status: 500 }
    );
  }
}
