import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ThesisOutcome, ThesisStatus, ThesisTradeStatus } from '@prisma/client';
import { analyzeThesisPatterns, findSimilarTheses } from '@/lib/thesisPatterns';

/**
 * POST /api/theses/[id]/close
 * Close a thesis with outcome and lessons learned
 *
 * Also triggers pattern analysis to identify learnings from this closure
 * and store detected patterns for future reminders.
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

    // After closing, trigger pattern analysis in the background
    // This identifies learnings and updates patterns for future reminders
    let patternsAnalyzed = false;
    let learnedPatterns: string[] = [];

    try {
      // Analyze patterns from all closed theses including this one
      const patternAnalysis = await analyzeThesisPatterns();

      // Find patterns related to this thesis's characteristics
      // Note: similarTheses result is computed for potential future use
      await findSimilarTheses(
        existingThesis.ticker,
        existingThesis.thesisTrades[0]?.strategyType || undefined
      );

      // Extract patterns learned from this closure
      learnedPatterns = [];

      // Add ticker-based pattern if detected
      const tickerPattern = patternAnalysis.topPerformingTickers.find(
        (t) => t.ticker === existingThesis.ticker
      );
      if (tickerPattern) {
        learnedPatterns.push(
          `${existingThesis.ticker}: ${(tickerPattern.winRate * 100).toFixed(0)}% win rate (${tickerPattern.count} trades)`
        );
      }

      // Add strategy-based pattern if detected
      if (patternAnalysis.topPerformingStrategies.length > 0) {
        const strategyUsed = existingThesis.thesisTrades
          .map((t) => t.strategyType)
          .filter((s) => s !== null)[0];

        if (strategyUsed) {
          const strategyPattern = patternAnalysis.topPerformingStrategies.find(
            (s) => s.strategyType === strategyUsed
          );
          if (strategyPattern) {
            learnedPatterns.push(
              `${strategyUsed}: ${(strategyPattern.winRate * 100).toFixed(0)}% win rate`
            );
          }
        }
      }

      // Store learned patterns on the thesis if any were detected
      if (learnedPatterns.length > 0) {
        await prisma.tradingThesis.update({
          where: { id: params.id },
          data: {
            learnedPatterns
          }
        });
        patternsAnalyzed = true;
      }
    } catch (patternError) {
      // Pattern analysis failure should not fail the close operation
      console.error('Error during pattern analysis after thesis close:', patternError);
    }

    return NextResponse.json({
      ...thesis,
      learnedPatterns,
      patternsAnalyzed
    });
  } catch (error) {
    console.error('Error closing thesis:', error);
    return NextResponse.json(
      { error: 'Failed to close thesis' },
      { status: 500 }
    );
  }
}
