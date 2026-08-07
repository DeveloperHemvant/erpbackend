import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Remaining Empty Tables ---');

  const students = await prisma.student.findMany({ select: { id: true } });
  const staff = await prisma.staff.findMany({ select: { id: true } });
  const campuses = await prisma.campus.findMany({ select: { id: true } });
  const sections = await prisma.section.findMany({ select: { id: true } });
  const rooms = await prisma.hostelRoom.findMany({ select: { id: true, hostelId: true } });
  const vehicles = await prisma.transportVehicle.findMany({ select: { id: true } });

  if (!students.length || !staff.length || !campuses.length || !sections.length) {
    console.error('Run npm run seed first!');
    return;
  }

  const campusId = campuses[0].id;
  const sectionId = sections[0].id;
  const staffId = staff[0].id;
  const studentId = students[0].id;

  const safeSeed = async (label: string, task: () => Promise<any>) => {
    try {
      await task();
      console.log(`[PASS] Seeded ${label}`);
    } catch (e) {
      console.log(`[SKIP] ${label}: ${e.message}`);
    }
  };

  // 1. Hostel & Gate Logs
  await safeSeed('hostelAllocation', async () => {
    const enrollments = await prisma.studentEnrollment.findMany({ select: { id: true } });
    if (rooms.length && enrollments.length) {
      await prisma.hostelAllocation.createMany({
        data: enrollments.slice(0, 50).map((en, idx) => ({
          id: randomUUID(),
          roomId: rooms[idx % rooms.length].id,
          enrollmentId: en.id,
          status: 'Active',
        })),
        skipDuplicates: true,
      });
    }
  });

  await safeSeed('hostelAttendance', async () => {
    const allocations = await prisma.hostelAllocation.findMany({ select: { enrollmentId: true } });
    if (allocations.length) {
      await prisma.hostelAttendance.createMany({
        data: allocations.slice(0, 50).map((al) => ({
          id: randomUUID(),
          enrollmentId: al.enrollmentId,
          date: '2026-06-01',
          status: 'Present',
        })),
        skipDuplicates: true,
      });
    }
  });

  await safeSeed('vehicleGateLog', async () => {
    await prisma.vehicleGateLog.createMany({
      data: Array.from({ length: 5 }).map((_, idx) => ({
        id: randomUUID(),
        vehicleNumber: `KA-05-CT-200${idx}`,
        driverName: `Driver ${idx + 1}`,
        purpose: 'Delivery',
        entryTime: new Date(),
      })),
      skipDuplicates: true,
    });
  });

  await safeSeed('studentGateLog', async () => {
    const enrollments = await prisma.studentEnrollment.findMany({ select: { id: true } });
    if (enrollments.length) {
      await prisma.studentGateLog.createMany({
        data: enrollments.slice(0, 5).map((en) => ({
          id: randomUUID(),
          enrollmentId: en.id,
          type: 'LATE_ENTRY',
          timestamp: new Date(),
        })),
        skipDuplicates: true,
      });
    }
  });

  // 2. HR & Admin
  await safeSeed('studentLeaveApplication', async () => {
    const enrollments = await prisma.studentEnrollment.findMany({ select: { id: true } });
    if (enrollments.length) {
      await prisma.studentLeaveApplication.createMany({
        data: enrollments.slice(0, 5).map((en) => ({
          id: randomUUID(),
          enrollmentId: en.id,
          leaveType: 'Sick',
          startDate: new Date(),
          endDate: new Date(),
          reason: 'Family event',
          status: 'Pending',
        })),
        skipDuplicates: true,
      });
    }
  });

  await safeSeed('performanceReview', async () => {
    await prisma.performanceReview.createMany({
      data: staff.slice(0, 5).map((st) => ({
        id: randomUUID(),
        staffId: st.id,
        reviewerId: staffId,
        cycle: '2026 Q1',
        rating: 4,
        comments: 'Excellent class management.',
      })),
      skipDuplicates: true,
    });
  });

  await safeSeed('feeRefund', async () => {
    const payments = await prisma.feePayment.findMany({ select: { id: true } });
    if (payments.length) {
      await prisma.feeRefund.createMany({
        data: payments.slice(0, 5).map((pay) => ({
          id: randomUUID(),
          paymentId: pay.id,
          amount: 500.0,
          reason: 'Double payment refund',
          status: 'Processed',
        })),
        skipDuplicates: true,
      });
    }
  });

  await safeSeed('room', async () => {
    await prisma.room.createMany({
      data: Array.from({ length: 5 }).map((_, idx) => ({
        id: randomUUID(),
        name: `Room ${100 + idx}`,
        capacity: 40,
        campusId,
      })),
      skipDuplicates: true,
    });
  });

  await safeSeed('documentTemplate', async () => {
    await prisma.documentTemplate.createMany({
      data: Array.from({ length: 3 }).map((_, idx) => ({
        id: randomUUID(),
        name: `Template ${idx + 1}`,
        type: 'CERTIFICATE',
        targetAudience: 'STUDENT',
        designJson: {},
        status: 'Active',
      })),
      skipDuplicates: true,
    });
  });

  // 3. Transport Maintenance details
  await safeSeed('transportVehicleDocument', async () => {
    await prisma.transportVehicleDocument.createMany({
      data: vehicles.slice(0, 5).map((v) => ({
        id: randomUUID(),
        vehicleId: v.id,
        documentType: 'Insurance',
        expiryDate: '2027-12-31',
        fileUrl: 'https://example.com/insurance.pdf',
      })),
      skipDuplicates: true,
    });
  });

  await safeSeed('transportOdometerLog', async () => {
    await prisma.transportOdometerLog.createMany({
      data: vehicles.slice(0, 5).map((v) => ({
        id: randomUUID(),
        vehicleId: v.id,
        date: '2026-06-01',
        openingReading: 12500.0,
      })),
      skipDuplicates: true,
    });
  });

  await safeSeed('transportDailyCheck', async () => {
    await prisma.transportDailyCheck.createMany({
      data: vehicles.slice(0, 5).map((v) => ({
        id: randomUUID(),
        vehicleId: v.id,
        date: '2026-06-01',
        shift: 'Morning',
        overallStatus: 'Fit',
      })),
      skipDuplicates: true,
    });
  });

  // 4. LMS Sub-details
  await safeSeed('lMSCurriculum', async () => {
    const courses = await prisma.lMSCourse.findMany({ select: { id: true } });
    if (courses.length) {
      await prisma.lMSCurriculum.createMany({
        data: courses.slice(0, 5).map((c) => ({
          id: randomUUID(),
          courseId: c.id,
          board: 'CBSE',
          description: 'Syllabus and guidelines',
        })),
        skipDuplicates: true,
      });
    }
  });

  // 5. System Utilities
  await safeSeed('gradingRule', async () => {
    await prisma.gradingRule.createMany({
      data: Array.from({ length: 5 }).map((_, idx) => ({
        id: randomUUID(),
        name: 'Standard Absolute Scale',
        rules: {},
      })),
      skipDuplicates: true,
    });
  });

  await safeSeed('healthProfile', async () => {
    await prisma.healthProfile.createMany({
      data: students.slice(0, 10).map((st) => ({
        id: randomUUID(),
        studentId: st.id,
        bloodGroup: 'B+',
        allergies: 'None',
        notes: 'General health good.',
      })),
      skipDuplicates: true,
    });
  });

  console.log('--- Extended seeding complete. ---');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
