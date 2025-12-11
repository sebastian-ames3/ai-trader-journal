import { NextRequest, NextResponse } from 'next/server';
import { StrategyType } from '@prisma/client';
import {
  getThesisReminders,
  findSimilarTheses,
  calculateHistoricalIvHvPerformance,
} from '@/lib/thesisPatterns';
import { ExtractedTradeData } from '@/lib/tradeExtraction';

/**
 * POST /api/patterns/reminders
 * Get reminders and lessons for a new trade based on historical data
 *
 * Request body:
 * - ticker: string (required) - Ticker symbol
 * - strategyType: string (optional) - Strategy type from StrategyType enum
 * - extractedData: object (optional) - Data extracted from screenshot
 *
 * Returns:
 * - reminders: Array of warnings, info, and lessons
 * - lessons: Array of lessons from past theses
 * - similarTheses: Array of similar past theses
 * - ivHvPerformance: Historical performance by IV/HV ratio (if extractedData provided)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.ticker || typeof body.ticker !== 'string') {
      return NextResponse.json(
        { error: 'ticker is required and must be a string' },
        { status: 400 }
      );
    }

    const ticker = body.ticker.toUpperCase();

    // Validate strategyType if provided
    let strategyType: StrategyType | undefined;
    if (body.strategyType) {
      const validStrategies = Object.values(StrategyType);
      if (!validStrategies.includes(body.strategyType)) {
        return NextResponse.json(
          {
            error: `Invalid strategyType. Must be one of: ${validStrategies.join(', ')}`,
          },
          { status: 400 }
        );
      }
      strategyType = body.strategyType as StrategyType;
    }

    // Extract data from request if provided
    let extractedData: ExtractedTradeData | undefined;
    if (body.extractedData && typeof body.extractedData === 'object') {
      extractedData = body.extractedData as ExtractedTradeData;
    }

    // Get reminders and lessons
    const { reminders, lessons } = await getThesisReminders(
      ticker,
      strategyType,
      extractedData
    );

    // Find similar theses
    const similarTheses = await findSimilarTheses(ticker, strategyType);

    // Get IV/HV performance if we have that data
    let ivHvPerformance = null;
    if (extractedData?.iv && extractedData?.hv && extractedData.hv > 0) {
      const ivHvRatio = extractedData.iv / extractedData.hv;
      ivHvPerformance = await calculateHistoricalIvHvPerformance(
        strategyType,
        ivHvRatio
      );
    }

    return NextResponse.json({
      success: true,
      ticker,
      strategyType: strategyType || null,
      reminders,
      lessons,
      similarTheses,
      ivHvPerformance,
    });
  } catch (error) {
    console.error('Error getting trade reminders:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get trade reminders' },
      { status: 500 }
    );
  }
}
