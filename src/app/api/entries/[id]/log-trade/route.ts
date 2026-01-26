import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { TradeOutcome, TradeSourceType, TradeAction, ThesisTradeStatus } from '@prisma/client';

/**
 * POST /api/entries/[id]/log-trade
 * Create a trade from a journal entry with detected trade activity.
 *
 * This endpoint enables frictionless trade capture from journal entries.
 * When AI detects a trade in an entry, users can confirm and log it with one tap.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();

    // Validate required outcome field
    const validOutcomes: TradeOutcome[] = ['WIN', 'LOSS', 'BREAKEVEN'];
    if (!body.outcome || !validOutcomes.includes(body.outcome)) {
      return NextResponse.json(
        { error: 'Valid outcome (WIN, LOSS, BREAKEVEN) is required' },
        { status: 400 }
      );
    }

    // Fetch the entry and verify ownership
    const entry = await prisma.entry.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        content: true,
        ticker: true,
        tradeDetected: true,
        tradeDetectionData: true,
        thesisTradeId: true,
      },
    });

    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    if (entry.userId !== user.id) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    // Check if entry already has a linked trade
    if (entry.thesisTradeId) {
      return NextResponse.json(
        { error: 'This entry already has a linked trade' },
        { status: 400 }
      );
    }

    // Determine ticker: from request, entry, or detection data
    const detectionData = entry.tradeDetectionData as {
      signals?: { ticker?: string };
    } | null;

    const ticker = (
      body.ticker ||
      entry.ticker ||
      detectionData?.signals?.ticker
    )?.toUpperCase();

    if (!ticker) {
      return NextResponse.json(
        { error: 'Ticker is required (provide in request or must be detected)' },
        { status: 400 }
      );
    }

    // Try to find an existing active thesis for this ticker
    let linkedThesis: { id: string; name: string } | null = null;

    if (body.thesisId) {
      // User explicitly specified a thesis
      const thesis = await prisma.tradingThesis.findFirst({
        where: {
          id: body.thesisId,
          userId: user.id,
        },
        select: { id: true, name: true },
      });

      if (!thesis) {
        return NextResponse.json(
          { error: 'Specified thesis not found' },
          { status: 400 }
        );
      }

      linkedThesis = thesis;
    } else {
      // Try to auto-link to an active thesis with matching ticker
      const matchingThesis = await prisma.tradingThesis.findFirst({
        where: {
          userId: user.id,
          ticker: ticker,
          status: 'ACTIVE',
        },
        select: { id: true, name: true },
        orderBy: { createdAt: 'desc' },
      });

      if (matchingThesis) {
        linkedThesis = matchingThesis;
      }
    }

    // Determine trade action based on outcome
    // If the trade has an outcome, it's likely a closing action
    const action: TradeAction = body.outcome !== 'BREAKEVEN' ? 'INITIAL' : 'INITIAL';

    // Create the trade
    const trade = await prisma.thesisTrade.create({
      data: {
        userId: user.id,
        thesisId: linkedThesis?.id || null,
        ticker: ticker,
        action: action,
        description: `Trade logged from journal entry`,
        status: ThesisTradeStatus.CLOSED, // Since it has an outcome, it's closed
        closedAt: new Date(),
        debitCredit: 0, // Unknown
        quantity: 1,
        realizedPL: body.approximatePnL || null,
        outcome: body.outcome as TradeOutcome,
        sourceType: TradeSourceType.JOURNAL_DETECTED,
        sourceEntryId: entry.id,
      },
      select: {
        id: true,
        ticker: true,
        outcome: true,
        realizedPL: true,
        sourceType: true,
        sourceEntryId: true,
        thesisId: true,
        thesis: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
      },
    });

    // Update the entry to link to this trade
    await prisma.entry.update({
      where: { id: entry.id },
      data: { thesisTradeId: trade.id },
    });

    return NextResponse.json({
      trade,
      linkedToThesis: !!linkedThesis,
      thesisName: linkedThesis?.name || null,
    }, { status: 201 });
  } catch (error) {
    console.error('Error logging trade from entry:', error);
    return NextResponse.json(
      { error: 'Failed to log trade' },
      { status: 500 }
    );
  }
}
