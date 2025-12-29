import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { StrategyType } from '@prisma/client';

export const dynamic = 'force-dynamic';

function formatStrategyType(type: StrategyType): string {
  return type
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * POST /api/admin/migrate-thesis-names
 * Updates thesis names from "TICKER Mon YYYY Trade" to include strategy type
 */
export async function POST() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { user } = auth;

    // Find all theses for this user with names ending in "Trade"
    const theses = await prisma.tradingThesis.findMany({
      where: {
        userId: user.id,
        name: {
          endsWith: 'Trade',
        },
      },
      include: {
        thesisTrades: {
          take: 1,
          orderBy: {
            openedAt: 'asc',
          },
          select: {
            strategyType: true,
          },
        },
      },
    });

    const results = {
      updated: [] as { oldName: string; newName: string }[],
      skipped: [] as { name: string; reason: string }[],
    };

    for (const thesis of theses) {
      const trade = thesis.thesisTrades[0];

      if (!trade || !trade.strategyType) {
        results.skipped.push({
          name: thesis.name,
          reason: 'No trades or strategy type found',
        });
        continue;
      }

      const strategyName = formatStrategyType(trade.strategyType);
      const newName = thesis.name.replace(/Trade$/, strategyName);

      if (newName === thesis.name) {
        results.skipped.push({
          name: thesis.name,
          reason: 'Name unchanged',
        });
        continue;
      }

      await prisma.tradingThesis.update({
        where: { id: thesis.id },
        data: { name: newName },
      });

      results.updated.push({
        oldName: thesis.name,
        newName: newName,
      });
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('[Migrate Thesis Names] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
