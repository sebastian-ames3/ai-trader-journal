import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { parseOptionStratCSV } from '@/lib/csvImport';
import { prisma } from '@/lib/prisma';
import { cache, CacheTTL } from '@/lib/cache';
import { createHash } from 'crypto';

export const dynamic = 'force-dynamic';

// Cache key prefix for import previews
const IMPORT_CACHE_PREFIX = 'import:csv:';

/**
 * POST /api/import/csv/upload
 * Upload and parse OptionStrat CSV file
 *
 * Request body: { csvContent: string }
 * Response: CSVParseResult with trades preview
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { user } = auth;

    // Parse request body
    const body = await request.json();
    const { csvContent } = body;

    if (!csvContent || typeof csvContent !== 'string') {
      return NextResponse.json(
        { error: 'csvContent is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate content is not empty
    if (csvContent.trim().length === 0) {
      return NextResponse.json({ error: 'CSV content is empty' }, { status: 400 });
    }

    // Parse CSV content
    console.log('[CSV Import] Parsing CSV content...');
    const parseResult = parseOptionStratCSV(csvContent);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to parse CSV',
          errors: parseResult.errors,
        },
        { status: 400 }
      );
    }

    // Check for existing theses for the symbols found
    const symbols = Array.from(new Set(parseResult.trades.map((t) => t.symbol).filter(Boolean)));

    const existingTheses = await prisma.tradingThesis.findMany({
      where: {
        userId: user.id,
        ticker: { in: symbols },
      },
      select: {
        id: true,
        name: true,
        ticker: true,
      },
    });

    // Create symbol to thesis map
    const thesesBySymbol: Record<string, { id: string; name: string }[]> = {};
    existingTheses.forEach((thesis) => {
      if (!thesesBySymbol[thesis.ticker]) {
        thesesBySymbol[thesis.ticker] = [];
      }
      thesesBySymbol[thesis.ticker].push({ id: thesis.id, name: thesis.name });
    });

    // Check for duplicate trades already in database
    const tradesToCheck = parseResult.trades.filter((t) => t.isValid && !t.isDuplicate);

    // Check for existing imports with same date/symbol/strategy
    const existingTrades = await prisma.thesisTrade.findMany({
      where: {
        userId: user.id,
        source: 'OPTIONSTRAT',
        openedAt: {
          in: tradesToCheck.map((t) => t.date),
        },
      },
      select: {
        id: true,
        openedAt: true,
        description: true,
        strategyType: true,
        thesis: {
          select: {
            ticker: true,
          },
        },
      },
    });

    // Mark trades that already exist in database
    const existingKeys = new Set(
      existingTrades.map((t) => {
        const dateKey = t.openedAt.toISOString().split('T')[0];
        const ticker = t.thesis?.ticker || '';
        return `${dateKey}-${ticker}-${t.strategyType || ''}`;
      })
    );

    parseResult.trades.forEach((trade) => {
      if (trade.isValid && !trade.isDuplicate) {
        const dateKey = trade.date.toISOString().split('T')[0];
        const key = `${dateKey}-${trade.symbol}-${trade.strategyType || ''}`;
        if (existingKeys.has(key)) {
          trade.isDuplicate = true;
          trade.warnings.push('Trade already imported');
        }
      }
    });

    // Generate import batch ID and cache the parsed data
    const batchId = createHash('sha256')
      .update(`${user.id}-${Date.now()}-${csvContent.slice(0, 100)}`)
      .digest('hex')
      .slice(0, 16);

    const cacheKey = `${IMPORT_CACHE_PREFIX}${batchId}`;

    // Cache parsed trades for 15 minutes (for confirmation step)
    cache.set(
      cacheKey,
      {
        trades: parseResult.trades,
        userId: user.id,
      },
      CacheTTL.FIFTEEN_MINUTES
    );

    console.log(
      `[CSV Import] Parsed ${parseResult.summary.totalRows} rows, ${parseResult.summary.validTrades} valid trades`
    );

    // Recalculate summary after duplicate checks
    const validCount = parseResult.trades.filter((t) => t.isValid && !t.isDuplicate).length;
    const duplicateCount = parseResult.trades.filter((t) => t.isDuplicate).length;

    return NextResponse.json({
      success: true,
      batchId,
      data: {
        trades: parseResult.trades.map((t) => ({
          ...t,
          date: t.date.toISOString(),
        })),
        existingTheses: thesesBySymbol,
        summary: {
          ...parseResult.summary,
          validTrades: validCount,
          duplicates: duplicateCount,
        },
        warnings: parseResult.warnings,
      },
    });
  } catch (error) {
    console.error('[CSV Import] Upload error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Export cache key helper for confirm endpoint
export function getImportCacheKey(batchId: string): string {
  return `${IMPORT_CACHE_PREFIX}${batchId}`;
}
