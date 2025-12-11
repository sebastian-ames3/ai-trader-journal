import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoalStatus, GoalTimeframe, Prisma } from '@prisma/client';

interface CheckIn {
  date: string;
  value: number;
  note?: string;
}

/**
 * GET /api/coach/goals/[id]
 * Get a specific coach goal
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const goal = await prisma.coachGoal.findUnique({
      where: { id: params.id },
    });

    if (!goal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error fetching coach goal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goal' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/coach/goals/[id]
 * Update a coach goal
 *
 * Request body (all optional):
 * - goal: string - Goal description
 * - description: string - Additional details
 * - metricType: string - Type of metric
 * - metricName: string - Name of the metric
 * - targetValue: number - Target value
 * - currentValue: number - Current progress value
 * - timeframe: GoalTimeframe - DAILY, WEEKLY, MONTHLY, QUARTERLY
 * - endDate: string - ISO date string
 * - status: GoalStatus - ACTIVE, COMPLETED, ABANDONED, EXPIRED
 * - progress: number - Progress percentage (0-100)
 * - checkIn: { value: number, note?: string } - Add a progress check-in
 * - reflection: string - Reflection on goal completion
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Check if goal exists
    const existingGoal = await prisma.coachGoal.findUnique({
      where: { id: params.id },
    });

    if (!existingGoal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    // Validate status if provided
    if (body.status && !Object.values(GoalStatus).includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be ACTIVE, COMPLETED, ABANDONED, or EXPIRED' },
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

    // Validate progress if provided
    if (body.progress !== undefined) {
      const progress = parseFloat(body.progress);
      if (isNaN(progress) || progress < 0 || progress > 100) {
        return NextResponse.json(
          { error: 'Progress must be a number between 0 and 100' },
          { status: 400 }
        );
      }
    }

    // Build update data with Prisma types
    const updateData: Prisma.CoachGoalUpdateInput = {};

    if (body.goal !== undefined) updateData.goal = body.goal.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.metricType !== undefined) updateData.metricType = body.metricType || null;
    if (body.metricName !== undefined) updateData.metricName = body.metricName || null;
    if (body.targetValue !== undefined) updateData.targetValue = body.targetValue ?? null;
    if (body.currentValue !== undefined) updateData.currentValue = body.currentValue ?? null;
    if (body.timeframe !== undefined) updateData.timeframe = body.timeframe;
    if (body.progress !== undefined) updateData.progress = parseFloat(body.progress);
    if (body.reflection !== undefined) updateData.reflection = body.reflection?.trim() || null;

    // Handle end date
    if (body.endDate !== undefined) {
      if (body.endDate === null) {
        updateData.endDate = null;
      } else {
        const endDate = new Date(body.endDate);
        if (isNaN(endDate.getTime())) {
          return NextResponse.json(
            { error: 'Invalid end date format' },
            { status: 400 }
          );
        }
        updateData.endDate = endDate;
      }
    }

    // Handle status changes
    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === GoalStatus.COMPLETED) {
        updateData.completedAt = new Date();
        updateData.progress = 100;
      } else if (body.status === GoalStatus.ACTIVE) {
        updateData.completedAt = null;
      }
    }

    // Handle check-in addition
    if (body.checkIn) {
      if (typeof body.checkIn.value !== 'number') {
        return NextResponse.json(
          { error: 'Check-in value must be a number' },
          { status: 400 }
        );
      }

      const existingCheckIns = (existingGoal.checkIns as unknown as CheckIn[]) || [];
      const newCheckIn: CheckIn = {
        date: new Date().toISOString(),
        value: body.checkIn.value,
        note: body.checkIn.note?.trim(),
      };
      updateData.checkIns = [...existingCheckIns, newCheckIn] as unknown as Prisma.InputJsonValue;
      updateData.currentValue = body.checkIn.value;

      // Auto-calculate progress if we have target and current values
      if (existingGoal.targetValue && body.checkIn.value !== undefined) {
        const progress = Math.min(
          100,
          Math.max(0, (body.checkIn.value / existingGoal.targetValue) * 100)
        );
        updateData.progress = Math.round(progress);
      }
    }

    // Update goal
    const goal = await prisma.coachGoal.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error updating coach goal:', error);
    return NextResponse.json(
      { error: 'Failed to update goal' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/coach/goals/[id]
 * Delete a coach goal
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if goal exists
    const existingGoal = await prisma.coachGoal.findUnique({
      where: { id: params.id },
    });

    if (!existingGoal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    // Delete goal
    await prisma.coachGoal.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting coach goal:', error);
    return NextResponse.json(
      { error: 'Failed to delete goal' },
      { status: 500 }
    );
  }
}
