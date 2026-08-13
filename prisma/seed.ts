/* eslint-disable */
// Run this file with: npm run seed:demo
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();
faker.seed(20260804);

const SESSION_DEFS = [
  {
    name: '2026-2027',
    start: new Date('2026-04-01'),
    end: new Date('2027-03-15'),
    isActive: true,
  },
  {
    name: '2027-2028',
    start: new Date('2027-04-01'),
    end: new Date('2028-03-15'),
    isActive: false,
  },
] as const;

// Backward-compatible defaults (used by parts of the seed that we refactor gradually).
const SESSION_NAME = SESSION_DEFS[0].name;
const SESSION_START = SESSION_DEFS[0].start;
const SESSION_END = SESSION_DEFS[0].end;
const CLASS_NAMES = ['Nursery', 'LKG', 'UKG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const SECTION_NAMES = ['A', 'B', 'C', 'D'];
const STAFF_PASSWORD = 'Staff@123';
const PARENT_PASSWORD = 'Parent@123';
const ADMIN_PASSWORD = 'Admin@123';
const MAX_STUDENTS_PER_SECTION = 80;
const MIN_STUDENTS_PER_SECTION = 72;
const TRANSPORT_ROUTES = 30;

const CLUSTER_SUBJECTS: Record<string, string[]> = {
  Nursery: ['English', 'Numeracy', 'EVS', 'Art & Craft', 'Music', 'Physical Education'],
  LKG: ['English', 'Numeracy', 'EVS', 'Hindi', 'Art & Craft', 'Music', 'Physical Education'],
  UKG: ['English', 'Mathematics', 'Environmental Studies', 'Hindi', 'Art & Craft', 'Music', 'Physical Education'],
  'Grade 1': ['English', 'Mathematics', 'EVS', 'Hindi', 'Art & Craft', 'Computer Science', 'Physical Education'],
  'Grade 2': ['English', 'Mathematics', 'Science', 'Social Studies', 'Hindi', 'Computer Science', 'Art & Craft', 'Physical Education'],
  'Grade 3': ['English', 'Mathematics', 'Science', 'Social Studies', 'Hindi', 'Computer Science', 'Physical Education'],
  'Grade 4': ['English', 'Mathematics', 'Science', 'Social Studies', 'Hindi', 'Computer Science', 'Physical Education'],
  'Grade 5': ['English', 'Mathematics', 'Science', 'Social Studies', 'Hindi', 'Computer Science', 'Physical Education'],
  'Grade 6': ['English', 'Mathematics', 'Science', 'Social Studies', 'Hindi', 'Computer Science', 'Physical Education'],
  'Grade 7': ['English', 'Mathematics', 'Science', 'Social Studies', 'Hindi', 'Computer Science', 'Physical Education'],
  'Grade 8': ['English', 'Mathematics', 'Science', 'Social Studies', 'Hindi', 'Computer Science', 'Physical Education'],
  'Grade 9': ['English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Hindi', 'Computer Science', 'Physical Education'],
  'Grade 10': ['English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Hindi', 'Computer Science', 'Physical Education'],
  'Grade 11': ['English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Physical Education'],
  'Grade 12': ['English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Physical Education'],
};

const SUBJECTS = Array.from(new Set(Object.values(CLUSTER_SUBJECTS).flat()));
const CITIES = ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangalore', 'Belagavi', 'Tumakuru', 'Davangere'];
const VILLAGES = ['Kumbarakoppal', 'Shettihalli', 'Kaggalipura', 'Chikkaballapura', 'Hassan', 'Mandya', 'Haveri'];
const SCHOOLS = ['Central Academy', 'Central Academy Senior School'];
const OCCUPATIONS = ['Teacher', 'Engineer', 'Bank Manager', 'Business Owner', 'Government Employee', 'Doctor', 'Nurse', 'Accountant', 'Professor', 'Sales Executive'];
const STAFF_ROLES = [
  { name: 'Principal', count: 1, baseSalary: [100000, 125000] },
  { name: 'Vice Principal', count: 1, baseSalary: [85000, 105000] },
  { name: 'Academic Coordinator', count: 1, baseSalary: [70000, 90000] },
  { name: 'Administrative Officer', count: 2, baseSalary: [40000, 55000] },
  { name: 'Receptionist', count: 2, baseSalary: [25000, 32000] },
  { name: 'HR Manager', count: 1, baseSalary: [45000, 60000] },
  { name: 'Accountant', count: 2, baseSalary: [38000, 50000] },
  { name: 'Librarian', count: 2, baseSalary: [32000, 42000] },
  { name: 'Transport Manager', count: 1, baseSalary: [45000, 55000] },
  { name: 'Nurse', count: 1, baseSalary: [30000, 42000] },
  { name: 'Warden', count: 2, baseSalary: [32000, 45000] },
  { name: 'Mess Supervisor', count: 2, baseSalary: [28000, 36000] },
  { name: 'Driver', count: 35, baseSalary: [22000, 32000] },
  { name: 'Conductor', count: 25, baseSalary: [18000, 24000] },
  { name: 'Security Guard', count: 8, baseSalary: [18000, 26000] },
  { name: 'Peon', count: 8, baseSalary: [15000, 21000] },
  { name: 'Cleaner', count: 8, baseSalary: [15000, 20000] },
  { name: 'Lab Assistant', count: 8, baseSalary: [26000, 36000] },
  { name: 'PET Teacher', count: 4, baseSalary: [32000, 45000] },
  { name: 'Music Teacher', count: 3, baseSalary: [32000, 45000] },
  { name: 'Art Teacher', count: 3, baseSalary: [32000, 45000] },
  { name: 'Computer Teacher', count: 6, baseSalary: [35000, 50000] },
];

const STAFF_OFFER = [
  'Excellent curriculum delivery',
  'Consistent academic mentorship',
  'High student engagement',
  'Strong classroom management',
  'Positive parent feedback',
  'Needs improvement in punctuality',
];

const HOLIDAYS = [
  { name: 'Ambedkar Jayanti', date: '2026-04-14', type: 'NATIONAL' },
  { name: 'Labour Day', date: '2026-05-01', type: 'NATIONAL' },
  { name: 'Independence Day', date: '2026-08-15', type: 'NATIONAL' },
  { name: 'Ganesh Chaturthi', date: '2026-09-07', type: 'REGIONAL' },
  { name: 'Gandhi Jayanti', date: '2026-10-02', type: 'NATIONAL' },
  { name: 'Diwali Break', date: '2026-10-20', type: 'SCHOOL' },
  { name: 'Diwali Break', date: '2026-10-21', type: 'SCHOOL' },
  { name: 'Diwali Break', date: '2026-10-22', type: 'SCHOOL' },
  { name: 'Diwali Break', date: '2026-10-23', type: 'SCHOOL' },
  { name: 'Diwali Break', date: '2026-10-24', type: 'SCHOOL' },
  { name: 'Christmas', date: '2026-12-25', type: 'NATIONAL' },
  { name: 'Winter Break', date: '2026-12-26', type: 'SCHOOL' },
  { name: 'Winter Break', date: '2026-12-27', type: 'SCHOOL' },
  { name: 'Winter Break', date: '2026-12-28', type: 'SCHOOL' },
  { name: 'Winter Break', date: '2026-12-29', type: 'SCHOOL' },
  { name: 'Winter Break', date: '2026-12-30', type: 'SCHOOL' },
  { name: 'Winter Break', date: '2026-12-31', type: 'SCHOOL' },
  { name: 'New Year', date: '2027-01-01', type: 'NATIONAL' },
  { name: 'Republic Day', date: '2027-01-26', type: 'NATIONAL' },
  { name: 'Holi', date: '2027-03-04', type: 'NATIONAL' },
];

const ROUTE_STOPS = [
  'Shanthi Circle', 'Mahadevapura Cross', 'Kasturi Nagar', 'Whitefield Gate', 'Hennur Cross', 'Kalyan Nagar',
  'Hebbal Flyover', 'Yelahanka Junction', 'Madiwala Bridge', 'Banashankari Metro', 'Koramangala 5th Block', 'Electronic City',
  'Marathahalli Bridge', 'Rajajinagar', 'Jayanagar 4th T Block', 'Malleswaram', 'Yeshwanthpur', 'MG Road', 'Church Street', 'Bannerghatta Road',
];

const SCHOOL_WEBSITES = ['https://centralacademy.edu', 'https://centralacademy.ac.in'];

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function sampleItems<T>(items: T[], count: number): T[] {
  const result: T[] = [];
  const pool = [...items];
  while (result.length < count && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(idx, 1)[0]);
  }
  return result;
}

function weightedPick<T>(options: { value: T; weight: number }[]): T {
  const total = options.reduce((sum, item) => sum + item.weight, 0);
  let pick = Math.random() * total;
  for (const option of options) {
    if (pick < option.weight) return option.value;
    pick -= option.weight;
  }
  return options[options.length - 1].value;
}

function fmt(date: Date) {
  return date.toISOString().split('T')[0];
}

function isSchoolDay(date: Date) {
  const weekday = date.getDay();
  if (weekday === 0) return false;
  if (HOLIDAYS.some((holiday) => holiday.date === fmt(date))) return false;
  return true;
}

function getSchoolDaysForRange(sessionStart: Date, sessionEnd: Date) {
  const dates: string[] = [];
  for (let d = new Date(sessionStart); d <= sessionEnd; d.setDate(d.getDate() + 1)) {
    if (isSchoolDay(new Date(d))) {
      dates.push(fmt(new Date(d)));
    }
  }
  return dates;
}

