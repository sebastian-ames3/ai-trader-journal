import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { TradeOutcome, TradeSourceType, TradeAction, ThesisTradeStatus } from '@prisma/client';

/**
 * POST /api/trades/quick
 * Ultra-simple trade creation with minimal required fields.
 *
 * Request body:
 * - ticker: string (required)
 * - outcome: 'WIN' | 'LOSS' | 'BREAKEVEN' (required)
 * - approximatePnL?: number (optional)
 *
 * Response:
 * - trade: The created ThesisTrade
 * - autoLinkedThesis: { id, name } | null
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

    const body = await request.json();

    // Validate ticker
    if (!body.ticker || typeof body.ticker !== 'string') {
      return NextResponse.json(
        { error: 'Ticker is required' },
        { status: 400 }
      );
    }

    const ticker = body.ticker.toUpperCase().trim();
    if (ticker.length < 1 || ticker.length > 5) {
      return NextResponse.json(
        { error: 'Ticker must be 1-5 characters' },
        { status: 400 }
      );
    }

    // Validate outcome
    const validOutcomes: TradeOutcome[] = ['WIN', 'LOSS', 'BREAKEVEN'];
    if (!body.outcome || !validOutcomes.includes(body.outcome)) {
      return NextResponse.json(
        { error: 'Valid outcome (WIN, LOSS, BREAKEVEN) is required' },
        { status: 400 }
      );
    }

    // Parse optional P/L
    let approximatePnL: number | null = null;
    if (body.approximatePnL !== undefined && body.approximatePnL !== null) {
      approximatePnL = parseFloat(body.approximatePnL);
      if (isNaN(approximatePnL)) {
        return NextResponse.json(
          { error: 'Invalid approximatePnL value' },
          { status: 400 }
        );
      }
    }

    // Parse optional source type (defaults to MANUAL)
    let sourceType: TradeSourceType = TradeSourceType.MANUAL;
    if (body.sourceType && Object.values(TradeSourceType).includes(body.sourceType)) {
      sourceType = body.sourceType as TradeSourceType;
    }

    // Parse optional screenshot URL and extracted data
    const screenshotUrl = typeof body.screenshotUrl === 'string' ? body.screenshotUrl : null;
    const rawExtractedData = body.extractedData || null;

    // Combine screenshot URL with extracted data for storage
    const extractedData = screenshotUrl || rawExtractedData
      ? { ...rawExtractedData, screenshotUrl }
      : null;

    // Try to find an active thesis for this ticker to auto-link
    const matchingThesis = await prisma.tradingThesis.findFirst({
      where: {
        userId: user.id,
        ticker: ticker,
        status: 'ACTIVE',
      },
      select: { id: true, name: true },
      orderBy: { createdAt: 'desc' },
    });

    // Create the trade
    const trade = await prisma.thesisTrade.create({
      data: {
        userId: user.id,
        thesisId: matchingThesis?.id || null,
        ticker: ticker,
        action: TradeAction.INITIAL,
        description: sourceType === TradeSourceType.SCREENSHOT
          ? `Screenshot trade: ${ticker} ${body.outcome}`
          : `Quick trade: ${ticker} ${body.outcome}`,
        status: ThesisTradeStatus.CLOSED,
        closedAt: new Date(),
        debitCredit: 0,
        quantity: 1,
        realizedPL: approximatePnL,
        outcome: body.outcome as TradeOutcome,
        sourceType: sourceType,
        extractedData: extractedData,
      },
      select: {
        id: true,
        ticker: true,
        outcome: true,
        realizedPL: true,
        sourceType: true,
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

    return NextResponse.json({
      trade,
      autoLinkedThesis: matchingThesis || null,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating quick trade:', error);
    return NextResponse.json(
      { error: 'Failed to create trade' },
      { status: 500 }
    );
  }
}
