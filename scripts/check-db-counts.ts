import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Checking DB Table Row Counts ---');

  const prismaKeys = Object.keys(prisma);
  const models = prismaKeys.filter(
    (key) =>
      typeof (prisma as any)[key] === 'object' &&
      (prisma as any)[key] !== null &&
      'count' in (prisma as any)[key]
  );

  const populated: { table: string; count: number }[] = [];
  const empty: string[] = [];

  for (const model of models) {
    try {
      const count = await (prisma as any)[model].count();
      if (count > 0) {
        populated.push({ table: model, count });
      } else {
        empty.push(model);
      }
    } catch {
      // Ignore intermediate internal helpers
    }
  }

  populated.sort((a, b) => b.count - a.count);

  console.log('\n--- Populated Tables ---');
  console.table(populated);

  console.log('\n--- Empty Tables ---');
  console.log(empty.join(', ') || 'None!');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