function getAttendanceDays(sessionStart: Date, sessionEnd: Date, windowDays = 7) {
  const all = getSchoolDaysForRange(sessionStart, sessionEnd);
  return all.slice(0, windowDays);
}

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

async function batchInsert(label: string, delegate: { createMany: (args: any) => Promise<any> }, rows: any[], chunkSize = 2000) {
  if (!rows.length) return;
  let inserted = 0;
  for (const batch of chunkArray(rows, chunkSize)) {
    await delegate.createMany({ data: batch, skipDuplicates: true });
    inserted += batch.length;
    process.stdout.write(`\r  ${label}: ${inserted}/${rows.length}`);
  }
  process.stdout.write('\n');
}

async function resetDatabase() {
  const tables = await prisma.$queryRawUnsafe<{ tablename: string }[]>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations'`
  );
  if (!tables.length) return;
  const tableList = tables.map((row) => `"${row.tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE;`);
}

async function main() {
  console.log('Starting enterprise-grade demo seed for Aegis OS School ERP...');
  await resetDatabase();

  const seedDays = process.env.SEED_DAYS ? parseInt(process.env.SEED_DAYS, 10) : 30;
  const schoolDays = getAttendanceDays(SESSION_START, SESSION_END, seedDays);
  const schoolDays2 = getAttendanceDays(SESSION_DEFS[1].start, SESSION_DEFS[1].end, seedDays);
  console.log(`Academic session1 attendance days: ${schoolDays.length} (configured: ${seedDays})`);
  console.log(`Academic session2 attendance days: ${schoolDays2.length} (configured: ${seedDays})`);

  const sharedHash = await bcrypt.hash(STAFF_PASSWORD, 10);
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const parentHash = await bcrypt.hash(PARENT_PASSWORD, 10);

  console.log('\n1) Creating school, campus, session, roles...');
  const schoolProfile = await prisma.schoolProfile.create({
    data: {
      name: 'Central Academy',
      email: 'admin@centralacademy.edu',
      phone: '080-44556677',
      address: '14 Education Road, Hebbal, Bengaluru, Karnataka 560024',
      status: 'Active',
      contactInfo: 'info@centralacademy.edu',
    },
  });

  const campus = await prisma.campus.create({
    data: {
      schoolProfileId: schoolProfile.id,
      name: 'Central Academy Main Campus',
      address: 'Hebbal, Bengaluru, Karnataka 560024',
      capacity: 5000,
      status: 'Active',
      latitude: 12.9898,
      longitude: 77.5946,
    },
  });

  const sessions: any[] = [];
  for (const def of SESSION_DEFS) {
    const created = await prisma.academicSession.create({
      data: { name: def.name, isActive: def.isActive, status: 'Active' },
    });
    sessions.push(created);
  }
  // Keep the existing logic working for Session 1 first; we’ll refactor to seed both sessions.
  const session = sessions[0];

  const roleDefinitions = [
    { name: 'Super Admin', permissions: ['*'] },
    { name: 'Principal', permissions: ['*'] },
    // MANAGE_DISCIPLINE added here: Vice Principal is who actually handles
    // student discipline day to day; previously no seeded role held this
    // permission at all, so the Discipline Desk (mobile tile a9, web
    // dashboard/admin/discipline) was reachable by nobody but Super Admin.
    // MANAGE_GRIEVANCES added here and on Admin Staff: Phase 5 of the
    // paperless rollout plan wires up the previously controller-less
    // GrievanceRecord model, but no seeded role held a permission for it —
    // Vice Principal and Admin Staff are who actually triage/resolve general
    // complaints day to day (Principal/Super Admin already hold '*').
    { name: 'Vice Principal', permissions: ['VIEW_STUDENTS', 'MANAGE_USERS', 'MANAGE_ACADEMICS', 'MARK_ATTENDANCE', 'MANAGE_EXAMS', 'MANAGE_FEES', 'VIEW_REPORTS', 'MANAGE_TRANSPORT', 'MANAGE_TRANSPORT_FLEET', 'MANAGE_LMS', 'MANAGE_DISCIPLINE', 'MANAGE_GRIEVANCES'] },
    { name: 'Academic Coordinator', permissions: ['VIEW_STUDENTS', 'MANAGE_ACADEMICS', 'MANAGE_EXAMS', 'VIEW_REPORTS', 'MANAGE_ACTIVITIES'] },
    // MANAGE_EXAMS added here: the Exams Desk (mobile tile t3) does real
    // invigilation/evaluation/online-test-monitoring work against /ems/*,
    // which requires MANAGE_EXAMS — Teacher previously only held
    // MANAGE_GRADES, so the tile was visible but every action 403'd.
    { name: 'Teacher', permissions: ['VIEW_OWN_PROFILE', 'VIEW_OWN_SCHEDULE', 'VIEW_STUDENTS', 'MARK_ATTENDANCE', 'MANAGE_GRADES', 'MANAGE_EXAMS', 'MANAGE_LMS', 'VIEW_REPORTS', 'MANAGE_ACTIVITIES'] },
    { name: 'Accountant', permissions: ['MANAGE_FEES', 'VIEW_REPORTS'] },
    { name: 'Librarian', permissions: ['MANAGE_ACADEMICS', 'VIEW_REPORTS'] },
    { name: 'Warden', permissions: ['MANAGE_HOSTEL', 'VIEW_REPORTS'] },
    { name: 'Transport Manager', permissions: ['MANAGE_TRANSPORT', 'MANAGE_TRANSPORT_FLEET', 'VIEW_REPORTS'] },
    { name: 'Driver', permissions: ['MANAGE_TRANSPORT', 'VIEW_REPORTS'] },
    { name: 'Conductor', permissions: ['MANAGE_TRANSPORT'] },
    // MANAGE_ADMISSIONS_PIPELINE added here: Admin Staff already manages
    // admissions conversion (MANAGE_USERS covers PATCH /erp-core/students);
    // the pipeline view is the same registrar job, but no role held this
    // permission before, so the Admissions Pipeline desk was unreachable.
    { name: 'Admin Staff', permissions: ['MANAGE_USERS', 'MANAGE_COMMUNICATION', 'VIEW_REPORTS', 'MANAGE_ADMISSIONS_PIPELINE', 'MANAGE_GRIEVANCES'] },
    // New role: the 'Nurse' staff designation existed (STAFF_ROLES above)
    // but had no matching Role — it silently fell back to Admin Staff, which
    // lacks MANAGE_HEALTH_RECORDS, so the school nurse could never open the
    // Health Centre Desk. Split out its own role instead of over-granting
    // health-records access to the rest of the Admin Staff bucket (HR
    // Manager, Peon, Cleaner, ...).
    { name: 'Nurse', permissions: ['MANAGE_HEALTH_RECORDS', 'VIEW_REPORTS'] },
    // Front-desk and gate operations share MANAGE_VISITORS — same permission
    // already gates the one shared Visitor & Gate Pass desk screen (mobile
    // tile a12) both roles use, so there's no separate permission to invent
    // per feature (courier, appointments, vehicle log, late-entry log).
    { name: 'Reception', permissions: ['MANAGE_VISITORS', 'VIEW_REPORTS'] },
    { name: 'Security', permissions: ['MANAGE_VISITORS', 'VIEW_REPORTS'] },
    { name: 'Parent', permissions: ['VIEW_CHILD_PROFILE', 'PAY_FEES', 'VIEW_REPORTS'] },
    { name: 'Student', permissions: ['VIEW_OWN_PROFILE', 'VIEW_OWN_GRADES', 'VIEW_LMS'] },
  ];

  const roles: Record<string, string> = {};
  for (const role of roleDefinitions) {
    const created = await prisma.role.create({
      data: { name: role.name, permissions: role.permissions, schoolProfileId: schoolProfile.id },
    });
    roles[role.name] = created.id;
  }

  const superAdmin = await prisma.staff.create({
    data: {
      fullName: 'Vision K. Reddy',
      email: 'superadmin@centralacademy.edu',
      passwordHash: adminHash,
      roleId: roles['Super Admin'],
      status: 'Active',
      campusId: campus.id,
    },
  });

  const principal = await prisma.staff.create({
    data: {
      fullName: 'Dr. Meera Krishnan',
      email: 'principal@centralacademy.edu',
      passwordHash: sharedHash,
      roleId: roles['Principal'],
      gender: 'Female',
      status: 'Active',
      education: 'Ph.D. in Education',
      experience: '18 years',
      details: { designation: 'Principal', campus: campus.name },
      campusId: campus.id,
    },
  });

  const vicePrincipal = await prisma.staff.create({
    data: {
      fullName: 'Ananya Nair',
      email: 'viceprincipal@centralacademy.edu',
      passwordHash: sharedHash,
      roleId: roles['Vice Principal'],
      gender: 'Female',
      status: 'Active',
      education: 'M.Ed',
      experience: '15 years',
      campusId: campus.id,
    },
  });

  const academicCoordinator = await prisma.staff.create({
    data: {
      fullName: 'Rahul Sharma',
      email: 'academics@centralacademy.edu',
      passwordHash: sharedHash,
      roleId: roles['Academic Coordinator'],
      gender: 'Male',
      status: 'Active',
      education: 'M.Sc. Education',
      campusId: campus.id,
      experience: '12 years',
    },
  });

  console.log('\n2) Creating subjects, classes, sections, and fee structures...');
  const subjectMap: Record<string, string> = {};
  for (const name of SUBJECTS) {
    const created = await prisma.subject.create({ data: { name, medium: name === 'Hindi' ? 'Hindi' : 'English' } });
    subjectMap[name] = created.id;
  }

  type ClassDef = { id: string; grade: string; sections: { id: string; name: string }[]; };
  const classDefinitions: ClassDef[] = [];
  const classSubjectRelations: { classId: string; subjectId: string }[] = [];
  const feeStructureMap: Record<string, string> = {};
  const sectionToClassMap: Record<string, { classId: string; grade: string }> = {};

  for (const grade of CLASS_NAMES) {
    const createdClass = await prisma.class.create({
      data: {
        grade,
        campusId: campus.id,
        sessionId: session.id,
        status: 'Active',
        sections: {
          create: SECTION_NAMES.map((section) => ({ name: section })),
        },
      },
      include: { sections: true },
    });

    classDefinitions.push({ id: createdClass.id, grade, sections: createdClass.sections.map((section) => ({ id: section.id, name: section.name })) });

    const amount = 12500 + CLASS_NAMES.indexOf(grade) * 1100;
    const fee = await prisma.feeStructure.create({
      data: {
        name: `${grade} Tuition 2026-27`,
        amount: amount.toString(),
        cycle: 'Annual',
        sessionId: session.id,
        classId: createdClass.id,
      },
    });

    createdClass.sections.forEach((section) => {
      sectionToClassMap[section.id] = { classId: createdClass.id, grade };
      feeStructureMap[section.id] = fee.id;
    });

    const subjectsForGrade = CLUSTER_SUBJECTS[grade];
    for (const subjectName of subjectsForGrade) {
      classSubjectRelations.push({ classId: createdClass.id, subjectId: subjectMap[subjectName] });
    }
  }

  await batchInsert('class_subjects', prisma.classSubject, classSubjectRelations);

  console.log('\n3) Creating teaching and support staff...');
  const staffRecords: any[] = [];
  const payrollRecords: any[] = [];
  const leaveBalanceRecords: any[] = [];

  function makeStaff(name: string, email: string, roleName: string, gender: string, salary: number, extras: Record<string, any> = {}) {
    const id = randomUUID();
    let resolvedRoleName = roleName;
    if (roleName === 'Receptionist') {
      resolvedRoleName = 'Reception';
    } else if (roleName === 'Security Guard') {
      resolvedRoleName = 'Security';
    } else if (['Administrative Officer', 'HR Manager', 'Mess Supervisor', 'Peon', 'Cleaner'].includes(roleName)) {
      resolvedRoleName = 'Admin Staff';
    } else if (['PET Teacher', 'Music Teacher', 'Art Teacher', 'Computer Teacher', 'Lab Assistant'].includes(roleName)) {
      resolvedRoleName = 'Teacher';
    }
    const roleId = roles[resolvedRoleName];
    if (!roleId) {
      console.warn(`WARNING: Role '${roleName}' (resolved to '${resolvedRoleName}') not found in DB roles dictionary!`);
    }
    staffRecords.push({
      id,
      fullName: name,
      email,
      passwordHash: sharedHash,
      roleId: roleId,
      status: 'Active',
      gender,
      education: 'B.Ed',
      experience: `${faker.number.int({ min: 3, max: 20 })} years`,
      details: extras,
      campusId: campus.id,
    });
    payrollRecords.push({ staffId: id, basicSalary: salary, allowances: Math.round(salary * 0.16), deductions: Math.round(salary * 0.05) });
    leaveBalanceRecords.push({ staffId: id, leaveType: 'Casual', totalAllowed: 12, used: 0, year: 2026 });
    leaveBalanceRecords.push({ staffId: id, leaveType: 'Sick', totalAllowed: 10, used: 0, year: 2026 });
    return id;
  }

  const teacherPool: Record<string, string[]> = {};
  const teacherIds: string[] = [];
  const roleTypeOnly = ['Teacher', 'PET Teacher', 'Music Teacher', 'Art Teacher', 'Computer Teacher', 'Lab Assistant'];

  for (const role of STAFF_ROLES) {
    for (let index = 1; index <= role.count; index++) {
      const gender = faker.person.sex() as 'male' | 'female';
      const firstName = faker.person.firstName(gender);
      const lastName = faker.person.lastName();
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${index}@centralacademy.edu`.replace(/[^a-z0-9@\.]/g, '');
      const name = `${firstName} ${lastName}`;
      const staffId = makeStaff(name, email, role.name, gender === 'male' ? 'Male' : 'Female', faker.number.int({ min: role.baseSalary[0], max: role.baseSalary[1] }), { designation: role.name });
      if (roleTypeOnly.includes(role.name)) {
        teacherIds.push(staffId);
        if (!teacherPool[role.name]) teacherPool[role.name] = [];
        teacherPool[role.name].push(staffId);
      }
    }
  }

  if (teacherPool['Teacher']) {
    teacherPool['Teacher'] = teacherPool['Teacher'];
  }

  await batchInsert('staff', prisma.staff, staffRecords);
  await batchInsert('payroll_structures', prisma.payrollStructure, payrollRecords);
  await batchInsert('leave_balances', prisma.leaveBalance, leaveBalanceRecords);

  console.log('\n4) Assigning teachers to sections and subjects...');
  const assignmentRows: any[] = [];
  const classTeacherAssignments: Record<string, string> = {};
  const subjectTeacherList: Record<string, string[]> = {};

  for (const subjectName of SUBJECTS) {
    subjectTeacherList[subjectName] = sampleItems(teacherPool['Teacher'] || teacherIds, Math.min(4, (teacherPool['Teacher'] || teacherIds).length));
  }

  for (const classDef of classDefinitions) {
    const subjectsForGrade = CLUSTER_SUBJECTS[classDef.grade];
    let classTeacherCandidateIndex = 0;
    for (const section of classDef.sections) {
      const sectionTeacher = teacherIds[classTeacherCandidateIndex % teacherIds.length];
      classTeacherAssignments[section.id] = sectionTeacher;
      assignmentRows.push({
        id: randomUUID(),
        staffId: sectionTeacher,
        sessionId: session.id,
        sectionId: section.id,
        isClassTeacher: true,
        status: 'Active',
      });
      classTeacherCandidateIndex++;

      for (const subjectName of subjectsForGrade) {
        const pool = subjectTeacherList[subjectName];
        const teacherId = pool[faker.number.int({ min: 0, max: pool.length - 1 })];
        assignmentRows.push({
          id: randomUUID(),
          staffId: teacherId,
          sessionId: session.id,
          subjectId: subjectMap[subjectName],
          sectionId: section.id,
          isClassTeacher: false,
          hoursPerWeek: faker.number.int({ min: 4, max: 8 }),
          status: 'Active',
        });
      }
    }
  }

  await batchInsert('teacher_assignments', prisma.teacherAssignment, assignmentRows, 3000);

  console.log('\n5) Generating complete section timetables...');
  const timetable = await prisma.timetable.create({ data: { name: '2026-2027 Master Timetable', sessionId: session.id, status: 'Active' } });
  const slots = [
    { name: 'Assembly', startTime: '08:30', endTime: '09:00', isBreak: false },
    { name: 'Period 1', startTime: '09:00', endTime: '09:40', isBreak: false },
    { name: 'Period 2', startTime: '09:40', endTime: '10:20', isBreak: false },
    { name: 'Period 3', startTime: '10:20', endTime: '11:00', isBreak: false },
    { name: 'Recess', startTime: '11:00', endTime: '11:20', isBreak: true },
    { name: 'Period 4', startTime: '11:20', endTime: '12:00', isBreak: false },
    { name: 'Period 5', startTime: '12:00', endTime: '12:40', isBreak: false },
    { name: 'Period 6', startTime: '12:40', endTime: '13:20', isBreak: false },
    { name: 'Lunch', startTime: '13:20', endTime: '14:00', isBreak: true },
    { name: 'Period 7', startTime: '14:00', endTime: '14:40', isBreak: false },
    { name: 'Period 8', startTime: '14:40', endTime: '15:20', isBreak: false },
  ];
  await batchInsert('timetable_slots', prisma.timetableSlot, slots.map((slot) => ({ ...slot, sessionId: session.id })));
  const timetablePeriods: any[] = [];
  const timetableCardinal = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const roomNames = ['Room 101', 'Room 102', 'Room 103', 'Room 104', 'Physics Lab', 'Chemistry Lab', 'Biology Lab', 'Computer Lab', 'Art Room', 'Music Room', 'Sports Ground'];

  const teacherBusy: Record<string, boolean> = {};
  for (const classDef of classDefinitions) {
    const subjectsForGrade = CLUSTER_SUBJECTS[classDef.grade];
    for (const section of classDef.sections) {
      for (const day of timetableCardinal) {
        let subjectIndex = 0;
        for (const slot of slots) {
          if (slot.isBreak || slot.name === 'Assembly') {
            if (slot.name !== 'Assembly') {
              timetablePeriods.push({
                timetableId: timetable.id,
                sectionId: section.id,
                dayOfWeek: day,
                startTime: slot.startTime,
                endTime: slot.endTime,
                room: 'Cafeteria',
                status: 'Active',
                assignmentId: assignmentRows.find((row) => row.sectionId === section.id && row.isClassTeacher)?.id ?? assignmentRows[0].id,
              });
            }
            continue;
          }
          const subjectName = subjectsForGrade[subjectIndex % subjectsForGrade.length];
          const teacherAssignment = assignmentRows.find(
            (row) => row.sectionId === section.id && row.subjectId === subjectMap[subjectName]
          );
          if (!teacherAssignment) continue;
          const teacherKey = `${teacherAssignment.staffId}_${day}_${slot.startTime}`;
          if (teacherBusy[teacherKey]) {
            subjectIndex++;
            continue;
          }
          teacherBusy[teacherKey] = true;
          timetablePeriods.push({
            timetableId: timetable.id,
            sectionId: section.id,
            subjectId: teacherAssignment.subjectId,
            assignmentId: teacherAssignment.id,
            dayOfWeek: day,
            startTime: slot.startTime,
            endTime: slot.endTime,
            room: randomItem(roomNames),
            status: 'Active',
          });
          subjectIndex++;
        }
      }
    }
  }
  await batchInsert('timetable_periods', prisma.timetablePeriod, timetablePeriods, 4000);

  console.log('\n6) Creating 4,400+ students, families, and portal accounts...');
  const SCHOOL_HOUSES = [
    { id: randomUUID(), name: 'Aravalli' },
    { id: randomUUID(), name: 'Nilgiri' },
    { id: randomUUID(), name: 'Vindhya' },
    { id: randomUUID(), name: 'Satpura' },
  ];
  const studentRows: any[] = [];
  const enrollments: any[] = [];
  const parentRows: any[] = [];
  const parentStudentRows: any[] = [];
  const portalRows: any[] = [];
  const studentPortalRows: any[] = [];

  let admissionCounter = 1000;
  const familyGroups: any[] = [];

  for (const classDef of classDefinitions) {
    for (const section of classDef.sections) {
      const studentsInSection = faker.number.int({ min: MIN_STUDENTS_PER_SECTION, max: MAX_STUDENTS_PER_SECTION });
      for (let index = 0; index < studentsInSection; index++) {
        const gender = faker.person.sex() as 'male' | 'female';
        const firstName = faker.person.firstName(gender);
        const lastName = faker.person.lastName();
        const admissionNumber = `ADM2026${String(admissionCounter++).padStart(4, '0')}`;
        const studentId = randomUUID();
        const dob = new Date(2026 - (CLASS_NAMES.indexOf(classDef.grade) + 3), faker.number.int({ min: 0, max: 11 }), faker.number.int({ min: 1, max: 26 }));
        const studentName = `${firstName} ${lastName}`;
        const village = randomItem(VILLAGES);
        const city = randomItem(CITIES);
        const address = `${faker.location.streetAddress()}, ${village}, ${city}, Karnataka`;

        studentRows.push({
          id: studentId,
          admissionNumber,
          fullName: studentName,
          gender: gender === 'male' ? 'Male' : 'Female',
          guardianName: '',
          phone: '9' + faker.string.numeric(9),
          status: 'Active',
          documentsVerified: true,
          dateOfBirth: dob,
          details: {
            bloodGroup: randomItem(['A+', 'A-', 'B+', 'B-', 'O+', 'O-']),
            category: randomItem(['General', 'OBC', 'SC', 'ST', 'EWS']),
            religion: randomItem(['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain']),
            address,
            village,
            city,
            state: 'Karnataka',
            pinCode: faker.number.int({ min: 560001, max: 560099 }).toString(),
            admissionDate: fmt(new Date(2026, 3, faker.number.int({ min: 1, max: 30 }))),
            feePlan: 'Annual',
            transportMode: randomItem(['Bus', 'Walk', 'Cab', 'Parent Pickup']),
            status: 'Active',
          },
          photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName + ' ' + lastName)}&background=0D8ABC&color=fff`,
        });

        enrollments.push({
          id: randomUUID(),
          studentId,
          sessionId: session.id,
          sectionId: section.id,
          campusId: campus.id,
          rollNumber: `${classDef.grade.replace(/[^0-9A-Za-z]/g, '')}${section.name}-${String(index + 1).padStart(2, '0')}`,
          status: 'Enrolled',
        });
      }
    }
  }

  // --- Session 2: promotion/failure + new admissions ---
  const session2 = sessions[1];
  const enrollments2: any[] = [];

  const sectionInfoById = new Map<string, { grade: string; letter: string }>();
  const sectionIdByGradeAndLetter = new Map<string, string>();
  for (const classDef of classDefinitions) {
    for (const section of classDef.sections) {
      sectionInfoById.set(section.id, { grade: classDef.grade, letter: section.name });
      sectionIdByGradeAndLetter.set(`${classDef.grade}|${section.name}`, section.id);
    }
  }

  // 90% promoted, 5% repeat (fail), 10% new admissions
  const failThresholdPct = 5;
  for (const enrollment of enrollments) {
    const info = sectionInfoById.get(enrollment.sectionId);
    if (!info) continue;

    const currentIndex = CLASS_NAMES.indexOf(info.grade);
    if (currentIndex < 0) continue;

    const isFail = faker.number.int({ min: 1, max: 100 }) <= failThresholdPct;
    const targetIndex = isFail ? currentIndex : Math.min(currentIndex + 1, CLASS_NAMES.length - 1);
    const targetGrade = CLASS_NAMES[targetIndex];
    const targetSectionId = sectionIdByGradeAndLetter.get(`${targetGrade}|${info.letter}`) ?? enrollment.sectionId;

    enrollments2.push({
      id: randomUUID(),
      studentId: enrollment.studentId,
      sessionId: session2.id,
      sectionId: targetSectionId,
      campusId: campus.id,
      rollNumber: `${enrollment.rollNumber}-S2`,
      status: 'Enrolled',
    });
  }

  const newAdmissionsCount = Math.floor(studentRows.length * 0.1);
  const allSections = classDefinitions.flatMap((cd: any) => cd.sections);
  const session2Year = SESSION_DEFS[1].start.getFullYear();

  for (let i = 0; i < newAdmissionsCount; i++) {
    const section = randomItem(allSections);
    const info = sectionInfoById.get(section.id);
    if (!info) continue;

    const gender = faker.person.sex() as 'male' | 'female';
    const firstName = faker.person.firstName(gender);
    const lastName = faker.person.lastName();
    const admissionNumber = `ADM${session2Year}${String(admissionCounter++).padStart(4, '0')}`;
    const studentId = randomUUID();
    const dob = new Date(session2Year - (CLASS_NAMES.indexOf(info.grade) + 3), faker.number.int({ min: 0, max: 11 }), faker.number.int({ min: 1, max: 26 }));
    const studentName = `${firstName} ${lastName}`;

    const village = randomItem(VILLAGES);
    const city = randomItem(CITIES);
    const address = `${faker.location.streetAddress()}, ${village}, ${city}, Karnataka`;

    studentRows.push({
      id: studentId,
      admissionNumber,
      fullName: studentName,
      gender: gender === 'male' ? 'Male' : 'Female',
      guardianName: '',
      phone: '9' + faker.string.numeric(9),
      status: 'Active',
      documentsVerified: true,
      dateOfBirth: dob,
      details: {
        bloodGroup: randomItem(['A+', 'A-', 'B+', 'B-', 'O+', 'O-']),
        category: randomItem(['General', 'OBC', 'SC', 'ST', 'EWS']),
        religion: randomItem(['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain']),
        address,
        village,
        city,
        state: 'Karnataka',
        pinCode: faker.number.int({ min: 560001, max: 560099 }).toString(),
        admissionDate: fmt(new Date(session2Year, 3, faker.number.int({ min: 1, max: 30 }))),
        feePlan: 'Annual',
        transportMode: randomItem(['Bus', 'Walk', 'Cab', 'Parent Pickup']),
        status: 'Active',
      },
      photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName + ' ' + lastName)}&background=0D8ABC&color=fff`,
    });

    enrollments2.push({
      id: randomUUID(),
      studentId,
      sessionId: session2.id,
      sectionId: section.id,
      campusId: campus.id,
      rollNumber: `${info.grade.replace(/[^0-9A-Za-z]/g, '')}${section.name}-${String(i + 1).padStart(2, '0')}-S2`,
      status: 'Enrolled',
    });
  }

  for (const student of studentRows) {
    const familySize = faker.number.int({ min: 1, max: 3 });
    const family = familyGroups.find((group) => group.children.length < 3);
    if (family && faker.datatype.boolean()) {
      family.children.push(student.id);
    } else {
      const parentId = randomUUID();
      const parentName = `${faker.person.firstName()} ${student.fullName.split(' ').pop()}`;
      const parentEmail = `parent.${parentRows.length + 1}@centralacademy.edu`;
      parentRows.push({ id: parentId, name: parentName, phone: '9' + faker.string.numeric(9), email: parentEmail, passwordHash: parentHash, status: 'Active' });
      familyGroups.push({ parentId, children: [student.id] });
    }
  }

  for (const family of familyGroups) {
    for (const childId of family.children) {
      parentStudentRows.push({ id: randomUUID(), parentId: family.parentId, studentId: childId, relationship: 'Parent' });
    }
    portalRows.push({ username: `parent.${family.parentId}@centralacademy.edu`, passwordHash: parentHash, userType: 'PARENT', referenceId: family.parentId, status: 'Active' });
  }

  for (const student of studentRows) {
    portalRows.push({ username: student.admissionNumber, passwordHash: parentHash, userType: 'STUDENT', referenceId: student.id, status: 'Active' });
  }

  // Houses (§ Co-Curricular & Activities) — every student belongs to one,
  // assigned round-robin so House Points has real membership to work with.
  await batchInsert('school_houses', prisma.schoolHouse, SCHOOL_HOUSES.map((h) => ({ id: h.id, name: h.name })), 10);
  studentRows.forEach((student, idx) => {
    student.houseId = SCHOOL_HOUSES[idx % SCHOOL_HOUSES.length].id;
  });

  await batchInsert('students', prisma.student, studentRows, 2000);
  await batchInsert('student_enrollments', prisma.studentEnrollment, [...enrollments, ...enrollments2], 2000);
  await batchInsert('parents', prisma.parent, parentRows, 1000);
  await batchInsert('parent_students', prisma.parentStudent, parentStudentRows, 2000);
  await batchInsert('portal_accounts', prisma.portalAccount, portalRows, 2000);

  for (const house of SCHOOL_HOUSES) {
    const members = studentRows.filter((s) => s.houseId === house.id);
    if (members.length >= 2) {
      await prisma.schoolHouse.update({
        where: { id: house.id },
        data: { captainId: members[0].id, viceCaptainId: members[1].id },
      });
    }
  }

  console.log('\n7) Creating ID cards and certificates...');
  const studentTemplate = await prisma.idCardTemplate.create({
    data: { templateName: 'Student ID 2026-27', targetRole: 'Student', schoolName: schoolProfile.name, logoUrl: '', primaryColor: '#1f2937', secondaryColor: '#f59e0b' },
  });
  const staffTemplate = await prisma.idCardTemplate.create({
    data: { templateName: 'Staff ID 2026-27', targetRole: 'Staff', schoolName: schoolProfile.name, logoUrl: '', primaryColor: '#003262', secondaryColor: '#f97316' },
  });

  const studentIdCards = studentRows.map((student) => ({
    id: randomUUID(),
    idNumber: `SCH-${student.admissionNumber}`,
    templateId: studentTemplate.id,
    studentId: student.id,
    barcodeData: student.admissionNumber,
    expiryDate: SESSION_DEFS[SESSION_DEFS.length - 1].end,
    status: 'Active',
  }));
  const staffIdCards = staffRecords.slice(0, 200).map((staff, index) => ({
    id: randomUUID(),
    idNumber: `STAFF-${String(index + 1).padStart(4, '0')}`,
    templateId: staffTemplate.id,
    staffId: staff.id,
    barcodeData: `S-${index + 1}`,
    expiryDate: SESSION_DEFS[SESSION_DEFS.length - 1].end,
    status: 'Active',
  }));

  await batchInsert('id_cards', prisma.idCard, [...studentIdCards, ...staffIdCards], 2000);

  console.log('\n8) Generating academic attendance for students and staff...');
  const studentAttendance: any[] = [];
  const staffAttendance: any[] = [];

  for (const enrollment of enrollments) {
    for (const date of schoolDays) {
      const status = weightedPick([
        { value: 'Present', weight: 92 },
        { value: 'Absent', weight: 5 },
        { value: 'Late', weight: 3 },
      ]);
      studentAttendance.push({
        id: randomUUID(),
        enrollmentId: enrollment.id,
        date,
        status,
        checkInTime: status === 'Late' ? '09:12' : '08:55',
        campusId: campus.id,
        sessionId: session.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  for (const enrollment of enrollments2) {
    for (const date of schoolDays2) {
      const status = weightedPick([
        { value: 'Present', weight: 92 },
        { value: 'Absent', weight: 5 },
        { value: 'Late', weight: 3 },
      ]);
      studentAttendance.push({
        id: randomUUID(),
        enrollmentId: enrollment.id,
        date,
        status,
        checkInTime: status === 'Late' ? '09:12' : '08:55',
        campusId: campus.id,
        sessionId: session2.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  const allStaffIds = [superAdmin.id, principal.id, vicePrincipal.id, academicCoordinator.id, ...staffRecords.map((r) => r.id)];
  for (const staffId of allStaffIds) {
    for (const date of schoolDays) {
      const status = weightedPick([
        { value: 'Present', weight: 93 },
        { value: 'Leave', weight: 4 },
        { value: 'Absent', weight: 2 },
        { value: 'Late', weight: 1 },
      ]);
      staffAttendance.push({
        id: randomUUID(),
        staffId,
        date,
        status,
        checkInTime: status === 'Late' ? '09:10' : '08:50',
        campusId: campus.id,
        sessionId: session.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    for (const date of schoolDays2) {
      const status = weightedPick([
        { value: 'Present', weight: 93 },
        { value: 'Leave', weight: 4 },
        { value: 'Absent', weight: 2 },
        { value: 'Late', weight: 1 },
      ]);
      staffAttendance.push({
        id: randomUUID(),
        staffId,
        date,
        status,
        checkInTime: status === 'Late' ? '09:10' : '08:50',
        campusId: campus.id,
        sessionId: session2.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  await batchInsert('attendance_records', prisma.attendanceRecord, studentAttendance, 5000);
  await batchInsert('attendance_records', prisma.attendanceRecord, staffAttendance, 5000);

  console.log('\n9) Creating transport fleet, routes, students, and trip logs...');
  const vehicles = Array.from({ length: TRANSPORT_ROUTES }).map((_, index) => ({
    id: randomUUID(),
    vehicleNumber: `KA-05-CT-${String(1000 + index)}`,
    busName: `Central Bus ${index + 1}`,
    vehicleType: 'School Bus',
    seatingCapacity: 40,
    fuelType: 'Diesel',
    gpsDevice: true,
    status: 'Active',
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
  await batchInsert('transport_vehicles', prisma.transportVehicle, vehicles);

  const driverIds = staffRecords.filter((s) => s.details?.designation === 'Driver').map((s) => s.id);
  const conductorIds = staffRecords.filter((s) => s.details?.designation === 'Conductor').map((s) => s.id);
  const routeRows: any[] = [];
  const routeStopsRows: any[] = [];

  for (let i = 0; i < TRANSPORT_ROUTES; i++) {
    const routeId = randomUUID();
    const selectedStops = faker.helpers.arrayElements(ROUTE_STOPS, faker.number.int({ min: 5, max: 7 }));
    routeRows.push({
      id: routeId,
      routeName: `Route ${i + 1} - ${selectedStops[0]}`,
      distance: Number(faker.number.float({ min: 8, max: 20, fractionDigits: 1 }).toFixed(1)),
      estimatedTime: `${faker.number.int({ min: 35, max: 70 })} Minutes`,
      morningStartTime: '07:00',
      afternoonStartTime: '15:00',
      vehicleId: vehicles[i].id,
      status: 'Active',
    });
    selectedStops.forEach((stopName, idx) => {
      routeStopsRows.push({
        id: randomUUID(),
        routeId,
        stopName,
        latitude: 12.95 + idx * 0.01,
        longitude: 77.55 + idx * 0.01,
        arrivalTime: `07:${String(30 + idx * 4).padStart(2, '0')}`,
        departureTime: `07:${String(31 + idx * 4).padStart(2, '0')}`,
        distanceFromPrev: idx === 0 ? 0 : Number(faker.number.float({ min: 1, max: 3, fractionDigits: 1 }).toFixed(1)),
        orderIndex: idx,
      });
    });
  }

  await batchInsert('transport_routes', prisma.transportRoute, routeRows);
  await batchInsert('transport_route_stops', prisma.transportRouteStop, routeStopsRows);
  await batchInsert('transport_vehicle_staff', prisma.transportVehicleStaff, vehicles.map((vehicle, idx) => ({ vehicleId: vehicle.id, staffId: driverIds[idx % driverIds.length], shift: 'Morning', status: 'Assigned' })));

  const transportAssignments: any[] = [];
  const studentsForTransport = faker.helpers.arrayElements(enrollments, Math.floor(enrollments.length * 0.58));
  for (const enrollment of studentsForTransport) {
    const route = randomItem(routeRows);
    const stop = faker.helpers.arrayElement(routeStopsRows.filter((stop) => stop.routeId === route.id));
    transportAssignments.push({
      id: randomUUID(),
      enrollmentId: enrollment.id,
      routeId: route.id,
      stopId: stop.id,
      morningPickup: true,
      afternoonDrop: true,
      seatNumber: `${faker.number.int({ min: 1, max: 40 })}`,
      feePeriod: 'Annual',
      guardianAuth: 'Verified',
      status: 'Active',
    });
  }
  await batchInsert('transport_student_assignments', prisma.transportStudentAssignment, transportAssignments, 2000);

  const tripRows: any[] = [];
  const tripLogRows: any[] = [];
  const transportAttendanceRows: any[] = [];
  for (const date of schoolDays) {
    for (const route of routeRows) {
      ['Morning', 'Afternoon'].forEach((travelType) => {
        const tripId = randomUUID();
        tripRows.push({ id: tripId, vehicleId: route.vehicleId, routeId: route.id, tripType: travelType, driverId: driverIds[routeRows.indexOf(route) % driverIds.length], date, status: 'Completed', createdAt: new Date(), updatedAt: new Date() });
        const stops = routeStopsRows.filter((stop) => stop.routeId === route.id);
        stops.forEach((stop) => {
          tripLogRows.push({ id: randomUUID(), tripId, stopId: stop.id, status: 'Reached Stop', timestamp: new Date(), remarks: 'On time' });
        });
        transportAssignments.filter((assignment) => assignment.routeId === route.id).forEach((assignment) => {
          transportAttendanceRows.push({ id: randomUUID(), tripId, enrollmentId: assignment.enrollmentId, status: faker.helpers.arrayElement(['Boarded', 'Dropped', 'Absent']), timestamp: new Date(), markedBy: 'Manual', stopId: assignment.stopId });
        });
      });
    }
  }

  await batchInsert('transport_trips', prisma.transportTrip, tripRows, 2000);
  await batchInsert('transport_trip_logs', prisma.transportTripLog, tripLogRows, 4000);
  await batchInsert('transport_attendance', prisma.transportAttendance, transportAttendanceRows, 4000);

  // --- Session 2: transport assignments/trips/attendance (7-day attendance window) ---
  const transportAssignments2: any[] = [];
  const studentsForTransport2 = faker.helpers.arrayElements(enrollments2, Math.floor(enrollments2.length * 0.58));
  for (const enrollment of studentsForTransport2) {
    const route = randomItem(routeRows);
    const stop = faker.helpers.arrayElement(routeStopsRows.filter((s) => s.routeId === route.id));
    transportAssignments2.push({
      id: randomUUID(),
      enrollmentId: enrollment.id,
      routeId: route.id,
      stopId: stop.id,
      morningPickup: true,
      afternoonDrop: true,
      seatNumber: `${faker.number.int({ min: 1, max: 40 })}`,
      feePeriod: 'Annual',
      guardianAuth: 'Verified',
      status: 'Active',
    });
  }
  await batchInsert('transport_student_assignments', prisma.transportStudentAssignment, transportAssignments2, 2000);

  const tripRows2: any[] = [];
  const tripLogRows2: any[] = [];
  const transportAttendanceRows2: any[] = [];

  for (const date of schoolDays2) {
    for (const route of routeRows) {
      ['Morning', 'Afternoon'].forEach((travelType) => {
        const tripId = randomUUID();
        tripRows2.push({
          id: tripId,
          vehicleId: route.vehicleId,
          routeId: route.id,
          tripType: travelType,
          driverId: driverIds[routeRows.indexOf(route) % driverIds.length],
          date,
          status: 'Completed',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const stops = routeStopsRows.filter((stop) => stop.routeId === route.id);
        stops.forEach((stop) => {
          tripLogRows2.push({
            id: randomUUID(),
            tripId,
            stopId: stop.id,
            status: 'Reached Stop',
            timestamp: new Date(),
            remarks: 'On time',
          });
        });

        transportAssignments2
          .filter((assignment) => assignment.routeId === route.id)
          .forEach((assignment) => {
            transportAttendanceRows2.push({
              id: randomUUID(),
              tripId,
              enrollmentId: assignment.enrollmentId,
              status: faker.helpers.arrayElement(['Boarded', 'Dropped', 'Absent']),
              timestamp: new Date(),
              markedBy: 'Manual',
              stopId: assignment.stopId,
            });
          });
      });
    }
  }

  await batchInsert('transport_trips', prisma.transportTrip, tripRows2, 2000);
  await batchInsert('transport_trip_logs', prisma.transportTripLog, tripLogRows2, 4000);
  await batchInsert('transport_attendance', prisma.transportAttendance, transportAttendanceRows2, 4000);

  console.log('\n10) Generating fees, invoices, payments, and overdue records...');
  const invoiceRows: any[] = [];
  const paymentRows: any[] = [];
  for (const enrollment of enrollments) {
    const grade = sectionToClassMap[enrollment.sectionId]?.grade ?? 'Grade 1';
    const amount = 14000 + CLASS_NAMES.indexOf(grade) * 900;
    const siblings = familyGroups.find((family) => family.children.includes(enrollment.studentId));
    const discount = siblings && siblings.children.length > 1 ? 0.08 : 0;
    const feeAmount = Math.round(amount * (1 - discount));
    ['2026-06-30', '2026-12-31'].forEach((dueDate, idx) => {
      const invoiceId = randomUUID();
      const statusProb = faker.number.int({ min: 1, max: 100 });
      const status = statusProb <= 70 ? 'Paid' : statusProb <= 88 ? 'Unpaid' : 'Overdue';
      invoiceRows.push({
        id: invoiceId,
        enrollmentId: enrollment.id,
        structureId: feeStructureMap[enrollment.sectionId],
        amount: feeAmount.toString(),
        lateFeeAmount: status === 'Overdue' ? '500' : '0',
        totalAmount: (feeAmount + (status === 'Overdue' ? 500 : 0)).toString(),
        dueDate,
        status,
        campusId: campus.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      if (status === 'Paid') {
        paymentRows.push({
          id: randomUUID(),
          invoiceId,
          amountPaid: feeAmount.toString(),
          paymentMode: randomItem(['Cash', 'UPI', 'NetBanking', 'Cheque']),
          paymentDate: idx === 0 ? '2026-06-15' : '2026-12-20',
          transactionRef: `TXN${faker.number.int({ min: 1000000, max: 9999999 })}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else if (status === 'Overdue') {
        paymentRows.push({
          id: randomUUID(),
          invoiceId,
          amountPaid: '0',
          paymentMode: 'None',
          paymentDate: '2026-12-31',
          transactionRef: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    });
  }

  await batchInsert('fee_invoices', prisma.feeInvoice, invoiceRows, 3000);
  await batchInsert('fee_payments', prisma.feePayment, paymentRows, 3000);

  console.log('\n11) Creating examinations, marks, and report cards...');
  const examTypes = [
    { name: 'Unit Test 1', term: 'Term 1', date: '2026-08-15' },
    { name: 'Half Yearly Exam', term: 'Term 1', date: '2026-11-20' },
    { name: 'Annual Exam', term: 'Term 2', date: '2027-03-05' },
  ];
  const examRecords: any[] = [];
  for (const examDef of examTypes) {
    examRecords.push(await prisma.exam.create({ data: { name: examDef.name, term: examDef.term, sessionId: session.id, status: 'Completed' } }));
  }

  const examSlotRows: any[] = [];
  for (const exam of examRecords) {
    for (const classDef of classDefinitions) {
      const subjectsForGrade = CLUSTER_SUBJECTS[classDef.grade];
      let slotOffset = 0;
      for (const subjectName of subjectsForGrade) {
        examSlotRows.push({
          id: randomUUID(),
          examId: exam.id,
          classId: classDef.id,
          subjectId: subjectMap[subjectName],
          date: fmt(new Date(new Date(examTypes.find((e) => e.name === exam.name)!.date).setDate(new Date(examTypes.find((e) => e.name === exam.name)!.date).getDate() + slotOffset))),
          startTime: '09:00',
          endTime: '11:00',
          room: randomItem(['Main Hall', 'Room 501', 'Room 502', 'Room 503', 'Auditorium']),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        slotOffset++;
      }
    }
  }
  await batchInsert('exam_slots', prisma.examSlot, examSlotRows, 3000);

  const marksRows: any[] = [];
  const reportCardRows: any[] = [];
  const schoolAttendanceByEnrollment: Record<string, { present: number; total: number }> = {};
  for (const attendance of studentAttendance) {
    schoolAttendanceByEnrollment[attendance.enrollmentId] = schoolAttendanceByEnrollment[attendance.enrollmentId] || { present: 0, total: 0 };
    schoolAttendanceByEnrollment[attendance.enrollmentId].total++;
    if (attendance.status === 'Present' || attendance.status === 'Late') {
      schoolAttendanceByEnrollment[attendance.enrollmentId].present++;
    }
  }

  for (const exam of examRecords) {
    for (const enrollment of enrollments) {
      const grade = sectionToClassMap[enrollment.sectionId]?.grade ?? 'Grade 1';
      const subjectsForGrade = CLUSTER_SUBJECTS[grade] || ['English', 'Mathematics'];
      let totalMarks = 0;
      let subjectCount = 0;
      for (const subjectName of subjectsForGrade) {
        const examSlot = examSlotRows.find((slot) => slot.examId === exam.id && slot.classId === sectionToClassMap[enrollment.sectionId]?.classId && slot.subjectId === subjectMap[subjectName]);
        const isAbsent = faker.number.int({ min: 1, max: 100 }) <= 4;
        const marksObtained = isAbsent ? null : faker.number.int({ min: 28, max: 98 });
        marksRows.push({
          id: randomUUID(),
          examSlotId: examSlot?.id ?? randomUUID(),
          enrollmentId: enrollment.id,
          marksObtained,
          isAbsent,
          remarks: isAbsent ? 'Absent' : 'Completed',
        });
        if (!isAbsent && marksObtained !== null) {
          totalMarks += marksObtained;
          subjectCount++;
        }
      }
      const attendance = schoolAttendanceByEnrollment[enrollment.id];
      const percentage = subjectCount ? Math.round((totalMarks / (subjectCount * 100)) * 100) : 0;
      const gpa = ((percentage / 100) * 10).toFixed(2);
      reportCardRows.push({
        id: randomUUID(),
        enrollmentId: enrollment.id,
        examId: exam.id,
        attendanceRate: attendance ? `${((attendance.present / attendance.total) * 100).toFixed(1)}%` : '0%',
        gpa,
        computedData: { percentage, performance: percentage >= 75 ? 'Strong' : percentage >= 50 ? 'Satisfactory' : 'Needs Improvement' },
        remarks: percentage >= 75 ? 'Excellent performance' : percentage >= 50 ? 'Good effort' : 'Requires attention',
        isApproved: true,
        status: 'Active',
      });
    }
  }
  await batchInsert('exam_marks', prisma.examMarks, marksRows, 5000);
  await batchInsert('report_cards', prisma.reportCard, reportCardRows, 3000);

  console.log('\n12) Seeding LMS courses, resources, quizzes, and student progress...');
  const lmsCourses: any[] = [];
  for (const classDef of classDefinitions) {
    for (const subjectName of CLUSTER_SUBJECTS[classDef.grade]) {
      const courseId = randomUUID();
      lmsCourses.push({
        id: courseId,
        title: `${subjectName} - ${classDef.grade}`,
        description: `Interactive ${subjectName} learning resources for ${classDef.grade} students.`,
        subjectId: subjectMap[subjectName],
        classId: classDef.id,
        status: 'Published',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }
  await batchInsert('lms_courses', prisma.lMSCourse, lmsCourses, 2000);

  const courseSections: any[] = [];
  for (const course of lmsCourses) {
    const section = randomItem(classDefinitions.find((cls) => cls.id === course.classId)?.sections ?? []);
    const teacherAssignment = assignmentRows.find((assignment) => assignment.sectionId === section?.id && assignment.subjectId === course.subjectId);
    courseSections.push({
      id: randomUUID(),
      courseId: course.id,
      sectionId: section?.id,
      teacherId: teacherAssignment?.staffId ?? randomItem(teacherIds),
      startDate: SESSION_START,
      endDate: SESSION_END,
      status: 'Active',
    });
  }
  await batchInsert('lms_course_sections', prisma.lMSCourseSection, courseSections, 2000);

  const quizRows: any[] = [];
  const quizAttemptRows: any[] = [];
  const lmsAssignmentRows: any[] = [];
  const lmsSubmissionRows: any[] = [];
  const lmsResourceRows: any[] = [];
  for (const course of lmsCourses) {
    const quizId = randomUUID();
    quizRows.push({
      id: quizId,
      title: `${course.title} Practice Quiz`,
      description: `Practice quiz for ${course.title}`,
      durationMin: 30,
      maxScore: 50,
      createdAt: new Date(),
    });
    const enrolledInSection = enrollments.filter((enrollment) => enrollment.sectionId === courseSections.find((section) => section.courseId === course.id)?.sectionId);
    faker.helpers.arrayElements(enrolledInSection, Math.round(enrolledInSection.length * 0.35)).forEach((enrollment) => {
      quizAttemptRows.push({
        id: randomUUID(),
        quizId,
        studentId: enrollment.studentId,
        score: faker.number.int({ min: 28, max: 50 }),
        startedAt: new Date('2027-02-25'),
        endedAt: new Date('2027-02-25'),
      });
    });

    for (let i = 1; i <= 2; i++) {
      lmsAssignmentRows.push({
        id: randomUUID(),
        title: `${course.title} Assignment ${i}`,
        description: `Complete assignment ${i} for ${course.title}`,
        dueDate: new Date('2027-02-28'),
        maxScore: 100,
        createdAt: new Date(),
      });
    }

    for (let i = 1; i <= 3; i++) {
      lmsResourceRows.push({
        id: randomUUID(),
        title: `${course.title} Resource ${i}`,
        type: randomItem(['PDF', 'VIDEO', 'LINK']),
        url: `https://resources.centralacademy.edu/${course.id}/resource-${i}`,
        createdAt: new Date(),
      });
    }
  }
  await batchInsert('lms_quizzes', prisma.lMSQuiz, quizRows, 2000);
  await batchInsert('lms_quiz_attempts', prisma.lMSQuizAttempt, quizAttemptRows, 3000);
  await batchInsert('lms_assignments', prisma.lMSAssignment, lmsAssignmentRows, 3000);
  await batchInsert('lms_content_resources', prisma.lMSContentResource, lmsResourceRows, 3000);

  const assignmentIds = lmsAssignmentRows.map((assignment) => assignment.id);
  for (const assignmentId of assignmentIds) {
    const sampledEnrollments = faker.helpers.arrayElements(enrollments, Math.round(enrollments.length * 0.06));
    sampledEnrollments.forEach((enrollment) => {
      lmsSubmissionRows.push({
        id: randomUUID(),
        assignmentId,
        studentId: enrollment.studentId,
        content: 'Submitted through LMS mobile app',
        score: faker.number.int({ min: 55, max: 98 }),
        feedback: randomItem(['Well done', 'Good structure', 'Revise final answer']),
        submittedAt: new Date('2027-02-20'),
        gradedAt: new Date('2027-02-21'),
      });
    });
  }
  await batchInsert('lms_submissions', prisma.lMSSubmission, lmsSubmissionRows, 5000);

  console.log('\n13) LMS assignments and submissions seeded from canonical LMS tables...');

  console.log('\n14) Seeding library usage and fine records...');
  const bookRows: any[] = [];
  const bookTitles = [
    'India: A History', 'Elementary Mathematics', 'General Science', 'Our Environment', 'English Grammar Workbook',
    'Hindi Vyakaran', 'Art and Craft Basics', 'Computer Fundamentals', 'Physics Concepts', 'Chemistry Essentials',
    'Biology Explorer', 'History Through Ages', 'Geography Simplified', 'Political Science Today', 'Economics for Schools',
    'The Story of My Experiments', 'Treasure Island', 'The Jungle Book', 'Gulliver’s Travels', 'The Merchant of Venice',
  ];

  for (const title of bookTitles) {
    bookRows.push({
      id: randomUUID(),
      title,
      author: faker.person.fullName(),
      isbn: faker.number.int({ min: 1000000000000, max: 9999999999999 }).toString(),
      category: randomItem(['Textbook', 'Reference', 'Fiction', 'Non-Fiction', 'Biography', 'Science']),
      totalCopies: faker.number.int({ min: 2, max: 8 }),
      available: faker.number.int({ min: 1, max: 5 }),
      status: 'Active',
    });
  }
  await batchInsert('library_books', prisma.libraryBook, bookRows, 2000);

  const bookIssues: any[] = [];
  const bookFines: any[] = [];
  faker.helpers.arrayElements(enrollments, Math.round(enrollments.length * 0.28)).forEach((enrollment) => {
    const issueDate = faker.date.between({ from: SESSION_START, to: SESSION_END });
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 14);
    const returned = faker.datatype.boolean();
    bookIssues.push({
      id: randomUUID(),
      bookId: randomItem(bookRows).id,
      enrollmentId: enrollment.id,
      issueDate,
      dueDate,
      returnDate: returned ? new Date(dueDate.getTime() + faker.number.int({ min: -3, max: 7 }) * 86400000) : null,
      status: returned ? 'Returned' : 'Issued',
    });
  });
  await batchInsert('book_issues', prisma.bookIssue, bookIssues, 3000);
  bookIssues.filter((issue) => issue.status !== 'Returned' && new Date(issue.dueDate) < new Date()).forEach((issue) => {
    bookFines.push({
      id: randomUUID(),
      issueId: issue.id,
      amount: faker.number.int({ min: 20, max: 150 }),
      status: 'Unpaid',
    });
  });
  await batchInsert('library_fines', prisma.libraryFine, bookFines, 2000);

  console.log('\n14a) Seeding library reservations...');
  const reservationRows: any[] = [];
  // Create a light reservation queue so the UI isn't empty.
  faker.helpers.arrayElements(enrollments, Math.round(enrollments.length * 0.03)).forEach((enrollment) => {
    const book = randomItem(bookRows);
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 7);
    reservationRows.push({
      id: randomUUID(),
      bookId: book.id,
      enrollmentId: enrollment.id,
      status: 'Reserved',
      expiresAt,
    });
  });
  await batchInsert('library_reservations', prisma.libraryReservation, reservationRows, 2000);

  console.log('\n15) Adding hostel, rooms, mess menus, and boarder attendance...');
  const hostelBoys = await prisma.hostel.create({ data: { name: 'Aravali Boys Hostel', type: 'BOYS', warden: staffRecords.find((s) => s.details?.designation === 'Warden')?.fullName || 'Warden' } });
  const hostelGirls = await prisma.hostel.create({ data: { name: 'Nilgiri Girls Hostel', type: 'GIRLS', warden: staffRecords.find((s) => s.details?.designation === 'Warden')?.fullName || 'Warden' } });

  const rooms: any[] = [];
  for (let i = 1; i <= 10; i++) {
    rooms.push({ id: randomUUID(), hostelId: hostelBoys.id, roomNumber: `B-${String(i).padStart(2, '0')}`, capacity: 4 });
    rooms.push({ id: randomUUID(), hostelId: hostelGirls.id, roomNumber: `G-${String(i).padStart(2, '0')}`, capacity: 4 });
  }
  await batchInsert('hostel_rooms', prisma.hostelRoom, rooms, 2000);

  const hostelAllocationRows: any[] = [];
  const hostelAttendanceRows: any[] = [];
  const messMenuRows: any[] = [];
  const boarders = faker.helpers.arrayElements(enrollments.filter((en) => classDefinitions.find((cls) => cls.id === en.sectionId) && ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].includes(classDefinitions.find((cls) => cls.id === en.sectionId)!.grade)), 120);
  const roomOccupancy: Record<string, number> = {};

  for (const enrollment of boarders) {
    const student = studentRows.find((st) => st.id === enrollment.studentId);
    if (!student) continue;
    const gender = student.gender;
    const eligibleRooms = rooms.filter((room) => gender === 'Male' ? room.roomNumber.startsWith('B-') : room.roomNumber.startsWith('G-'));
    const room = faker.helpers.arrayElement(eligibleRooms.filter((room) => (roomOccupancy[room.id] ?? 0) < room.capacity));
    if (!room) continue;
    roomOccupancy[room.id] = (roomOccupancy[room.id] ?? 0) + 1;
    hostelAllocationRows.push({ id: randomUUID(), roomId: room.id, enrollmentId: enrollment.id, status: 'Active' });
    for (const date of schoolDays) {
      hostelAttendanceRows.push({ id: randomUUID(), enrollmentId: enrollment.id, date, status: weightedPick([{ value: 'Present', weight: 94 }, { value: 'Leave', weight: 4 }, { value: 'Absent', weight: 2 }]) });
    }
  }

  await batchInsert('hostel_allocations', prisma.hostelAllocation, hostelAllocationRows, 2000);
  await batchInsert('hostel_attendance', prisma.hostelAttendance, hostelAttendanceRows, 5000);
  const weeklyMenu = {
    Monday: { Breakfast: 'Idli, sambar, banana', Lunch: 'Rice, dal, veg curry, curd', Dinner: 'Chapati, paneer masala, salad' },
    Tuesday: { Breakfast: 'Poha, boiled egg, milk', Lunch: 'Lemon rice, chana masala, buttermilk', Dinner: 'Jeera rice, mixed veg curry, soup' },
    Wednesday: { Breakfast: 'Dosa, chutney, fruit', Lunch: 'Chapati, rajma, rice, curd', Dinner: 'Veg pulao, raita, roasted papad' },
    Thursday: { Breakfast: 'Upma, coconut chutney, milk', Lunch: 'Sambar rice, beans poriyal, curd', Dinner: 'Chapati, dal tadka, aloo fry' },
    Friday: { Breakfast: 'Paratha, curd, fruit', Lunch: 'Rice, veg kurma, dal, salad', Dinner: 'Fried rice, gobi manchurian, soup' },
    Saturday: { Breakfast: 'Pongal, chutney, banana', Lunch: 'Bisibele bath, chips, curd', Dinner: 'Chapati, chole, halwa' },
    Sunday: { Breakfast: 'Poori, aloo sabzi, juice', Lunch: 'Special veg biryani, raita, sweet', Dinner: 'Noodles, manchurian, fruit custard' },
  } as const;

  [hostelBoys.id, hostelGirls.id].forEach((hostelId) => {
    Object.entries(weeklyMenu).forEach(([dayOfWeek, meals]) => {
      Object.entries(meals).forEach(([mealType, items]) => {
        messMenuRows.push({
          id: randomUUID(),
          hostelId,
          dayOfWeek,
          mealType,
          items,
        });
      });
    });
  });
  await batchInsert('mess_menus', prisma.messMenu, messMenuRows, 500);

  console.log('\n16) Seeding inventory, assets, purchase requisitions, and maintenance logs...');
  const assetCategories = ['Computers', 'Projectors', 'Furniture', 'Sports Equipment', 'Lab Equipment', 'Library', 'Transport'];
  const assetCategoryRows = assetCategories.map((name) => ({ id: randomUUID(), name, status: 'Active' }));
  await batchInsert('asset_categories', prisma.assetCategory, assetCategoryRows);

  const assetRows: any[] = [];
  assetCategories.forEach((category) => {
    for (let i = 1; i <= 6; i++) {
      assetRows.push({
        id: randomUUID(),
        categoryId: assetCategoryRows.find((cat) => cat.name === category)!.id,
        campusId: campus.id,
        name: `${category} Item ${i}`,
        quantity: faker.number.int({ min: 5, max: 35 }),
        status: 'Active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  });
  await batchInsert('assets', prisma.asset, assetRows);

  const purchaseRows: any[] = [];
  for (let i = 1; i <= 12; i++) {
    purchaseRows.push({
      id: randomUUID(),
      campusId: campus.id,
      itemName: randomItem(['Refill cartridges', 'Projector bulb', 'Whiteboard markers', 'Chemistry reagents', 'Sports kit', 'Desktop PC']),
      quantity: faker.number.int({ min: 5, max: 20 }),
      estimatedCost: Number(faker.number.int({ min: 5000, max: 45000 })),
      purpose: 'Routine replenishment',
      status: randomItem(['Pending', 'Approved', 'Received']),
      createdAt: new Date(),
    });
  }
  await batchInsert('purchase_requisitions', prisma.purchaseRequisition, purchaseRows);

  console.log('\n17) Creating academic calendar events and notifications...');
  await batchInsert('acms_holiday_master', prisma.aCMSHolidayMaster, HOLIDAYS.map((holiday) => ({
    id: randomUUID(),
    name: holiday.name,
    date: new Date(holiday.date),
    type: holiday.type,
    campusId: campus.id,
    description: `${holiday.name} observed by the school`,
  })));

  await batchInsert('acms_academic_terms', prisma.aCMSAcademicTerm, [
    { id: randomUUID(), sessionId: session.id, name: 'Term 1', startDate: SESSION_START, endDate: new Date('2026-10-31') },
    { id: randomUUID(), sessionId: session.id, name: 'Term 2', startDate: new Date('2026-11-01'), endDate: SESSION_END },
  ]);

  const eventRows = [
    { title: 'Annual Sports Day', description: 'Inter-house athletics and field events.', startDate: new Date('2026-09-25'), endDate: new Date('2026-09-25'), type: 'SPORTS', organizer: 'Sports Department' },
    { title: 'Annual Day Function', description: 'Cultural programme and awards ceremony.', startDate: new Date('2027-03-10'), endDate: new Date('2027-03-10'), type: 'CULTURAL', organizer: 'Principal Office' },
    { title: 'Parent-Teacher Meeting', description: 'Parent-teacher conferences for Term 1.', startDate: new Date('2026-06-20'), endDate: new Date('2026-06-20'), type: 'ACADEMIC', organizer: 'Academic Coordinator' },
    { title: 'Science Exhibition', description: 'Student-led science projects and live demonstrations.', startDate: new Date('2026-11-28'), endDate: new Date('2026-11-28'), type: 'ACADEMIC', organizer: 'Science Department' },
  ].map((event) => ({ id: randomUUID(), sessionId: session.id, ...event, createdAt: new Date() }));
  await batchInsert('acms_events', prisma.aCMSEvent, eventRows);

  const announcementRows = [
    { title: 'Welcome to Central Academy', body: 'Excited to welcome families for the academic session 2026-27.', targetAudience: 'ALL' },
    { title: 'Fee Payment Reminder', body: 'Term 2 fee invoices are due by Dec 31, 2026.', targetAudience: 'PARENTS' },
    { title: 'PTA Meeting Scheduled', body: 'Parent-Teacher meetings take place on June 20, 2026.', targetAudience: 'PARENTS' },
    { title: 'Sports Day Announcement', body: 'Annual Sports Day is scheduled for September 25, 2026.', targetAudience: 'ALL' },
    { title: 'Library Week', body: 'Library week activities begin next Monday.', targetAudience: 'STUDENTS' },
  ].map((item) => ({ ...item, id: randomUUID(), createdBy: principal.id, eventDate: new Date(), updatedAt: new Date() }));
  await batchInsert('announcements', prisma.announcement, announcementRows);

  const notificationRows: any[] = [];
  for (const parent of parentRows.slice(0, 100)) {
    notificationRows.push({ id: randomUUID(), userId: parent.id, title: 'Fee Due Reminder', message: 'Please clear outstanding fee invoices before the due date.', type: 'SMS', status: 'UNREAD', createdAt: new Date() });
  }
  for (const staff of staffRecords.slice(0, 50)) {
    notificationRows.push({ id: randomUUID(), userId: staff.id, title: 'Staff Meeting', message: 'Monthly staff meeting scheduled in the auditorium at 4 PM.', type: 'EMAIL', status: 'UNREAD', createdAt: new Date() });
  }
  await batchInsert('aCMS_notifications', prisma.aCMSNotification, notificationRows);

  console.log('\n18) Issuing certificates for top performers and participation...');
  const certificateRows: any[] = [];
  const topPerformers = enrollments.filter((_, index) => index % 40 === 0).slice(0, 120);
  for (const enrollment of topPerformers) {
    certificateRows.push({
      id: randomUUID(),
      studentId: enrollment.studentId,
      type: 'MERIT',
      title: 'Merit Certificate',
      fileUrl: 'https://centralacademy.edu/certificates/merit.pdf',
      issueDate: new Date('2027-03-15'),
    });
  }
  await batchInsert('certificates', prisma.certificate, certificateRows);

  console.log('\n19) Final validation summary...');
  const studentCount = await prisma.student.count();
  const staffCount = await prisma.staff.count();
  const sectionCount = await prisma.section.count();
  const invoiceCount = await prisma.feeInvoice.count();
  const examCount = await prisma.exam.count();
  const libraryCount = await prisma.libraryBook.count();
  const routeCount = await prisma.transportRoute.count();
  const eventCount = await prisma.aCMSEvent.count();

  console.log(`Students: ${studentCount}`);
  console.log(`Staff: ${staffCount}`);
  console.log(`Sections: ${sectionCount}`);
  console.log(`Fee invoices: ${invoiceCount}`);
  console.log(`Exams: ${examCount}`);
  console.log(`Library books: ${libraryCount}`);
  console.log(`Transport routes: ${routeCount}`);
  console.log(`Events: ${eventCount}`);
  console.log('Demo dataset ready. Use the following logins:');
  console.log('  Super Admin: superadmin@centralacademy.edu / Admin@123');
  console.log('  Principal: principal@centralacademy.edu / Staff@123');
  console.log(`  Parent sample: ${parentRows[0]?.email || 'n/a'} / Parent@123`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
