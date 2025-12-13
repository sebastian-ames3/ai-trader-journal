import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ThesisDirection, ThesisStatus, Prisma } from '@prisma/client';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/theses
 * List trading theses with optional filters
 *
 * Query Parameters:
 * - status: Thesis status (ACTIVE, CLOSED, EXPIRED)
 * - ticker: Ticker symbol
 * - direction: Thesis direction (BULLISH, BEARISH, NEUTRAL, VOLATILE)
 * - limit: Max results (default: 50)
 * - offset: Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(request.url);

    // Parse filter parameters
    const status = searchParams.get('status');
    const ticker = searchParams.get('ticker');
    const direction = searchParams.get('direction');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build where clause
    const where: Prisma.TradingThesisWhereInput = { userId: user.id };

    // Status filter
    if (status && Object.values(ThesisStatus).includes(status as ThesisStatus)) {
      where.status = status as ThesisStatus;
    }

    // Ticker filter (case-insensitive)
    if (ticker) {
      where.ticker = {
        equals: ticker,
        mode: 'insensitive'
      };
    }

    // Direction filter
    if (direction && Object.values(ThesisDirection).includes(direction as ThesisDirection)) {
      where.direction = direction as ThesisDirection;
    }

    // Fetch theses with pagination
    const theses = await prisma.tradingThesis.findMany({
      where,
      orderBy: {
        startedAt: 'desc'
      },
      include: {
        thesisTrades: {
          select: {
            id: true,
            action: true,
            status: true,
            debitCredit: true,
            realizedPL: true,
            openedAt: true
          },
          orderBy: {
            openedAt: 'desc'
          },
          take: 5
        },
        _count: {
          select: {
            thesisTrades: true,
            updates: true
          }
        }
      },
      take: Math.min(limit, 100),
      skip: offset
    });

    // Get total count for pagination
    const total = await prisma.tradingThesis.count({ where });

    return NextResponse.json({
      theses,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + theses.length < total
      }
    });
  } catch (error) {
    console.error('Error fetching theses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch theses' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/theses
 * Create a new trading thesis
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.ticker || !body.direction || !body.originalThesis) {
      return NextResponse.json(
        { error: 'Name, ticker, direction, and originalThesis are required' },
        { status: 400 }
      );
    }

    // Validate direction enum
    if (!Object.values(ThesisDirection).includes(body.direction)) {
      return NextResponse.json(
        { error: 'Invalid thesis direction' },
        { status: 400 }
      );
    }

    // Create thesis
    const thesis = await prisma.tradingThesis.create({
      data: {
        userId: user.id,
        name: body.name,
        ticker: body.ticker.toUpperCase(),
        direction: body.direction,
        originalThesis: body.originalThesis
      },
      include: {
        thesisTrades: true,
        updates: true,
        _count: {
          select: {
            thesisTrades: true,
            updates: true
          }
        }
      }
    });

    return NextResponse.json(thesis, { status: 201 });
  } catch (error) {
    console.error('Error creating thesis:', error);
    return NextResponse.json(
      { error: 'Failed to create thesis' },
      { status: 500 }
    );
  }
}
