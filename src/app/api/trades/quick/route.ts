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
 * - outcome?: 'WIN' | 'LOSS' | 'BREAKEVEN' (optional — omit when opening a position)
 * - approximatePnL?: number (optional)
 * - status?: 'OPEN' | 'CLOSED' (optional — defaults to CLOSED if outcome provided, OPEN otherwise)
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

    // outcome is now optional — only required when closing a trade
    const validOutcomes: TradeOutcome[] = ['WIN', 'LOSS', 'BREAKEVEN'];
    const hasOutcome = body.outcome && validOutcomes.includes(body.outcome);
    if (body.outcome && !hasOutcome) {
      return NextResponse.json(
        { error: 'outcome must be WIN, LOSS, or BREAKEVEN' },
        { status: 400 }
      );
    }

    // Determine trade status: CLOSED if outcome provided, OPEN otherwise
    const tradeStatus: ThesisTradeStatus = hasOutcome
      ? ThesisTradeStatus.CLOSED
      : ThesisTradeStatus.OPEN;

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

    // Build description based on context
    let description: string;
    if (sourceType === TradeSourceType.SCREENSHOT) {
      description = `Screenshot trade: ${ticker}${hasOutcome ? ` ${body.outcome}` : ''}`;
    } else if (tradeStatus === ThesisTradeStatus.OPEN) {
      description = `Open position: ${ticker}`;
    } else {
      description = `Quick trade: ${ticker} ${body.outcome}`;
    }

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
        description,
        status: tradeStatus,
        closedAt: tradeStatus === ThesisTradeStatus.CLOSED ? new Date() : null,
        debitCredit: 0,
        quantity: 1,
        realizedPL: approximatePnL,
        outcome: hasOutcome ? (body.outcome as TradeOutcome) : null,
        sourceType: sourceType,
        extractedData: extractedData,
      },
      select: {
        id: true,
        ticker: true,
        outcome: true,
        status: true,
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
