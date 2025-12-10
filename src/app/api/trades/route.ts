import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TradeAction, StrategyType, ThesisTradeStatus, Prisma } from '@prisma/client';

/**
 * GET /api/trades
 * List trades with optional filters
 *
 * Query Parameters:
 * - thesisId: Filter by thesis ID
 * - status: Trade status (OPEN, CLOSED, EXPIRED, ASSIGNED)
 * - action: Trade action type
 * - limit: Max results (default: 50)
 * - offset: Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse filter parameters
    const thesisId = searchParams.get('thesisId');
    const status = searchParams.get('status');
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build where clause
    const where: Prisma.ThesisTradeWhereInput = {};

    if (thesisId) {
      where.thesisId = thesisId;
    }

    if (status && Object.values(ThesisTradeStatus).includes(status as ThesisTradeStatus)) {
      where.status = status as ThesisTradeStatus;
    }

    if (action && Object.values(TradeAction).includes(action as TradeAction)) {
      where.action = action as TradeAction;
    }

    // Fetch trades with pagination
    const trades = await prisma.thesisTrade.findMany({
      where,
      orderBy: { openedAt: 'desc' },
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
      },
      take: Math.min(limit, 100),
      skip: offset
    });

    // Get total count for pagination
    const total = await prisma.thesisTrade.count({ where });

    return NextResponse.json({
      trades,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + trades.length < total
      }
    });
  } catch (error) {
    console.error('Error fetching trades:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trades' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/trades
 * Log a new trade
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.action || !body.description || body.debitCredit === undefined) {
      return NextResponse.json(
        { error: 'Action, description, and debitCredit are required' },
        { status: 400 }
      );
    }

    // Validate action enum
    if (!Object.values(TradeAction).includes(body.action)) {
      return NextResponse.json(
        { error: 'Invalid trade action' },
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

    // If thesisId provided, verify thesis exists
    if (body.thesisId) {
      const thesis = await prisma.tradingThesis.findUnique({
        where: { id: body.thesisId }
      });
      if (!thesis) {
        return NextResponse.json(
          { error: 'Thesis not found' },
          { status: 404 }
        );
      }
    }

    // Create trade and update thesis aggregates in a transaction
    const trade = await prisma.$transaction(async (tx) => {
      // Create the trade
      const newTrade = await tx.thesisTrade.create({
        data: {
          thesisId: body.thesisId || null,
          action: body.action,
          previousTradeId: body.previousTradeId || null,
          description: body.description,
          strategyType: body.strategyType || null,
          expiration: body.expiration ? new Date(body.expiration) : null,
          debitCredit: body.debitCredit,
          quantity: body.quantity || 1,
          realizedPL: body.realizedPL || null,
          extractedData: body.extractedData || null,
          reasoningEntryId: body.reasoningEntryId || null,
          reasoningNote: body.reasoningNote || null,
          status: body.status || ThesisTradeStatus.OPEN
        },
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
      if (body.thesisId) {
        const allTrades = await tx.thesisTrade.findMany({
          where: { thesisId: body.thesisId }
        });

        let totalRealizedPL = 0;
        let totalCapitalDeployed = 0;

        for (const t of allTrades) {
          if (t.realizedPL !== null) {
            totalRealizedPL += t.realizedPL;
          }
          // Capital deployed is sum of debits (negative debitCredit values)
          if (t.debitCredit < 0) {
            totalCapitalDeployed += Math.abs(t.debitCredit);
          }
        }

        await tx.tradingThesis.update({
          where: { id: body.thesisId },
          data: {
            totalRealizedPL,
            totalCapitalDeployed
          }
        });
      }

      return newTrade;
    });

    return NextResponse.json(trade, { status: 201 });
  } catch (error) {
    console.error('Error creating trade:', error);
    return NextResponse.json(
      { error: 'Failed to create trade' },
      { status: 500 }
    );
  }
}
