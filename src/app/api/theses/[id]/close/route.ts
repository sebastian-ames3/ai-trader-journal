import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ThesisOutcome, ThesisStatus, ThesisTradeStatus } from '@prisma/client';

/**
 * POST /api/theses/[id]/close
 * Close a thesis with outcome and lessons learned
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.outcome) {
      return NextResponse.json(
        { error: 'Outcome is required' },
        { status: 400 }
      );
    }

    // Validate outcome enum
    if (!Object.values(ThesisOutcome).includes(body.outcome)) {
      return NextResponse.json(
        { error: 'Invalid outcome value. Must be WIN, LOSS, or BREAKEVEN' },
        { status: 400 }
      );
    }

    // Check if thesis exists
    const existingThesis = await prisma.tradingThesis.findUnique({
      where: { id: params.id },
      include: {
        thesisTrades: true
      }
    });

    if (!existingThesis) {
      return NextResponse.json(
        { error: 'Thesis not found' },
        { status: 404 }
      );
    }

    // Check if thesis is already closed
    if (existingThesis.status === ThesisStatus.CLOSED) {
      return NextResponse.json(
        { error: 'Thesis is already closed' },
        { status: 400 }
      );
    }

    // Calculate final P/L from all trades
    let totalRealizedPL = 0;
    for (const trade of existingThesis.thesisTrades) {
      if (trade.realizedPL !== null) {
        totalRealizedPL += trade.realizedPL;
      }
    }

    // Close thesis and all open trades in a transaction
    const thesis = await prisma.$transaction(async (tx) => {
      // Close all open trades
      await tx.thesisTrade.updateMany({
        where: {
          thesisId: params.id,
          status: ThesisTradeStatus.OPEN
        },
        data: {
          status: ThesisTradeStatus.CLOSED,
          closedAt: new Date()
        }
      });

      // Update thesis with closure data
      return tx.tradingThesis.update({
        where: { id: params.id },
        data: {
          status: ThesisStatus.CLOSED,
          closedAt: new Date(),
          outcome: body.outcome,
          lessonsLearned: body.lessonsLearned || null,
          totalRealizedPL
        },
        include: {
          thesisTrades: {
            orderBy: { openedAt: 'desc' }
          },
          updates: {
            orderBy: { date: 'desc' }
          },
          _count: {
            select: {
              thesisTrades: true,
              updates: true
            }
          }
        }
      });
    });

    return NextResponse.json(thesis);
  } catch (error) {
    console.error('Error closing thesis:', error);
    return NextResponse.json(
      { error: 'Failed to close thesis' },
      { status: 500 }
    );
  }
}
