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

function generateTime(startHour, startMin, spreadMins) {
  const extraMins = Math.floor(Math.random() * spreadMins);
  let h = startHour;
  let m = startMin + extraMins;
  if (m >= 60) {
    h += Math.floor(m / 60);
    m = m % 60;
  }
  const ampm = h >= 12 ? 'PM' : 'AM';
  let formattedH = h % 12;
  if (formattedH === 0) formattedH = 12;
  return `${String(formattedH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

async function main() {
  console.log("Starting Staff Attendance Check-In/Out Seeding...");
  
  const campus = await prisma.campus.findUnique({ where: { name: 'Main Campus' } });
  const session = await prisma.academicSession.findUnique({ where: { name: '2026-2027' } });
  
  if (!campus || !session) {
    throw new Error("Missing master data!");
  }

  console.log("Wiping old Staff Attendance Records...");
  const deleteResult = await prisma.attendanceRecord.deleteMany({
    where: { staffId: { not: null } }
  });
  console.log(`Deleted ${deleteResult.count} old records.`);

  const staffList = await prisma.staff.findMany();
  console.log(`Found ${staffList.length} staff members.`);
  
  const dates = getDates('2026-04-01', '2026-07-31');
  console.log(`Generating attendance for ${dates.length} days (Apr 1 - Jul 31, 2026)...`);

  const attendanceRecords = [];
  
  for (const date of dates) {
    for (const staff of staffList) {
      const status = getRandomStatus();
      let checkInTime = null;
      let checkOutTime = null;

      if (status === 'Present') {
        checkInTime = generateTime(7, 30, 30); // 7:30 AM to 8:00 AM
        checkOutTime = generateTime(14, 0, 60); // 2:00 PM to 3:00 PM
      } else if (status === 'Late') {
        checkInTime = generateTime(8, 15, 60); // 8:15 AM to 9:15 AM
        checkOutTime = generateTime(14, 0, 60); // 2:00 PM to 3:00 PM
      }

      attendanceRecords.push({
        staffId: staff.id,
        campusId: campus.id,
        sessionId: session.id,
        date: date,
        status: status,
        checkInTime: checkInTime,
        checkOutTime: checkOutTime,
        createdBy: "SYSTEM"
      });
    }
  }

  console.log(`Prepared ${attendanceRecords.length} attendance records. Inserting...`);
  
  const result = await prisma.attendanceRecord.createMany({
    data: attendanceRecords,
    skipDuplicates: true
  });

  console.log(`Successfully inserted ${result.count} attendance records with check-in/out times!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
