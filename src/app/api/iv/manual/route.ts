import { NextRequest, NextResponse } from 'next/server';
import { ManualIvPayload, ManualIvResponse } from '@/lib/types/iv';
import { validateIvPct, normalizeTermDays } from '@/lib/iv';
import { persistIvForTicker } from '@/lib/persistIV';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body: ManualIvPayload = await request.json();
    
    logger.debug('Manual IV request', body);
    
    // Validate ticker
    if (!body.ticker || body.ticker.trim().length === 0) {
      const response: ManualIvResponse = {
        success: false,
        error: { message: 'Ticker is required', field: 'ticker' }
      };
      return NextResponse.json(response, { status: 400 });
    }
    
    // Validate IV
    const ivValidation = validateIvPct(body.ivPct);
    if (!ivValidation.valid) {
      const response: ManualIvResponse = {
        success: false,
        error: { message: ivValidation.error!, field: 'ivPct' }
      };
      return NextResponse.json(response, { status: 400 });
    }
    
    // Normalize term days
    const ivTermDays = normalizeTermDays(body.ivTermDays);
    
    // Persist to database
    const { tradesAffected } = await persistIvForTicker(
      body.ticker,
      body.ivPct,
      ivTermDays,
    );
    
    const response: ManualIvResponse = {
      success: true,
      data: {
        ticker: body.ticker,
        iv: body.ivPct,
        ivTermDays,
        ivAt: new Date().toISOString(),
        tradesAffected
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    logger.error('Manual IV error', error);
    const response: ManualIvResponse = {
      success: false,
      error: { message: 'Internal server error' }
    };
    return NextResponse.json(response, { status: 500 });
  }
}