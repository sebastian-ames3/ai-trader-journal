import { NextResponse } from 'next/server';
import {
  WIDGET_REGISTRY,
  getWidgetCategories,
  getWidgetsByCategory,
  WidgetDefinition,
} from '@/lib/dashboard';
import { WidgetCategory } from '@prisma/client';

interface WidgetAvailableResponse {
  widgets: WidgetDefinition[];
  categories: {
    category: WidgetCategory;
    name: string;
    widgets: WidgetDefinition[];
  }[];
  totalCount: number;
}

/**
 * GET /api/dashboard/widgets/available
 * Get all available widget definitions with their categories and configuration schemas
 *
 * Returns:
 * - widgets: All widget definitions
 * - categories: Widgets organized by category
 * - totalCount: Total number of available widgets
 */
export async function GET(): Promise<NextResponse<WidgetAvailableResponse | { error: string }>> {
  try {
    const allWidgets = Object.values(WIDGET_REGISTRY);
    const categories = getWidgetCategories();

    // Map category enum to display name
    const categoryNames: Record<WidgetCategory, string> = {
      CAPTURE: 'Capture',
      INSIGHTS: 'Insights',
      TRACKING: 'Tracking',
      POSITIONS: 'Positions',
      SOCIAL: 'Social',
    };

    const categorizedWidgets = categories.map((category) => ({
      category,
      name: categoryNames[category],
      widgets: getWidgetsByCategory(category),
    }));

    return NextResponse.json({
      widgets: allWidgets,
      categories: categorizedWidgets,
      totalCount: allWidgets.length,
    });
  } catch (error) {
    console.error('Error fetching available widgets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available widgets' },
      { status: 500 }
    );
  }
}
