import { logger } from './logger';
import { pctToDecimal } from './iv';
import { prisma } from '@/lib/prisma';


/**
 * Get start and end of "today" in UTC
 */
function getTodayBounds(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  
  return { start, end };
}

/**
 * Persist IV to snapshots for trades created today
 */
export async function persistIvForTicker(
  ticker: string,
  ivPct: number,
  ivTermDays: number
): Promise<{ tradesAffected: number }> {
  
  const { start, end } = getTodayBounds();
  const ivDecimal = pctToDecimal(ivPct);
  const ivAt = new Date();
  
  logger.debug('Persisting IV', { 
    ticker, 
    ivPct, 
    ivDecimal,
    ivTermDays,
    todayStart: start.toISOString(),
    todayEnd: end.toISOString()
  });
  
  // Find trades created today for this ticker
  const todayTrades = await prisma.trade.findMany({
    where: {
      ticker: ticker,  // Using 'symbol' based on your Trade model
      createdAt: {
        gte: start,
        lt: end
      }
    },
    select: { id: true }
  });
  
  if (todayTrades.length === 0) {
    logger.debug('IV persist skipped: no trades today for ' + ticker);
    return { tradesAffected: 0 };
  }
  
  // Upsert snapshot for each trade
  const upsertPromises = todayTrades.map(trade => 
    prisma.snapshot.upsert({
      where: { tradeId: trade.id },
      create: {
        tradeId: trade.id,
        // Required fields
        marketData: {},  // Empty object for now
        chainData: {},   // Empty object for now
        // IV fields
        iv: ivDecimal,
        ivTermDays,
        ivSource: 'manual',
        ivAt
      },
      update: {
        iv: ivDecimal,
        ivTermDays,
        ivSource: 'manual',
        ivAt
      }
    })
  );
  
  await Promise.all(upsertPromises);
  
  logger.debug('IV persisted', { 
    ticker, 
    tradesAffected: todayTrades.length 
  });
  
  return { tradesAffected: todayTrades.length };
}