import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/cache';
import {
  ParsedTrade,
  mapToTradeAction,
  generateTradeDescription,
  getImportCacheKey,
} from '@/lib/csvImport';
import { ThesisDirection, StrategyType, ThesisTradeStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

interface CachedImportData {
  trades: ParsedTrade[];
  userId: string;
}

interface TradeEdits {
  ticker?: string;
  strategyType?: StrategyType;
  openedAt?: string;
  closedAt?: string;
  debitCredit?: number;
  realizedPL?: number;
  status?: ThesisTradeStatus;
  description?: string;
}

interface TradeDecision {
  tradeId: string;
  action: 'approve' | 'skip';
  edits?: TradeEdits;
  notes?: string;
  linkedGroupId?: string;
  tradeAction?: string;
}

interface LinkGroup {
  name: string;
  ticker: string;
  direction: ThesisDirection;
  tradeIds: string[];
  existingThesisId?: string;
}

interface SmartConfirmRequest {
  batchId: string;
  decisions: TradeDecision[];
  linkGroups?: LinkGroup[];
}

/**
 * POST /api/import/smart/confirm
 * Confirm and create trades from smart import wizard
 *
 * Request body:
 * {
 *   batchId: string,
 *   decisions: [
 *     { tradeId, action, edits?, notes?, linkedGroupId?, tradeAction? }
 *   ],
 *   linkGroups?: [
 *     { name, ticker, direction, tradeIds, existingThesisId? }
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
    const body: SmartConfirmRequest = await request.json();
    const { batchId, decisions, linkGroups = [] } = body;

    if (!batchId || typeof batchId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'batchId is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(decisions)) {
      return NextResponse.json(
        { success: false, error: 'decisions array is required' },
        { status: 400 }
      );
    }

    // Get cached import data
    const cacheKey = getImportCacheKey(batchId);
    const cachedData = cache.get<CachedImportData>(cacheKey);

    if (!cachedData) {
      return NextResponse.json(
        { success: false, error: 'Import session expired. Please upload the CSV again.' },
        { status: 410 }
      );
    }

    // Verify user matches
    if (cachedData.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Create a map of parsed trades by ID
    const parsedTradesMap = new Map<string, ParsedTrade>();
    cachedData.trades.forEach((t) => {
      parsedTradesMap.set(t.id, t);
    });

    // Filter approved decisions
    const approvedDecisions = decisions.filter((d) => d.action === 'approve');
    const skippedCount = decisions.filter((d) => d.action === 'skip').length;

    // Validate all approved trades exist in cache
    const invalidTradeIds = approvedDecisions
      .filter((d) => !parsedTradesMap.has(d.tradeId))
      .map((d) => d.tradeId);

    if (invalidTradeIds.length > 0) {
      return NextResponse.json(
        { success: false, error: `Invalid trade IDs: ${invalidTradeIds.join(', ')}` },
        { status: 400 }
      );
    }

    // Process results tracking
    const results = {
      imported: 0,
      skipped: skippedCount,
      thesesCreated: 0,
      errors: [] as { tradeId: string; error: string }[],
      createdTradeIds: [] as string[],
      createdThesisIds: [] as string[],
    };

    // Create a map from trade ID to link group
    const tradeToGroupMap = new Map<string, LinkGroup>();
    for (const group of linkGroups) {
      for (const tradeId of group.tradeIds) {
        tradeToGroupMap.set(tradeId, group);
      }
    }

    // Create new theses for link groups (not using existing thesis)
    const groupToThesisMap = new Map<string, string>();

    for (const group of linkGroups) {
      if (group.existingThesisId) {
        // Verify existing thesis belongs to user
        const existingThesis = await prisma.tradingThesis.findFirst({
          where: {
            id: group.existingThesisId,
            userId: user.id,
          },
          select: { id: true },
        });

        if (existingThesis) {
          groupToThesisMap.set(group.name, existingThesis.id);
        } else {
          // Thesis not found, create new one
          try {
            const thesis = await prisma.tradingThesis.create({
              data: {
                userId: user.id,
                name: group.name,
                ticker: group.ticker.toUpperCase(),
                direction: group.direction,
                originalThesis: `Imported via Smart Import Wizard`,
                status: 'ACTIVE',
              },
            });
            groupToThesisMap.set(group.name, thesis.id);
            results.thesesCreated++;
            results.createdThesisIds.push(thesis.id);
          } catch (error) {
            console.error('[Smart Import] Failed to create thesis:', error);
          }
        }
      } else {
        // Create new thesis
        try {
          const thesis = await prisma.tradingThesis.create({
            data: {
              userId: user.id,
              name: group.name,
              ticker: group.ticker.toUpperCase(),
              direction: group.direction,
              originalThesis: `Imported via Smart Import Wizard`,
              status: 'ACTIVE',
            },
          });
          groupToThesisMap.set(group.name, thesis.id);
          results.thesesCreated++;
          results.createdThesisIds.push(thesis.id);
        } catch (error) {
          console.error('[Smart Import] Failed to create thesis:', error);
        }
      }
    }

    // Create trades
    const importBatchId = batchId;

    for (const decision of approvedDecisions) {
      const parsedTrade = parsedTradesMap.get(decision.tradeId);
      if (!parsedTrade) continue;

      try {
        // Apply edits
        const ticker = decision.edits?.ticker || parsedTrade.symbol;
        const strategyType = decision.edits?.strategyType || parsedTrade.strategyType;
        const openedAt = decision.edits?.openedAt || parsedTrade.date;
        const closedAt = decision.edits?.closedAt;
        const debitCredit = decision.edits?.debitCredit ?? 0;
        const realizedPL = decision.edits?.realizedPL ?? parsedTrade.realizedPL;
        const status: ThesisTradeStatus = decision.edits?.status || parsedTrade.status;

        // Determine thesis ID
        let thesisId: string | null = null;
        const linkedGroup = tradeToGroupMap.get(decision.tradeId);
        if (linkedGroup) {
          thesisId = groupToThesisMap.get(linkedGroup.name) || null;
        }

        // If no thesis from link group, create standalone
        if (!thesisId) {
          // Create a standalone thesis for this trade
          const thesis = await prisma.tradingThesis.create({
            data: {
              userId: user.id,
              name: `${ticker} ${new Date(openedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} Trade`,
              ticker: ticker.toUpperCase(),
              direction: 'BULLISH', // Default
              originalThesis: `Imported via Smart Import Wizard`,
              status: 'ACTIVE',
            },
          });
          thesisId = thesis.id;
          results.thesesCreated++;
          results.createdThesisIds.push(thesis.id);
        }

        // Determine trade action
        const action = decision.tradeAction
          ? (decision.tradeAction as 'INITIAL' | 'ADD' | 'REDUCE' | 'ROLL' | 'CONVERT' | 'CLOSE' | 'ASSIGNED' | 'EXERCISED')
          : mapToTradeAction(status);

        const description = decision.edits?.description || generateTradeDescription(parsedTrade);

        const trade = await prisma.thesisTrade.create({
          data: {
            thesisId,
            userId: user.id,
            action,
            description,
            strategyType,
            openedAt: new Date(openedAt),
            closedAt: closedAt
              ? new Date(closedAt)
              : status === 'CLOSED' || status === 'EXPIRED'
                ? new Date(openedAt)
                : null,
            debitCredit,
            realizedPL,
            status,
            source: 'OPTIONSTRAT',
            importedAt: new Date(),
            importBatch: importBatchId,
            reasoningNote: decision.notes || null,
            extractedData: JSON.parse(JSON.stringify({
              legs: parsedTrade.legs,
              rawRow: parsedTrade.rawRow,
              edits: decision.edits,
            })),
          },
        });

        results.imported++;
        results.createdTradeIds.push(trade.id);
      } catch (error) {
        console.error('[Smart Import] Failed to create trade:', error);
        results.errors.push({
          tradeId: decision.tradeId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Clear cache after successful import
    cache.clear(cacheKey);

    console.log(
      `[Smart Import] Completed: ${results.imported} imported, ${results.skipped} skipped, ${results.thesesCreated} theses created`
    );

    return NextResponse.json({
      success: true,
      data: {
        imported: results.imported,
        skipped: results.skipped,
        thesesCreated: results.thesesCreated,
        tradeIds: results.createdTradeIds,
        thesisIds: results.createdThesisIds,
        errors: results.errors.length > 0 ? results.errors : undefined,
      },
    });
  } catch (error) {
    console.error('[Smart Import] Confirm error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
