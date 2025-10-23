import { NextRequest, NextResponse } from 'next/server';
import { getContractSnapshot } from '@/lib/polygonClient';
import { logger } from '@/lib/logger';

/**
 * GET /api/options/contract/[symbol]
 *
 * Fetch detailed option contract snapshot with pricing and Greeks
 * Uses Polygon.io for real-time data
 *
 * Path params:
 * - symbol: Full OCC contract symbol (e.g., 'O:AAPL251121C00170000')
 *
 * Format: O:[TICKER][YYMMDD][C/P][STRIKE*1000]
 * Examples:
 * - O:AAPL251121C00170000 = AAPL $170 Call expiring 11/21/2025
 * - O:SPY251219P00450000 = SPY $450 Put expiring 12/19/2025
 *
 * Response includes:
 * - Current bid/ask/last price
 * - Volume and open interest
 * - Implied volatility
 * - Greeks (Delta, Gamma, Theta, Vega)
 * - In-the-money status
 *
 * Rate Limits (Free Tier): 5 calls/minute
 * Cache: 1 minute
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const symbol = params.symbol;
    if (!symbol) {
      return NextResponse.json(
        { error: 'Contract symbol is required' },
        { status: 400 }
      );
    }

    // Validate symbol format (basic check)
    if (!symbol.startsWith('O:')) {
      return NextResponse.json(
        { error: 'Invalid contract symbol format. Must start with "O:" (e.g., O:AAPL251121C00170000)' },
        { status: 400 }
      );
    }

    logger.debug('Contract snapshot API request', { symbol });

    const contract = await getContractSnapshot(symbol);

    if (!contract) {
      return NextResponse.json(
        { error: 'Failed to fetch contract snapshot. Contract may not exist or data unavailable.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      contract: {
        symbol: contract.contractSymbol,
        strike: contract.strike,
        lastPrice: contract.lastPrice,
        bid: contract.bid,
        ask: contract.ask,
        midpoint: contract.bid > 0 && contract.ask > 0 ? (contract.bid + contract.ask) / 2 : contract.lastPrice,
        change: contract.change,
        percentChange: contract.percentChange,
        volume: contract.volume,
        openInterest: contract.openInterest,
        impliedVolatility: contract.impliedVolatility,
        inTheMoney: contract.inTheMoney,
        greeks: {
          delta: contract.delta,
          gamma: contract.gamma,
          theta: contract.theta,
          vega: contract.vega,
        },
        lastTradeDate: contract.lastTradeDate.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Contract snapshot API error', error, { symbol: params.symbol });

    return NextResponse.json(
      { error: 'Internal server error fetching contract data' },
      { status: 500 }
    );
  }
}
