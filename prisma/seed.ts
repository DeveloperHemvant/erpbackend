/* eslint-disable */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();
faker.seed(20260802);

// ==========================================
// CONFIG
// ==========================================
const CAMPUS_NAME = 'Main Campus';
const SESSION_NAME = '2026-2027';
const SESSION_START = new Date('2026-04-01');
const SESSION_END = new Date('2027-03-15');
const SECTION_NAMES = ['A', 'B'];
const STUDENTS_PER_SECTION = 50;

const GRADES = [
  'Nursery', 'LKG', 'UKG',
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
  'Grade 6', 'Grade 7', 'Grade 8',
  'Grade 9', 'Grade 10',
  'Grade 11', 'Grade 12',
];

type Cluster = 'EARLY' | 'PRIMARY' | 'MIDDLE' | 'SECONDARY' | 'SENIOR';

function clusterOf(grade: string): Cluster {
  if (['Nursery', 'LKG', 'UKG'].includes(grade)) return 'EARLY';
  const n = parseInt(grade.replace('Grade ', ''), 10);
  if (n <= 5) return 'PRIMARY';
  if (n <= 8) return 'MIDDLE';
  if (n <= 10) return 'SECONDARY';
  return 'SENIOR';
}

const SUBJECTS_BY_CLUSTER: Record<Cluster, string[]> = {
  EARLY: ['English', 'Numeracy', 'Environmental Studies', 'Art & Craft', 'Music', 'Physical Education'],
  PRIMARY: ['English', 'Mathematics', 'Science', 'Social Studies', 'Hindi', 'Computer Science', 'Art & Craft', 'Physical Education'],
  MIDDLE: ['English', 'Mathematics', 'Science', 'Social Studies', 'Hindi', 'Computer Science', 'Physical Education'],
  SECONDARY: ['English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Social Studies', 'Hindi', 'Computer Science', 'Physical Education'],
  SENIOR: ['English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Physical Education'],
};

const ALL_SUBJECTS = Array.from(new Set(Object.values(SUBJECTS_BY_CLUSTER).flat()));

// Approximate age (years) a student in a given grade should be, for a believable DOB.
const AGE_BY_GRADE: Record<string, number> = {
  Nursery: 3, LKG: 4, UKG: 5,
  'Grade 1': 6, 'Grade 2': 7, 'Grade 3': 8, 'Grade 4': 9, 'Grade 5': 10,
  'Grade 6': 11, 'Grade 7': 12, 'Grade 8': 13,
  'Grade 9': 14, 'Grade 10': 15,
  'Grade 11': 16, 'Grade 12': 17,
};

const HOLIDAYS = new Set([
  '2026-04-14', // Ambedkar Jayanti
  '2026-05-01', // Labour Day
  '2026-08-15', // Independence Day
  '2026-09-07', // Ganesh Chaturthi
  '2026-10-02', // Gandhi Jayanti
  '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', // Diwali break
  '2026-12-25', // Christmas
  '2027-01-01', // New Year
  '2027-01-26', // Republic Day
  '2027-03-04', // Holi
]);
// Winter break
for (let d = new Date('2026-12-26'); d <= new Date('2027-01-03'); d.setDate(d.getDate() + 1)) {
  HOLIDAYS.add(d.toISOString().split('T')[0]);
}

function fmt(d: Date) {
  return d.toISOString().split('T')[0];
}

function isSchoolDay(d: Date) {
  const day = d.getDay(); // 0 Sun, 6 Sat
  if (day === 0 || day === 6) return false;
  return !HOLIDAYS.has(fmt(d));
}

function getSchoolDays(): string[] {
  const days: string[] = [];
  for (let d = new Date(SESSION_START); d <= SESSION_END; d.setDate(d.getDate() + 1)) {
    if (isSchoolDay(d)) days.push(fmt(new Date(d)));
  }
  return days;
}

// ==========================================
// HELPERS
// ==========================================
function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function batchInsert(label: string, delegate: { createMany: (args: any) => Promise<any> }, rows: any[], chunkSize = 3000) {
  if (rows.length === 0) return;
  let done = 0;
  for (const batch of chunkArray(rows, chunkSize)) {
    await delegate.createMany({ data: batch, skipDuplicates: true });
    done += batch.length;
    process.stdout.write(`\r  ${label}: ${done}/${rows.length}`);
  }
  process.stdout.write('\n');
}

function weightedPick<T>(options: { value: T; weight: number }[]): T {
  const total = options.reduce((s, o) => s + o.weight, 0);
  let r = Math.random() * total;
  for (const o of options) {
    if (r < o.weight) return o.value;
    r -= o.weight;
  }
  return options[options.length - 1].value;
}

async function resetDatabase() {
  console.log('Resetting database...');
  const tables: { tablename: string }[] = await prisma.$queryRawUnsafe(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations'`
  );
  if (tables.length === 0) return;
  const names = tables.map((t) => `"${t.tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${names} RESTART IDENTITY CASCADE;`);
  console.log('Database reset complete.');
}

