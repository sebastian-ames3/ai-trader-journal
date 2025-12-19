import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/cache';
import { getImportCacheKey } from '../upload/route';
import {
  ParsedTrade,
  mapToTradeAction,
  generateTradeDescription,
} from '@/lib/csvImport';
import { ThesisDirection } from '@prisma/client';

export const dynamic = 'force-dynamic';

interface CachedImportData {
  trades: ParsedTrade[];
  userId: string;
}

interface TradeToImport {
  tradeId: string;
  thesisId?: string;
  newThesis?: {
    name: string;
    ticker: string;
    direction: ThesisDirection;
  };
}

interface ImportConfirmRequest {
  batchId: string;
  trades: TradeToImport[];
}

/**
 * POST /api/import/csv/confirm
 * Confirm and create trades from parsed CSV
 *
 * Request body:
 * {
 *   batchId: string,
 *   trades: [
 *     { tradeId: string, thesisId?: string, newThesis?: { name, ticker, direction } }
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { user } = auth;

    // Parse request body
    const body: ImportConfirmRequest = await request.json();
    const { batchId, trades: tradesToImport } = body;

    if (!batchId || typeof batchId !== 'string') {
      return NextResponse.json({ error: 'batchId is required' }, { status: 400 });
    }

    if (!Array.isArray(tradesToImport) || tradesToImport.length === 0) {
      return NextResponse.json(
        { error: 'trades array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Get cached import data
    const cacheKey = getImportCacheKey(batchId);
    const cachedData = cache.get<CachedImportData>(cacheKey);

    if (!cachedData) {
      return NextResponse.json(
        { error: 'Import session expired. Please upload the CSV again.' },
        { status: 410 }
      );
    }

    // Verify user matches
    if (cachedData.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Create a map of parsed trades by ID
    const parsedTradesMap = new Map<string, ParsedTrade>();
    cachedData.trades.forEach((t) => {
      parsedTradesMap.set(t.id, t);
    });

    // Validate all trades exist in cache
    const invalidTradeIds = tradesToImport
      .filter((t) => !parsedTradesMap.has(t.tradeId))
      .map((t) => t.tradeId);

    if (invalidTradeIds.length > 0) {
      return NextResponse.json(
        { error: `Invalid trade IDs: ${invalidTradeIds.join(', ')}` },
        { status: 400 }
      );
    }

    // Process imports
    const results = {
      imported: 0,
      failed: 0,
      thesesCreated: 0,
      errors: [] as { tradeId: string; error: string }[],
      createdTradeIds: [] as string[],
    };

    // Group trades by thesis (new or existing)
    const tradesByThesis = new Map<string, { thesisId: string; trades: TradeToImport[] }>();
    const newTheses: { key: string; thesis: NonNullable<TradeToImport['newThesis']>; trades: TradeToImport[] }[] = [];

    for (const tradeToImport of tradesToImport) {
      if (tradeToImport.thesisId) {
        // Existing thesis
        if (!tradesByThesis.has(tradeToImport.thesisId)) {
          tradesByThesis.set(tradeToImport.thesisId, {
            thesisId: tradeToImport.thesisId,
            trades: [],
          });
        }
        tradesByThesis.get(tradeToImport.thesisId)!.trades.push(tradeToImport);
      } else if (tradeToImport.newThesis) {
        // New thesis - group by ticker
        const key = tradeToImport.newThesis.ticker.toUpperCase();
        let group = newTheses.find((g) => g.key === key);
        if (!group) {
          group = { key, thesis: tradeToImport.newThesis, trades: [] };
          newTheses.push(group);
        }
        group.trades.push(tradeToImport);
      } else {
        // Trade without thesis assignment - skip with error
        results.errors.push({
          tradeId: tradeToImport.tradeId,
          error: 'No thesis specified',
        });
        results.failed++;
      }
    }

    // Create new theses first
    const newThesisIdMap = new Map<string, string>();
    for (const group of newTheses) {
      try {
        const thesis = await prisma.tradingThesis.create({
          data: {
            userId: user.id,
            name: group.thesis.name,
            ticker: group.thesis.ticker.toUpperCase(),
            direction: group.thesis.direction,
            originalThesis: `Imported from OptionStrat CSV`,
            status: 'ACTIVE',
          },
        });
        newThesisIdMap.set(group.key, thesis.id);
        results.thesesCreated++;

        // Add to trades map
        tradesByThesis.set(thesis.id, {
          thesisId: thesis.id,
          trades: group.trades,
        });
      } catch (error) {
        console.error('[CSV Import] Failed to create thesis:', error);
        group.trades.forEach((t) => {
          results.errors.push({
            tradeId: t.tradeId,
            error: `Failed to create thesis: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
          results.failed++;
        });
      }
    }

    // Verify existing theses belong to user
    const existingThesisIds = Array.from(tradesByThesis.keys()).filter(
      (id) => !newThesisIdMap.has(id) && !newTheses.some((g) => newThesisIdMap.get(g.key) === id)
    );

    if (existingThesisIds.length > 0) {
      const validTheses = await prisma.tradingThesis.findMany({
        where: {
          id: { in: existingThesisIds },
          userId: user.id,
        },
        select: { id: true },
      });

      const validThesisIds = new Set(validTheses.map((t) => t.id));
      const invalidThesisIds = existingThesisIds.filter((id) => !validThesisIds.has(id));

      if (invalidThesisIds.length > 0) {
        invalidThesisIds.forEach((thesisId) => {
          const group = tradesByThesis.get(thesisId);
          group?.trades.forEach((t) => {
            results.errors.push({
              tradeId: t.tradeId,
              error: 'Thesis not found or access denied',
            });
            results.failed++;
          });
          tradesByThesis.delete(thesisId);
        });
      }
    }

    // Create trades
    const importBatchId = batchId;

    for (const [thesisId, group] of Array.from(tradesByThesis.entries())) {
      for (const tradeToImport of group.trades) {
        const parsedTrade = parsedTradesMap.get(tradeToImport.tradeId);
        if (!parsedTrade) continue;

        try {
          const action = mapToTradeAction(parsedTrade.status);
          const description = generateTradeDescription(parsedTrade);

          const trade = await prisma.thesisTrade.create({
            data: {
              thesisId,
              userId: user.id,
              action,
              description,
              strategyType: parsedTrade.strategyType,
              openedAt: parsedTrade.date,
              closedAt:
                parsedTrade.status === 'CLOSED' || parsedTrade.status === 'EXPIRED'
                  ? parsedTrade.date
                  : null,
              debitCredit: 0, // OptionStrat doesn't provide this, only P/L
              realizedPL: parsedTrade.realizedPL,
              status: parsedTrade.status,
              source: 'OPTIONSTRAT',
              importedAt: new Date(),
              importBatch: importBatchId,
              extractedData: JSON.parse(JSON.stringify({
                legs: parsedTrade.legs,
                rawRow: parsedTrade.rawRow,
              })),
            },
          });

          results.imported++;
          results.createdTradeIds.push(trade.id);
        } catch (error) {
          console.error('[CSV Import] Failed to create trade:', error);
          results.errors.push({
            tradeId: tradeToImport.tradeId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          results.failed++;
        }
      }
    }

    // Clear cache after successful import
    cache.clear(cacheKey);

    console.log(
      `[CSV Import] Completed: ${results.imported} imported, ${results.failed} failed, ${results.thesesCreated} theses created`
    );

    return NextResponse.json({
      success: true,
      data: {
        imported: results.imported,
        failed: results.failed,
        thesesCreated: results.thesesCreated,
        tradeIds: results.createdTradeIds,
        errors: results.errors.length > 0 ? results.errors : undefined,
      },
    });
  } catch (error) {
    console.error('[CSV Import] Confirm error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
