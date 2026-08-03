const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function getDates(startDate, endDate) {
  const dates = [];
  let currentDate = new Date(startDate);
  const end = new Date(endDate);
  
  while (currentDate <= end) {
    const yyyy = currentDate.getFullYear();
    const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dd = String(currentDate.getDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}

function getRandomStatus() {
  const rand = Math.random();
  if (rand < 0.85) return 'Present';
  if (rand < 0.95) return 'Absent';
  if (rand < 0.98) return 'Late';
  return 'Leave';
}

async function main() {
  console.log("Starting MASSIVE Student Attendance Seeding...");
  
  const campus = await prisma.campus.findUnique({ where: { name: 'Main Campus' } });
  const session = await prisma.academicSession.findUnique({ where: { name: '2026-2027' } });
  
  if (!campus || !session) {
    throw new Error("Missing master data! Please run seed_master_data.js first.");
  }

  const enrollments = await prisma.studentEnrollment.findMany({
    where: { sessionId: session.id, campusId: campus.id }
  });

  if (enrollments.length === 0) {
    throw new Error("No student enrollments found! Please run seed_students.js first.");
  }

  console.log(`Found ${enrollments.length} enrolled students.`);
  
  const dates = getDates('2026-04-01', '2026-07-31');
  console.log(`Generating attendance for ${dates.length} days (Apr 1 - Jul 31, 2026)...`);

  let totalRecords = 0;
  
  // To avoid memory limits with ~94,000 records, we process and batch insert by date chunks.
  for (const date of dates) {
    const dailyRecords = [];
    
    for (const enrollment of enrollments) {
      dailyRecords.push({
        enrollmentId: enrollment.id,
        campusId: campus.id,
        sessionId: session.id,
        date: date,
        status: getRandomStatus(),
        createdBy: "SYSTEM"
      });
    }

    // Insert day by day (~770 records per insert)
    await prisma.attendanceRecord.createMany({
      data: dailyRecords,
      skipDuplicates: true
    });
    
    totalRecords += dailyRecords.length;
    // Log progress every 10 days
    if (dates.indexOf(date) % 10 === 0) {
      console.log(`Progress: Inserted attendance up to ${date} (${totalRecords} records total)`);
    }
  }

  console.log(`\nSUCCESS! Massively inserted ${totalRecords} student attendance records!`);
  console.log("Student Attendance Seeding completely finished!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
