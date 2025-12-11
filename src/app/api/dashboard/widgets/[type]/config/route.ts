import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  isValidWidgetType,
  validateWidgetConfig,
  getDefaultWidgetConfig,
  WidgetType,
} from '@/lib/dashboard';

interface RouteParams {
  params: { type: string };
}

/**
 * PUT /api/dashboard/widgets/[type]/config
 * Save widget configuration
 *
 * Request body:
 * - config: Record<string, unknown> - Widget-specific configuration
 *
 * Validates the config against the widget's schema before saving.
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { type } = params;

    // Validate widget type
    if (!isValidWidgetType(type)) {
      return NextResponse.json(
        { error: `Invalid widget type: ${type}` },
        { status: 400 }
      );
    }

    const widgetType = type as WidgetType;
    const body = await request.json();

    // Validate config object
    if (!body.config || typeof body.config !== 'object') {
      return NextResponse.json(
        { error: 'Config object is required' },
        { status: 400 }
      );
    }

    // Merge with defaults to ensure all required fields
    const defaultConfig = getDefaultWidgetConfig(widgetType);
    const mergedConfig = { ...defaultConfig, ...body.config };

    // Validate against schema
    if (!validateWidgetConfig(widgetType, mergedConfig)) {
      return NextResponse.json(
        { error: 'Invalid configuration for widget type' },
        { status: 400 }
      );
    }

    // Upsert the widget config
    const savedConfig = await prisma.widgetConfig.upsert({
      where: { widgetType: type },
      create: {
        widgetType: type,
        config: mergedConfig,
        isDefault: false,
      },
      update: {
        config: mergedConfig,
      },
    });

    return NextResponse.json(savedConfig);
  } catch (error) {
    console.error('Error saving widget config:', error);
    return NextResponse.json(
      { error: 'Failed to save widget configuration' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/dashboard/widgets/[type]/config
 * Get saved widget configuration
 *
 * Returns the saved config or defaults if none saved.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { type } = params;

    // Validate widget type
    if (!isValidWidgetType(type)) {
      return NextResponse.json(
        { error: `Invalid widget type: ${type}` },
        { status: 400 }
      );
    }

    const widgetType = type as WidgetType;

    // Get saved config
    const savedConfig = await prisma.widgetConfig.findUnique({
      where: { widgetType: type },
    });

    if (savedConfig) {
      return NextResponse.json(savedConfig);
    }

    // Return defaults if no saved config
    const defaultConfig = getDefaultWidgetConfig(widgetType);
    return NextResponse.json({
      widgetType: type,
      config: defaultConfig,
      isDefault: true,
    });
  } catch (error) {
    console.error('Error fetching widget config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch widget configuration' },
      { status: 500 }
    );
  }
}
