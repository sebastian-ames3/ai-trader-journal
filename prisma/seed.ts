import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Note: Settings are now created per-user when they sign up (see src/lib/auth.ts)

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