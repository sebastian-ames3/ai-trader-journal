import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import {
  getThesisSuggestions,
  type TradeForAnalysis,
  type EntryForAnalysis,
} from '@/lib/thesisGeneration';

/**
 * GET /api/theses/suggestions
 * Get AI-generated thesis suggestions based on unassigned trades and related entries.
 *
 * Query params:
 * - useAI: Whether to use AI for suggestions (default: true)
 * - maxSuggestions: Max suggestions to return (default: 5, max: 10)
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const useAI = searchParams.get('useAI') !== 'false';
    const maxSuggestions = Math.min(
      parseInt(searchParams.get('maxSuggestions') || '5', 10),
      10
    );

    // Get unassigned trades (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const rawTrades = await prisma.thesisTrade.findMany({
      where: {
        userId: user.id,
        thesisId: null,
        ticker: { not: null },
        createdAt: { gte: ninetyDaysAgo },
      },
      select: {
        id: true,
        ticker: true,
        outcome: true,
        realizedPL: true,
        strategyType: true,
        description: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit for performance
    });

    // Transform to TradeForAnalysis
    const trades: TradeForAnalysis[] = rawTrades.map((t) => ({
      id: t.id,
      ticker: t.ticker!,
      outcome: t.outcome as 'WIN' | 'LOSS' | 'BREAKEVEN' | null,
      realizedPL: t.realizedPL,
      strategyType: t.strategyType,
      description: t.description,
      createdAt: t.createdAt,
    }));

    // Get unique tickers from trades
    const tickers = Array.from(new Set(trades.map((t) => t.ticker.toUpperCase())));

    // Get related entries
    const rawEntries = await prisma.entry.findMany({
      where: {
        userId: user.id,
        deletedAt: null,
        createdAt: { gte: ninetyDaysAgo },
        OR: [
          { ticker: { in: tickers } },
          // Also check content for ticker mentions
          ...tickers.map((ticker) => ({
            content: { contains: ticker, mode: 'insensitive' as const },
          })),
        ],
      },
      select: {
        id: true,
        content: true,
        ticker: true,
        type: true,
        mood: true,
        sentiment: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Transform to EntryForAnalysis
    const entries: EntryForAnalysis[] = rawEntries.map((e) => ({
      id: e.id,
      content: e.content,
      ticker: e.ticker,
      entryType: e.type,
      mood: e.mood,
      sentiment: e.sentiment,
      createdAt: e.createdAt,
    }));

    // Generate suggestions
    const suggestions = await getThesisSuggestions(trades, entries, {
      useAI,
      maxSuggestions,
    });

    return NextResponse.json({
      suggestions,
      meta: {
        tradesAnalyzed: trades.length,
        entriesAnalyzed: entries.length,
        tickersFound: tickers.length,
        useAI,
      },
    });
  } catch (error) {
    console.error('Error generating thesis suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/theses/suggestions
 * Create a thesis from a suggestion.
 *
 * Body:
 * - suggestion: ThesisSuggestion object
 * - customize: Optional overrides { name?, direction?, thesisText? }
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

    const body = await request.json();

    if (!body.suggestion) {
      return NextResponse.json(
        { error: 'Suggestion is required' },
        { status: 400 }
      );
    }

    const { suggestion, customize } = body;

    // Validate suggestion structure
    if (!suggestion.ticker || !suggestion.direction) {
      return NextResponse.json(
        { error: 'Invalid suggestion structure' },
        { status: 400 }
      );
    }

    // Create the thesis
    const thesis = await prisma.tradingThesis.create({
      data: {
        userId: user.id,
        ticker: suggestion.ticker.toUpperCase(),
        name: customize?.name || suggestion.suggestedName,
        direction: customize?.direction || suggestion.direction,
        originalThesis: customize?.thesisText || suggestion.thesisText,
        status: 'ACTIVE',
        // Store AI generation metadata in aiSummary for reference
        aiSummary: `AI-generated with ${Math.round(suggestion.confidence * 100)}% confidence. ${suggestion.reasoning}`,
      },
      select: {
        id: true,
        ticker: true,
        name: true,
        direction: true,
        originalThesis: true,
        status: true,
        createdAt: true,
      },
    });

    // Link the source trades to the new thesis
    if (suggestion.sourcedFrom?.tradeIds?.length > 0) {
      await prisma.thesisTrade.updateMany({
        where: {
          id: { in: suggestion.sourcedFrom.tradeIds },
          userId: user.id, // Security: ensure trades belong to user
          thesisId: null, // Only update unassigned trades
        },
        data: {
          thesisId: thesis.id,
        },
      });
    }

    // Get count of linked trades
    const linkedTradesCount = await prisma.thesisTrade.count({
      where: {
        thesisId: thesis.id,
        userId: user.id,
      },
    });

    return NextResponse.json(
      {
        thesis,
        linkedTradesCount,
        message: `Created thesis "${thesis.name}" with ${linkedTradesCount} linked trades`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating thesis from suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to create thesis' },
      { status: 500 }
    );
  }
}
