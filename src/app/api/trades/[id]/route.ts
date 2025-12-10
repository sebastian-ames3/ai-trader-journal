import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ThesisTradeStatus, StrategyType, Prisma } from '@prisma/client';

/**
 * GET /api/trades/[id]
 * Get a single trade with all related data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const trade = await prisma.thesisTrade.findUnique({
      where: { id: params.id },
      include: {
        thesis: {
          select: {
            id: true,
            name: true,
            ticker: true,
            direction: true,
            status: true,
            originalThesis: true
          }
        },
        attachments: true
      }
    });

    if (!trade) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(trade);
  } catch (error) {
    console.error('Error fetching trade:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trade' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/trades/[id]
 * Update a trade
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Check if trade exists
    const existingTrade = await prisma.thesisTrade.findUnique({
      where: { id: params.id }
    });

    if (!existingTrade) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    // Validate status if provided
    if (body.status && !Object.values(ThesisTradeStatus).includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid trade status' },
        { status: 400 }
      );
    }

    // Validate strategyType if provided
    if (body.strategyType && !Object.values(StrategyType).includes(body.strategyType)) {
      return NextResponse.json(
        { error: 'Invalid strategy type' },
        { status: 400 }
      );
    }

    // Build update data using Prisma's update input type
    const updateData: Prisma.ThesisTradeUpdateInput = {};

    if (body.description !== undefined) updateData.description = body.description;
    if (body.strategyType !== undefined) updateData.strategyType = body.strategyType;
    if (body.expiration !== undefined) updateData.expiration = body.expiration ? new Date(body.expiration) : null;
    if (body.debitCredit !== undefined) updateData.debitCredit = body.debitCredit;
    if (body.quantity !== undefined) updateData.quantity = body.quantity;
    if (body.realizedPL !== undefined) updateData.realizedPL = body.realizedPL;
    if (body.extractedData !== undefined) {
      updateData.extractedData = body.extractedData === null ? Prisma.JsonNull : body.extractedData;
    }
    if (body.reasoningNote !== undefined) updateData.reasoningNote = body.reasoningNote;

    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === ThesisTradeStatus.CLOSED && !existingTrade.closedAt) {
        updateData.closedAt = new Date();
      }
    }

    // Update trade and recalculate thesis aggregates
    const trade = await prisma.$transaction(async (tx) => {
      const updatedTrade = await tx.thesisTrade.update({
        where: { id: params.id },
        data: updateData,
        include: {
          thesis: {
            select: {
              id: true,
              name: true,
              ticker: true,
              direction: true,
              status: true
            }
          },
          attachments: true
        }
      });

      // Update thesis aggregates if linked to a thesis
      if (existingTrade.thesisId) {
        const allTrades = await tx.thesisTrade.findMany({
          where: { thesisId: existingTrade.thesisId }
        });

        let totalRealizedPL = 0;
        let totalCapitalDeployed = 0;

        for (const t of allTrades) {
          if (t.realizedPL !== null) {
            totalRealizedPL += t.realizedPL;
          }
          if (t.debitCredit < 0) {
            totalCapitalDeployed += Math.abs(t.debitCredit);
          }
        }

        await tx.tradingThesis.update({
          where: { id: existingTrade.thesisId },
          data: {
            totalRealizedPL,
            totalCapitalDeployed
          }
        });
      }

      return updatedTrade;
    });

    return NextResponse.json(trade);
  } catch (error) {
    console.error('Error updating trade:', error);
    return NextResponse.json(
      { error: 'Failed to update trade' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/trades/[id]
 * Delete a trade
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if trade exists and get thesis ID
    const existingTrade = await prisma.thesisTrade.findUnique({
      where: { id: params.id }
    });

    if (!existingTrade) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    const thesisId = existingTrade.thesisId;

    // Delete trade and update thesis aggregates
    await prisma.$transaction(async (tx) => {
      // Delete trade (cascades to attachments)
      await tx.thesisTrade.delete({
        where: { id: params.id }
      });

      // Update thesis aggregates if linked to a thesis
      if (thesisId) {
        const remainingTrades = await tx.thesisTrade.findMany({
          where: { thesisId }
        });

        let totalRealizedPL = 0;
        let totalCapitalDeployed = 0;

        for (const t of remainingTrades) {
          if (t.realizedPL !== null) {
            totalRealizedPL += t.realizedPL;
          }
          if (t.debitCredit < 0) {
            totalCapitalDeployed += Math.abs(t.debitCredit);
          }
        }

        await tx.tradingThesis.update({
          where: { id: thesisId },
          data: {
            totalRealizedPL,
            totalCapitalDeployed
          }
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting trade:', error);
    return NextResponse.json(
      { error: 'Failed to delete trade' },
      { status: 500 }
    );
  }
}