// ==========================================
// MAIN
// ==========================================
async function main() {
  await resetDatabase();

  const schoolDays = getSchoolDays();
  console.log(`School year: ${fmt(SESSION_START)} -> ${fmt(SESSION_END)} (${schoolDays.length} school days)`);

  const sharedHash = await bcrypt.hash('Staff@123', 10);
  const adminHash = await bcrypt.hash('Admin@123', 10);
  const parentHash = await bcrypt.hash('Parent@123', 10);

  // ---------- Phase 1: Foundation ----------
  console.log('\nPhase 1: Foundation (school, campus, session, roles)');
  const schoolProfile = await prisma.schoolProfile.create({
    data: { name: 'Central Academy', email: 'admin@centralacademy.edu', phone: '1234567890' },
  });
  const campus = await prisma.campus.create({
    data: {
      schoolProfileId: schoolProfile.id,
      name: CAMPUS_NAME,
      address: '123 Education Lane',
      capacity: 3000,
      latitude: 12.9716,
      longitude: 77.5946,
      status: 'Active',
    },
  });
  const session = await prisma.academicSession.create({
    data: { name: SESSION_NAME, isActive: true, status: 'Active' },
  });

  // Permission strings must match exactly what @RequirePermissions() guards on the backend
  // check, and what the web (lib/auth.ts moduleMap) and mobile (modules.tsx req arrays)
  // gate navigation on — arbitrary/lowercase strings here silently lock every real login
  // out of the very features their role is supposed to have.
  const roleDefs = [
    { name: 'Super Admin', permissions: ['*'] },
    { name: 'Principal', permissions: ['*'] },
    { name: 'Vice Principal', permissions: ['VIEW_STUDENTS', 'MANAGE_USERS', 'MANAGE_ACADEMICS', 'MARK_ATTENDANCE', 'MANAGE_GRADES', 'VIEW_REPORTS', 'MANAGE_EXAMS', 'VIEW_OWN_PROFILE', 'VIEW_OWN_SCHEDULE', 'MANAGE_LMS_CONTENT', 'MANAGE_FEES', 'MANAGE_HEALTH_RECORDS', 'MANAGE_DISCIPLINE', 'MANAGE_ADMISSIONS_PIPELINE'] },
    { name: 'Teacher', permissions: ['VIEW_OWN_PROFILE', 'VIEW_OWN_SCHEDULE', 'VIEW_STUDENTS', 'MARK_ATTENDANCE', 'MANAGE_GRADES', 'MANAGE_LMS_CONTENT', 'VIEW_REPORTS', 'MANAGE_EXAMS', 'read', 'MANAGE_DISCIPLINE'] },
    { name: 'Accountant', permissions: ['VIEW_OWN_PROFILE', 'VIEW_STUDENTS', 'MANAGE_FEES', 'VIEW_REPORTS'] },
    { name: 'Librarian', permissions: ['VIEW_OWN_PROFILE', 'MANAGE_ACADEMICS'] },
    { name: 'Warden', permissions: ['VIEW_OWN_PROFILE', 'MANAGE_ACADEMICS', 'MANAGE_HEALTH_RECORDS', 'MANAGE_DISCIPLINE'] },
    { name: 'Driver', permissions: ['VIEW_OWN_PROFILE', 'MANAGE_TRANSPORT', 'VIEW_TRANSPORT', 'read'] },
    { name: 'Admin Staff', permissions: ['VIEW_OWN_PROFILE', 'MANAGE_USERS', 'MANAGE_ACADEMICS', 'MANAGE_HEALTH_RECORDS', 'MANAGE_ADMISSIONS_PIPELINE'] },
    { name: 'Parent', permissions: ['VIEW_OWN_PROFILE', 'VIEW_CHILD_PROFILE', 'VIEW_CHILD_GRADES', 'VIEW_LMS_CONTENT', 'read', 'PAY_FEES'] },
    { name: 'Student', permissions: ['VIEW_OWN_PROFILE', 'VIEW_OWN_GRADES', 'VIEW_LMS_CONTENT', 'read'] },
  ];
  const roles: Record<string, { id: string }> = {};
  for (const r of roleDefs) {
    roles[r.name] = await prisma.role.create({ data: { name: r.name, permissions: r.permissions, schoolProfileId: schoolProfile.id } });
  }

  const superAdmin = await prisma.staff.create({
    data: {
      fullName: 'System Admin',
      email: 'admin@centralacademy.edu',
      passwordHash: adminHash,
      roleId: roles['Super Admin'].id,
      status: 'Active',
    },
  });
  const principal = await prisma.staff.create({
    data: {
      fullName: 'Dr. Meera Krishnan',
      email: 'principal@centralacademy.edu',
      passwordHash: sharedHash,
      roleId: roles['Principal'].id,
      status: 'Active',
      gender: 'Female',
    },
  });

  // ---------- Phase 2: Classes, Sections, Subjects, Fee Structures ----------
  console.log('\nPhase 2: Classes, sections, subjects, fee structures');
  const subjects: Record<string, { id: string }> = {};
  for (const name of ALL_SUBJECTS) {
    subjects[name] = await prisma.subject.create({ data: { name, medium: 'English' } });
  }

  type ClassInfo = { id: string; grade: string; cluster: Cluster; sections: { id: string; name: string }[] };
  const classes: ClassInfo[] = [];
  const classSubjectRows: { classId: string; subjectId: string }[] = [];
  const feeStructureByClass: Record<string, { id: string }> = {};

  for (let gi = 0; gi < GRADES.length; gi++) {
    const grade = GRADES[gi];
    const cluster = clusterOf(grade);
    const cls = await prisma.class.create({
      data: {
        grade,
        campusId: campus.id,
        sessionId: session.id,
        sections: { create: SECTION_NAMES.map((n) => ({ name: n })) },
      },
      include: { sections: true },
    });
    classes.push({ id: cls.id, grade, cluster, sections: cls.sections.map((s) => ({ id: s.id, name: s.name })) });

    for (const subjName of SUBJECTS_BY_CLUSTER[cluster]) {
      classSubjectRows.push({ classId: cls.id, subjectId: subjects[subjName].id });
    }

    feeStructureByClass[cls.id] = await prisma.feeStructure.create({
      data: {
        name: `${grade} Annual Tuition`,
        amount: 12000 + gi * 1200,
        cycle: 'Annual',
        sessionId: session.id,
        classId: cls.id,
      },
    });
  }
  await batchInsert('class_subjects', prisma.classSubject, classSubjectRows);

  // ---------- Phase 3: Staff (teachers + support staff) ----------
  console.log('\nPhase 3: Staff');
  const subjectTeacherPool: Record<string, string[]> = {}; // subjectName -> staffIds
  const staffRows: any[] = [];
  const payrollRows: any[] = [];
  const leaveBalanceRows: any[] = [];

  function pushStaff(fullName: string, email: string, roleId: string, gender: string, basicSalary: number) {
    const id = randomUUID();
    staffRows.push({ id, fullName, email, passwordHash: sharedHash, roleId, status: 'Active', gender, education: "Bachelor's Degree", experience: `${faker.number.int({ min: 1, max: 20 })} years` });
    payrollRows.push({ staffId: id, basicSalary, allowances: Math.round(basicSalary * 0.15), deductions: Math.round(basicSalary * 0.05) });
    leaveBalanceRows.push({ staffId: id, leaveType: 'Casual', totalAllowed: 12, year: 2026 });
    leaveBalanceRows.push({ staffId: id, leaveType: 'Sick', totalAllowed: 10, year: 2026 });
    return id;
  }

  for (const subjName of ALL_SUBJECTS) {
    const sectionsNeeding = classes.filter((c) => SUBJECTS_BY_CLUSTER[c.cluster].includes(subjName)).flatMap((c) => c.sections);
    const poolSize = Math.max(2, Math.ceil(sectionsNeeding.length / 3));
    const ids: string[] = [];
    for (let i = 0; i < poolSize; i++) {
      const gender = faker.person.sex() as 'male' | 'female';
      const firstName = faker.person.firstName(gender);
      const lastName = faker.person.lastName();
      const email = faker.internet.email({ firstName, lastName, provider: 'centralacademy.edu' }).toLowerCase();
      ids.push(pushStaff(`${firstName} ${lastName}`, email, roles['Teacher'].id, gender === 'male' ? 'Male' : 'Female', faker.number.int({ min: 45000, max: 85000 })));
    }
    subjectTeacherPool[subjName] = ids;
  }

  const nonTeachingCounts: [string, number, [number, number]][] = [
    ['Vice Principal', 1, [70000, 90000]],
    ['Accountant', 2, [35000, 50000]],
    ['Librarian', 1, [30000, 40000]],
    ['Warden', 2, [30000, 42000]],
    ['Admin Staff', 3, [25000, 35000]],
  ];
  const nonTeachingIds: Record<string, string[]> = {};
  for (const [roleName, count, [min, max]] of nonTeachingCounts) {
    nonTeachingIds[roleName] = [];
    for (let i = 0; i < count; i++) {
      const gender = faker.person.sex() as 'male' | 'female';
      const firstName = faker.person.firstName(gender);
      const lastName = faker.person.lastName();
      const email = faker.internet.email({ firstName, lastName, provider: 'centralacademy.edu' }).toLowerCase();
      nonTeachingIds[roleName].push(pushStaff(`${firstName} ${lastName}`, email, roles[roleName].id, gender === 'male' ? 'Male' : 'Female', faker.number.int({ min, max })));
    }
  }

  const VEHICLE_COUNT = 10;
  const driverIds: string[] = [];
  for (let i = 0; i < VEHICLE_COUNT; i++) {
    const gender = faker.person.sex() as 'male' | 'female';
    const firstName = faker.person.firstName(gender);
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName, provider: 'centralacademy.edu' }).toLowerCase();
    driverIds.push(pushStaff(`${firstName} ${lastName}`, email, roles['Driver'].id, gender === 'male' ? 'Male' : 'Female', faker.number.int({ min: 22000, max: 32000 })));
  }

  await batchInsert('staff', prisma.staff, staffRows);
  await batchInsert('payroll_structures', prisma.payrollStructure, payrollRows);
  await batchInsert('leave_balances', prisma.leaveBalance, leaveBalanceRows);

  // PerformanceReview + LeaveApplication + Payslip for teachers
  const allTeacherIds = Object.values(subjectTeacherPool).flat();
  const reviewRows = allTeacherIds.map((staffId) => ({
    staffId,
    reviewerId: principal.id,
    cycle: '2026 Q2',
    rating: faker.number.int({ min: 3, max: 5 }),
    comments: faker.helpers.arrayElement(['Strong classroom engagement.', 'Consistently meets curriculum targets.', 'Excellent student feedback.', 'Room for improvement in punctuality.', 'Outstanding mentor to junior staff.']),
  }));
  await batchInsert('performance_reviews', prisma.performanceReview, reviewRows);

  const leaveAppRows: any[] = [];
  for (const staffId of allTeacherIds) {
    const numLeaves = faker.number.int({ min: 0, max: 3 });
    for (let i = 0; i < numLeaves; i++) {
      const start = faker.date.between({ from: SESSION_START, to: SESSION_END });
      const end = new Date(start);
      end.setDate(end.getDate() + faker.number.int({ min: 1, max: 4 }));
      const status = faker.helpers.arrayElement(['Approved', 'Approved', 'Approved', 'Pending', 'Rejected']);
      leaveAppRows.push({
        staffId,
        leaveType: faker.helpers.arrayElement(['Casual', 'Sick']),
        startDate: start,
        endDate: end,
        reason: faker.helpers.arrayElement(['Family function', 'Feeling unwell', 'Personal work', 'Medical appointment']),
        status,
        resolvedAt: status === 'Pending' ? null : end,
        resolvedById: status === 'Pending' ? null : principal.id,
      });
    }
  }
  await batchInsert('leave_applications', prisma.leaveApplication, leaveAppRows);

  const allStaffIds = [superAdmin.id, principal.id, ...staffRows.map((s) => s.id)];
  const payslipRows: any[] = [];
  const now = new Date('2026-08-02');
  for (const s of [...staffRows]) {
    for (let m = 0; m < 6; m++) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - m);
      const basic = payrollRows.find((p) => p.staffId === s.id)!.basicSalary;
      const allowances = Math.round(basic * 0.15);
      const deductions = Math.round(basic * 0.05);
      payslipRows.push({
        staffId: s.id,
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        basicSalary: basic,
        allowances,
        fixedDeductions: deductions,
        lopDeductions: 0,
        netSalary: basic + allowances - deductions,
        status: m === 0 ? 'Generated' : 'Paid',
      });
    }
  }
  await batchInsert('payslips', prisma.payslip, payslipRows);

  // ---------- Phase 4: Teacher assignments ----------
  console.log('\nPhase 4: Teacher assignments');
  const poolCursor: Record<string, number> = {};
  const assignmentBySectionSubject: Record<string, { id: string; staffId: string }> = {};
  const assignmentRows: any[] = [];
  const classTeacherPicked = new Set<string>();

  for (const cls of classes) {
    for (const section of cls.sections) {
      const subjectList = SUBJECTS_BY_CLUSTER[cls.cluster];
      for (let si = 0; si < subjectList.length; si++) {
        const subjName = subjectList[si];
        const pool = subjectTeacherPool[subjName];
        const idx = (poolCursor[subjName] = (poolCursor[subjName] ?? -1) + 1) % pool.length;
        const staffId = pool[idx];
        const id = randomUUID();
        const isClassTeacher = si === 0 && !classTeacherPicked.has(section.id);
        if (isClassTeacher) classTeacherPicked.add(section.id);
        assignmentRows.push({
          id,
          staffId,
          sessionId: session.id,
          subjectId: subjects[subjName].id,
          sectionId: section.id,
          isClassTeacher,
          hoursPerWeek: faker.number.int({ min: 4, max: 8 }),
        });
        assignmentBySectionSubject[`${section.id}_${subjName}`] = { id, staffId };
      }
    }
  }
  await batchInsert('teacher_assignments', prisma.teacherAssignment, assignmentRows);

  // ---------- Phase 5: Timetable ----------
  console.log('\nPhase 5: Timetable');
  const timetable = await prisma.timetable.create({ data: { name: `${SESSION_NAME} Master Timetable`, sessionId: session.id, status: 'Active' } });

  const PERIOD_TIMES = [
    ['09:00', '09:40'], ['09:40', '10:20'], ['10:20', '11:00'],
    ['11:15', '11:55'], ['11:55', '12:35'], ['13:20', '14:00'], ['14:00', '14:40'],
  ];
  await batchInsert(
    'timetable_slots',
    prisma.timetableSlot,
    PERIOD_TIMES.map(([start, end], i) => ({ name: `Period ${i + 1}`, startTime: start, endTime: end, sessionId: session.id }))
  );

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const teacherBusy = new Set<string>(); // `${staffId}_${day}_${start}`
  const timetableRows: any[] = [];
  const ROOMS = ['Room 101', 'Room 102', 'Room 103', 'Room 104', 'Lab A', 'Lab B', 'Hall', 'Room 201', 'Room 202'];

  for (const cls of classes) {
    for (const section of cls.sections) {
      const subjectList = SUBJECTS_BY_CLUSTER[cls.cluster];
      let cursor = 0;
      for (const day of DAYS) {
        for (const [start, end] of PERIOD_TIMES) {
          let placed = false;
          for (let attempt = 0; attempt < subjectList.length; attempt++) {
            const subjName = subjectList[(cursor + attempt) % subjectList.length];
            const assignment = assignmentBySectionSubject[`${section.id}_${subjName}`];
            const busyKey = `${assignment.staffId}_${day}_${start}`;
            if (!teacherBusy.has(busyKey)) {
              teacherBusy.add(busyKey);
              timetableRows.push({
                timetableId: timetable.id,
                sectionId: section.id,
                subjectId: subjects[subjName].id,
                assignmentId: assignment.id,
                dayOfWeek: day,
                startTime: start,
                endTime: end,
                room: faker.helpers.arrayElement(ROOMS),
              });
              cursor++;
              placed = true;
              break;
            }
          }
          if (!placed) continue; // leave this slot free for this section
        }
      }
    }
  }
  await batchInsert('timetable_periods', prisma.timetablePeriod, timetableRows);

  // ---------- Phase 6: Students, enrollments, parents, portal accounts ----------
  console.log('\nPhase 6: Students, enrollments, parents, portal accounts');
  const studentRows: any[] = [];
  const enrollmentRows: any[] = [];
  const enrollmentMeta: { enrollmentId: string; studentId: string; classId: string; cluster: Cluster; grade: string; sectionId: string }[] = [];
  let admissionCounter = 1;

  for (const cls of classes) {
    const age = AGE_BY_GRADE[cls.grade];
    for (const section of cls.sections) {
      for (let i = 1; i <= STUDENTS_PER_SECTION; i++) {
        const gender = faker.person.sex() as 'male' | 'female';
        const firstName = faker.person.firstName(gender);
        const lastName = faker.person.lastName();
        const studentId = randomUUID();
        const enrollmentId = randomUUID();
        const dob = new Date(2026 - age, faker.number.int({ min: 0, max: 11 }), faker.number.int({ min: 1, max: 28 }));
        const admissionNumber = `ADM2026${String(admissionCounter).padStart(4, '0')}`;
        admissionCounter++;

        studentRows.push({
          id: studentId,
          admissionNumber,
          fullName: `${firstName} ${lastName}`,
          gender: gender === 'male' ? 'Male' : 'Female',
          guardianName: `${faker.person.firstName()} ${lastName}`,
          phone: faker.phone.number({ style: 'national' }),
          status: 'Active',
          documentsVerified: true,
          dateOfBirth: dob,
        });
        enrollmentRows.push({
          id: enrollmentId,
          studentId,
          sessionId: session.id,
          sectionId: section.id,
          rollNumber: `${cls.grade.replace('Grade ', 'G')}${section.name}-${String(i).padStart(2, '0')}`,
          status: 'Enrolled',
          campusId: campus.id,
        });
        enrollmentMeta.push({ enrollmentId, studentId, classId: cls.id, cluster: cls.cluster, grade: cls.grade, sectionId: section.id });
      }
    }
  }
  await batchInsert('students', prisma.student, studentRows);
  await batchInsert('student_enrollments', prisma.studentEnrollment, enrollmentRows);

  // Parents: pair up students two-at-a-time within the same section as "siblings" for realism.
  const parentRows: any[] = [];
  const parentStudentRows: any[] = [];
  const portalAccountRows: any[] = [];
  let parentCounter = 1;
  for (const batch of chunkArray(studentRows, 2)) {
    const parentId = randomUUID();
    const lastName = batch[0].fullName.split(' ').pop();
    const parentFirstName = faker.person.firstName();
    const parentEmail = `parent${parentCounter}@demo.school`;
    parentCounter++;
    parentRows.push({
      id: parentId,
      name: `${parentFirstName} ${lastName}`,
      email: parentEmail,
      phone: faker.phone.number({ style: 'national' }),
      passwordHash: parentHash,
    });
    for (const s of batch) {
      parentStudentRows.push({ parentId, studentId: s.id, relationship: faker.helpers.arrayElement(['Father', 'Mother', 'Guardian']) });
    }
    portalAccountRows.push({ username: parentEmail, passwordHash: parentHash, userType: 'PARENT', referenceId: parentId });
  }
  await batchInsert('parents', prisma.parent, parentRows);
  await batchInsert('parent_students', prisma.parentStudent, parentStudentRows);
  await batchInsert('portal_accounts', prisma.portalAccount, portalAccountRows);

  // ---------- Phase 7: ID Cards ----------
  console.log('\nPhase 7: ID Cards');
  const studentTemplate = await prisma.idCardTemplate.create({
    data: { templateName: 'Student ID 2026-27', targetRole: 'Student', schoolName: 'Central Academy', primaryColor: '#c89f3c', secondaryColor: '#2a382e' },
  });
  const staffTemplate = await prisma.idCardTemplate.create({
    data: { templateName: 'Staff ID 2026-27', targetRole: 'Staff', schoolName: 'Central Academy', primaryColor: '#2a382e', secondaryColor: '#c89f3c' },
  });
  await batchInsert(
    'id_cards (students)',
    prisma.idCard,
    studentRows.map((s) => ({ idNumber: `IDS-${s.admissionNumber}`, templateId: studentTemplate.id, studentId: s.id, barcodeData: s.admissionNumber, expiryDate: SESSION_END }))
  );
  await batchInsert(
    'id_cards (staff)',
    prisma.idCard,
    allStaffIds.map((id, i) => ({ idNumber: `IDF-${String(i + 1).padStart(4, '0')}`, templateId: staffTemplate.id, staffId: id, barcodeData: `STF${i + 1}`, expiryDate: SESSION_END }))
  );

  // ---------- Phase 8: Attendance (full year) ----------
  console.log('\nPhase 8: Attendance (this is the big one)');
  const studentAttendanceRows: any[] = [];
  for (const meta of enrollmentMeta) {
    for (const date of schoolDays) {
      const status = weightedPick([
        { value: 'Present', weight: 92 },
        { value: 'Absent', weight: 5 },
        { value: 'Late', weight: 3 },
      ]);
      studentAttendanceRows.push({ enrollmentId: meta.enrollmentId, date, status, faceVerified: status !== 'Absent', campusId: campus.id, sessionId: session.id });
    }
  }
  await batchInsert('attendance_records (students)', prisma.attendanceRecord, studentAttendanceRows, 8000);

  const staffAttendanceRows: any[] = [];
  for (const staffId of allStaffIds) {
    for (const date of schoolDays) {
      const status = weightedPick([
        { value: 'Present', weight: 94 },
        { value: 'Leave', weight: 3 },
        { value: 'Absent', weight: 2 },
        { value: 'Late', weight: 1 },
      ]);
      staffAttendanceRows.push({ staffId, date, status, campusId: campus.id, sessionId: session.id });
    }
  }
  await batchInsert('attendance_records (staff)', prisma.attendanceRecord, staffAttendanceRows, 8000);

  // ---------- Phase 9: Transport ----------
  console.log('\nPhase 9: Transport');
  const vehicleRows = Array.from({ length: VEHICLE_COUNT }).map((_, i) => ({
    id: randomUUID(),
    vehicleNumber: `KA-05-AB-${1000 + i}`,
    busName: `Bus ${i + 1}`,
    vehicleType: 'School Bus',
    manufacturer: faker.helpers.arrayElement(['Tata', 'Ashok Leyland', 'Force Motors']),
    seatingCapacity: 45,
    fuelType: 'Diesel',
    gpsDevice: true,
    status: 'Active',
  }));
  await batchInsert('transport_vehicles', prisma.transportVehicle, vehicleRows);

  await batchInsert(
    'transport_vehicle_staff',
    prisma.transportVehicleStaff,
    vehicleRows.map((v, i) => ({ vehicleId: v.id, staffId: driverIds[i], shift: 'Full Day', status: 'Assigned' }))
  );

  const routeRows = vehicleRows.map((v, i) => ({
    id: randomUUID(),
    routeName: `Route ${i + 1} - ${faker.location.street()}`,
    distance: faker.number.float({ min: 8, max: 22, fractionDigits: 1 }),
    estimatedTime: `${faker.number.int({ min: 35, max: 70 })} Minutes`,
    morningStartTime: '07:00',
    afternoonStartTime: '15:00',
    vehicleId: v.id,
  }));
  await batchInsert('transport_routes', prisma.transportRoute, routeRows);

  const stopsByRoute: Record<string, { id: string; name: string }[]> = {};
  const stopRows: any[] = [];
  for (const route of routeRows) {
    const stopCount = faker.number.int({ min: 5, max: 8 });
    const stops: { id: string; name: string }[] = [];
    for (let i = 0; i < stopCount; i++) {
      const id = randomUUID();
      const name = `${faker.location.street()} Stop`;
      stops.push({ id, name });
      stopRows.push({
        id,
        routeId: route.id,
        stopName: name,
        latitude: 12.9716 + faker.number.float({ min: -0.08, max: 0.08, fractionDigits: 4 }),
        longitude: 77.5946 + faker.number.float({ min: -0.08, max: 0.08, fractionDigits: 4 }),
        arrivalTime: `07:${String(10 + i * 5).padStart(2, '0')}`,
        orderIndex: i,
      });
    }
    stopsByRoute[route.id] = stops;
  }
  await batchInsert('transport_route_stops', prisma.transportRouteStop, stopRows);

  // Assign ~60% of students to transport
  const transportEligible = faker.helpers.arrayElements(enrollmentMeta, Math.round(enrollmentMeta.length * 0.6));
  const assignmentRoutes = routeRows.map((r) => r.id);
  const studentTransport: { enrollmentId: string; routeId: string; stopId: string }[] = [];
  const transportAssignmentRows: any[] = [];
  for (const meta of transportEligible) {
    const routeId = faker.helpers.arrayElement(assignmentRoutes);
    const stop = faker.helpers.arrayElement(stopsByRoute[routeId]);
    studentTransport.push({ enrollmentId: meta.enrollmentId, routeId, stopId: stop.id });
    transportAssignmentRows.push({ enrollmentId: meta.enrollmentId, routeId, stopId: stop.id, morningPickup: true, afternoonDrop: true, feePeriod: 'Annual', status: 'Active' });
  }
  await batchInsert('transport_student_assignments', prisma.transportStudentAssignment, transportAssignmentRows);

  const studentsByRoute: Record<string, string[]> = {};
  for (const st of studentTransport) {
    (studentsByRoute[st.routeId] ??= []).push(st.enrollmentId);
  }

  console.log('  Generating trips, trip logs, and boarding attendance for the full year...');
  const tripRows: any[] = [];
  const tripLogRows: any[] = [];
  const transportAttendanceRows: any[] = [];
  for (const route of routeRows) {
    const driverId = vehicleRows.find((v) => v.id === route.vehicleId)!.id === route.vehicleId
      ? driverIds[vehicleRows.findIndex((v) => v.id === route.vehicleId)]
      : driverIds[0];
    const roster = studentsByRoute[route.id] || [];
    const stops = stopsByRoute[route.id];
    for (const date of schoolDays) {
      for (const tripType of ['Morning', 'Afternoon']) {
        const tripId = randomUUID();
        tripRows.push({ id: tripId, vehicleId: route.vehicleId, routeId: route.id, tripType, driverId, date, status: 'Completed' });
        for (const stop of stops) {
          tripLogRows.push({ tripId, stopId: stop.id, latitude: null, longitude: null, status: 'Reached Stop' });
        }
        for (const enrollmentId of roster) {
          const boarded = Math.random() > 0.04;
          transportAttendanceRows.push({
            tripId,
            enrollmentId,
            status: boarded ? (tripType === 'Morning' ? 'Boarded' : 'Dropped') : 'Absent',
            markedBy: 'Manual',
          });
        }
      }
    }
  }
  await batchInsert('transport_trips', prisma.transportTrip, tripRows, 5000);
  await batchInsert('transport_trip_logs', prisma.transportTripLog, tripLogRows, 8000);
  await batchInsert('transport_attendance', prisma.transportAttendance, transportAttendanceRows, 8000);

  // ---------- Phase 10: Fees ----------
  console.log('\nPhase 10: Fees');
  const invoiceRows: any[] = [];
  const invoiceIdByTerm: { id: string; enrollmentId: string; amount: number; status: string }[] = [];
  for (const meta of enrollmentMeta) {
    const structure = feeStructureByClass[meta.classId];
    const halfAmount = 12000 / 2 + GRADES.indexOf(meta.grade) * 600;
    for (const term of [1, 2]) {
      const id = randomUUID();
      const status = weightedPick([
        { value: 'Paid', weight: 70 },
        { value: 'Unpaid', weight: 20 },
        { value: 'Overdue', weight: 10 },
      ]);
      invoiceRows.push({
        id,
        enrollmentId: meta.enrollmentId,
        structureId: structure.id,
        amount: halfAmount,
        totalAmount: halfAmount,
        dueDate: term === 1 ? '2026-06-30' : '2026-12-31',
        status,
        campusId: campus.id,
      });
      invoiceIdByTerm.push({ id, enrollmentId: meta.enrollmentId, amount: halfAmount, status });
    }
  }
  await batchInsert('fee_invoices', prisma.feeInvoice, invoiceRows, 5000);

  const paymentRows = invoiceIdByTerm
    .filter((inv) => inv.status === 'Paid')
    .map((inv) => ({
      invoiceId: inv.id,
      amountPaid: inv.amount,
      paymentMode: faker.helpers.arrayElement(['Cash', 'UPI', 'NetBanking', 'Cheque']),
      paymentDate: '2026-06-15',
    }));
  await batchInsert('fee_payments', prisma.feePayment, paymentRows, 5000);

  // ---------- Phase 11: Exams & Report Cards ----------
  console.log('\nPhase 11: Exams and report cards');
  const examDefs = [
    { name: 'Mid-Term Examination 2026', term: 'Term 1', date: '2026-09-15' },
    { name: 'Final Examination 2027', term: 'Term 2', date: '2027-02-15' },
  ];
  const examRecords: { id: string; name: string }[] = [];
  for (const ex of examDefs) {
    const created = await prisma.exam.create({ data: { name: ex.name, term: ex.term, sessionId: session.id, status: 'Completed' } });
    examRecords.push({ id: created.id, name: created.name });
  }

  const examSlotRows: any[] = [];
  const slotIdByClassSubjectExam: Record<string, string> = {};
  for (let ei = 0; ei < examDefs.length; ei++) {
    const exam = examRecords[ei];
    for (const cls of classes) {
      let dayOffset = 0;
      for (const subjName of SUBJECTS_BY_CLUSTER[cls.cluster]) {
        const slotId = randomUUID();
        const date = new Date(examDefs[ei].date);
        date.setDate(date.getDate() + dayOffset);
        dayOffset++;
        examSlotRows.push({
          id: slotId,
          examId: exam.id,
          classId: cls.id,
          subjectId: subjects[subjName].id,
          date: fmt(date),
          startTime: '09:00',
          endTime: '11:00',
          room: 'Main Hall',
        });
        slotIdByClassSubjectExam[`${exam.id}_${cls.id}_${subjName}`] = slotId;
      }
    }
  }
  await batchInsert('exam_slots', prisma.examSlot, examSlotRows, 3000);

  console.log('  Generating marks and report cards...');
  const marksRows: any[] = [];
  const reportCardRows: any[] = [];
  const attendanceByEnrollment: Record<string, { present: number; total: number }> = {};
  for (const row of studentAttendanceRows) {
    const bucket = (attendanceByEnrollment[row.enrollmentId] ??= { present: 0, total: 0 });
    bucket.total++;
    if (row.status === 'Present' || row.status === 'Late') bucket.present++;
  }

  for (const exam of examRecords) {
    for (const meta of enrollmentMeta) {
      const subjectList = SUBJECTS_BY_CLUSTER[meta.cluster];
      let sum = 0;
      let count = 0;
      const subjectMarks: { subject: string; marksObtained: number | null; isAbsent: boolean }[] = [];
      for (const subjName of subjectList) {
        const slotId = slotIdByClassSubjectExam[`${exam.id}_${meta.classId}_${subjName}`];
        const isAbsent = Math.random() < 0.04;
        const marksObtained = isAbsent ? null : faker.number.int({ min: 38, max: 98 });
        marksRows.push({ examSlotId: slotId, enrollmentId: meta.enrollmentId, marksObtained, isAbsent });
        subjectMarks.push({ subject: subjName, marksObtained, isAbsent });
        if (!isAbsent && marksObtained != null) {
          sum += marksObtained;
          count++;
        }
      }
      const percentage = count > 0 ? sum / count : 0;
      const gpa = (percentage / 100) * 10;
      const attendance = attendanceByEnrollment[meta.enrollmentId];
      const attendanceRate = attendance && attendance.total > 0 ? ((attendance.present / attendance.total) * 100).toFixed(1) : '0.0';

      reportCardRows.push({
        enrollmentId: meta.enrollmentId,
        examId: exam.id,
        attendanceRate: `${attendanceRate}%`,
        gpa: gpa.toFixed(2),
        computedData: { subjects: subjectMarks, percentage: percentage.toFixed(2) },
        remarks: percentage >= 75 ? 'Excellent performance this term.' : percentage >= 50 ? 'Good effort, keep it up.' : 'Needs improvement, please schedule a parent meeting.',
        isApproved: true,
      });
    }
  }
  await batchInsert('exam_marks', prisma.examMarks, marksRows, 8000);
  await batchInsert('report_cards', prisma.reportCard, reportCardRows, 5000);

  // ---------- Phase 12: Library ----------
  console.log('\nPhase 12: Library');
  const BOOK_TITLES = [
    'Wings of Fire', 'A Brief History of Time', 'The Alchemist', 'To Kill a Mockingbird', 'Pride and Prejudice',
    'The Diary of a Young Girl', 'Charlotte\'s Web', 'The Jungle Book', 'Panchatantra Tales', 'Malgudi Days',
    'The Discovery of India', 'Sapiens', 'The Hobbit', 'Harry Potter and the Sorcerer\'s Stone', 'Matilda',
    'The Little Prince', 'Physics for Scholars', 'Fundamentals of Chemistry', 'Advanced Mathematics', 'World Atlas',
    'Introduction to Biology', 'Great Expectations', 'The Adventures of Tom Sawyer', 'Gulliver\'s Travels', 'Treasure Island',
    'Animal Farm', '1984', 'The Wonderful Wizard of Oz', 'Around the World in Eighty Days', 'Twenty Thousand Leagues Under the Sea',
    'The Secret Garden', 'Anne of Green Gables', 'Black Beauty', 'The Adventures of Sherlock Holmes', 'Robinson Crusoe',
    'A Tale of Two Cities', 'The Count of Monte Cristo', 'Don Quixote', 'War and Peace', 'Crime and Punishment',
  ];
  const bookRows = BOOK_TITLES.map((title) => ({
    title,
    author: faker.person.fullName(),
    isbn: faker.commerce.isbn ? faker.commerce.isbn() : faker.string.numeric(13),
    category: faker.helpers.arrayElement(['Fiction', 'Non-Fiction', 'Science', 'Reference', 'Biography', 'Textbook']),
    totalCopies: faker.number.int({ min: 2, max: 8 }),
    available: faker.number.int({ min: 0, max: 8 }),
  }));
  await batchInsert('library_books', prisma.libraryBook, bookRows);
  const createdBooks = await prisma.libraryBook.findMany({ select: { id: true } });

  const bookIssueRows: any[] = [];
  const libraryEligible = faker.helpers.arrayElements(enrollmentMeta, 500);
  for (const meta of libraryEligible) {
    const issueDate = faker.date.between({ from: SESSION_START, to: SESSION_END });
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 14);
    const status = faker.helpers.arrayElement(['Returned', 'Returned', 'Returned', 'Issued', 'Lost']);
    bookIssueRows.push({
      id: randomUUID(),
      bookId: faker.helpers.arrayElement(createdBooks).id,
      enrollmentId: meta.enrollmentId,
      issueDate,
      dueDate,
      returnDate: status === 'Returned' ? new Date(dueDate.getTime() + faker.number.int({ min: -3, max: 10 }) * 86400000) : null,
      status,
    });
  }
  await batchInsert('book_issues', prisma.bookIssue, bookIssueRows, 3000);
  const overdueIssues = bookIssueRows.filter((b) => b.status !== 'Returned' && b.dueDate < new Date());
  await batchInsert(
    'library_fines',
    prisma.libraryFine,
    overdueIssues.map((b) => ({ issueId: b.id, amount: faker.number.int({ min: 10, max: 100 }), status: faker.helpers.arrayElement(['Unpaid', 'Paid']) }))
  );

  // ---------- Phase 13: Hostel ----------
  console.log('\nPhase 13: Hostel');
  const boysHostel = await prisma.hostel.create({ data: { name: 'Aravali Boys Hostel', type: 'BOYS', warden: nonTeachingIds['Warden'][0] } });
  const girlsHostel = await prisma.hostel.create({ data: { name: 'Nilgiri Girls Hostel', type: 'GIRLS', warden: nonTeachingIds['Warden'][1] } });

  const hostelRoomRows: any[] = [];
  for (const hostel of [boysHostel, girlsHostel]) {
    for (let i = 1; i <= 10; i++) {
      hostelRoomRows.push({ id: randomUUID(), hostelId: hostel.id, roomNumber: `${hostel.type === 'BOYS' ? 'B' : 'G'}-${String(i).padStart(2, '0')}`, capacity: 4 });
    }
  }
  await batchInsert('hostel_rooms', prisma.hostelRoom, hostelRoomRows);
  const createdRooms = await prisma.hostelRoom.findMany({ include: { hostel: true } });

  const boardingEligible = enrollmentMeta.filter((m) => ['MIDDLE', 'SECONDARY', 'SENIOR'].includes(m.cluster));
  const boarders = faker.helpers.arrayElements(boardingEligible, Math.min(160, boardingEligible.length));
  const studentGenderById: Record<string, string> = Object.fromEntries(studentRows.map((s) => [s.id, s.gender]));

  const roomOccupancy: Record<string, number> = {};
  const hostelAllocationRows: any[] = [];
  const boarderEnrollments: string[] = [];
  for (const meta of boarders) {
    const gender = studentGenderById[meta.studentId];
    const eligibleRooms = createdRooms.filter((r) => (gender === 'Male' ? r.hostel.type === 'BOYS' : r.hostel.type === 'GIRLS'));
    const room = eligibleRooms.find((r) => (roomOccupancy[r.id] ?? 0) < r.capacity);
    if (!room) continue;
    roomOccupancy[room.id] = (roomOccupancy[room.id] ?? 0) + 1;
    hostelAllocationRows.push({ roomId: room.id, enrollmentId: meta.enrollmentId, status: 'Active' });
    boarderEnrollments.push(meta.enrollmentId);
  }
  await batchInsert('hostel_allocations', prisma.hostelAllocation, hostelAllocationRows);

  const hostelAttendanceRows: any[] = [];
  for (const enrollmentId of boarderEnrollments) {
    for (const date of schoolDays) {
      hostelAttendanceRows.push({ enrollmentId, date, status: weightedPick([{ value: 'Present', weight: 95 }, { value: 'Leave', weight: 4 }, { value: 'Absent', weight: 1 }]) });
    }
  }
  await batchInsert('hostel_attendance', prisma.hostelAttendance, hostelAttendanceRows, 8000);

  // ---------- Phase 14: LMS ----------
  console.log('\nPhase 14: LMS');
  const lmsCourseRows: any[] = [];
  for (const cls of classes) {
    for (const subjName of SUBJECTS_BY_CLUSTER[cls.cluster]) {
      lmsCourseRows.push({ id: randomUUID(), title: `${subjName} - ${cls.grade}`, description: `Curriculum resources for ${subjName} in ${cls.grade}.`, subjectId: subjects[subjName].id, classId: cls.id, status: 'Published' });
    }
  }
  await batchInsert('lms_courses', prisma.lMSCourse, lmsCourseRows);

  const resourceRows: any[] = [];
  const RESOURCE_TYPES = ['PDF', 'VIDEO', 'LINK'];
  for (const course of lmsCourseRows) {
    const count = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < count; i++) {
      resourceRows.push({
        subjectId: course.subjectId,
        title: `${course.title} - Chapter ${i + 1} Notes`,
        type: faker.helpers.arrayElement(RESOURCE_TYPES),
        url: 'https://example.com/resource.pdf',
      });
    }
  }
  await batchInsert('course_content', prisma.courseContent, resourceRows, 3000);

  // ---------- Phase 15: Announcements ----------
  console.log('\nPhase 15: Announcements');
  const announcementRows = [
    { title: 'Welcome Back to the New Academic Year', body: 'We are excited to welcome all students and staff back for the 2026-2027 session.', targetAudience: 'ALL' },
    { title: 'PTA Meeting - Term 1', body: 'Parent-Teacher meetings for Term 1 will be held on the last Saturday of June.', targetAudience: 'PARENTS' },
    { title: 'Annual Sports Day', body: 'Annual Sports Day will be celebrated with inter-house competitions.', targetAudience: 'ALL' },
    { title: 'Diwali Break Notice', body: 'School will remain closed from Oct 20 to Oct 24 for Diwali celebrations.', targetAudience: 'ALL' },
    { title: 'Staff Meeting - Curriculum Review', body: 'All teaching staff are requested to attend the curriculum review meeting.', targetAudience: 'STAFF' },
    { title: 'Mid-Term Examination Schedule Released', body: 'The Mid-Term Examination schedule has been published. Please check the timetable module.', targetAudience: 'STUDENTS' },
    { title: 'Winter Break Notice', body: 'School will remain closed from Dec 26 to Jan 3 for winter break.', targetAudience: 'ALL' },
    { title: 'Fee Payment Reminder - Term 2', body: 'Term 2 fee payment is due by December 31. Please clear dues to avoid late fees.', targetAudience: 'PARENTS' },
    { title: 'Library Week Celebrations', body: 'Library week will be celebrated with reading competitions and book fairs.', targetAudience: 'STUDENTS' },
    { title: 'Republic Day Celebration', body: 'Republic Day will be celebrated with a flag hoisting ceremony at 8 AM.', targetAudience: 'ALL' },
    { title: 'Final Examination Schedule Released', body: 'The Final Examination schedule has been published.', targetAudience: 'STUDENTS' },
    { title: 'New Transport Routes Added', body: 'Two new transport routes have been added to cover additional residential areas.', targetAudience: 'PARENTS' },
    { title: 'Staff Performance Review Cycle', body: 'The Q2 performance review cycle has been completed for all teaching staff.', targetAudience: 'STAFF' },
    { title: 'Hostel Inspection Notice', body: 'Routine hostel inspection will be conducted next week.', targetAudience: 'ALL' },
    { title: 'Annual Day Celebrations', body: 'Save the date for our Annual Day celebrations in March.', targetAudience: 'ALL' },
  ];
  await batchInsert('announcements', prisma.announcement, announcementRows.map((a) => ({ ...a, createdBy: principal.id })));

  // ---------- Summary ----------
  console.log('\n================================================');
  console.log('Seeding complete!');
  console.log('================================================');
  console.log(`Students: ${studentRows.length}`);
  console.log(`Staff: ${allStaffIds.length}`);
  console.log(`Parents: ${parentRows.length}`);
  console.log(`School days: ${schoolDays.length}`);
  console.log(`Attendance records: ${studentAttendanceRows.length + staffAttendanceRows.length}`);
  console.log(`Transport trips: ${tripRows.length}, trip logs: ${tripLogRows.length}, boarding records: ${transportAttendanceRows.length}`);
  console.log(`Fee invoices: ${invoiceRows.length}, payments: ${paymentRows.length}`);
  console.log(`Exam marks: ${marksRows.length}, report cards: ${reportCardRows.length}`);
  console.log('\n--- Demo Login Credentials ---');
  console.log('Super Admin  : admin@centralacademy.edu / Admin@123');
  console.log('Principal    : principal@centralacademy.edu / Staff@123');
  console.log(`Sample Teacher: ${staffRows[0].email} / Staff@123`);
  console.log(`Sample Driver : ${staffRows.find((s) => s.roleId === roles['Driver'].id)?.email} / Staff@123`);
  console.log(`Sample Parent : ${parentRows[0].email} / Parent@123 (linked to ${studentRows[0].fullName}${studentRows[1] ? ' & ' + studentRows[1].fullName : ''})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
