/**
 * Migration script to update thesis names from "TICKER Mon YYYY Trade"
 * to "TICKER Mon YYYY Strategy Type" based on their trades' strategy types.
 *
 * Run with: npx tsx scripts/migrate-thesis-names.ts
 *
 * Options:
 *   --dry-run    Preview changes without applying them (default)
 *   --apply      Actually apply the changes to the database
 */

import { PrismaClient, StrategyType } from '@prisma/client';

const prisma = new PrismaClient();

function formatStrategyType(type: StrategyType): string {
  return type
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

async function main() {
  const isDryRun = !process.argv.includes('--apply');

  if (isDryRun) {
    console.log('=== DRY RUN MODE ===');
    console.log('No changes will be made. Use --apply to execute.\n');
  } else {
    console.log('=== APPLYING CHANGES ===\n');
  }

  // Find all theses with names ending in "Trade"
  const theses = await prisma.tradingThesis.findMany({
    where: {
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

  console.log(`Found ${theses.length} theses ending with "Trade"\n`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const thesis of theses) {
    const trade = thesis.thesisTrades[0];

    if (!trade || !trade.strategyType) {
      console.log(`SKIP: "${thesis.name}" - No trades or strategy type found`);
      skippedCount++;
      continue;
    }

    const strategyName = formatStrategyType(trade.strategyType);
    const newName = thesis.name.replace(/Trade$/, strategyName);

    if (newName === thesis.name) {
      console.log(`SKIP: "${thesis.name}" - Name unchanged`);
      skippedCount++;
      continue;
    }

    console.log(`UPDATE: "${thesis.name}" -> "${newName}"`);

    if (!isDryRun) {
      await prisma.tradingThesis.update({
        where: { id: thesis.id },
        data: { name: newName },
      });
    }

    updatedCount++;
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Updated: ${updatedCount}`);
  console.log(`Skipped: ${skippedCount}`);

  if (isDryRun && updatedCount > 0) {
    console.log('\nRun with --apply to execute these changes.');
  }
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
