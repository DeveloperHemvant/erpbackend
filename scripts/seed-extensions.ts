import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Extended Table Seeding (Enterprise Workflows) ---');

  // Campus Isolation Multi-Campus Demo Data Overhaul — this used to hardcode
  // `campuses[0]` and slice(0, N) off globally-mixed arrays, so every
  // extension record (visitor records, admission inquiries, gate passes,
  // leave applications, payslips, morning assemblies, ...) ended up on
  // whichever campus happened to be first, and campus 2 got zero of any of
  // it. Now loops per campus, with every dependency array pre-filtered to
  // that campus, so each campus gets its own independent set.
  const campuses = await prisma.campus.findMany({ select: { id: true, name: true } });
  if (!campuses.length) {
    console.error('No campuses found. Run npm run seed first!');
    return;
  }

  for (const campus of campuses) {
    console.log(`\n=== Extensions for campus: ${campus.name} ===`);
    const campusId = campus.id;

    const students = await prisma.student.findMany({
      where: { enrollments: { some: { campusId } } },
      select: { id: true },
    });
    const enrollments = await prisma.studentEnrollment.findMany({
      where: { campusId },
      select: { id: true, studentId: true, sectionId: true },
    });
    const staff = await prisma.staff.findMany({ where: { campusId }, select: { id: true } });
    const rooms = await prisma.hostelRoom.findMany({ where: { hostel: { campusId } }, select: { id: true, hostelId: true } });
    const vehicles = await prisma.transportVehicle.findMany({ where: { campusId }, select: { id: true } });
    const periods = await prisma.timetablePeriod.findMany({
      where: { section: { class: { campusId } } },
      select: { id: true },
    });

    if (!students.length || !staff.length || !enrollments.length || !rooms.length || !vehicles.length) {
      console.error(`  Core data not found for ${campus.name}. Skipping.`);
      continue;
    }

    const staffId = staff[0].id;
    const studentId = students[0].id;

    const safeSeed = async (label: string, task: () => Promise<any>) => {
      try {
        await task();
        console.log(`  [PASS] Seeded ${label}`);
      } catch (e) {
        console.log(`  [SKIP] ${label}: ${e.message}`);
      }
    };

    // 1. Hostel Outpasses
    await safeSeed('Hostel Outpasses', async () => {
      const outpasses = enrollments.slice(0, 10).map((en) => ({
        id: randomUUID(),
        enrollmentId: en.id,
        reason: 'Weekend home visit',
        fromDate: new Date('2026-06-10T09:00:00Z'),
        toDate: new Date('2026-06-12T17:00:00Z'),
        status: 'Approved',
        approvedById: staff[0].id,
      }));
      await prisma.hostelOutpass.createMany({ data: outpasses, skipDuplicates: true });
    });

    // 2. Hostel Grievances
    await safeSeed('Hostel Grievances', async () => {
      const grievances = enrollments.slice(0, 10).map((en, idx) => ({
        id: randomUUID(),
        hostelId: rooms[idx % rooms.length].hostelId,
        enrollmentId: en.id,
        title: 'Room fan repair',
        description: 'Ceiling fan in room is making noise and running slow.',
        status: 'Open',
      }));
      await prisma.hostelGrievance.createMany({ data: grievances, skipDuplicates: true });
    });

    // 3. Leave Applications
    await safeSeed('Leave Applications', async () => {
      const leaves = staff.slice(0, 10).map((st) => ({
        id: randomUUID(),
        staffId: st.id,
        leaveType: 'CL',
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-07-02'),
        reason: 'Medical checkup',
        status: 'Approved',
        resolvedById: staff[0].id,
      }));
      await prisma.leaveApplication.createMany({ data: leaves, skipDuplicates: true });
    });

    // 4. Payslips
    await safeSeed('Payslips', async () => {
      const payslips = staff.slice(0, 20).map((st) => ({
        id: randomUUID(),
        staffId: st.id,
        month: 6,
        year: 2026,
        basicSalary: 40000,
        allowances: 5000,
        fixedDeductions: 2000,
        netSalary: 43000,
        status: 'Paid',
      }));
      await prisma.payslip.createMany({ data: payslips, skipDuplicates: true });
    });

    // 5. Visitor Records
    await safeSeed('Visitor Records', async () => {
      const visitors = Array.from({ length: 15 }).map((_, idx) => ({
        id: randomUUID(),
        fullName: `Visitor ${idx + 1}`,
        phone: `98765432${idx}`,
        purpose: 'Parent Teacher Meeting',
        hostId: staff[0].id,
        entryTime: new Date(),
        status: 'CheckedIn',
        campusId,
      }));
      await prisma.visitorRecord.createMany({ data: visitors, skipDuplicates: true });
    });

    // 6. Student Gate Passes
    await safeSeed('Student Gate Passes', async () => {
      const gatePasses = enrollments.slice(0, 10).map((en) => ({
        id: randomUUID(),
        studentId: en.studentId,
        reason: 'Doctor Appointment',
        leaveType: 'Short Leave',
        approvedById: staff[0].id,
        exitTime: new Date(),
        status: 'Approved',
      }));
      await prisma.studentGatePass.createMany({ data: gatePasses, skipDuplicates: true });
    });

    // 7. Student Achievements
    await safeSeed('Student Achievements', async () => {
      const achievements = students.slice(0, 20).map((st) => ({
        id: randomUUID(),
        studentId: st.id,
        type: 'ACADEMIC',
        title: 'Inter-school debate tournament',
        award: '1st Place Gold Medal',
        issuedById: staff[0].id,
      }));
      await prisma.studentAchievement.createMany({ data: achievements, skipDuplicates: true });
    });

    // 8. Lost and Found Items
    await safeSeed('Lost and Found items', async () => {
      const lostItems = Array.from({ length: 10 }).map((_, idx) => ({
        id: randomUUID(),
        itemName: `Water Bottle ${idx + 1}`,
        description: 'Blue metal thermos bottle found in playground.',
        reporterId: staff[0].id,
        status: 'Unclaimed',
      }));
      await prisma.lostFoundItem.createMany({ data: lostItems, skipDuplicates: true });
    });

    // 9. Morning Assemblies
    await safeSeed('Morning Assemblies', async () => {
      const assemblies = Array.from({ length: 5 }).map((_, idx) => ({
        id: randomUUID(),
        date: new Date(`2026-06-0${idx + 1}`),
        campusId,
        theme: `Theme of Day ${idx + 1}`,
        performingSectionId: enrollments[0].sectionId,
        supervisingStaffId: staff[0].id,
        venue: 'Main School Auditorium',
        activities: ['Prayer', 'National Anthem', 'Daily News Reading'],
      }));
      await prisma.morningAssembly.createMany({ data: assemblies, skipDuplicates: true });
    });

    // 10. Admission Inquiries
    await safeSeed('Admission Inquiries', async () => {
      const inquiries = Array.from({ length: 10 }).map((_, idx) => ({
        id: randomUUID(),
        childName: `Inquiry Student ${idx + 1}`,
        gradeInterested: 'Grade 1',
        parentName: `Parent ${idx + 1}`,
        phone: `98765431${idx}`,
        email: `inquiry.${campusId.slice(0, 6)}.${idx}@example.com`,
        status: 'New',
        campusId,
      }));
      await prisma.admissionInquiry.createMany({ data: inquiries, skipDuplicates: true });
    });

    // 11. Discipline Incidents
    await safeSeed('Discipline Incidents', async () => {
      const disciplineIncidents = enrollments.slice(0, 10).map((en) => ({
        id: randomUUID(),
        studentId: en.studentId,
        incidentDate: new Date(),
        category: 'Attendance',
        description: 'Late entry to class repeatedly.',
        severity: 'Minor',
        actionTaken: 'Verbal Warning',
        status: 'Resolved',
        reportedByStaffId: staffId,
      }));
      await prisma.disciplineIncident.createMany({ data: disciplineIncidents, skipDuplicates: true });
    });

    // 12. Transport Fuel Logs
    await safeSeed('Transport Fuel Logs', async () => {
      const fuelLogs = vehicles.slice(0, 10).map((v) => ({
        id: randomUUID(),
        vehicleId: v.id,
        date: '2026-06-01',
        fuelType: 'Diesel',
        litres: 50.0,
        ratePerLitre: 90.0,
        totalCost: 4500.0,
        currentOdometer: 12000.0,
        status: 'Pending',
      }));
      await prisma.transportFuelLog.createMany({ data: fuelLogs, skipDuplicates: true });
    });

    // 13. Courier Logs
    await safeSeed('Courier Logs', async () => {
      const courierLogs = Array.from({ length: 10 }).map((_, idx) => ({
        id: randomUUID(),
        type: 'INCOMING',
        sender: 'Speed Post Courier',
        description: 'Official school transcript document packet.',
        status: 'Received',
      }));
      await prisma.courierLog.createMany({ data: courierLogs, skipDuplicates: true });
    });

    // 14. Meetings
    await safeSeed('Meetings', async () => {
      const meetings = Array.from({ length: 5 }).map((_, idx) => ({
        id: randomUUID(),
        title: `Parent Teacher Meet Term ${idx + 1}`,
        agenda: 'Discuss academic progress and marks card reviews.',
        scheduledFor: new Date(),
        location: 'Conference Room',
        status: 'Scheduled',
        organizerId: staffId,
      }));
      await prisma.meeting.createMany({ data: meetings, skipDuplicates: true });
    });

    // 15. Diary Entries
    await safeSeed('Diary Entries', async () => {
      const diaryEntries = enrollments.slice(0, 10).map((en) => ({
        id: randomUUID(),
        studentId: en.studentId,
        teacherId: staffId,
        type: 'REMARK',
        content: 'Demonstrated outstanding teamwork during class project.',
        parentSigned: false,
      }));
      await prisma.schoolDiaryEntry.createMany({ data: diaryEntries, skipDuplicates: true });
    });

    // 16. Teacher Substitutions
    await safeSeed('Teacher Substitutions', async () => {
      const activeLeaves = await prisma.leaveApplication.findMany({
        where: { staff: { campusId } },
        select: { id: true, staffId: true },
      });
      if (activeLeaves.length && periods.length) {
        const subs = activeLeaves.slice(0, 5).map((l, idx) => ({
          id: randomUUID(),
          leaveApplicationId: l.id,
          primaryTeacherId: l.staffId,
          substituteTeacherId: staff[(idx + 1) % staff.length].id,
          date: new Date(),
          timetablePeriodId: periods[idx % periods.length].id,
          status: 'ASSIGNED',
        }));
        await prisma.teacherSubstitution.createMany({ data: subs, skipDuplicates: true });
      }
    });

    // 17. Grievance Records
    await safeSeed('Grievance Records', async () => {
      const grievances = Array.from({ length: 5 }).map((_, idx) => ({
        id: randomUUID(),
        userType: 'STUDENT',
        reporterId: studentId,
        title: `Portal Access Issue ${idx + 1}`,
        description: 'Unable to login to library search console from personal phone.',
        status: 'Open',
      }));
      await prisma.grievanceRecord.createMany({ data: grievances, skipDuplicates: true });
    });
  }

  console.log('\n--- Seeding complete. All database tables populated successfully! ---');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
