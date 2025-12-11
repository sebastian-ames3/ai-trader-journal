import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoalStatus, GoalTimeframe } from '@prisma/client';
import { GOAL_TEMPLATES } from '@/lib/coach';

/**
 * GET /api/coach/goals
 * List coach goals with optional filters
 *
 * Query parameters:
 * - status: Filter by status (ACTIVE, COMPLETED, ABANDONED, EXPIRED)
 * - limit: Max results (default: 20, max: 100)
 * - offset: Pagination offset (default: 0)
 *
 * Response:
 * - goals: CoachGoal[]
 * - templates: Goal template suggestions
 * - pagination: { total, limit, offset, hasMore }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build where clause
    const where: { status?: GoalStatus } = {};

    if (status && Object.values(GoalStatus).includes(status as GoalStatus)) {
      where.status = status as GoalStatus;
    }

    // Fetch goals with pagination
    const goals = await prisma.coachGoal.findMany({
      where,
      orderBy: [
        { status: 'asc' }, // ACTIVE first
        { startDate: 'desc' },
      ],
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const total = await prisma.coachGoal.count({ where });

    return NextResponse.json({
      goals,
      templates: GOAL_TEMPLATES,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + goals.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching coach goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/coach/goals
 * Create a new coach goal
 *
 * Request body:
 * - goal: string (required) - The goal description
 * - description?: string - Additional details
 * - metricType?: string - Type of metric (e.g., 'bias_count', 'win_rate')
 * - metricName?: string - Name of the metric (e.g., 'fomo', 'HIGH_CONVICTION')
 * - targetValue?: number - Target value to achieve
 * - timeframe?: GoalTimeframe - DAILY, WEEKLY, MONTHLY, QUARTERLY (default: WEEKLY)
 * - endDate?: string - ISO date string for goal end date
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.goal || typeof body.goal !== 'string') {
      return NextResponse.json(
        { error: 'Goal description is required' },
        { status: 400 }
      );
    }

    // Validate goal length
    if (body.goal.trim().length === 0) {
      return NextResponse.json(
        { error: 'Goal cannot be empty' },
        { status: 400 }
      );
    }

    if (body.goal.length > 500) {
      return NextResponse.json(
        { error: 'Goal exceeds maximum length of 500 characters' },
        { status: 400 }
      );
    }

    // Validate description length if provided
    if (body.description && body.description.length > 2000) {
      return NextResponse.json(
        { error: 'Description exceeds maximum length of 2000 characters' },
        { status: 400 }
      );
    }

    // Validate timeframe if provided
    if (body.timeframe && !Object.values(GoalTimeframe).includes(body.timeframe)) {
      return NextResponse.json(
        { error: 'Invalid timeframe. Must be DAILY, WEEKLY, MONTHLY, or QUARTERLY' },
        { status: 400 }
      );
    }

    // Validate targetValue if provided
    if (body.targetValue !== undefined && typeof body.targetValue !== 'number') {
      return NextResponse.json(
        { error: 'Target value must be a number' },
        { status: 400 }
      );
    }

    // Parse end date if provided
    let endDate: Date | undefined;
    if (body.endDate) {
      endDate = new Date(body.endDate);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid end date format' },
          { status: 400 }
        );
      }
    }

    // Create goal
    const goal = await prisma.coachGoal.create({
      data: {
        goal: body.goal.trim(),
        description: body.description?.trim() || null,
        metricType: body.metricType || null,
        metricName: body.metricName || null,
        targetValue: body.targetValue ?? null,
        timeframe: body.timeframe || GoalTimeframe.WEEKLY,
        endDate: endDate || null,
        status: GoalStatus.ACTIVE,
        progress: 0,
        currentValue: null,
        checkIns: [],
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error('Error creating coach goal:', error);
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    );
  }
}
