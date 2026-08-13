// Non-destructive supplement to prisma/seed.ts — run after the main seed
// pipeline, does not truncate anything. Adds:
//   1. TransportExpense records per campus (fuel/maintenance/toll/insurance/
//      etc. against each campus's real vehicles) — genuinely missing from
//      every prior seed pass.
//   2. Marks a realistic share of existing report cards as parent-signed
//      (ReportCard.parentSigned/parentSignedAt/signatureAttachmentId),
//      exercising the sign-off workflow the mobile/web report-card screens
//      actually check for, not just "the report card exists."
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

async function main() {
  console.log('--- Seeding transport expenses + report card signatures ---');

  const campuses = await prisma.campus.findMany({ select: { id: true, name: true } });
  const EXPENSE_CATEGORIES = ['Fuel', 'Maintenance', 'Toll', 'Parking', 'Fine', 'Insurance', 'Taxes', 'Other'];
  const PAYMENT_MODES = ['Cash', 'Card', 'UPI', 'Bank Transfer'];

  for (const campus of campuses) {
    console.log(`\n=== ${campus.name} ===`);
    const vehicles = await prisma.transportVehicle.findMany({ where: { campusId: campus.id }, select: { id: true } });
    if (!vehicles.length) {
      console.log('  No vehicles found, skipping.');
      continue;
    }

    const expenses: any[] = [];
    // Historical session window (2025-04 to 2026-03) — a handful per vehicle,
    // spread across months, so expense reports have real history to show.
    const historicalMonths = ['2025-04', '2025-06', '2025-08', '2025-10', '2025-12', '2026-02'];
    for (const vehicle of vehicles) {
      for (const month of historicalMonths) {
        const day = String(Math.floor(Math.random() * 25) + 1).padStart(2, '0');
        expenses.push({
          id: randomUUID(),
          vehicleId: vehicle.id,
          date: `${month}-${day}`,
          category: randomItem(EXPENSE_CATEGORIES),
          amount: Math.round((Math.random() * 8000 + 500) * 100) / 100,
          paymentMode: randomItem(PAYMENT_MODES),
          remarks: 'Routine operational expense',
          status: 'Approved',
        });
      }
      // Current session, through today — a couple of recent ones per vehicle.
      for (const month of ['2026-04', '2026-06', '2026-08']) {
        const day = String(Math.floor(Math.random() * (month === '2026-08' ? 12 : 25)) + 1).padStart(2, '0');
        expenses.push({
          id: randomUUID(),
          vehicleId: vehicle.id,
          date: `${month}-${day}`,
          category: randomItem(EXPENSE_CATEGORIES),
          amount: Math.round((Math.random() * 8000 + 500) * 100) / 100,
          paymentMode: randomItem(PAYMENT_MODES),
          remarks: 'Routine operational expense',
          status: randomItem(['Approved', 'Approved', 'Pending']),
        });
      }
    }
    await prisma.transportExpense.createMany({ data: expenses, skipDuplicates: true });
    console.log(`  transport_expenses: ${expenses.length}`);

    // Report card parent signatures — sign ~70% of report cards belonging to
    // this campus's enrollments (historical + current), leaving the rest
    // unsigned so the "pending signature" state is also realistically
    // represented, not just "always signed."
    const reportCards = await prisma.reportCard.findMany({
      where: { enrollment: { campusId: campus.id } },
      select: { id: true, createdAt: true },
    });
    let signedCount = 0;
    const BATCH = 500;
    for (let i = 0; i < reportCards.length; i += BATCH) {
      const batch = reportCards.slice(i, i + BATCH);
      await Promise.all(
        batch.map((rc) => {
          if (Math.random() > 0.7) return Promise.resolve();
          signedCount++;
          const signedAt = new Date(rc.createdAt.getTime() + (1 + Math.floor(Math.random() * 5)) * 86400000);
          return prisma.reportCard.update({
            where: { id: rc.id },
            data: {
              parentSigned: true,
              parentSignedAt: signedAt,
              signatureAttachmentId: `seed-signature-${rc.id.slice(0, 8)}`,
            },
          });
        }),
      );
      process.stdout.write(`\r  report_cards signed: ${Math.min(i + BATCH, reportCards.length)}/${reportCards.length}`);
    }
    process.stdout.write('\n');
    console.log(`  Signed ${signedCount} of ${reportCards.length} report cards for ${campus.name}.`);
  }

  console.log('\n--- Done. ---');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
