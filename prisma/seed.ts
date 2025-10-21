import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create default settings
  await prisma.settings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      defaultRisk: 1.0,
      accountSize: 10000,
      liquidityThreshold: 100,
      ivThreshold: 80,
    },
  });

  // Create sample tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { name: 'earnings' },
      update: {},
      create: { name: 'earnings' },
    }),
    prisma.tag.upsert({
      where: { name: 'hedge' },
      update: {},
      create: { name: 'hedge' },
    }),
    prisma.tag.upsert({
      where: { name: 'weekly' },
      update: {},
      create: { name: 'weekly' },
    }),
  ]);

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });