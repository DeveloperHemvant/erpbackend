/**
 * Campus Isolation Phase 0b — one-time backfill for the 10 columns added in
 * migration 20260813153624_campus_isolation_phase0b_group_ab_columns.
 *
 * Transitional-nullable models (A1, A2, A3, A4x2, A5, A6, B1) get every
 * existing row set to the current single campus — matches the exact
 * pattern already used for Staff.campusId in Phase 0.
 *
 * Announcement (B2) and FeeStructure (B3) are deliberately NOT backfilled —
 * see CAMPUS_ISOLATION_DECISIONS.md. Their campusId is permanently optional
 * by design (null = school-wide); backfilling existing rows to "the current
 * campus" would wrongly narrow pre-existing school-wide records to one
 * campus the moment a second campus is created.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const campus = await prisma.campus.findFirstOrThrow();
  console.log(`Backfilling to campus: ${campus.name} (${campus.id})`);

  const results = await Promise.all([
    prisma.admissionInquiry.updateMany({
      where: { campusId: null },
      data: { campusId: campus.id },
    }),
    prisma.eMSExamSession.updateMany({
      where: { campusId: null },
      data: { campusId: campus.id },
    }),
    prisma.visitorRecord.updateMany({
      where: { campusId: null },
      data: { campusId: campus.id },
    }),
    prisma.transportVehicle.updateMany({
      where: { campusId: null },
      data: { campusId: campus.id },
    }),
    prisma.transportRoute.updateMany({
      where: { campusId: null },
      data: { campusId: campus.id },
    }),
    prisma.hostel.updateMany({
      where: { campusId: null },
      data: { campusId: campus.id },
    }),
    prisma.libraryBook.updateMany({
      where: { campusId: null },
      data: { campusId: campus.id },
    }),
    prisma.schoolHouse.updateMany({
      where: { campusId: null },
      data: { campusId: campus.id },
    }),
  ]);

  const labels = [
    'admissionInquiry',
    'eMSExamSession',
    'visitorRecord',
    'transportVehicle',
    'transportRoute',
    'hostel',
    'libraryBook',
    'schoolHouse',
  ];
  labels.forEach((label, i) => console.log(`${label}: ${results[i].count} rows backfilled`));

  const [announcementNull, feeStructureNull] = await Promise.all([
    prisma.announcement.count({ where: { campusId: null } }),
    prisma.feeStructure.count({ where: { campusId: null } }),
  ]);
  console.log(`announcement: left NULL by design (${announcementNull} rows, school-wide)`);
  console.log(`feeStructure: left NULL by design (${feeStructureNull} rows, not campus-restricted)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
