/* eslint-disable */
// Run this file with: npm run seed:demo
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import { randomUUID } from 'crypto';
import { PromotionsService } from '../src/promotions/promotions.service';
import { DocumentRenderingService } from '../src/documents/document-rendering.service';
import { StorageService } from '../src/storage/storage.service';

const prisma = new PrismaClient();

const BASE_FAKER_SEED = 20260804;

// Single-campus demo data, two sessions with real temporal meaning relative
// to "today" (2026-08-13), not two arbitrary future years:
//   - Historical session (2025-2026): fully in the past, seeded completely
//     (every data type, every school day, full year — no truncation) — this
//     is what gets promoted FROM.
//   - Current session (2026-2027): the one actually active today, seeded
//     from its start through today — this is what gets promoted TO.
const SESSION_DEFS = [
  {
    name: '2025-2026',
    start: new Date('2025-04-01'),
    end: new Date('2026-03-15'),
    isActive: false,
  },
  {
    name: '2026-2027',
    start: new Date('2026-04-01'),
    end: new Date('2027-03-15'),
    isActive: true,
  },
] as const;

// Backward-compatible defaults (used by parts of the seed that we refactor gradually).
const SESSION_NAME = SESSION_DEFS[0].name;
const SESSION_START = SESSION_DEFS[0].start;
const SESSION_END = SESSION_DEFS[0].end;
const TODAY = new Date('2026-08-13');

const CLASS_NAMES = ['Nursery', 'LKG', 'UKG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
// EMS is seeded for a representative slice (both grades share the same
// subject list) rather than the whole school — the point is a real,
// complete attempt->evaluation->result chain with many real students, not
// matching the core Exam system's full-population volume.
const EMS_TARGET_GRADES = ['Grade 9', 'Grade 10'];
const EMS_TARGET_SUBJECTS = ['English', 'Mathematics', 'Physics'];
const SECTION_NAMES = ['A', 'B', 'C', 'D'];
const STAFF_PASSWORD = 'Staff@123';
const PARENT_PASSWORD = 'Parent@123';
const ADMIN_PASSWORD = 'Admin@123';
const MAX_STUDENTS_PER_SECTION = 80;
const MIN_STUDENTS_PER_SECTION = 72;
const TRANSPORT_ROUTES = 30;

// Single-campus deployment — the per-campus loop below still exists (kept
// intentionally rather than unwound) because every downstream section reads
// `campus`/`def` from it; with exactly one entry it just runs once. `slug`
// still folds into generated identifiers (admission numbers, vehicle
// numbers, parent emails, ID card numbers) purely for readability, not to
// avoid collisions across campuses anymore.
const CAMPUS_DEFS = [
  {
    slug: 'main',
    name: 'Central Academy',
    address: 'Hebbal, Bengaluru, Karnataka 560024',
    latitude: 12.9898,
    longitude: 77.5946,
    fakerSeedOffset: 0,
    admissionYear: 2025,
    vehiclePrefix: 'KA-05',
  },
] as const;

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
  // 'Teacher' (the general classroom-teacher pool) is generated separately
  // below with a larger count so the class/section/subject assignment loop
  // (§4) has enough bodies to draw from — kept out of this list so its
  // count isn't accidentally touched by the Principal/VP/AC dedup fix.
];
const GENERAL_TEACHER_COUNT = 60;

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
  // Historical-session holidays (2025-2026) — same calendar shape, one year
  // earlier, so the fully-seeded historical session has its own holiday set.
  { name: 'Ambedkar Jayanti', date: '2025-04-14', type: 'NATIONAL' },
  { name: 'Labour Day', date: '2025-05-01', type: 'NATIONAL' },
  { name: 'Independence Day', date: '2025-08-15', type: 'NATIONAL' },
  { name: 'Gandhi Jayanti', date: '2025-10-02', type: 'NATIONAL' },
  { name: 'Diwali Break', date: '2025-10-20', type: 'SCHOOL' },
  { name: 'Diwali Break', date: '2025-10-21', type: 'SCHOOL' },
  { name: 'Christmas', date: '2025-12-25', type: 'NATIONAL' },
  { name: 'New Year', date: '2026-01-01', type: 'NATIONAL' },
  { name: 'Republic Day', date: '2026-01-26', type: 'NATIONAL' },
  { name: 'Holi', date: '2026-03-04', type: 'NATIONAL' },
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

// Adds a fractional-hour offset to a "HH:MM" string, used to derive a
// plausible check-out time from a check-in time (e.g. '08:55' + 6.5h ->
// '15:25') without carrying a full Date object through the attendance rows.
function addHoursToTime(time: string, hours: number): string {
  const [h, m] = time.split(':').map(Number);
  const totalMinutes = h * 60 + m + Math.round(hours * 60);
  const outH = Math.floor(totalMinutes / 60) % 24;
  const outM = totalMinutes % 60;
  return `${String(outH).padStart(2, '0')}:${String(outM).padStart(2, '0')}`;
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

// Every role a Staff account can hold. Super Admin / Principal are '*'
// (canAccessAllCampuses) — genuinely cross-campus roles, kept as ONE shared
// account each rather than duplicated per campus (a "Campus A Super Admin"
// isn't a meaningful separate concept from "Campus B Super Admin" when both
// already see everything). Every other role is campus-restricted and gets
// its own named account per campus — that's the actual point of this data:
// a real, memorable login to prove isolation with.
const CAMPUS_SPECIFIC_NAMED_ROLES: { role: string; fullName: string; slug: string }[] = [
  { role: 'Vice Principal', fullName: 'Ananya Nair', slug: 'viceprincipal' },
  { role: 'Academic Coordinator', fullName: 'Rahul Sharma', slug: 'academics' },
  { role: 'Teacher', fullName: 'Priya Menon', slug: 'teacher' },
  { role: 'Accountant', fullName: 'Suresh Kumar', slug: 'accountant' },
  { role: 'Librarian', fullName: 'Lakshmi Iyer', slug: 'librarian' },
  { role: 'Warden', fullName: 'Geeta Rao', slug: 'warden' },
  { role: 'Transport Manager', fullName: 'Arjun Reddy', slug: 'transportmanager' },
  { role: 'Driver', fullName: 'Manjunath Gowda', slug: 'driver' },
  { role: 'Conductor', fullName: 'Ravi Shankar', slug: 'conductor' },
  { role: 'Admin Staff', fullName: 'Kavya Pillai', slug: 'adminstaff' },
  { role: 'Nurse', fullName: 'Fatima Sheikh', slug: 'nurse' },
  { role: 'Reception', fullName: 'Divya Bhat', slug: 'reception' },
  { role: 'Security', fullName: 'Nagesh Patil', slug: 'security' },
];

type CampusDef = (typeof CAMPUS_DEFS)[number];
type NamedAccount = { role: string; fullName: string; email: string; password: string; campus: string };

// Runs the full EMS chain once per exam cycle (question bank -> paper ->
// schedule/seating/invigilation -> real online/offline student attempts ->
// evaluation -> moderation -> gradebook/result/report card when fullyGraded).
// Module-level (not a closure) so both the historical-session pass and the
// current-session pass can call it with their own enrollments/dates.
async function seedEmsCycle(opts: {
  campusId: string;
  subjectMap: Record<string, string>;
  teacherIds: string[];
  namedStaffIdsThisCampus: string[];
  sectionToClassMap: Record<string, { classId: string; grade: string }>;
  emsRooms: { id: string }[];
  emsExamTemplateRows: { id: string }[];
  emsGradingScheme: { ranges: any };
  emsTargetClasses: { id: string; grade: string }[];
  sessionName: string; sessionStart: Date; sessionEnd: Date; sessionIsActive: boolean;
  examTypeIdx: 0 | 1; examDate: Date; mode: 'OFFLINE' | 'ONLINE'; fullyGraded: boolean;
  targetEnrollments: any[];
}) {
  const { subjectMap, teacherIds, namedStaffIdsThisCampus, sectionToClassMap, emsRooms, emsExamTemplateRows, emsGradingScheme, emsTargetClasses } = opts;
  const emsSession = await prisma.eMSExamSession.create({
    data: { name: opts.sessionName, startDate: opts.sessionStart, endDate: opts.sessionEnd, isActive: opts.sessionIsActive, campusId: opts.campusId },
  });

  for (const subjectName of EMS_TARGET_SUBJECTS) {
    const questionBank = await prisma.eMSQuestionBank.create({
      data: { title: `${subjectName} Question Bank`, description: `${subjectName} MCQ repository`, subjectId: subjectMap[subjectName] },
    });
    const questionRows = Array.from({ length: 10 }).map((_, i) => {
      const options = [{ id: 'A', text: `Option A for Q${i + 1}` }, { id: 'B', text: `Option B for Q${i + 1}` }, { id: 'C', text: `Option C for Q${i + 1}` }, { id: 'D', text: `Option D for Q${i + 1}` }];
      return {
        id: randomUUID(), questionBankId: questionBank.id, type: 'MCQ', text: `${subjectName} question ${i + 1}: sample assessment item.`,
        bloomLevel: randomItem(['Remember', 'Understand', 'Apply', 'Analyze']), difficulty: randomItem(['EASY', 'MEDIUM', 'HARD']),
        options, correctOptionId: 'A', marks: 10, createdAt: new Date(),
      };
    });
    await batchInsert(`ems_questions_${subjectName}`, prisma.eMSQuestion, questionRows, 500);

    const paper = await prisma.eMSQuestionPaper.create({
      data: { title: `${subjectName} — ${opts.sessionName}`, subjectId: subjectMap[subjectName], totalMarks: 100, durationMin: 90, isApproved: true },
    });
    await batchInsert(`ems_paper_items_${subjectName}`, prisma.eMSQuestionPaperItem, questionRows.map((q, idx) => ({
      id: randomUUID(), questionPaperId: paper.id, questionId: q.id, sequence: idx + 1, marks: q.marks,
    })), 500);

    for (const classDef of emsTargetClasses) {
      const schedule = await prisma.eMSExamSchedule.create({
        data: {
          sessionId: emsSession.id, templateId: emsExamTemplateRows[opts.examTypeIdx].id, subjectId: subjectMap[subjectName],
          date: opts.examDate, startTime: new Date(`${fmt(opts.examDate)}T09:00:00`), endTime: new Date(`${fmt(opts.examDate)}T10:30:00`),
          mode: opts.mode, durationMin: 90, questionPaperId: paper.id,
        },
      });

      const room = await prisma.eMSExamRoom.create({ data: { scheduleId: schedule.id, roomId: randomItem(emsRooms).id, capacity: 150 } });
      const classEnrollments = opts.targetEnrollments.filter((e) => sectionToClassMap[e.sectionId]?.classId === classDef.id);
      const seatingRows = classEnrollments.map((e, idx) => ({ id: randomUUID(), roomId: room.id, studentId: e.studentId, seatNumber: `S-${idx + 1}` }));
      await batchInsert('ems_exam_seatings', prisma.eMSExamSeating, seatingRows, 2000);
      await prisma.eMSInvigilator.create({ data: { roomId: room.id, staffId: randomItem(teacherIds) } });

      const attemptRows = classEnrollments.map((e) => ({ id: randomUUID(), scheduleId: schedule.id, studentId: e.studentId, status: 'PRESENT', startedAt: opts.examDate, endedAt: new Date(opts.examDate.getTime() + 80 * 60000), createdAt: opts.examDate }));
      await batchInsert('ems_exam_attempts', prisma.eMSExamAttempt, attemptRows, 3000);

      if (opts.mode === 'ONLINE') {
        const submissionRows = attemptRows.map((a) => ({
          id: randomUUID(), attemptId: a.id, scheduleId: schedule.id, startedAt: a.startedAt, submittedAt: a.endedAt,
          autoSubmitted: false, status: opts.fullyGraded ? 'GRADED' : 'SUBMITTED', createdAt: a.startedAt,
        }));
        await batchInsert('ems_online_submissions', prisma.eMSOnlineSubmission, submissionRows, 3000);

        const answerRows: any[] = [];
        submissionRows.forEach((submission) => {
          questionRows.forEach((question) => {
            const isCorrect = faker.number.int({ min: 1, max: 100 }) <= 78;
            answerRows.push({
              id: randomUUID(), submissionId: submission.id, questionId: question.id,
              selectedOptionId: isCorrect ? question.correctOptionId : randomItem(['A', 'B', 'C', 'D'].filter((o) => o !== question.correctOptionId)),
              textAnswer: null, isCorrect, marksAwarded: isCorrect ? question.marks : 0,
            });
          });
        });
        await batchInsert('ems_answers', prisma.eMSAnswer, answerRows, 5000);
      } else {
        const answerSheetRows = attemptRows.map((a) => ({ id: randomUUID(), attemptId: a.id, fileUrl: `https://centralacademy.edu/ems/answer-sheets/${a.id}.pdf`, content: null, isGraded: opts.fullyGraded, createdAt: a.startedAt }));
        await batchInsert('ems_answer_sheets', prisma.eMSAnswerSheet, answerSheetRows, 3000);
      }

      const evaluationRows = attemptRows.map((a) => ({
        id: randomUUID(), attemptId: a.id, evaluatorId: randomItem(teacherIds),
        marksObtained: faker.number.int({ min: 30, max: 98 }), remarks: opts.fullyGraded ? 'Evaluated and finalized.' : 'Evaluation in progress.',
        gradedAt: opts.fullyGraded ? new Date(opts.examDate.getTime() + 5 * 86400000) : a.startedAt,
      }));
      if (opts.fullyGraded) {
        await batchInsert('ems_evaluation_records', prisma.eMSEvaluationRecord, evaluationRows, 3000);
        await prisma.eMSModerationRecord.create({
          data: { scheduleId: schedule.id, moderatorId: namedStaffIdsThisCampus[1] ?? teacherIds[0], graceMarks: 2, reason: 'Standard moderation adjustment for question difficulty.', approvedAt: new Date(opts.examDate.getTime() + 7 * 86400000) },
        });
      }
    }
  }

  if (opts.fullyGraded) {
    for (const classDef of emsTargetClasses) {
      const gradebook = await prisma.eMSGradebook.create({ data: { sessionId: emsSession.id, classId: classDef.id, isPublished: true } });
      const classEnrollments = opts.targetEnrollments.filter((e) => sectionToClassMap[e.sectionId]?.classId === classDef.id);
      const resultRows = classEnrollments.map((e) => {
        const percentage = faker.number.int({ min: 35, max: 98 });
        const scheme = emsGradingScheme.ranges as any[];
        const grade = scheme.find((r) => percentage >= r.min && percentage <= r.max)?.grade ?? 'C';
        return { id: randomUUID(), gradebookId: gradebook.id, studentId: e.studentId, totalMarks: percentage * EMS_TARGET_SUBJECTS.length, percentage, grade, gpa: Number((percentage / 10).toFixed(1)), rank: null as number | null, createdAt: new Date() };
      });
      resultRows.sort((a, b) => b.percentage - a.percentage).forEach((r, idx) => { r.rank = idx + 1; });
      await batchInsert('ems_results', prisma.eMSResult, resultRows, 3000);

      const reportCardRows = classEnrollments.map((e) => ({
        id: randomUUID(), studentId: e.studentId, sessionId: emsSession.id, fileUrl: `https://centralacademy.edu/ems/report-cards/${e.studentId}.pdf`,
        remarks: 'Consistent performance across the session.', attendance: 95, publishedAt: opts.sessionEnd,
      }));
      await batchInsert('ems_report_cards', prisma.eMSReportCard, reportCardRows, 3000);
    }
  }
}

async function main() {
  console.log('Starting enterprise-grade demo seed for Aegis OS School ERP...');
  await resetDatabase();

  const schoolDays = getSchoolDaysForRange(SESSION_START, SESSION_END);
  console.log(`Historical session (${SESSION_DEFS[0].name}) attendance days: ${schoolDays.length} (full session, no truncation)`);
  const currentSessionDays = getSchoolDaysForRange(SESSION_DEFS[1].start, TODAY);
  console.log(`Current session (${SESSION_DEFS[1].name}) attendance days (start through today): ${currentSessionDays.length}`);

  const sharedHash = await bcrypt.hash(STAFF_PASSWORD, 10);
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const parentHash = await bcrypt.hash(PARENT_PASSWORD, 10);

  // ==========================================
  // GLOBAL / SHARED — created once, not per campus. Roles are school-wide
  // RBAC, Subjects are shared curriculum, IdCardTemplates are shared design
  // templates, AcademicSessions/AcademicTerms are school-wide session
  // structure — none of these have a campusId column, duplicating them per
  // campus would be semantically wrong, not just wasteful.
  // ==========================================
  console.log('\n1) Creating school, sessions, roles, subjects, ID templates...');
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

  const sessions: any[] = [];
  for (const def of SESSION_DEFS) {
    const created = await prisma.academicSession.create({
      data: { name: def.name, isActive: def.isActive, status: 'Active' },
    });
    sessions.push(created);
  }
  const historicalSession = sessions[0];
  const currentSession = sessions[1];

  // VIEW_OWN_SCHEDULE / VIEW_OWN_PROFILE — found missing from every role
  // except Teacher while testing the driver mobile flow: GET
  // /portal/staff/:id/dashboard (the "my dashboard/vehicle assignment"
  // widget every staff role's own app screen depends on) requires
  // VIEW_OWN_SCHEDULE and is already self-access-gated (@RequireSelfAccess),
  // so granting it to every staff role is just "can see your own basic
  // dashboard," not a privilege expansion — added to all non-'*' roles below.
  const roleDefinitions = [
    { name: 'Super Admin', permissions: ['*'] },
    { name: 'Principal', permissions: ['*'] },
    { name: 'Vice Principal', permissions: ['VIEW_OWN_PROFILE', 'VIEW_OWN_SCHEDULE', 'VIEW_STUDENTS', 'MANAGE_USERS', 'MANAGE_ACADEMICS', 'MARK_ATTENDANCE', 'MANAGE_EXAMS', 'MANAGE_FEES', 'VIEW_REPORTS', 'MANAGE_TRANSPORT', 'MANAGE_TRANSPORT_FLEET', 'MANAGE_LMS', 'MANAGE_DISCIPLINE', 'MANAGE_GRIEVANCES'] },
    { name: 'Academic Coordinator', permissions: ['VIEW_OWN_PROFILE', 'VIEW_OWN_SCHEDULE', 'VIEW_STUDENTS', 'MANAGE_ACADEMICS', 'MANAGE_EXAMS', 'VIEW_REPORTS', 'MANAGE_ACTIVITIES', 'USE_AI_ASSISTANT'] },
    { name: 'Teacher', permissions: ['VIEW_OWN_PROFILE', 'VIEW_OWN_SCHEDULE', 'VIEW_STUDENTS', 'MARK_ATTENDANCE', 'MANAGE_GRADES', 'MANAGE_EXAMS', 'MANAGE_LMS', 'VIEW_REPORTS', 'MANAGE_ACTIVITIES', 'USE_AI_ASSISTANT'] },
    { name: 'Accountant', permissions: ['VIEW_OWN_PROFILE', 'VIEW_OWN_SCHEDULE', 'MANAGE_FEES', 'VIEW_REPORTS'] },
    { name: 'Librarian', permissions: ['VIEW_OWN_PROFILE', 'VIEW_OWN_SCHEDULE', 'MANAGE_ACADEMICS', 'VIEW_REPORTS'] },
    { name: 'Warden', permissions: ['VIEW_OWN_PROFILE', 'VIEW_OWN_SCHEDULE', 'MANAGE_HOSTEL', 'VIEW_REPORTS'] },
    { name: 'Transport Manager', permissions: ['VIEW_OWN_PROFILE', 'VIEW_OWN_SCHEDULE', 'MANAGE_TRANSPORT', 'MANAGE_TRANSPORT_FLEET', 'VIEW_REPORTS'] },
    { name: 'Driver', permissions: ['VIEW_OWN_PROFILE', 'VIEW_OWN_SCHEDULE', 'MANAGE_TRANSPORT', 'VIEW_REPORTS'] },
    { name: 'Conductor', permissions: ['VIEW_OWN_PROFILE', 'VIEW_OWN_SCHEDULE', 'MANAGE_TRANSPORT'] },
    { name: 'Admin Staff', permissions: ['VIEW_OWN_PROFILE', 'VIEW_OWN_SCHEDULE', 'MANAGE_USERS', 'MANAGE_COMMUNICATION', 'VIEW_REPORTS', 'MANAGE_ADMISSIONS_PIPELINE', 'MANAGE_GRIEVANCES', 'MANAGE_DIARY', 'MANAGE_NEWS', 'MANAGE_LOST_FOUND', 'MANAGE_DOCUMENTS', 'MANAGE_HR'] },
    { name: 'Nurse', permissions: ['VIEW_OWN_PROFILE', 'VIEW_OWN_SCHEDULE', 'MANAGE_HEALTH_RECORDS', 'VIEW_REPORTS'] },
    { name: 'Reception', permissions: ['VIEW_OWN_PROFILE', 'VIEW_OWN_SCHEDULE', 'MANAGE_VISITORS', 'VIEW_REPORTS'] },
    { name: 'Security', permissions: ['VIEW_OWN_PROFILE', 'VIEW_OWN_SCHEDULE', 'MANAGE_VISITORS', 'VIEW_REPORTS'] },
    { name: 'Parent', permissions: ['VIEW_CHILD_PROFILE', 'PAY_FEES', 'VIEW_REPORTS', 'VIEW_CHILD_GRADES'] },
    { name: 'Student', permissions: ['VIEW_OWN_PROFILE', 'VIEW_OWN_GRADES', 'VIEW_LMS'] },
  ];

  const roles: Record<string, string> = {};
  for (const role of roleDefinitions) {
    const created = await prisma.role.create({
      data: { name: role.name, permissions: role.permissions, schoolProfileId: schoolProfile.id },
    });
    roles[role.name] = created.id;
  }

  const subjectMap: Record<string, string> = {};
  for (const name of SUBJECTS) {
    const created = await prisma.subject.create({ data: { name, medium: name === 'Hindi' ? 'Hindi' : 'English' } });
    subjectMap[name] = created.id;
  }

  const studentTemplate = await prisma.idCardTemplate.create({
    data: { templateName: 'Student ID 2026-27', targetRole: 'Student', schoolName: schoolProfile.name, logoUrl: '', primaryColor: '#1f2937', secondaryColor: '#f59e0b' },
  });
  const staffTemplate = await prisma.idCardTemplate.create({
    data: { templateName: 'Staff ID 2026-27', targetRole: 'Staff', schoolName: schoolProfile.name, logoUrl: '', primaryColor: '#003262', secondaryColor: '#f97316' },
  });

  await batchInsert('acms_academic_terms', prisma.aCMSAcademicTerm, [
    { id: randomUUID(), sessionId: historicalSession.id, name: 'Term 1', startDate: SESSION_START, endDate: new Date('2025-10-31') },
    { id: randomUUID(), sessionId: historicalSession.id, name: 'Term 2', startDate: new Date('2025-11-01'), endDate: SESSION_END },
    { id: randomUUID(), sessionId: currentSession.id, name: 'Term 1', startDate: SESSION_DEFS[1].start, endDate: new Date('2026-10-31') },
    { id: randomUUID(), sessionId: currentSession.id, name: 'Term 2', startDate: new Date('2026-11-01'), endDate: SESSION_DEFS[1].end },
  ]);

  // Generic, school-wide announcements — content isn't campus-specific, so
  // these stay null-campusId (school-wide, per B2's decided semantics),
  // created once rather than duplicated.
  const announcementRows = [
    { title: 'Welcome to Central Academy', body: 'Excited to welcome families for the academic session 2026-27.', targetAudience: 'ALL' },
    { title: 'Fee Payment Reminder', body: 'Term 2 fee invoices are due by Dec 31, 2026.', targetAudience: 'PARENTS' },
    { title: 'PTA Meeting Scheduled', body: 'Parent-Teacher meetings take place on June 20, 2026.', targetAudience: 'PARENTS' },
    { title: 'Sports Day Announcement', body: 'Annual Sports Day is scheduled for September 25, 2026.', targetAudience: 'ALL' },
    { title: 'Library Week', body: 'Library week activities begin next Monday.', targetAudience: 'STUDENTS' },
  ];

  const namedAccounts: NamedAccount[] = [];
  const sampleAccounts: { campus: string; parentEmail: string; studentAdmissionNumber: string }[] = [];

  // ==========================================
  // PER-CAMPUS — everything below runs once per entry in CAMPUS_DEFS,
  // producing two fully independent populations (own classes, staff,
  // students, transport fleet, fees, exams, library, hostel, etc.) rather
  // than one dataset artificially split — matches how Phase 0b's decisions
  // already model Transport/Hostel/Library/SchoolHouse/EMS as genuinely
  // per-campus, separate operating units.
  // ==========================================
  const campusContext: Record<string, {
    campusId: string;
    classDefinitions: any[];
    sectionToClassMap: Record<string, { classId: string; grade: string }>;
    vehicles: any[];
    routeRows: any[];
    driverIds: string[];
    ems?: {
      teacherIds: string[];
      namedStaffIdsThisCampus: string[];
      sectionToClassMap: Record<string, { classId: string; grade: string }>;
      emsRooms: { id: string }[];
      emsExamTemplateRows: { id: string }[];
      emsGradingScheme: { ranges: any };
      emsTargetClasses: { id: string; grade: string }[];
    };
  }> = {};

  for (const def of CAMPUS_DEFS) {
    console.log(`\n=== Seeding campus: ${def.name} (${def.slug}) ===`);
    faker.seed(BASE_FAKER_SEED + def.fakerSeedOffset);

    const campus = await prisma.campus.create({
      data: {
        schoolProfileId: schoolProfile.id,
        name: def.name,
        address: def.address,
        capacity: 5000,
        status: 'Active',
        latitude: def.latitude,
        longitude: def.longitude,
      },
    });

    // Super Admin / Principal — one shared account each, canAccessAllCampuses
    // via '*', created only on the first campus iteration (Staff.campusId is
    // a required column — Phase 0 of this initiative — so they can't exist
    // before any campus does; "home" campus is otherwise arbitrary since it
    // doesn't restrict them). Announcements need principal.id, so they're
    // created here too, once, on the first iteration.
    if (def.slug === CAMPUS_DEFS[0].slug) {
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
          details: { designation: 'Principal' },
          campusId: campus.id,
        },
      });

      await batchInsert(
        'announcements',
        prisma.announcement,
        announcementRows.map((item) => ({ ...item, id: randomUUID(), createdBy: principal.id, eventDate: new Date(), updatedAt: new Date() })),
      );

      namedAccounts.push(
        { role: 'Super Admin', fullName: superAdmin.fullName, email: superAdmin.email, password: ADMIN_PASSWORD, campus: 'shared (all campuses)' },
        { role: 'Principal', fullName: principal.fullName, email: principal.email, password: STAFF_PASSWORD, campus: 'shared (all campuses)' },
      );
    }

    console.log('\n1b) Creating campus-restricted named accounts...');
    const namedStaffIdsThisCampus: string[] = [];
    let namedDriverIdThisCampus: string | null = null;
    let namedTeacherIdThisCampus: string | null = null;
    for (const named of CAMPUS_SPECIFIC_NAMED_ROLES) {
      const email = `${named.slug}.${def.slug}@centralacademy.edu`;
      const account = await prisma.staff.create({
        data: {
          fullName: `${named.fullName} (${def.name.replace('Central Academy ', '')})`,
          email,
          passwordHash: sharedHash,
          roleId: roles[named.role],
          status: 'Active',
          campusId: campus.id,
          details: { designation: named.role },
        },
      });
      namedAccounts.push({ role: named.role, fullName: account.fullName, email, password: STAFF_PASSWORD, campus: def.name });
      namedStaffIdsThisCampus.push(account.id);
      if (named.role === 'Driver') namedDriverIdThisCampus = account.id;
      if (named.role === 'Teacher') namedTeacherIdThisCampus = account.id;
    }

    console.log('\n2) Creating classes, sections, and fee structures...');
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
          sessionId: historicalSession.id,
          status: 'Active',
          sections: { create: SECTION_NAMES.map((section) => ({ name: section })) },
        },
        include: { sections: true },
      });

      classDefinitions.push({ id: createdClass.id, grade, sections: createdClass.sections.map((section) => ({ id: section.id, name: section.name })) });

      const amount = 12500 + CLASS_NAMES.indexOf(grade) * 1100;
      const fee = await prisma.feeStructure.create({
        data: {
          name: `${grade} Tuition 2025-26`,
          amount: amount.toString(),
          cycle: 'Annual',
          sessionId: historicalSession.id,
          classId: createdClass.id,
        },
      });

      createdClass.sections.forEach((section) => {
        sectionToClassMap[section.id] = { classId: createdClass.id, grade };
        feeStructureMap[section.id] = fee.id;
      });

      for (const subjectName of CLUSTER_SUBJECTS[grade]) {
        classSubjectRelations.push({ classId: createdClass.id, subjectId: subjectMap[subjectName] });
      }
    }
    await batchInsert('class_subjects', prisma.classSubject, classSubjectRelations);
    campusContext[def.slug] = { campusId: campus.id, classDefinitions, sectionToClassMap, vehicles: [], routeRows: [], driverIds: [] };

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

    const allStaffRoleDefs = [...STAFF_ROLES, { name: 'Teacher', count: GENERAL_TEACHER_COUNT, baseSalary: [35000, 55000] as [number, number] }];
    for (const role of allStaffRoleDefs) {
      for (let index = 1; index <= role.count; index++) {
        const gender = faker.person.sex() as 'male' | 'female';
        const firstName = faker.person.firstName(gender);
        const lastName = faker.person.lastName();
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${def.slug}.${index}@centralacademy.edu`.replace(/[^a-z0-9@\.]/g, '');
        const name = `${firstName} ${lastName}`;
        const staffId = makeStaff(name, email, role.name, gender === 'male' ? 'Male' : 'Female', faker.number.int({ min: role.baseSalary[0], max: role.baseSalary[1] }), { designation: role.name });
        if (roleTypeOnly.includes(role.name)) {
          teacherIds.push(staffId);
          if (!teacherPool[role.name]) teacherPool[role.name] = [];
          teacherPool[role.name].push(staffId);
        }
      }
    }

    // The named demo "Teacher" account (created in step 1b, above) was never
    // part of this bulk-generated pool — every downstream consumer of
    // teacherIds/teacherPool (class-teacher/subject TeacherAssignment,
    // EMSInvigilator, EMSEvaluationRecord) sampled exclusively from bulk
    // teachers, leaving the named account with zero assignments/duties in
    // any session. Join it into the same pool so it participates like any
    // other teacher, with no new seeding logic needed.
    if (namedTeacherIdThisCampus) {
      teacherIds.push(namedTeacherIdThisCampus);
      if (!teacherPool['Teacher']) teacherPool['Teacher'] = [];
      teacherPool['Teacher'].push(namedTeacherIdThisCampus);
    }

    await batchInsert('staff', prisma.staff, staffRecords);
    await batchInsert('payroll_structures', prisma.payrollStructure, payrollRecords);
    await batchInsert('leave_balances', prisma.leaveBalance, leaveBalanceRecords);

    console.log('\n29) Granting staff campus access...');
    const staffCampusAccessRows = staffRecords.map((s) => ({
      id: randomUUID(),
      staffId: s.id,
      campusId: campus.id,
    }));
    await batchInsert('staff_campus_access', prisma.staffCampusAccess, staffCampusAccessRows);

    console.log('\n4) Assigning teachers to sections and subjects...');
    const assignmentRows: any[] = [];
    const subjectTeacherList: Record<string, string[]> = {};

    for (const subjectName of SUBJECTS) {
      subjectTeacherList[subjectName] = sampleItems(teacherPool['Teacher'] || teacherIds, Math.min(4, (teacherPool['Teacher'] || teacherIds).length));
    }

    for (const classDef of classDefinitions) {
      const subjectsForGrade = CLUSTER_SUBJECTS[classDef.grade];
      let classTeacherCandidateIndex = 0;
      for (const section of classDef.sections) {
        const sectionTeacher = teacherIds[classTeacherCandidateIndex % teacherIds.length];
        assignmentRows.push({
          id: randomUUID(),
          staffId: sectionTeacher,
          sessionId: historicalSession.id,
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
            sessionId: historicalSession.id,
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
    const timetable = await prisma.timetable.create({ data: { name: `2025-2026 Master Timetable — ${def.name}`, sessionId: historicalSession.id, status: 'Active' } });
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
    await batchInsert('timetable_slots', prisma.timetableSlot, slots.map((slot) => ({ ...slot, sessionId: historicalSession.id })));
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
                  id: randomUUID(),
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
              id: randomUUID(),
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

    console.log('\n6) Creating students, families, and portal accounts...');
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

    let admissionCounter = 1000;
    const familyGroups: any[] = [];

    for (const classDef of classDefinitions) {
      for (const section of classDef.sections) {
        const studentsInSection = faker.number.int({ min: MIN_STUDENTS_PER_SECTION, max: MAX_STUDENTS_PER_SECTION });
        for (let index = 0; index < studentsInSection; index++) {
          const gender = faker.person.sex() as 'male' | 'female';
          const firstName = faker.person.firstName(gender);
          const lastName = faker.person.lastName();
          const admissionNumber = `ADM${def.admissionYear}${def.slug.toUpperCase()}${String(admissionCounter++).padStart(4, '0')}`;
          const studentId = randomUUID();
          const dob = new Date(2025 - (CLASS_NAMES.indexOf(classDef.grade) + 3), faker.number.int({ min: 0, max: 11 }), faker.number.int({ min: 1, max: 26 }));
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
              admissionDate: fmt(new Date(2025, 3, faker.number.int({ min: 1, max: 30 }))),
              feePlan: 'Annual',
              transportMode: randomItem(['Bus', 'Walk', 'Cab', 'Parent Pickup']),
              status: 'Active',
            },
            photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName + ' ' + lastName)}&background=0D8ABC&color=fff`,
          });

          enrollments.push({
            id: randomUUID(),
            studentId,
            sessionId: historicalSession.id,
            sectionId: section.id,
            campusId: campus.id,
            rollNumber: `${classDef.grade.replace(/[^0-9A-Za-z]/g, '')}${section.name}-${String(index + 1).padStart(2, '0')}`,
            status: 'Enrolled',
          });
        }
      }
    }

    for (const student of studentRows) {
      const family = familyGroups.find((group) => group.children.length < 3);
      if (family && faker.datatype.boolean()) {
        family.children.push(student.id);
      } else {
        const parentId = randomUUID();
        const parentName = `${faker.person.firstName()} ${student.fullName.split(' ').pop()}`;
        const parentEmail = `parent.${def.slug}.${parentRows.length + 1}@centralacademy.edu`;
        parentRows.push({ id: parentId, name: parentName, phone: '9' + faker.string.numeric(9), email: parentEmail, passwordHash: parentHash, status: 'Active' });
        familyGroups.push({ parentId, children: [student.id] });
      }
    }

    for (const family of familyGroups) {
      for (const childId of family.children) {
        parentStudentRows.push({ id: randomUUID(), parentId: family.parentId, studentId: childId, relationship: 'Parent' });
      }
      // id pre-generated (not left to the DB default) so notification-seeding
      // below can set Notification.recipientId to the PortalAccount's own id
      // — the FK the app actually queries by (see communication.service.ts's
      // getNotifications: portalAccount lookup by referenceId, then
      // notification lookup by recipientId = that account's id).
      portalRows.push({ id: randomUUID(), username: `parent.${family.parentId}@centralacademy.edu`, passwordHash: parentHash, userType: 'PARENT', referenceId: family.parentId, status: 'Active' });
    }

    for (const student of studentRows) {
      portalRows.push({ id: randomUUID(), username: student.admissionNumber, passwordHash: parentHash, userType: 'STUDENT', referenceId: student.id, status: 'Active' });
    }

    await batchInsert('school_houses', prisma.schoolHouse, SCHOOL_HOUSES.map((h) => ({ id: h.id, name: h.name, campusId: campus.id })), 10);
    studentRows.forEach((student, idx) => {
      student.houseId = SCHOOL_HOUSES[idx % SCHOOL_HOUSES.length].id;
    });

    await batchInsert('students', prisma.student, studentRows, 2000);
    await batchInsert('student_enrollments', prisma.studentEnrollment, enrollments, 2000);
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

    sampleAccounts.push({ campus: def.name, parentEmail: parentRows[0]?.email || 'n/a', studentAdmissionNumber: studentRows[0]?.admissionNumber || 'n/a' });

    console.log('\n30) Generating notifications, parent-teacher conversations, and messages...');
    const notificationRows: any[] = [];
    // `data.route` matches the deep-link convention notifyPortalAccount() (in
    // communication.service.ts) now attaches to every real alert — seeding it
    // here means tapping a seeded notification on mobile actually navigates
    // somewhere, instead of only working for notifications sent after seeding.
    const notificationTemplates = [
      { type: 'PUSH', title: 'Fee Due Reminder', content: 'Term fee payment is due soon. Please clear dues to avoid late fees.', route: '/modules/student/fees' },
      { type: 'EMAIL', title: 'Attendance Alert', content: 'Your ward was marked absent today. Contact the class teacher for details.', route: '/modules/student/attendance' },
      { type: 'PUSH', title: 'Exam Result Published', content: 'Report card for the latest exam has been published on the portal.', route: '/modules/student/grades' },
      { type: 'SMS', title: 'Homework Assigned', content: 'New homework has been assigned. Check the portal for details.', route: '/modules/student/homework' },
      { type: 'PUSH', title: 'PTM Reminder', content: 'Parent-Teacher meeting is scheduled this weekend. Please book a slot.', route: '/modules/shared/ptm' },
      { type: 'EMAIL', title: 'Holiday Notice', content: 'School will remain closed for the upcoming holiday.', route: '/modules/shared/notifications' },
    ];
    // Note: staff have no PortalAccount in this schema (only PARENT/STUDENT
    // do — see portalRows above; staff auth is a separate Staff.passwordHash
    // flow with no "setup portal" step anywhere). The in-app Notification
    // list is PortalAccount-keyed (communication.service.ts's
    // getNotifications), so a staff-targeted row here would be permanently
    // unreachable through the API — not seeded, to avoid dead rows. Staff
    // still get real push notifications (leave decisions, exam schedules,
    // substitutions) since those key off Staff.id directly via PushToken,
    // no PortalAccount required.
    for (const portal of portalRows) {
      const count = faker.number.int({ min: 3, max: 6 });
      for (let i = 0; i < count; i++) {
        const template = randomItem(notificationTemplates);
        notificationRows.push({
          id: randomUUID(),
          recipientId: portal.id,
          type: template.type,
          title: template.title,
          content: template.content,
          priority: weightedPick([{ value: 'NORMAL', weight: 80 }, { value: 'URGENT', weight: 15 }, { value: 'LOW', weight: 5 }]),
          readStatus: faker.datatype.boolean(),
          data: { route: template.route },
        });
      }
    }
    await batchInsert('notifications', prisma.notification, notificationRows, 3000);

    const conversationRows: any[] = [];
    const messageRows: any[] = [];
    const seenConversationPairs = new Set<string>();
    const messageTemplates = [
      { sender: 'PARENT', content: 'My child will be absent tomorrow due to a medical appointment.' },
      { sender: 'STAFF', content: 'Noted, thank you for informing us in advance.' },
      { sender: 'PARENT', content: 'Could you share details about the pending homework?' },
      { sender: 'STAFF', content: 'Sure, I will share the homework list by evening.' },
      { sender: 'PARENT', content: 'When is the next fee installment due?' },
      { sender: 'STAFF', content: 'Please check the Fees section on the portal for the due date.' },
      { sender: 'PARENT', content: 'Thank you for the update on the recent test performance.' },
      { sender: 'STAFF', content: 'Your ward is doing well, keep encouraging regular practice.' },
    ];
    const conversationSampleFraction = faker.number.int({ min: 40, max: 60 }) / 100;
    const sampledFamilies = sampleItems(familyGroups, Math.max(1, Math.round(familyGroups.length * conversationSampleFraction)));
    for (const family of sampledFamilies) {
      const childId = randomItem(family.children);
      const enrollment = enrollments.find((e) => e.studentId === childId);
      const classTeacherAssignment = enrollment && assignmentRows.find((a) => a.sectionId === enrollment.sectionId && a.isClassTeacher);
      const staffId = classTeacherAssignment?.staffId || randomItem(teacherIds);
      const pairKey = `${family.parentId}_${staffId}`;
      if (seenConversationPairs.has(pairKey)) continue;
      seenConversationPairs.add(pairKey);

      const conversationId = randomUUID();
      conversationRows.push({ id: conversationId, parentId: family.parentId, staffId });

      const messageCount = faker.number.int({ min: 3, max: 8 });
      for (let i = 0; i < messageCount; i++) {
        const template = messageTemplates[i % messageTemplates.length];
        messageRows.push({
          id: randomUUID(),
          conversationId,
          senderId: template.sender === 'PARENT' ? family.parentId : staffId,
          senderType: template.sender,
          content: template.content,
          readStatus: faker.datatype.boolean(),
        });
      }
    }
    await batchInsert('conversations', prisma.conversation, conversationRows, 2000);
    await batchInsert('messages', prisma.message, messageRows, 3000);

    console.log('\n31) Creating consent requests and responses...');
    const consentRequestRows: any[] = [];
    const consentResponseRows: any[] = [];
    const consentTemplates = [
      { title: 'Annual Sports Day Participation', description: "Consent for your ward to participate in the Annual Sports Day events.", targetType: 'ALL' },
      { title: 'Educational Field Trip Permission', description: 'Permission for the upcoming educational field trip.', targetType: 'SECTION' },
      { title: 'Photography & Media Consent', description: "Consent to use your ward's photos/videos in school communications.", targetType: 'ALL' },
      { title: 'Annual Health Checkup', description: "Consent for the school's annual health checkup camp.", targetType: 'ALL' },
      { title: 'Inter-School Competition Travel', description: 'Permission for travel to an inter-school competition.', targetType: 'SECTION' },
      { title: 'Extra-Curricular Workshop', description: 'Consent for participation in an extra-curricular workshop.', targetType: 'SECTION' },
    ];
    const allSections = classDefinitions.flatMap((c: any) => c.sections.map((s: any) => ({ ...s, classId: c.id })));
    for (const template of consentTemplates) {
      const requestId = randomUUID();
      const targetSectionId = template.targetType === 'SECTION' ? randomItem(allSections).id : null;
      consentRequestRows.push({
        id: requestId,
        title: template.title,
        description: template.description,
        targetType: template.targetType,
        targetSectionId,
        dueDate: faker.date.between({ from: SESSION_DEFS[0].start, to: SESSION_DEFS[0].end }),
        createdById: randomItem(staffRecords).id,
      });

      const targetedEnrollments = targetSectionId ? enrollments.filter((e) => e.sectionId === targetSectionId) : enrollments;
      for (const enrollment of targetedEnrollments) {
        const status = weightedPick([
          { value: 'Signed', weight: 65 },
          { value: 'Pending', weight: 25 },
          { value: 'Declined', weight: 10 },
        ]);
        const family = familyGroups.find((f) => f.children.includes(enrollment.studentId));
        consentResponseRows.push({
          id: randomUUID(),
          consentRequestId: requestId,
          studentId: enrollment.studentId,
          status,
          respondedAt: status === 'Pending' ? null : faker.date.recent({ days: 30 }),
          respondedById: status === 'Pending' ? null : family?.parentId ?? null,
        });
      }
    }
    await batchInsert('consent_requests', prisma.consentRequest, consentRequestRows, 2000);
    await batchInsert('consent_responses', prisma.consentResponse, consentResponseRows, 3000);

    console.log('\n7) Creating ID cards and certificates...');
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
      idNumber: `STAFF-${def.slug.toUpperCase()}-${String(index + 1).padStart(4, '0')}`,
      templateId: staffTemplate.id,
      staffId: staff.id,
      barcodeData: `S-${def.slug}-${index + 1}`,
      expiryDate: SESSION_DEFS[SESSION_DEFS.length - 1].end,
      status: 'Active',
    }));
    await batchInsert('id_cards', prisma.idCard, [...studentIdCards, ...staffIdCards], 2000);

    console.log('\n8) Generating academic attendance for students and staff (historical session)...');
    const studentAttendance: any[] = [];
    const staffAttendance: any[] = [];

    for (const enrollment of enrollments) {
      for (const date of schoolDays) {
        const status = weightedPick([
          { value: 'Present', weight: 92 },
          { value: 'Absent', weight: 5 },
          { value: 'Late', weight: 3 },
        ]);
        const studentCheckIn = status === 'Late' ? '09:12' : '08:55';
        studentAttendance.push({
          id: randomUUID(),
          enrollmentId: enrollment.id,
          date,
          status,
          checkInTime: studentCheckIn,
          checkOutTime: status === 'Absent' ? null : addHoursToTime(studentCheckIn, 6.5),
          faceVerified: status !== 'Absent' && faker.number.int({ min: 1, max: 100 }) <= 90,
          campusId: campus.id,
          sessionId: historicalSession.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    const allStaffIdsForAttendance = [...staffRecords.map((r) => r.id), ...namedStaffIdsThisCampus];

    for (const staffId of allStaffIdsForAttendance) {
      for (const date of schoolDays) {
        const status = weightedPick([
          { value: 'Present', weight: 93 },
          { value: 'Leave', weight: 4 },
          { value: 'Absent', weight: 2 },
          { value: 'Late', weight: 1 },
        ]);
        const staffCheckIn = status === 'Late' ? '09:10' : '08:50';
        const staffOnSite = status === 'Absent' || status === 'Leave';
        staffAttendance.push({
          id: randomUUID(),
          staffId,
          date,
          status,
          checkInTime: staffOnSite ? null : staffCheckIn,
          checkOutTime: staffOnSite ? null : addHoursToTime(staffCheckIn, 7),
          faceVerified: !staffOnSite && faker.number.int({ min: 1, max: 100 }) <= 90,
          campusId: campus.id,
          sessionId: historicalSession.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    await batchInsert('attendance_records', prisma.attendanceRecord, studentAttendance, 5000);
    await batchInsert('attendance_records', prisma.attendanceRecord, staffAttendance, 5000);

    console.log('\n9) Creating transport fleet, routes, students, and trip logs (historical session)...');
    const vehicles = Array.from({ length: TRANSPORT_ROUTES }).map((_, index) => ({
      id: randomUUID(),
      vehicleNumber: `${def.vehiclePrefix}-CT-${String(1000 + index)}`,
      busName: `${def.name.replace('Central Academy ', '')} Bus ${index + 1}`,
      vehicleType: 'School Bus',
      seatingCapacity: 40,
      fuelType: 'Diesel',
      gpsDevice: true,
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date(),
      campusId: campus.id,
    }));
    await batchInsert('transport_vehicles', prisma.transportVehicle, vehicles);

    // Named driver first (index 0) — the vehicle_staff assignment and
    // route[0]'s trips (both cycle via `driverIds[routeRows.indexOf(route)
    // % driverIds.length]`) are deterministic on index, so putting the named
    // account first guarantees they get a real assignment instead of maybe
    // landing on one of the unused tail slots once there are more drivers
    // than routes.
    const driverIds = [
      ...(namedDriverIdThisCampus ? [namedDriverIdThisCampus] : []),
      ...staffRecords.filter((s) => s.details?.designation === 'Driver').map((s) => s.id),
    ];
    const routeRows: any[] = [];
    const routeStopsRows: any[] = [];

    for (let i = 0; i < TRANSPORT_ROUTES; i++) {
      const routeId = randomUUID();
      const selectedStops = faker.helpers.arrayElements(ROUTE_STOPS, faker.number.int({ min: 5, max: 7 }));
      routeRows.push({
        id: routeId,
        routeName: `Route ${i + 1} - ${selectedStops[0]} (${def.name.replace('Central Academy ', '')})`,
        distance: Number(faker.number.float({ min: 8, max: 20, fractionDigits: 1 }).toFixed(1)),
        estimatedTime: `${faker.number.int({ min: 35, max: 70 })} Minutes`,
        morningStartTime: '07:00',
        afternoonStartTime: '15:00',
        vehicleId: vehicles[i].id,
        status: 'Active',
        campusId: campus.id,
      });
      selectedStops.forEach((stopName, idx) => {
        routeStopsRows.push({
          id: randomUUID(),
          routeId,
          stopName,
          latitude: def.latitude + idx * 0.01,
          longitude: def.longitude + idx * 0.01,
          arrivalTime: `07:${String(30 + idx * 4).padStart(2, '0')}`,
          departureTime: `07:${String(31 + idx * 4).padStart(2, '0')}`,
          distanceFromPrev: idx === 0 ? 0 : Number(faker.number.float({ min: 1, max: 3, fractionDigits: 1 }).toFixed(1)),
          orderIndex: idx,
        });
      });
    }

    await batchInsert('transport_routes', prisma.transportRoute, routeRows);
    await batchInsert('transport_route_stops', prisma.transportRouteStop, routeStopsRows);
    if (driverIds.length) {
      await batchInsert('transport_vehicle_staff', prisma.transportVehicleStaff, vehicles.map((vehicle, idx) => ({ vehicleId: vehicle.id, staffId: driverIds[idx % driverIds.length], shift: 'Morning', status: 'Assigned' })));
    }
    campusContext[def.slug].vehicles = vehicles;
    campusContext[def.slug].routeRows = routeRows;
    campusContext[def.slug].driverIds = driverIds;

    const transportAssignments: any[] = [];
    const studentsForTransport = faker.helpers.arrayElements(enrollments, Math.floor(enrollments.length * 0.58));
    for (const enrollment of studentsForTransport) {
      const route = randomItem(routeRows);
      const stop = faker.helpers.arrayElement(routeStopsRows.filter((s) => s.routeId === route.id));
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
          tripRows.push({ id: tripId, vehicleId: route.vehicleId, routeId: route.id, tripType: travelType, driverId: driverIds.length ? driverIds[routeRows.indexOf(route) % driverIds.length] : null, date, status: 'Completed', createdAt: new Date(), updatedAt: new Date() });
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

    console.log('\n10) Generating fees, invoices, payments, and overdue records (historical session)...');
    const invoiceRows: any[] = [];
    const paymentRows: any[] = [];
    for (const enrollment of enrollments) {
      const grade = sectionToClassMap[enrollment.sectionId]?.grade ?? 'Grade 1';
      const amount = 14000 + CLASS_NAMES.indexOf(grade) * 900;
      const siblings = familyGroups.find((family) => family.children.includes(enrollment.studentId));
      const discount = siblings && siblings.children.length > 1 ? 0.08 : 0;
      const feeAmount = Math.round(amount * (1 - discount));
      ['2025-06-30', '2025-12-31'].forEach((dueDate, idx) => {
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
            paymentDate: idx === 0 ? '2025-06-15' : '2025-12-20',
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
            paymentDate: '2025-12-31',
            transactionRef: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      });
    }
    await batchInsert('fee_invoices', prisma.feeInvoice, invoiceRows, 3000);
    await batchInsert('fee_payments', prisma.feePayment, paymentRows, 3000);

    console.log('\n11) Creating examinations, marks, and report cards (historical session)...');
    const examTypes = [
      { name: 'Unit Test 1', term: 'Term 1', date: '2025-08-15' },
      { name: 'Half Yearly Exam', term: 'Term 1', date: '2025-11-20' },
      { name: 'Annual Exam', term: 'Term 2', date: '2026-03-05' },
    ];
    const examRecords: any[] = [];
    for (const examDef of examTypes) {
      examRecords.push(await prisma.exam.create({ data: { name: `${examDef.name} (${def.name.replace('Central Academy ', '')})`, term: examDef.term, sessionId: historicalSession.id, status: 'Completed' } }));
    }

    const examSlotRows: any[] = [];
    for (const exam of examRecords) {
      const examDef = examTypes[examRecords.indexOf(exam)];
      for (const classDef of classDefinitions) {
        const subjectsForGrade = CLUSTER_SUBJECTS[classDef.grade];
        let slotOffset = 0;
        for (const subjectName of subjectsForGrade) {
          examSlotRows.push({
            id: randomUUID(),
            examId: exam.id,
            classId: classDef.id,
            subjectId: subjectMap[subjectName],
            date: fmt(new Date(new Date(examDef.date).setDate(new Date(examDef.date).getDate() + slotOffset))),
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
          startedAt: new Date('2026-02-25'),
          endedAt: new Date('2026-02-25'),
        });
      });

      for (let i = 1; i <= 2; i++) {
        lmsAssignmentRows.push({
          id: randomUUID(),
          title: `${course.title} Assignment ${i}`,
          description: `Complete assignment ${i} for ${course.title}`,
          dueDate: new Date('2026-02-28'),
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
          submittedAt: new Date('2026-02-20'),
          gradedAt: new Date('2026-02-21'),
        });
      });
    }
    await batchInsert('lms_submissions', prisma.lMSSubmission, lmsSubmissionRows, 5000);

    console.log('\n13) Seeding library usage and fine records...');
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
        campusId: campus.id,
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
      bookFines.push({ id: randomUUID(), issueId: issue.id, amount: faker.number.int({ min: 20, max: 150 }), status: 'Unpaid' });
    });
    await batchInsert('library_fines', prisma.libraryFine, bookFines, 2000);

    const reservationRows: any[] = [];
    faker.helpers.arrayElements(enrollments, Math.round(enrollments.length * 0.03)).forEach((enrollment) => {
      const book = randomItem(bookRows);
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + 7);
      reservationRows.push({ id: randomUUID(), bookId: book.id, enrollmentId: enrollment.id, status: 'Reserved', expiresAt });
    });
    await batchInsert('library_reservations', prisma.libraryReservation, reservationRows, 2000);

    console.log('\n14) Adding hostel, rooms, mess menus, and boarder attendance...');
    const hostelBoys = await prisma.hostel.create({ data: { name: `Aravali Boys Hostel (${def.name.replace('Central Academy ', '')})`, type: 'BOYS', warden: staffRecords.find((s) => s.details?.designation === 'Warden')?.fullName || 'Warden', campusId: campus.id } });
    const hostelGirls = await prisma.hostel.create({ data: { name: `Nilgiri Girls Hostel (${def.name.replace('Central Academy ', '')})`, type: 'GIRLS', warden: staffRecords.find((s) => s.details?.designation === 'Warden')?.fullName || 'Warden', campusId: campus.id } });

    const rooms: any[] = [];
    for (let i = 1; i <= 10; i++) {
      rooms.push({ id: randomUUID(), hostelId: hostelBoys.id, roomNumber: `B-${String(i).padStart(2, '0')}`, capacity: 4 });
      rooms.push({ id: randomUUID(), hostelId: hostelGirls.id, roomNumber: `G-${String(i).padStart(2, '0')}`, capacity: 4 });
    }
    await batchInsert('hostel_rooms', prisma.hostelRoom, rooms, 2000);

    const hostelAllocationRows: any[] = [];
    const hostelAttendanceRows: any[] = [];
    const messMenuRows: any[] = [];
    const boarders = faker.helpers.arrayElements(enrollments.filter((en) => classDefinitions.find((cls) => cls.id === sectionToClassMap[en.sectionId]?.classId) && ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].includes(sectionToClassMap[en.sectionId]?.grade || '')), 120);
    const roomOccupancy: Record<string, number> = {};

    for (const enrollment of boarders) {
      const student = studentRows.find((st) => st.id === enrollment.studentId);
      if (!student) continue;
      const gender = student.gender;
      const eligibleRooms = rooms.filter((room) => gender === 'Male' ? room.roomNumber.startsWith('B-') : room.roomNumber.startsWith('G-'));
      const availableRooms = eligibleRooms.filter((room) => (roomOccupancy[room.id] ?? 0) < room.capacity);
      if (!availableRooms.length) continue; // faker.helpers.arrayElement throws on an empty array rather than returning falsy
      const room = faker.helpers.arrayElement(availableRooms);
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
          messMenuRows.push({ id: randomUUID(), hostelId, dayOfWeek, mealType, items });
        });
      });
    });
    await batchInsert('mess_menus', prisma.messMenu, messMenuRows, 500);

    console.log('\n15) Seeding inventory, assets, purchase requisitions...');
    const assetCategories = ['Computers', 'Projectors', 'Furniture', 'Sports Equipment', 'Lab Equipment', 'Library', 'Transport'];
    const assetCategoryRows = assetCategories.map((name) => ({ id: randomUUID(), name: `${name} (${def.slug})`, status: 'Active' }));
    await batchInsert('asset_categories', prisma.assetCategory, assetCategoryRows);

    const assetRows: any[] = [];
    assetCategories.forEach((category, catIdx) => {
      for (let i = 1; i <= 6; i++) {
        assetRows.push({
          id: randomUUID(),
          categoryId: assetCategoryRows[catIdx].id,
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

    console.log('\n16) Creating academic calendar events...');
    await batchInsert('acms_holiday_master', prisma.aCMSHolidayMaster, HOLIDAYS.map((holiday) => ({
      id: randomUUID(),
      name: holiday.name,
      date: new Date(holiday.date),
      type: holiday.type,
      campusId: campus.id,
      description: `${holiday.name} observed by ${def.name}`,
    })));

    const eventRows = [
      { title: 'Annual Sports Day', description: 'Inter-house athletics and field events.', startDate: new Date('2025-09-25'), endDate: new Date('2025-09-25'), type: 'SPORTS', organizer: 'Sports Department' },
      { title: 'Annual Day Function', description: 'Cultural programme and awards ceremony.', startDate: new Date('2026-03-10'), endDate: new Date('2026-03-10'), type: 'CULTURAL', organizer: 'Principal Office' },
      { title: 'Parent-Teacher Meeting', description: 'Parent-teacher conferences for Term 1.', startDate: new Date('2025-06-20'), endDate: new Date('2025-06-20'), type: 'ACADEMIC', organizer: 'Academic Coordinator' },
      { title: 'Science Exhibition', description: 'Student-led science projects and live demonstrations.', startDate: new Date('2025-11-28'), endDate: new Date('2025-11-28'), type: 'ACADEMIC', organizer: 'Science Department' },
    ].map((event) => ({ id: randomUUID(), sessionId: historicalSession.id, campusId: campus.id, ...event, createdAt: new Date() }));
    await batchInsert('acms_events', prisma.aCMSEvent, eventRows);

    console.log('\n33) Seeding ACMS working days, resource bookings, and notifications...');
    const acmsWorkingDayRows: any[] = [];
    for (const session of [historicalSession, currentSession]) {
      for (let dayOfWeek = 1; dayOfWeek <= 7; dayOfWeek++) {
        acmsWorkingDayRows.push({
          id: randomUUID(),
          sessionId: session.id,
          dayOfWeek,
          isWorkingDay: dayOfWeek !== 7,
          isHalfDay: dayOfWeek === 6,
        });
      }
    }
    await batchInsert('acms_working_days', prisma.aCMSWorkingDay, acmsWorkingDayRows);

    const acmsResourceNames = ['Main Auditorium', 'Chemistry Lab', 'Physics Lab', 'Sports Ground', 'Computer Lab', 'Music Room'];
    const acmsBookingPurposes = ['Inter-house competition', 'Guest lecture', 'Parent-teacher meeting', 'Science exhibition setup', 'Staff training session', 'Cultural rehearsal'];
    const acmsResourceBookingRows = Array.from({ length: 15 }, () => {
      const bookingStart = faker.date.between({ from: SESSION_DEFS[0].start, to: SESSION_DEFS[1].end });
      const bookingEnd = new Date(bookingStart.getTime() + faker.number.int({ min: 1, max: 4 }) * 60 * 60 * 1000);
      return {
        id: randomUUID(),
        resourceName: randomItem(acmsResourceNames),
        bookedBy: randomItem(staffRecords).fullName,
        purpose: randomItem(acmsBookingPurposes),
        startDate: bookingStart,
        endDate: bookingEnd,
        status: weightedPick([{ value: 'CONFIRMED', weight: 70 }, { value: 'PENDING', weight: 20 }, { value: 'CANCELLED', weight: 10 }]),
      };
    });
    await batchInsert('acms_resource_bookings', prisma.aCMSResourceBooking, acmsResourceBookingRows);

    const acmsNotificationRows: any[] = [];
    const acmsNotificationTemplates = [
      { title: 'Holiday Reminder', message: 'School will remain closed for the upcoming holiday.' },
      { title: 'Upcoming Event', message: 'A school event is scheduled soon — check the calendar for details.' },
      { title: 'Working Day Update', message: 'Saturday has been marked as a half working day this week.' },
    ];
    const acmsNotificationTargets = [...staffRecords.map((s) => s.id), ...portalRows.map((p) => p.referenceId)];
    for (const targetId of acmsNotificationTargets) {
      const count = faker.number.int({ min: 2, max: 3 });
      for (let i = 0; i < count; i++) {
        const template = randomItem(acmsNotificationTemplates);
        acmsNotificationRows.push({
          id: randomUUID(),
          userId: targetId,
          title: template.title,
          message: template.message,
          type: randomItem(['EMAIL', 'SMS', 'PUSH']),
          status: weightedPick([{ value: 'UNREAD', weight: 40 }, { value: 'READ', weight: 60 }]),
        });
      }
    }
    await batchInsert('acms_notifications', prisma.aCMSNotification, acmsNotificationRows, 3000);

    console.log('\n17) Issuing certificates for top performers...');
    // None of these are backed by a real DocumentTemplate — they simulate
    // "already issued" certificates for demo browsing, not a real
    // issue-workflow run. Still render one real, viewable PDF (via the same
    // DocumentRenderingService/StorageService the live issue-certificate
    // flow uses) and share its URL across all 120 rows — real/valid file,
    // not a fabricated URL on a domain that doesn't resolve to anything.
    const documentRenderer = new DocumentRenderingService();
    const storageService = new StorageService();
    const sampleCertificateBuffer = await documentRenderer.renderCertificate(
      {
        designJson: {
          fields: [
            { key: '[SCHOOL_NAME]', x: 260, y: 80, fontSize: 20, fontWeight: 'bold' },
            { key: '[TITLE]', x: 260, y: 220, fontSize: 36, fontWeight: 'bold' },
            { key: '[TYPE]', x: 260, y: 280, fontSize: 14 },
            { key: '[DATE]', x: 260, y: 480, fontSize: 12 },
          ],
        },
      },
      {
        schoolName: 'Central Academy',
        title: 'Merit Certificate',
        type: 'Awarded for outstanding academic performance',
        date: new Date('2026-03-15').toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
      },
    );
    const { url: sampleCertificateUrl } = await storageService.uploadFile(
      sampleCertificateBuffer,
      'certificates',
      'merit-sample.pdf',
      'application/pdf',
    );

    const certificateRows: any[] = [];
    const topPerformers = enrollments.filter((_, index) => index % 40 === 0).slice(0, 120);
    for (const enrollment of topPerformers) {
      certificateRows.push({
        id: randomUUID(),
        studentId: enrollment.studentId,
        type: 'MERIT',
        title: 'Merit Certificate',
        fileUrl: sampleCertificateUrl,
        issueDate: new Date('2026-03-15'),
      });
    }
    await batchInsert('certificates', prisma.certificate, certificateRows);

    console.log('\n18) Seeding PTM slots (booked against real teacher/parent/student triples)...');
    const classTeacherRows = assignmentRows.filter((row) => row.isClassTeacher);
    const ptmDays = ['2025-06-20', '2025-11-25'];
    const ptmSlotRows: any[] = [];
    for (const ptmDay of ptmDays) {
      for (const ctRow of classTeacherRows) {
        const sectionEnrollments = enrollments.filter((e) => e.sectionId === ctRow.sectionId);
        const slotTimes = ['15:00', '15:15', '15:30', '15:45', '16:00', '16:15'];
        slotTimes.forEach((startTime, idx) => {
          const endTime = addHoursToTime(startTime, 0.25);
          const bookThisSlot = idx < sectionEnrollments.length && faker.number.int({ min: 1, max: 100 }) <= 65;
          let parentId: string | null = null;
          let studentId: string | null = null;
          let status = 'Open';
          let bookedAt: Date | null = null;
          if (bookThisSlot) {
            const enrollment = sectionEnrollments[idx];
            const family = familyGroups.find((f) => f.children.includes(enrollment.studentId));
            if (family) {
              parentId = family.parentId;
              studentId = enrollment.studentId;
              status = 'Booked';
              bookedAt = new Date(new Date(ptmDay).getTime() - 3 * 86400000);
            }
          } else if (faker.number.int({ min: 1, max: 100 }) <= 8) {
            status = 'Cancelled';
          }
          ptmSlotRows.push({
            id: randomUUID(),
            teacherId: ctRow.staffId,
            date: new Date(ptmDay),
            startTime,
            endTime,
            location: `Room ${101 + (idx % 4)}`,
            status,
            parentId,
            studentId,
            bookedAt,
          });
        });
      }
    }
    await batchInsert('ptm_slots', prisma.pTMSlot, ptmSlotRows, 3000);

    console.log('\n19) Seeding real morning assemblies, student achievements, and staff duty rosters...');
    const mondaySchoolDays = schoolDays.filter((d) => new Date(d).getDay() === 1);
    const assemblyThemes = ['Honesty & Integrity', 'Environmental Awareness', 'Road Safety', 'Digital Citizenship', 'Kindness & Empathy', 'National Unity', 'Health & Hygiene', 'Financial Literacy'];
    const assemblyRows: any[] = [];
    mondaySchoolDays.forEach((date, idx) => {
      const section = classDefinitions[idx % classDefinitions.length].sections[idx % 4];
      assemblyRows.push({
        id: randomUUID(),
        date: new Date(date),
        campusId: campus.id,
        theme: assemblyThemes[idx % assemblyThemes.length],
        performingSectionId: section.id,
        supervisingStaffId: teacherIds[idx % teacherIds.length],
        venue: 'Main Assembly Hall',
        activities: [
          { type: 'PRAYER', details: 'Morning prayer' },
          { type: 'SPEECH', studentId: undefined, details: `Speech on ${assemblyThemes[idx % assemblyThemes.length]}` },
          { type: 'SINGING', details: 'National anthem' },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
    await batchInsert('morning_assemblies', prisma.morningAssembly, assemblyRows, 2000);

    const achievementTypes = ['ACADEMIC', 'SPORTS', 'MUSIC', 'DANCE', 'DEBATE', 'OLYMPIAD'];
    const achievementAwards = ['MEDAL', 'TROPHY', 'CERTIFICATE', 'SCHOLARSHIP'];
    const achievementRows: any[] = [];
    faker.helpers.arrayElements(studentRows, Math.round(studentRows.length * 0.05)).forEach((student) => {
      achievementRows.push({
        id: randomUUID(),
        studentId: student.id,
        type: randomItem(achievementTypes),
        title: `${randomItem(['Inter-School', 'District-Level', 'State-Level', 'Zonal'])} ${randomItem(['Chess Championship', 'Science Fair', 'Debate Competition', 'Athletics Meet', 'Music Recital', 'Coding Olympiad'])}`,
        award: randomItem(achievementAwards),
        issuedById: randomItem(teacherIds),
        certificateData: {},
        issuedAt: faker.date.between({ from: SESSION_START, to: SESSION_END }),
      });
    });
    await batchInsert('student_achievements', prisma.studentAchievement, achievementRows, 3000);

    const dutyTypes = ['EXAM', 'ASSEMBLY', 'PTM', 'SPORTS', 'GATE', 'BUS'];
    const dutyRows: any[] = [];
    const dutyRosterDays = schoolDays.filter((_, idx) => idx % 10 === 0); // roughly one duty cycle every 2 weeks
    dutyRosterDays.forEach((date) => {
      sampleItems(teacherIds, Math.min(4, teacherIds.length)).forEach((staffId) => {
        dutyRows.push({
          id: randomUUID(),
          staffId,
          dutyType: randomItem(dutyTypes),
          date: new Date(date),
          notes: 'Routine duty roster assignment',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });
    });
    await batchInsert('staff_duty_allocations', prisma.staffDutyAllocation, dutyRows, 3000);

    console.log('\n20) Seeding health profiles, visits, and vaccinations...');
    const nurseStaffId = staffRecords.find((s) => s.details?.designation === 'Nurse')?.id
      ?? namedStaffIdsThisCampus.find((id) => id) ?? teacherIds[0];
    const healthProfileRows = studentRows.map((student) => ({
      id: randomUUID(),
      studentId: student.id,
      bloodGroup: student.details?.bloodGroup ?? randomItem(['A+', 'A-', 'B+', 'B-', 'O+', 'O-']),
      allergies: faker.number.int({ min: 1, max: 100 }) <= 12 ? randomItem(['Peanuts', 'Dust', 'Pollen', 'Lactose']) : null,
      chronicConditions: faker.number.int({ min: 1, max: 100 }) <= 5 ? randomItem(['Asthma', 'Type 1 Diabetes', 'Epilepsy']) : null,
      currentMedications: null,
      emergencyContactName: student.fullName.split(' ').pop() + ' Guardian',
      emergencyContactPhone: '9' + faker.string.numeric(9),
      familyDoctorName: `Dr. ${faker.person.lastName()}`,
      familyDoctorPhone: '9' + faker.string.numeric(9),
      insuranceProvider: faker.number.int({ min: 1, max: 100 }) <= 40 ? randomItem(['Star Health', 'HDFC Ergo', 'ICICI Lombard']) : null,
      insurancePolicyNo: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    await batchInsert('health_profiles', prisma.healthProfile, healthProfileRows, 3000);
    const healthProfileByStudent = new Map(healthProfileRows.map((p) => [p.studentId, p.id]));

    const healthVisitRows: any[] = [];
    faker.helpers.arrayElements(studentRows, Math.round(studentRows.length * 0.08)).forEach((student) => {
      const visitDate = faker.date.between({ from: SESSION_START, to: SESSION_END });
      healthVisitRows.push({
        id: randomUUID(),
        studentId: student.id,
        healthProfileId: healthProfileByStudent.get(student.id),
        visitDate,
        reason: randomItem(['Fever', 'Headache', 'Stomach ache', 'Minor injury', 'Dizziness', 'Allergic reaction']),
        symptoms: randomItem(['Mild', 'Moderate']),
        temperature: Number(faker.number.float({ min: 97.5, max: 101.5, fractionDigits: 1 })),
        treatmentGiven: randomItem(['Rest and observation', 'Paracetamol administered', 'First aid applied', 'ORS given']),
        actionTaken: randomItem(['Observed and Released', 'Sent Home', 'Referred to Doctor']),
        parentNotified: faker.datatype.boolean(),
        loggedByStaffId: nurseStaffId,
        createdAt: visitDate,
      });
    });
    await batchInsert('health_visits', prisma.healthVisit, healthVisitRows, 3000);

    const vaccinationRows: any[] = [];
    faker.helpers.arrayElements(studentRows, Math.round(studentRows.length * 0.3)).forEach((student) => {
      const dateAdministered = faker.date.between({ from: SESSION_START, to: SESSION_END });
      vaccinationRows.push({
        id: randomUUID(),
        studentId: student.id,
        healthProfileId: healthProfileByStudent.get(student.id),
        vaccineName: randomItem(['DPT Booster', 'Tetanus', 'Hepatitis B', 'MMR', 'Typhoid', 'Influenza']),
        doseNumber: randomItem([1, 2]),
        dateAdministered,
        nextDueDate: null,
        administeredBy: `Dr. ${faker.person.lastName()}`,
        certificateUrl: null,
        createdAt: dateAdministered,
      });
    });
    await batchInsert('vaccinations', prisma.vaccination, vaccinationRows, 3000);

    console.log('\n21) Seeding discipline incidents and counseling notes...');
    const disciplineIncidentRows: any[] = [];
    faker.helpers.arrayElements(studentRows, Math.round(studentRows.length * 0.02)).forEach((student) => {
      const incidentDate = faker.date.between({ from: SESSION_START, to: SESSION_END });
      const severity = weightedPick([{ value: 'Minor', weight: 60 }, { value: 'Moderate', weight: 30 }, { value: 'Major', weight: 10 }]);
      disciplineIncidentRows.push({
        id: randomUUID(),
        studentId: student.id,
        incidentDate,
        category: randomItem(['Bullying', 'Disruption', 'Academic Dishonesty', 'Property Damage', 'Attendance', 'Other']),
        severity,
        description: `${severity} incident reported during school hours.`,
        actionTaken: randomItem(['Verbal Warning', 'Written Warning', 'Detention', 'Parent Meeting', 'Counseling Referral']),
        status: weightedPick([{ value: 'Resolved', weight: 70 }, { value: 'Open', weight: 20 }, { value: 'Escalated', weight: 10 }]),
        reportedByStaffId: randomItem(teacherIds),
        parentNotified: severity !== 'Minor',
        createdAt: incidentDate,
        updatedAt: incidentDate,
      });
    });
    await batchInsert('discipline_incidents', prisma.disciplineIncident, disciplineIncidentRows, 2000);

    const counselingNoteRows: any[] = [];
    disciplineIncidentRows.filter((inc) => inc.status !== 'Open').forEach((incident) => {
      counselingNoteRows.push({
        id: randomUUID(),
        incidentId: incident.id,
        note: 'Follow-up counseling session completed; student has shown improvement.',
        createdByStaffId: randomItem(teacherIds),
        createdAt: incident.incidentDate,
      });
    });
    await batchInsert('discipline_counseling_notes', prisma.disciplineCounselingNote, counselingNoteRows, 2000);

    console.log('\n22) Seeding admission inquiries and follow-ups...');
    const admissionStaffId = namedStaffIdsThisCampus[9] ?? randomItem(teacherIds); // Admin Staff named account
    const inquiryStatuses = ['New', 'Contacted', 'Campus Visit Scheduled', 'Application Sent', 'Converted', 'Lost'];
    const admissionInquiryRows: any[] = [];
    for (let i = 0; i < 60; i++) {
      const gender = faker.person.sex() as 'male' | 'female';
      admissionInquiryRows.push({
        id: randomUUID(),
        childName: `${faker.person.firstName(gender)} ${faker.person.lastName()}`,
        gradeInterested: randomItem(CLASS_NAMES),
        parentName: faker.person.fullName(),
        phone: '9' + faker.string.numeric(9),
        email: faker.internet.email().toLowerCase(),
        source: randomItem(['Walk-in', 'Website', 'Referral', 'Phone', 'Social Media']),
        status: randomItem(inquiryStatuses),
        notes: 'Interested in admission for the upcoming session.',
        assignedToStaffId: admissionStaffId,
        createdAt: faker.date.between({ from: SESSION_START, to: SESSION_END }),
        updatedAt: new Date(),
      });
    }
    await batchInsert('admission_inquiries', prisma.admissionInquiry, admissionInquiryRows, 2000);

    const inquiryFollowUpRows: any[] = [];
    admissionInquiryRows.filter((inq) => inq.status !== 'New').forEach((inquiry) => {
      inquiryFollowUpRows.push({
        id: randomUUID(),
        inquiryId: inquiry.id,
        note: `Follow-up call made — status updated to ${inquiry.status}.`,
        followUpDate: inquiry.createdAt,
        createdByStaffId: admissionStaffId,
        createdAt: inquiry.createdAt,
      });
    });
    await batchInsert('admission_inquiry_followups', prisma.admissionInquiryFollowUp, inquiryFollowUpRows, 2000);

    console.log('\n34) Seeding admission documents, transport incident logs, push tokens, appointments, and document lifecycle alerts...');
    const admissionDocumentRows: any[] = [];
    const admissionDocTypes = ['Birth Certificate', 'Transfer Certificate', 'Aadhar Card', 'Passport Photo', 'Previous Marksheet'];
    for (const student of studentRows) {
      const docCount = faker.number.int({ min: 2, max: 4 });
      for (const docType of sampleItems(admissionDocTypes, docCount)) {
        admissionDocumentRows.push({
          id: randomUUID(),
          studentId: student.id,
          documentType: docType,
          fileUrl: `https://documents.centralacademy.edu/${student.id}/${docType.toLowerCase().replace(/\s+/g, '-')}.pdf`,
          isVerified: weightedPick([{ value: true, weight: 85 }, { value: false, weight: 15 }]),
          uploadedAt: faker.date.between({ from: new Date(2025, 3, 1), to: SESSION_START }),
        });
      }
    }
    await batchInsert('admission_documents', prisma.admissionDocument, admissionDocumentRows, 3000);

    const transportBreakdownRows: any[] = [];
    const transportAccidentRows: any[] = [];
    for (const vehicle of vehicles) {
      const breakdownCount = weightedPick([{ value: 0, weight: 50 }, { value: 1, weight: 35 }, { value: 2, weight: 15 }]);
      for (let i = 0; i < breakdownCount; i++) {
        const breakdownDate = faker.date.between({ from: SESSION_START, to: SESSION_END });
        transportBreakdownRows.push({
          id: randomUUID(),
          vehicleId: vehicle.id,
          driverId: driverIds.length ? randomItem(driverIds) : null,
          date: fmt(breakdownDate),
          time: `${faker.number.int({ min: 7, max: 17 })}:${faker.number.int({ min: 0, max: 59 }).toString().padStart(2, '0')}`,
          location: randomItem(ROUTE_STOPS),
          description: randomItem(['Engine overheating', 'Flat tyre', 'Brake failure warning', 'Battery discharge', 'Clutch issue']),
          actionTaken: randomItem(['Roadside repair completed', 'Towed to garage', 'Replacement vehicle dispatched']),
          towingRequired: faker.datatype.boolean(),
          costIncurred: faker.number.float({ min: 500, max: 8000, fractionDigits: 2 }),
          status: weightedPick([{ value: 'Resolved', weight: 70 }, { value: 'Under Repair', weight: 15 }, { value: 'Acknowledged', weight: 10 }, { value: 'Reported', weight: 5 }]),
          acknowledgedBy: randomItem(teacherIds),
          acknowledgedAt: breakdownDate,
        });
      }
      const hasAccident = weightedPick([{ value: true, weight: 12 }, { value: false, weight: 88 }]);
      if (hasAccident) {
        const accidentDate = faker.date.between({ from: SESSION_START, to: SESSION_END });
        transportAccidentRows.push({
          id: randomUUID(),
          vehicleId: vehicle.id,
          driverId: driverIds.length ? randomItem(driverIds) : null,
          date: fmt(accidentDate),
          time: `${faker.number.int({ min: 7, max: 17 })}:${faker.number.int({ min: 0, max: 59 }).toString().padStart(2, '0')}`,
          location: randomItem(ROUTE_STOPS),
          severity: weightedPick([{ value: 'Minor', weight: 80 }, { value: 'Major', weight: 20 }]),
          description: 'Minor collision while merging into traffic; no injuries reported.',
          policeReport: faker.datatype.boolean(),
          firNumber: faker.datatype.boolean() ? `FIR${faker.number.int({ min: 100000, max: 999999 })}` : null,
          insuranceClaimed: faker.datatype.boolean(),
          claimAmount: faker.number.float({ min: 2000, max: 25000, fractionDigits: 2 }),
          status: weightedPick([{ value: 'Closed', weight: 60 }, { value: 'Acknowledged', weight: 25 }, { value: 'Under Investigation', weight: 15 }]),
          acknowledgedBy: randomItem(teacherIds),
          acknowledgedAt: accidentDate,
        });
      }
    }
    await batchInsert('transport_breakdowns', prisma.transportBreakdown, transportBreakdownRows, 2000);
    await batchInsert('transport_accidents', prisma.transportAccident, transportAccidentRows, 2000);

    const pushTokenRows: any[] = [
      ...staffRecords.map((s) => ({ id: randomUUID(), userId: s.id, userType: 'STAFF', token: randomUUID() })),
      ...portalRows.map((p) => ({ id: randomUUID(), userId: p.referenceId, userType: p.userType, token: randomUUID() })),
    ];
    await batchInsert('push_tokens', prisma.pushToken, pushTokenRows, 3000);

    const appointmentRows: any[] = [];
    const appointmentPurposes = ['Admission Inquiry', 'Vendor Meeting', 'Parent Meeting', 'Document Submission', 'Interview'];
    for (let i = 0; i < 12; i++) {
      const scheduledFor = faker.date.between({ from: SESSION_START, to: TODAY });
      appointmentRows.push({
        id: randomUUID(),
        visitorName: faker.person.fullName(),
        purpose: randomItem(appointmentPurposes),
        scheduledFor,
        hostId: randomItem(staffRecords).id,
        status: scheduledFor < TODAY ? weightedPick([{ value: 'Completed', weight: 85 }, { value: 'Cancelled', weight: 15 }]) : 'Scheduled',
      });
    }
    await batchInsert('appointments', prisma.appointment, appointmentRows, 2000);

    const documentLifecycleRows: any[] = [];
    const vehicleDocTypes = ['Registration Certificate', 'Insurance', 'Fitness Certificate', 'Permit'];
    for (const vehicle of vehicles) {
      for (const docType of vehicleDocTypes) {
        documentLifecycleRows.push({
          id: randomUUID(),
          entityType: 'TransportVehicle',
          entityId: vehicle.id,
          docType,
          docNumber: `${docType.slice(0, 3).toUpperCase()}-${faker.number.int({ min: 100000, max: 999999 })}`,
          expiryDate: faker.date.between({ from: TODAY, to: new Date(TODAY.getFullYear() + 1, TODAY.getMonth(), TODAY.getDate()) }),
          alertDays: 30,
          status: 'Active',
        });
      }
    }
    for (const driverId of driverIds) {
      documentLifecycleRows.push({
        id: randomUUID(),
        entityType: 'Staff',
        entityId: driverId,
        docType: 'Driving License',
        docNumber: `DL-${faker.number.int({ min: 1000000, max: 9999999 })}`,
        expiryDate: faker.date.between({ from: TODAY, to: new Date(TODAY.getFullYear() + 2, TODAY.getMonth(), TODAY.getDate()) }),
        alertDays: 45,
        status: 'Active',
      });
    }
    await batchInsert('document_lifecycles', prisma.documentLifecycle, documentLifecycleRows, 2000);

    console.log('\n23) Seeding transport fuel/odometer/daily-check logs, maintenance, documents, and fleet vendors...');
    const transportVendorRows = [
      { id: randomUUID(), vendorName: 'Bengaluru Auto Garage', contactPerson: faker.person.fullName(), phone: '9' + faker.string.numeric(9), email: 'contact@blrautogarage.example', address: 'Peenya Industrial Area, Bengaluru', vendorType: 'Garage', status: 'Active', createdAt: new Date() },
      { id: randomUUID(), vendorName: 'Karnataka Tyre House', contactPerson: faker.person.fullName(), phone: '9' + faker.string.numeric(9), email: 'sales@katyrehouse.example', address: 'Mysore Road, Bengaluru', vendorType: 'Tyres', status: 'Active', createdAt: new Date() },
      { id: randomUUID(), vendorName: 'PowerCell Batteries', contactPerson: faker.person.fullName(), phone: '9' + faker.string.numeric(9), email: 'support@powercell.example', address: 'Whitefield, Bengaluru', vendorType: 'Battery', status: 'Active', createdAt: new Date() },
      { id: randomUUID(), vendorName: 'SafeDrive Spares', contactPerson: faker.person.fullName(), phone: '9' + faker.string.numeric(9), email: 'orders@safedrivespares.example', address: 'Yeshwanthpur, Bengaluru', vendorType: 'Spare Parts', status: 'Active', createdAt: new Date() },
    ];
    await batchInsert('transport_vendors', prisma.transportVendor, transportVendorRows);
    const garageVendor = transportVendorRows.find((v) => v.vendorType === 'Garage')!;
    const tyreVendor = transportVendorRows.find((v) => v.vendorType === 'Tyres')!;
    const batteryVendor = transportVendorRows.find((v) => v.vendorType === 'Battery')!;
    const sparesVendor = transportVendorRows.find((v) => v.vendorType === 'Spare Parts')!;

    const transportInventoryRows = ['Brake Pads', 'Engine Oil (5L)', 'Air Filter', 'Wiper Blades', 'Coolant (5L)', 'Fan Belt'].map((itemName) => ({
      id: randomUUID(), itemName, category: 'Spare Part', quantity: faker.number.int({ min: 4, max: 40 }),
      unitPrice: faker.number.float({ min: 200, max: 4500, fractionDigits: 2 }), vendorId: sparesVendor.id,
      minimumStock: 5, lastRestockedAt: faker.date.between({ from: SESSION_START, to: SESSION_END }), status: 'Available', createdAt: new Date(),
    }));
    await batchInsert('transport_inventory', prisma.transportInventory, transportInventoryRows);

    // Every vehicle gets a full year of monthly-ish fuel/odometer/service
    // records plus a document set, instead of the single hardcoded-June
    // snapshot the old auxiliary scripts produced.
    const fuelLogRows: any[] = [];
    const odometerLogRows: any[] = [];
    const dailyCheckRows: any[] = [];
    const serviceRows: any[] = [];
    const tyreRows: any[] = [];
    const batteryRows: any[] = [];
    const vehicleDocumentRows: any[] = [];
    const fuelCheckpointDays = schoolDays.filter((_, idx) => idx % 5 === 0); // roughly weekly per vehicle

    vehicles.forEach((vehicle, vIdx) => {
      let odometer = faker.number.int({ min: 5000, max: 20000 });
      fuelCheckpointDays.forEach((date) => {
        const previousOdometer = odometer;
        const distance = faker.number.int({ min: 150, max: 400 });
        odometer += distance;
        const litres = Number((distance / faker.number.float({ min: 3.5, max: 5.5 })).toFixed(1));
        const ratePerLitre = 92 + faker.number.float({ min: -3, max: 5, fractionDigits: 2 });
        fuelLogRows.push({
          id: randomUUID(), vehicleId: vehicle.id, date, fuelStation: randomItem(['Indian Oil - Hebbal', 'HP Petrol Pump - Yelahanka', 'Bharat Petroleum - Hennur']),
          invoiceNumber: `FUEL-${faker.number.int({ min: 100000, max: 999999 })}`, fuelType: 'Diesel', litres, ratePerLitre: Number(ratePerLitre.toFixed(2)),
          totalCost: Number((litres * ratePerLitre).toFixed(2)), currentOdometer: odometer, previousOdometer, mileage: Number((distance / litres).toFixed(2)),
          filledBy: 'Driver', status: 'Approved', approvedBy: 'Transport Manager',
        });
        odometerLogRows.push({
          id: randomUUID(), vehicleId: vehicle.id, date, openingReading: previousOdometer, closingReading: odometer,
          distanceTravelled: distance, remarks: 'Routine daily operation', createdAt: new Date(date),
        });
      });

      schoolDays.filter((_, idx) => idx % 3 === vIdx % 3).forEach((date) => {
        ['Morning', 'Afternoon'].forEach((shift) => {
          dailyCheckRows.push({
            id: randomUUID(), vehicleId: vehicle.id, driverId: driverIds.length ? driverIds[vIdx % driverIds.length] : null,
            date, shift, brakesOk: true, tyresOk: true, lightsIndicatorsOk: true, hornOk: true, firstAidKitOk: true,
            fireExtinguisherOk: true, fuelLevelOk: faker.datatype.boolean(), odometerReading: odometer,
            overallStatus: 'Fit', createdAt: new Date(date),
          });
        });
      });

      // Quarterly preventive service across the session.
      ['2025-06-15', '2025-09-15', '2025-12-15', '2026-03-01'].forEach((serviceDate) => {
        serviceRows.push({
          id: randomUUID(), vehicleId: vehicle.id, serviceDate, serviceType: 'Preventive', odometerReading: odometer,
          vendorId: garageVendor.id, mechanicName: faker.person.fullName(), totalCost: faker.number.int({ min: 2500, max: 12000 }),
          description: 'Routine preventive maintenance and safety check.', status: 'Completed',
          nextServiceDate: null, nextServiceOdo: odometer + 5000, createdAt: new Date(serviceDate),
        });
      });

      tyreRows.push({
        id: randomUUID(), vehicleId: vehicle.id, tyreNumber: `TYR-${vehicle.vehicleNumber}-${faker.number.int({ min: 1000, max: 9999 })}`,
        brand: randomItem(['MRF', 'CEAT', 'Apollo', 'JK Tyre']), type: 'Front Left', installedDate: '2025-04-05',
        installedOdo: 4500, currentOdo: odometer, treadDepth: Number(faker.number.float({ min: 3, max: 9, fractionDigits: 1 })),
        status: 'In Use', warrantyExpiry: '2027-04-05', createdAt: new Date('2025-04-05'),
      } as any);
      batteryRows.push({
        id: randomUUID(), vehicleId: vehicle.id, batteryNumber: `BAT-${vehicle.vehicleNumber}-${faker.number.int({ min: 1000, max: 9999 })}`,
        brand: randomItem(['Exide', 'Amaron', 'Amco']), capacity: '150Ah', installedDate: '2025-04-05',
        status: 'In Use', warrantyExpiry: '2027-04-05', createdAt: new Date('2025-04-05'),
      } as any);

      ['RC', 'Insurance', 'Permit', 'Fitness', 'Pollution'].forEach((documentType) => {
        vehicleDocumentRows.push({
          id: randomUUID(), vehicleId: vehicle.id, documentType, fileUrl: `https://centralacademy.edu/transport-docs/${vehicle.vehicleNumber}-${documentType}.pdf`,
          issueDate: '2025-04-01', expiryDate: documentType === 'Permit' ? '2027-03-31' : '2026-12-31', status: 'Valid',
          createdAt: new Date('2025-04-01'), updatedAt: new Date('2025-04-01'),
        });
      });
    });
    await batchInsert('transport_fuel_logs', prisma.transportFuelLog, fuelLogRows, 3000);
    await batchInsert('transport_odometer_logs', prisma.transportOdometerLog, odometerLogRows, 3000);
    await batchInsert('transport_daily_checks', prisma.transportDailyCheck, dailyCheckRows, 3000);
    await batchInsert('transport_services', prisma.transportService, serviceRows, 2000);
    await batchInsert('transport_tyres', prisma.transportTyre, tyreRows, 2000);
    await batchInsert('transport_batteries', prisma.transportBattery, batteryRows, 2000);
    await batchInsert('transport_vehicle_documents', prisma.transportVehicleDocument, vehicleDocumentRows, 2000);

    const expenseMonths = ['2025-04', '2025-06', '2025-08', '2025-10', '2025-12', '2026-02'];
    const expenseRows: any[] = [];
    vehicles.forEach((vehicle) => {
      expenseMonths.forEach((month) => {
        expenseRows.push({
          id: randomUUID(), vehicleId: vehicle.id, date: `${month}-10`, category: randomItem(['Fuel', 'Maintenance', 'Toll', 'Insurance']),
          amount: faker.number.int({ min: 800, max: 15000 }), paymentMode: randomItem(['Cash', 'Card', 'UPI', 'Bank Transfer']),
          referenceNumber: `EXP-${faker.number.int({ min: 100000, max: 999999 })}`, vendorId: randomItem(transportVendorRows).id,
          remarks: 'Routine fleet expense', status: 'Approved', approvedBy: 'Transport Manager', approvedAt: new Date(`${month}-15`), createdAt: new Date(`${month}-10`),
        });
      });
    });
    await batchInsert('transport_expenses', prisma.transportExpense, expenseRows, 2000);

    console.log('\n24) Seeding hostel outpasses/grievances, staff leave applications, payslips, and performance reviews...');
    const hostelOutpassRows = boarders.slice(0, 40).map((enrollment) => {
      const fromDate = faker.date.between({ from: SESSION_START, to: SESSION_END });
      const toDate = new Date(fromDate.getTime() + 2 * 86400000);
      const status = randomItem(['Approved', 'Returned', 'Pending']);
      return {
        id: randomUUID(), enrollmentId: enrollment.id, reason: randomItem(['Family function', 'Medical appointment', 'Festival at home', 'Sibling wedding']),
        fromDate, toDate, status, approvedById: status === 'Pending' ? null : staffRecords.find((s) => s.details?.designation === 'Warden')?.id ?? teacherIds[0],
        exitTime: status === 'Returned' ? fromDate : null, returnTime: status === 'Returned' ? toDate : null,
        parentConsent: status !== 'Pending', createdAt: fromDate,
      };
    });
    await batchInsert('hostel_outpasses', prisma.hostelOutpass, hostelOutpassRows, 2000);

    const hostelGrievanceRows = boarders.slice(0, 30).map((enrollment) => ({
      id: randomUUID(), hostelId: randomItem([hostelBoys.id, hostelGirls.id]), enrollmentId: enrollment.id,
      title: randomItem(['Room maintenance needed', 'Mess food quality', 'Wi-Fi connectivity', 'Water supply issue']),
      description: 'Reported by boarder via hostel grievance desk.', status: randomItem(['Open', 'Resolved']),
      createdAt: faker.date.between({ from: SESSION_START, to: SESSION_END }),
    }));
    await batchInsert('hostel_grievances', prisma.hostelGrievance, hostelGrievanceRows, 2000);

    const allStaffForLeave = [...staffRecords.map((r) => r.id), ...namedStaffIdsThisCampus];
    const staffLeaveRows: any[] = [];
    faker.helpers.arrayElements(allStaffForLeave, Math.round(allStaffForLeave.length * 0.15)).forEach((staffId) => {
      const startDate = faker.date.between({ from: SESSION_START, to: SESSION_END });
      const endDate = new Date(startDate.getTime() + faker.number.int({ min: 1, max: 3 }) * 86400000);
      const status = weightedPick([{ value: 'Approved', weight: 70 }, { value: 'Pending', weight: 15 }, { value: 'Rejected', weight: 15 }]);
      staffLeaveRows.push({
        id: randomUUID(), staffId, leaveType: randomItem(['Casual', 'Sick']), startDate, endDate,
        reason: randomItem(['Personal work', 'Health', 'Family emergency', 'Festival']), status,
        appliedAt: new Date(startDate.getTime() - 3 * 86400000), resolvedAt: status === 'Pending' ? null : startDate,
        resolvedById: status === 'Pending' ? null : namedStaffIdsThisCampus[0],
      });
    });
    await batchInsert('leave_applications', prisma.leaveApplication, staffLeaveRows, 3000);

    const teacherSubstitutionRows: any[] = [];
    staffLeaveRows.filter((leave) => leave.status === 'Approved' && teacherIds.includes(leave.staffId)).slice(0, 40).forEach((leave) => {
      const substitute = randomItem(teacherIds.filter((id) => id !== leave.staffId));
      const period = timetablePeriods.find((tp) => {
        const assignment = assignmentRows.find((a) => a.id === tp.assignmentId);
        return assignment && assignment.staffId === leave.staffId;
      }) || timetablePeriods[0];
      if (period) {
        teacherSubstitutionRows.push({
          id: randomUUID(), leaveApplicationId: leave.id, primaryTeacherId: leave.staffId, substituteTeacherId: substitute,
          date: leave.startDate, timetablePeriodId: period.id, status: 'Confirmed', createdAt: leave.appliedAt, updatedAt: leave.appliedAt,
        });
      }
    });
    await batchInsert('teacher_substitutions', prisma.teacherSubstitution, teacherSubstitutionRows, 2000);

    const payslipRows: any[] = [];
    const payslipMonths = [{ m: 4, y: 2025 }, { m: 6, y: 2025 }, { m: 8, y: 2025 }, { m: 10, y: 2025 }, { m: 12, y: 2025 }, { m: 2, y: 2026 }];
    payrollRecords.forEach((payroll) => {
      payslipMonths.forEach(({ m, y }) => {
        const gross = payroll.basicSalary + payroll.allowances;
        payslipRows.push({
          id: randomUUID(), staffId: payroll.staffId, month: m, year: y, basicSalary: payroll.basicSalary,
          allowances: payroll.allowances, fixedDeductions: payroll.deductions, lopDeductions: 0,
          netSalary: gross - payroll.deductions, status: 'Paid', generatedAt: new Date(y, m - 1, 28),
        });
      });
    });
    await batchInsert('payslips', prisma.payslip, payslipRows, 5000);

    const performanceReviewRows: any[] = [];
    // Random 50% sample would only *maybe* include the named demo teacher —
    // guarantee it explicitly so the account used for testing/demoing always
    // has review history to show.
    const reviewedTeacherIds = new Set(faker.helpers.arrayElements(teacherIds, Math.round(teacherIds.length * 0.5)));
    if (namedTeacherIdThisCampus) reviewedTeacherIds.add(namedTeacherIdThisCampus);
    Array.from(reviewedTeacherIds).forEach((staffId) => {
      ['2025 Q2', '2025 Q4'].forEach((cycle) => {
        performanceReviewRows.push({
          id: randomUUID(), staffId, reviewerId: namedStaffIdsThisCampus[1] ?? namedStaffIdsThisCampus[0], cycle,
          rating: faker.number.int({ min: 3, max: 5 }), comments: randomItem(STAFF_OFFER), createdAt: new Date(cycle === '2025 Q2' ? '2025-07-15' : '2026-01-15'),
        });
      });
    });
    await batchInsert('performance_reviews', prisma.performanceReview, performanceReviewRows, 2000);

    console.log('\n25) Seeding student leave applications and fee refunds...');
    const studentLeaveRows: any[] = [];
    faker.helpers.arrayElements(enrollments, Math.round(enrollments.length * 0.04)).forEach((enrollment) => {
      const startDate = faker.date.between({ from: SESSION_START, to: SESSION_END });
      const endDate = new Date(startDate.getTime() + faker.number.int({ min: 1, max: 4 }) * 86400000);
      const status = weightedPick([{ value: 'Approved', weight: 75 }, { value: 'Pending', weight: 15 }, { value: 'Rejected', weight: 10 }]);
      studentLeaveRows.push({
        id: randomUUID(), enrollmentId: enrollment.id, leaveType: randomItem(['Medical', 'Personal', 'Family Function']),
        startDate, endDate, reason: 'Submitted by parent through the portal.', status,
        appliedAt: new Date(startDate.getTime() - 2 * 86400000), resolvedAt: status === 'Pending' ? null : startDate,
        resolvedById: status === 'Pending' ? null : randomItem(teacherIds),
      });
    });
    await batchInsert('student_leave_applications', prisma.studentLeaveApplication, studentLeaveRows, 3000);

    const paidPayments = paymentRows.filter((p) => Number(p.amountPaid) > 0);
    const feeRefundRows = faker.helpers.arrayElements(paidPayments, Math.min(25, paidPayments.length)).map((payment) => {
      const status = randomItem(['Requested', 'Approved', 'Rejected']);
      return {
        id: randomUUID(), paymentId: payment.id, amount: Math.round(Number(payment.amountPaid) * 0.1), reason: 'Overpayment adjustment / transfer certificate refund',
        status, refundMode: status === 'Approved' ? randomItem(['UPI', 'NetBanking', 'Cheque']) : null,
        referenceNo: status === 'Approved' ? `RFD-${faker.number.int({ min: 100000, max: 999999 })}` : null,
        requestedBy: 'Parent Portal', approvedBy: status === 'Approved' ? namedStaffIdsThisCampus[3] : null,
        remarks: null, requestedAt: new Date(payment.paymentDate), resolvedAt: status === 'Requested' ? null : new Date(payment.paymentDate),
      };
    });
    await batchInsert('fee_refunds', prisma.feeRefund, feeRefundRows, 2000);

    console.log('\n26) Seeding visitor records, gate passes, lost & found, meetings, diary entries, and grievances...');
    const receptionStaffId = namedStaffIdsThisCampus[11] ?? teacherIds[0]; // Reception named account
    const visitorRows: any[] = [];
    for (let i = 0; i < 80; i++) {
      const entryTime = faker.date.between({ from: SESSION_START, to: SESSION_END });
      const checkedOut = faker.datatype.boolean();
      visitorRows.push({
        id: randomUUID(), fullName: faker.person.fullName(), phone: '9' + faker.string.numeric(9),
        purpose: randomItem(['Parent Meeting', 'Vendor Visit', 'Admission Enquiry', 'Delivery', 'Interview']),
        hostId: randomItem(teacherIds), govIdType: randomItem(['Aadhaar', 'Driving License', 'PAN Card']),
        govIdNumber: faker.string.alphanumeric(10).toUpperCase(), photoUrl: null, vehicleNumber: null,
        hostConfirmation: 'CONFIRMED', blacklisted: false, entryTime,
        exitTime: checkedOut ? new Date(entryTime.getTime() + faker.number.int({ min: 20, max: 90 }) * 60000) : null,
        status: checkedOut ? 'CheckedOut' : 'CheckedIn', createdAt: entryTime, updatedAt: entryTime,
      });
    }
    await batchInsert('visitor_records', prisma.visitorRecord, visitorRows, 2000);

    const gatePassRows = faker.helpers.arrayElements(studentRows, 50).map((student) => {
      const exitTime = faker.date.between({ from: SESSION_START, to: SESSION_END });
      const returned = faker.datatype.boolean();
      return {
        id: randomUUID(), studentId: student.id, reason: randomItem(['Medical appointment', 'Family emergency', 'Early pickup']),
        leaveType: 'Half Day', approvedById: randomItem(teacherIds), exitTime,
        returnTime: returned ? new Date(exitTime.getTime() + 3 * 3600000) : null, status: returned ? 'Returned' : 'Approved',
        createdAt: exitTime, updatedAt: exitTime,
      };
    });
    await batchInsert('student_gate_passes', prisma.studentGatePass, gatePassRows, 2000);

    const lostFoundRows: any[] = [];
    for (let i = 0; i < 25; i++) {
      const status = randomItem(['Reported', 'Claimed']);
      lostFoundRows.push({
        id: randomUUID(), status, itemName: randomItem(['Water Bottle', 'Lunch Box', 'Sweater', 'Textbook', 'Umbrella', 'ID Card']),
        description: 'Found on school premises.', reporterId: receptionStaffId, photoUrl: null,
        claimantId: status === 'Claimed' ? randomItem(studentRows).id : null,
        claimedAt: status === 'Claimed' ? faker.date.between({ from: SESSION_START, to: SESSION_END }) : null,
        createdAt: faker.date.between({ from: SESSION_START, to: SESSION_END }), updatedAt: new Date(),
      });
    }
    await batchInsert('lost_found_items', prisma.lostFoundItem, lostFoundRows, 2000);

    const vehicleGateLogRows = Array.from({ length: 20 }).map(() => {
      const entryTime = faker.date.between({ from: SESSION_START, to: SESSION_END });
      const exited = faker.datatype.boolean();
      return {
        id: randomUUID(), vehicleNumber: `KA-${faker.number.int({ min: 1, max: 9 })}${faker.string.alpha({ length: 2, casing: 'upper' })}-${faker.number.int({ min: 1000, max: 9999 })}`,
        driverName: faker.person.fullName(), purpose: randomItem(['Delivery', 'Vendor Visit', 'Maintenance', 'Supplies']),
        entryTime, exitTime: exited ? new Date(entryTime.getTime() + faker.number.int({ min: 15, max: 60 }) * 60000) : null, loggedById: receptionStaffId,
      };
    });
    await batchInsert('vehicle_gate_logs', prisma.vehicleGateLog, vehicleGateLogRows, 2000);

    const studentGateLogRows = faker.helpers.arrayElements(enrollments, 30).map((enrollment) => ({
      id: randomUUID(), enrollmentId: enrollment.id, type: randomItem(['LATE_ENTRY', 'EARLY_EXIT']),
      reason: randomItem(['Traffic delay', 'Medical appointment', 'Family emergency', 'Overslept']),
      timestamp: faker.date.between({ from: SESSION_START, to: SESSION_END }), loggedById: receptionStaffId,
    }));
    await batchInsert('student_gate_logs', prisma.studentGateLog, studentGateLogRows, 2000);

    const courierLogRows = Array.from({ length: 20 }).map(() => {
      const type = randomItem(['INCOMING', 'OUTGOING']);
      return {
        id: randomUUID(), type, sender: type === 'INCOMING' ? faker.company.name() : 'Central Academy',
        recipient: type === 'OUTGOING' ? faker.company.name() : 'Front Office', description: randomItem(['Documents', 'Textbooks parcel', 'Office supplies', 'Certificates']),
        status: randomItem(['Received', 'Dispatched', 'Collected']), loggedById: receptionStaffId,
        createdAt: faker.date.between({ from: SESSION_START, to: SESSION_END }),
      };
    });
    await batchInsert('courier_logs', prisma.courierLog, courierLogRows, 2000);

    const meetingRows = [
      { title: 'Staff Council Meeting', agenda: 'Term 1 academic planning', scheduledFor: new Date('2025-05-10'), location: 'Conference Room' },
      { title: 'Parent-Teacher Association Meeting', agenda: 'Sports Day & Annual Day planning', scheduledFor: new Date('2025-09-05'), location: 'Auditorium' },
      { title: 'Academic Review Committee', agenda: 'Mid-year performance review', scheduledFor: new Date('2025-11-10'), location: 'Conference Room' },
      { title: 'Staff Council Meeting', agenda: 'Term 2 planning', scheduledFor: new Date('2026-01-15'), location: 'Conference Room' },
      { title: 'Annual Budget Review', agenda: 'Next-session budget planning', scheduledFor: new Date('2026-02-20'), location: 'Principal Office' },
    ].map((m) => ({
      id: randomUUID(), ...m, status: 'Completed', organizerId: namedStaffIdsThisCampus[0],
      attendeeIds: sampleItems(teacherIds, Math.min(6, teacherIds.length)), createdAt: m.scheduledFor,
    }));
    await batchInsert('meetings', prisma.meeting, meetingRows, 500);

    const diaryRows: any[] = [];
    faker.helpers.arrayElements(enrollments, Math.round(enrollments.length * 0.1)).forEach((enrollment) => {
      const createdAt = faker.date.between({ from: SESSION_START, to: SESSION_END });
      diaryRows.push({
        id: randomUUID(), studentId: enrollment.studentId, teacherId: randomItem(teacherIds),
        type: randomItem(['Homework', 'Remark', 'Notice']),
        content: randomItem(['Complete worksheet by tomorrow.', 'Excellent participation in class today.', 'Please bring signed permission slip.', 'Needs to focus more during class hours.']),
        parentSigned: faker.datatype.boolean(), parentSignedAt: null, signatureAttachmentId: null,
        createdAt, updatedAt: createdAt,
      });
    });
    await batchInsert('school_diary_entries', prisma.schoolDiaryEntry, diaryRows, 3000);

    const grievanceRecordRows: any[] = [];
    faker.helpers.arrayElements(parentRows, Math.min(20, parentRows.length)).forEach((parent) => {
      const status = randomItem(['Open', 'Resolved']);
      grievanceRecordRows.push({
        id: randomUUID(), userType: 'PARENT', reporterId: parent.id,
        title: randomItem(['Fee discrepancy query', 'Transport route change request', 'Classroom facility concern']),
        description: 'Submitted via parent portal grievance form.', assignedToId: namedStaffIdsThisCampus[0], escalationLevel: 0,
        status, resolutionRemarks: status === 'Resolved' ? 'Issue addressed and resolved.' : null,
        resolvedAt: status === 'Resolved' ? new Date() : null, createdAt: faker.date.between({ from: SESSION_START, to: SESSION_END }), updatedAt: new Date(),
      });
    });
    await batchInsert('grievances', prisma.grievanceRecord, grievanceRecordRows, 2000);

    console.log('\n27) Seeding LMS curriculum trees, grading rules, and a generic document template...');
    const lmsCurriculumRows: any[] = [];
    const lmsUnitRows: any[] = [];
    sampleItems(lmsCourses, Math.min(8, lmsCourses.length)).forEach((course) => {
      const curriculumId = randomUUID();
      lmsCurriculumRows.push({ id: curriculumId, courseId: course.id, board: 'CBSE', description: `Structured curriculum for ${course.title}.`, createdAt: new Date() });
      ['Unit 1: Foundations', 'Unit 2: Core Concepts', 'Unit 3: Applications'].forEach((unitTitle, idx) => {
        lmsUnitRows.push({ id: randomUUID(), curriculumId, title: unitTitle, orderIndex: idx, createdAt: new Date() });
      });
    });
    await batchInsert('lms_curriculum', prisma.lMSCurriculum, lmsCurriculumRows, 500);
    await batchInsert('lms_units', prisma.lMSUnit, lmsUnitRows, 1000);

    const gradingRuleRows = [
      { id: randomUUID(), name: 'Standard Absolute Scale', rules: [{ min: 90, grade: 'A+' }, { min: 80, grade: 'A' }, { min: 70, grade: 'B+' }, { min: 60, grade: 'B' }, { min: 50, grade: 'C' }, { min: 35, grade: 'D' }, { min: 0, grade: 'F' }], isActive: true, createdAt: new Date() },
      { id: randomUUID(), name: 'Primary Grades Scale (Nursery-UKG)', rules: [{ min: 80, grade: 'Outstanding' }, { min: 60, grade: 'Very Good' }, { min: 40, grade: 'Good' }, { min: 0, grade: 'Needs Support' }], isActive: true, createdAt: new Date() },
    ];
    await batchInsert('grading_rules', prisma.gradingRule, gradingRuleRows);

    const documentTemplateRows = [
      { id: randomUUID(), name: 'Transfer Certificate Template', type: 'CERTIFICATE', targetAudience: 'STUDENT', designJson: { layout: 'formal', fields: ['studentName', 'admissionNumber', 'issueDate'] }, status: 'Active', createdAt: new Date(), updatedAt: new Date() },
      { id: randomUUID(), name: 'Bonafide Certificate Template', type: 'CERTIFICATE', targetAudience: 'STUDENT', designJson: { layout: 'formal', fields: ['studentName', 'className', 'purpose'] }, status: 'Active', createdAt: new Date(), updatedAt: new Date() },
    ];
    await batchInsert('document_templates', prisma.documentTemplate, documentTemplateRows);

    console.log('\n32) Seeding LMS chapters/topics/lessons, question banks, rubrics, gradebooks, live classes, discussions, portfolios, and AI generation logs...');
    const lmsChapterRows: any[] = [];
    const lmsTopicRows: any[] = [];
    const lmsLessonRows: any[] = [];
    for (const unit of lmsUnitRows) {
      for (let c = 1; c <= 2; c++) {
        const chapterId = randomUUID();
        lmsChapterRows.push({
          id: chapterId,
          unitId: unit.id,
          title: `Chapter ${c}: ${randomItem(['Introduction', 'Deep Dive', 'Practical Application', 'Review & Practice'])}`,
          description: `Chapter ${c} content for ${unit.title}.`,
          learningOutcomes: 'Students will understand and apply the core concepts covered in this chapter.',
          orderIndex: c - 1,
          createdAt: new Date(),
        });
        for (let t = 1; t <= 2; t++) {
          const topicId = randomUUID();
          lmsTopicRows.push({
            id: topicId,
            chapterId,
            title: `Topic ${t}: ${randomItem(['Key Concepts', 'Worked Examples', 'Common Mistakes', 'Real-World Use'])}`,
            orderIndex: t - 1,
            createdAt: new Date(),
          });
          for (let l = 1; l <= 2; l++) {
            lmsLessonRows.push({
              id: randomUUID(),
              topicId,
              title: `Lesson ${l}`,
              content: `<p>Lesson content covering ${unit.title}.</p>`,
              durationMin: randomItem([20, 30, 40, 45]),
              orderIndex: l - 1,
              isDraft: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        }
      }
    }
    await batchInsert('lms_chapters', prisma.lMSChapter, lmsChapterRows, 2000);
    await batchInsert('lms_topics', prisma.lMSTopic, lmsTopicRows, 3000);
    await batchInsert('lms_lessons', prisma.lMSLesson, lmsLessonRows, 5000);

    const lmsQuestionBankRows: any[] = [];
    const lmsQuestionRows: any[] = [];
    for (const subjectName of Object.keys(subjectMap)) {
      const bankId = randomUUID();
      lmsQuestionBankRows.push({
        id: bankId,
        title: `${subjectName} Question Bank`,
        description: `Curated question bank for ${subjectName}.`,
        subjectId: subjectMap[subjectName],
        createdAt: new Date(),
      });
      for (let i = 1; i <= 15; i++) {
        const type = weightedPick([{ value: 'MCQ', weight: 60 }, { value: 'TRUE_FALSE', weight: 25 }, { value: 'ESSAY', weight: 15 }]);
        let options: any = null;
        if (type === 'MCQ') {
          options = [
            { id: 1, text: 'Option A', isCorrect: true },
            { id: 2, text: 'Option B', isCorrect: false },
            { id: 3, text: 'Option C', isCorrect: false },
            { id: 4, text: 'Option D', isCorrect: false },
          ];
        } else if (type === 'TRUE_FALSE') {
          const isTrueCorrect = faker.datatype.boolean();
          options = [
            { id: 1, text: 'True', isCorrect: isTrueCorrect },
            { id: 2, text: 'False', isCorrect: !isTrueCorrect },
          ];
        }
        lmsQuestionRows.push({
          id: randomUUID(),
          questionBankId: bankId,
          type,
          text: `${subjectName} practice question ${i}: explain the key concept covered in this unit.`,
          options,
          explanation: type === 'ESSAY' ? null : 'Refer to the chapter notes for the detailed explanation.',
          difficulty: randomItem(['EASY', 'MEDIUM', 'HARD']),
          createdAt: new Date(),
        });
      }
    }
    await batchInsert('lms_question_banks', prisma.lMSQuestionBank, lmsQuestionBankRows, 500);
    await batchInsert('lms_questions', prisma.lMSQuestion, lmsQuestionRows, 3000);

    const lmsRubricRows: any[] = [];
    const rubricCriteria = ['Content Accuracy', 'Clarity & Structure', 'Timeliness', 'Creativity & Effort'];
    for (const assignment of lmsAssignmentRows) {
      const criteriaCount = faker.number.int({ min: 2, max: 3 });
      for (const criteria of sampleItems(rubricCriteria, criteriaCount)) {
        lmsRubricRows.push({
          id: randomUUID(),
          assignmentId: assignment.id,
          criteria,
          maxPoints: randomItem([10, 15, 20, 25]),
          createdAt: new Date(),
        });
      }
    }
    await batchInsert('lms_rubrics', prisma.lMSRubric, lmsRubricRows, 3000);

    const lmsGradebookRows: any[] = [];
    const lmsGradeRows: any[] = [];
    for (const course of lmsCourses) {
      const gradebookId = randomUUID();
      lmsGradebookRows.push({ id: gradebookId, courseId: course.id, createdAt: new Date() });
      const courseSection = courseSections.find((cs) => cs.courseId === course.id);
      const enrolledInSection = courseSection ? enrollments.filter((e) => e.sectionId === courseSection.sectionId) : [];
      for (const enrollment of enrolledInSection) {
        const totalScore = faker.number.int({ min: 55, max: 98 });
        lmsGradeRows.push({
          id: randomUUID(),
          gradebookId,
          studentId: enrollment.studentId,
          totalScore,
          letterGrade: totalScore >= 90 ? 'A+' : totalScore >= 80 ? 'A' : totalScore >= 70 ? 'B+' : totalScore >= 60 ? 'B' : 'C',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
    await batchInsert('lms_gradebooks', prisma.lMSGradebook, lmsGradebookRows, 2000);
    await batchInsert('lms_grades', prisma.lMSGrade, lmsGradeRows, 5000);

    const lmsLiveClassRows: any[] = [];
    for (const course of lmsCourses) {
      const courseSection = courseSections.find((cs) => cs.courseId === course.id);
      for (let i = 1; i <= 2; i++) {
        lmsLiveClassRows.push({
          id: randomUUID(),
          courseId: course.id,
          title: `${course.title} — Live Session ${i}`,
          meetingUrl: `https://meet.centralacademy.edu/${course.id}/session-${i}`,
          scheduledAt: faker.date.between({ from: SESSION_DEFS[0].start, to: SESSION_DEFS[0].end }),
          durationMin: randomItem([45, 60]),
          hostId: courseSection?.teacherId ?? randomItem(teacherIds),
          createdAt: new Date(),
        });
      }
    }
    await batchInsert('lms_live_classes', prisma.lMSLiveClass, lmsLiveClassRows, 3000);

    const lmsDiscussionThreadRows: any[] = [];
    const lmsDiscussionPostRows: any[] = [];
    const discussionPostTemplates = [
      'Can someone explain this concept in simpler terms?',
      'Great explanation, thanks!',
      'I found this part confusing — any tips?',
      'Here is a helpful resource I found on this topic.',
      'Does this apply to the upcoming exam too?',
    ];
    for (const course of lmsCourses) {
      const courseSection = courseSections.find((cs) => cs.courseId === course.id);
      const enrolledInSection = courseSection ? enrollments.filter((e) => e.sectionId === courseSection.sectionId) : [];
      const threadCount = faker.number.int({ min: 1, max: 2 });
      for (let t = 1; t <= threadCount; t++) {
        const threadId = randomUUID();
        lmsDiscussionThreadRows.push({
          id: threadId,
          courseId: course.id,
          title: `Discussion: ${randomItem(['Doubts & Questions', 'Study Group', 'Exam Preparation', 'Extra Resources'])}`,
          authorId: courseSection?.teacherId ?? null,
          createdAt: new Date(),
        });
        const postCount = faker.number.int({ min: 3, max: 5 });
        for (let p = 0; p < postCount; p++) {
          const authorId = p % 2 === 0 && enrolledInSection.length ? randomItem(enrolledInSection).studentId : courseSection?.teacherId ?? null;
          lmsDiscussionPostRows.push({
            id: randomUUID(),
            threadId,
            content: randomItem(discussionPostTemplates),
            authorId,
            createdAt: new Date(),
          });
        }
      }
    }
    await batchInsert('lms_discussion_threads', prisma.lMSDiscussionThread, lmsDiscussionThreadRows, 2000);
    await batchInsert('lms_discussion_posts', prisma.lMSDiscussionPost, lmsDiscussionPostRows, 3000);

    const lmsPortfolioRows: any[] = [];
    const lmsBadgeRows: any[] = [];
    const badgeNames = ['Perfect Attendance', 'Top Scorer', 'Quiz Champion', 'Reading Star', 'Science Fair Winner'];
    for (const student of studentRows) {
      const portfolioId = randomUUID();
      lmsPortfolioRows.push({
        id: portfolioId,
        studentId: student.id,
        totalXP: faker.number.int({ min: 0, max: 2000 }),
        createdAt: new Date(),
      });
      const badgeCount = weightedPick([{ value: 0, weight: 40 }, { value: 1, weight: 30 }, { value: 2, weight: 20 }, { value: 3, weight: 10 }]);
      for (const badgeName of sampleItems(badgeNames, badgeCount)) {
        lmsBadgeRows.push({
          id: randomUUID(),
          portfolioId,
          name: badgeName,
          iconUrl: null,
          earnedAt: faker.date.between({ from: SESSION_DEFS[0].start, to: SESSION_DEFS[0].end }),
        });
      }
    }
    await batchInsert('lms_student_portfolios', prisma.lMSStudentPortfolio, lmsPortfolioRows, 2000);
    await batchInsert('lms_badges', prisma.lMSBadge, lmsBadgeRows, 3000);

    const lmsAiGenerationRows: any[] = [];
    const aiGenTemplates = [
      { type: 'LESSON_PLAN', prompt: 'Generate a lesson plan for teaching fractions to Grade 5.', result: 'A structured 40-minute lesson plan covering introduction, guided practice, and assessment.' },
      { type: 'QUIZ_GEN', prompt: 'Create a 10-question quiz on the water cycle.', result: 'A 10-question MCQ quiz covering evaporation, condensation, and precipitation.' },
      { type: 'STUDENT_TUTOR', prompt: 'Explain photosynthesis in simple terms for a struggling student.', result: 'A simplified, analogy-based explanation of photosynthesis.' },
    ];
    for (const teacherId of teacherIds) {
      const count = faker.number.int({ min: 2, max: 4 });
      for (let i = 0; i < count; i++) {
        const template = randomItem(aiGenTemplates);
        lmsAiGenerationRows.push({
          id: randomUUID(),
          userId: teacherId,
          prompt: template.prompt,
          result: template.result,
          type: template.type,
          createdAt: new Date(),
        });
      }
    }
    await batchInsert('lms_ai_generations', prisma.lMSAIGeneration, lmsAiGenerationRows, 3000);

    console.log('\n28) Seeding EMS scaffolding (rooms, exam types/templates, grading scheme) and the historical-session cycle...');
    const emsRooms = Array.from({ length: 4 }).map((_, i) => ({
      id: randomUUID(), name: `Exam Hall ${i + 1}`, capacity: 150, campusId: campus.id, status: 'Active', createdAt: new Date(), updatedAt: new Date(),
    }));
    await batchInsert('rooms', prisma.room, emsRooms);

    const emsExamTypeRows = [
      { id: randomUUID(), name: 'Mid Term', description: 'Offline, scanned-answer-sheet mid-term assessment', createdAt: new Date() },
      { id: randomUUID(), name: 'Final', description: 'Online proctored final examination', createdAt: new Date() },
    ];
    await batchInsert('ems_exam_types', prisma.eMSExamType, emsExamTypeRows);

    const emsExamTemplateRows = [
      { id: randomUUID(), typeId: emsExamTypeRows[0].id, name: 'Mid Term Template', totalMarks: 100, passMarks: 35, createdAt: new Date() },
      { id: randomUUID(), typeId: emsExamTypeRows[1].id, name: 'Final Exam Template', totalMarks: 100, passMarks: 35, createdAt: new Date() },
    ];
    await batchInsert('ems_exam_templates', prisma.eMSExamTemplate, emsExamTemplateRows);

    const emsTargetClasses = classDefinitions.filter((c) => EMS_TARGET_GRADES.includes(c.grade));

    const emsGradingScheme = await prisma.eMSGradingScheme.create({
      data: { name: 'EMS Standard Scale', description: 'Percentage-based grading for EMS exams', ranges: [{ min: 90, max: 100, grade: 'A+' }, { min: 75, max: 89, grade: 'A' }, { min: 60, max: 74, grade: 'B' }, { min: 45, max: 59, grade: 'C' }, { min: 35, max: 44, grade: 'D' }, { min: 0, max: 34, grade: 'F' }] },
    });

    campusContext[def.slug].ems = {
      teacherIds, namedStaffIdsThisCampus, sectionToClassMap, emsRooms, emsExamTemplateRows, emsGradingScheme, emsTargetClasses,
    };

    const emsHistoricalEnrollments = enrollments.filter((e) => emsTargetClasses.some((c) => c.id === sectionToClassMap[e.sectionId]?.classId));
    await seedEmsCycle({
      campusId: campus.id, subjectMap, teacherIds, namedStaffIdsThisCampus, sectionToClassMap, emsRooms, emsExamTemplateRows, emsGradingScheme, emsTargetClasses,
      sessionName: `EMS Final Examinations ${SESSION_DEFS[0].name}`, sessionStart: SESSION_START, sessionEnd: SESSION_END, sessionIsActive: false,
      examTypeIdx: 1, examDate: new Date('2026-03-02'), mode: 'ONLINE', fullyGraded: true,
      targetEnrollments: emsHistoricalEnrollments,
    });
    await seedEmsCycle({
      campusId: campus.id, subjectMap, teacherIds, namedStaffIdsThisCampus, sectionToClassMap, emsRooms, emsExamTemplateRows, emsGradingScheme, emsTargetClasses,
      sessionName: `EMS Mid Term ${SESSION_DEFS[0].name}`, sessionStart: SESSION_START, sessionEnd: SESSION_END, sessionIsActive: false,
      examTypeIdx: 0, examDate: new Date('2025-11-18'), mode: 'OFFLINE', fullyGraded: true,
      targetEnrollments: emsHistoricalEnrollments,
    });

    console.log('\n35) Attaching comments and file attachments to case records...');
    const commentRows: any[] = [];
    const attachmentRows: any[] = [];
    const commentableSources: { entityType: string; rows: any[] }[] = [
      { entityType: 'DisciplineIncident', rows: disciplineIncidentRows },
      { entityType: 'AdmissionInquiry', rows: admissionInquiryRows },
      { entityType: 'LeaveApplication', rows: staffLeaveRows },
      { entityType: 'StudentLeaveApplication', rows: studentLeaveRows },
      { entityType: 'ConsentRequest', rows: consentRequestRows },
      { entityType: 'Certificate', rows: certificateRows },
      { entityType: 'FeeRefund', rows: feeRefundRows },
      { entityType: 'TransportBreakdown', rows: transportBreakdownRows },
      { entityType: 'TransportAccident', rows: transportAccidentRows },
    ];
    const commentBodies = [
      'Reviewed and verified — looks in order.',
      'Following up with the concerned party for additional details.',
      'Escalated to the department head for further action.',
      'Resolved after discussion; no further action needed.',
    ];
    for (const source of commentableSources) {
      if (!source.rows.length) continue;
      const sampled = sampleItems(source.rows, Math.max(1, Math.round(source.rows.length * 0.3)));
      for (const record of sampled) {
        const commentCount = faker.number.int({ min: 1, max: 3 });
        for (let i = 0; i < commentCount; i++) {
          commentRows.push({
            id: randomUUID(),
            entityType: source.entityType,
            entityId: record.id,
            authorId: randomItem(staffRecords).id,
            body: randomItem(commentBodies),
            createdAt: new Date(),
          });
        }
        if (faker.datatype.boolean()) {
          const attachmentCount = faker.number.int({ min: 1, max: 2 });
          for (let i = 0; i < attachmentCount; i++) {
            attachmentRows.push({
              id: randomUUID(),
              entityType: source.entityType,
              entityId: record.id,
              fileName: `${source.entityType.toLowerCase()}-${String(record.id).slice(0, 8)}-doc-${i + 1}.pdf`,
              sizeBytes: faker.number.int({ min: 20000, max: 4000000 }),
              uploadedById: randomItem(staffRecords).id,
              url: `https://documents.centralacademy.edu/${source.entityType.toLowerCase()}/${record.id}/attachment-${i + 1}.pdf`,
              uploadedAt: new Date(),
            });
          }
        }
      }
    }
    await batchInsert('comments', prisma.comment, commentRows, 3000);
    await batchInsert('attachments', prisma.attachment, attachmentRows, 3000);

    console.log('\n36) Generating audit trail entries...');
    const auditLogRows: any[] = [];
    const auditActionTemplates: { action: string; tableName: string; pick: () => string | null }[] = [
      { action: 'LOGIN', tableName: 'staff', pick: () => randomItem(staffRecords).id },
      { action: 'MARK_ATTENDANCE', tableName: 'attendance_records', pick: () => (enrollments.length ? randomItem(enrollments).id : null) },
      { action: 'UPDATE_FEE_INVOICE', tableName: 'fee_invoices', pick: () => (invoiceRows.length ? randomItem(invoiceRows).id : null) },
      { action: 'APPROVE_LEAVE', tableName: 'leave_applications', pick: () => (staffLeaveRows.length ? randomItem(staffLeaveRows).id : null) },
      { action: 'PUBLISH_RESULT', tableName: 'report_cards', pick: () => (reportCardRows.length ? randomItem(reportCardRows).id : null) },
      { action: 'CREATE_STUDENT', tableName: 'students', pick: () => (studentRows.length ? randomItem(studentRows).id : null) },
    ];
    for (const staff of staffRecords) {
      const count = faker.number.int({ min: 5, max: 10 });
      for (let i = 0; i < count; i++) {
        const template = randomItem(auditActionTemplates);
        const recordId = template.pick();
        if (!recordId) continue;
        auditLogRows.push({
          id: randomUUID(),
          userId: staff.id,
          userEmail: staff.email,
          action: template.action,
          tableName: template.tableName,
          recordId,
          oldValue: null,
          newValue: { action: template.action, changedBy: staff.fullName },
          ipAddress: faker.internet.ipv4(),
          userAgent: 'Mozilla/5.0 (SchoolERP Portal)',
          timestamp: faker.date.between({ from: SESSION_START, to: TODAY }),
        });
      }
    }
    await batchInsert('audit_logs', prisma.auditLog, auditLogRows, 5000);

    const acmsAuditLogRows: any[] = [];
    for (const event of eventRows) {
      acmsAuditLogRows.push({
        id: randomUUID(),
        action: 'EVENT_CREATED',
        entityType: 'ACMSEvent',
        entityId: event.id,
        performedBy: randomItem(staffRecords).id,
        timestamp: event.createdAt,
        details: `Calendar event "${event.title}" created.`,
      });
    }
    for (let i = 0; i < 10; i++) {
      acmsAuditLogRows.push({
        id: randomUUID(),
        action: randomItem(['HOLIDAY_UPDATED', 'TERM_CONFIGURED', 'WORKING_DAY_UPDATED']),
        entityType: randomItem(['ACMSHolidayMaster', 'ACMSAcademicTerm', 'ACMSWorkingDay']),
        entityId: randomUUID(),
        performedBy: randomItem(staffRecords).id,
        timestamp: faker.date.between({ from: SESSION_START, to: TODAY }),
        details: 'Academic calendar configuration updated.',
      });
    }
    await batchInsert('acms_audit_logs', prisma.aCMSAuditLog, acmsAuditLogRows, 3000);

    const systemAuditLogRows: any[] = [];
    const systemAuditActions = [
      { action: 'MOBILE_LOGIN', module: 'AUTH', role: 'TEACHER' },
      { action: 'ATTENDANCE_MARKED', module: 'ATTENDANCE', role: 'TEACHER' },
      { action: 'BUS_LOCATION_PING', module: 'TRANSPORT', role: 'DRIVER' },
      { action: 'GATE_CHECK_IN', module: 'TRANSPORT', role: 'CONDUCTOR' },
      { action: 'FEE_STATUS_VIEWED', module: 'FEES', role: 'PARENT' },
    ];
    const systemAuditActors = [...teacherIds, ...driverIds, ...familyGroups.map((f) => f.parentId)];
    for (const actorId of sampleItems(systemAuditActors, Math.min(systemAuditActors.length, 150))) {
      const count = faker.number.int({ min: 2, max: 5 });
      for (let i = 0; i < count; i++) {
        const template = randomItem(systemAuditActions);
        systemAuditLogRows.push({
          id: randomUUID(),
          action: template.action,
          module: template.module,
          entityType: null,
          entityId: null,
          performedBy: actorId,
          role: template.role,
          details: { source: 'mobile-app', appVersion: '2.4.0' },
          ipAddress: faker.internet.ipv4(),
          deviceInfo: randomItem(['Android 14 / Pixel 7', 'iOS 17 / iPhone 13', 'Android 13 / Redmi Note 12']),
          timestamp: faker.date.between({ from: SESSION_START, to: TODAY }),
        });
      }
    }
    await batchInsert('system_audit_logs', prisma.systemAuditLog, systemAuditLogRows, 5000);

  }

  // ==========================================
  // GLOBAL — workflow/rule configuration and the daily news digest are
  // school-wide, not campus-scoped, so they run once here rather than
  // inside the per-campus loop above.
  // ==========================================
  console.log('\nGlobal) Seeding workflow definitions, business rules, and daily news digest...');
  const workflowDefinitionRows = [
    { id: randomUUID(), entityType: 'LeaveApplication', name: 'Staff Leave Approval', stages: ['Submitted', 'PendingApproval', 'Approved', 'Rejected'], transitions: { Submitted: ['PendingApproval'], PendingApproval: ['Approved', 'Rejected'], Approved: [], Rejected: [] } },
    { id: randomUUID(), entityType: 'FeeRefund', name: 'Fee Refund Approval', stages: ['Requested', 'UnderReview', 'Approved', 'Rejected', 'Processed'], transitions: { Requested: ['UnderReview'], UnderReview: ['Approved', 'Rejected'], Approved: ['Processed'], Rejected: [], Processed: [] } },
    { id: randomUUID(), entityType: 'AdmissionInquiry', name: 'Admission Inquiry Pipeline', stages: ['New', 'Contacted', 'CampusVisitScheduled', 'ApplicationSent', 'Converted', 'Lost'], transitions: { New: ['Contacted'], Contacted: ['CampusVisitScheduled', 'Lost'], CampusVisitScheduled: ['ApplicationSent', 'Lost'], ApplicationSent: ['Converted', 'Lost'], Converted: [], Lost: [] } },
    { id: randomUUID(), entityType: 'ConsentRequest', name: 'Parental Consent Collection', stages: ['Open', 'Closed'], transitions: { Open: ['Closed'], Closed: [] } },
    { id: randomUUID(), entityType: 'DisciplineIncident', name: 'Discipline Incident Resolution', stages: ['Open', 'Escalated', 'Resolved'], transitions: { Open: ['Escalated', 'Resolved'], Escalated: ['Resolved'], Resolved: [] } },
  ].map((row) => ({ ...row, createdAt: new Date(), updatedAt: new Date() }));
  await batchInsert('workflow_definitions', prisma.workflowDefinition, workflowDefinitionRows);

  const ruleRows = [
    { key: 'ATTENDANCE_MIN_PERCENT_FOR_PROMOTION', entityType: 'StudentEnrollment', description: 'Minimum attendance percentage required for a student to be eligible for promotion.', definition: { minPercent: 75 } },
    { key: 'FEE_LATE_PENALTY_PERCENT', entityType: 'FeeInvoice', description: 'Late payment penalty applied to overdue fee invoices.', definition: { flatAmount: 500 } },
    { key: 'LEAVE_MAX_DAYS_PER_TERM', entityType: 'LeaveApplication', description: 'Maximum consecutive leave days a staff member can take per term without special approval.', definition: { maxDays: 15 } },
    { key: 'PROMOTION_PASS_PERCENT', entityType: 'ReportCard', description: 'Minimum overall percentage required for automatic promotion to the next grade.', definition: { minPercent: 35 } },
    { key: 'LMS_BADGE_XP_THRESHOLD', entityType: 'LMSStudentPortfolio', description: 'XP threshold at which a student portfolio automatically qualifies for a badge review.', definition: { xpThreshold: 500 } },
    { key: 'CONSENT_REMINDER_DAYS', entityType: 'ConsentRequest', description: 'Number of days before the due date to send a consent reminder notification.', definition: { reminderDays: 3 } },
    { key: 'HOSTEL_OUTPASS_MAX_HOURS', entityType: 'HostelOutpass', description: 'Maximum hours a student can be away from the hostel on a single outpass.', definition: { maxHours: 12 } },
    { key: 'LIBRARY_MAX_BOOKS_PER_STUDENT', entityType: 'BookIssue', description: 'Maximum number of books a student may have issued at the same time.', definition: { maxBooks: 3 } },
  ].map((row) => ({ id: randomUUID(), ...row, active: true, createdAt: new Date(), updatedAt: new Date() }));
  await batchInsert('rules', prisma.rule, ruleRows);

  const dailyNewsDates = Array.from(new Set([...schoolDays, ...currentSessionDays]));
  const dailyNewsTemplates = [
    { national: 'Parliament session continues with debates on the new education policy.', international: 'Global leaders convene for the annual climate summit.', sports: 'National cricket team wins the ongoing test series.', weather: 'Partly cloudy with a mild breeze; pleasant conditions expected through the day.' },
    { national: 'Government announces new infrastructure projects for rural development.', international: 'International trade talks progress between major economies.', sports: 'Local football league enters its semi-final round.', weather: 'Clear skies with warm daytime temperatures; light winds in the evening.' },
    { national: 'State governments roll out digital literacy programs in schools.', international: 'Scientific mission reports new findings from space exploration.', sports: 'Athletics championship sees a new national record set.', weather: 'Humid with a chance of light showers in the afternoon.' },
  ];
  const dailyNewsRows = dailyNewsDates.map((dateStr) => {
    const template = randomItem(dailyNewsTemplates);
    return {
      id: randomUUID(),
      date: new Date(dateStr),
      national: template.national,
      international: template.international,
      sports: template.sports,
      weather: template.weather,
      importantDay: null,
      festival: null,
      createdAt: new Date(),
    };
  });
  await batchInsert('daily_news_items', prisma.dailyNewsItem, dailyNewsRows, 3000);

  // ==========================================
  // PROMOTION — real PromotionsService, not hand-rolled enrollment inserts.
  // Runs once for BOTH campuses together: commit()/preview() query Class
  // with no campus filter (confirmed in PromotionsService — a pre-existing,
  // separately-tracked gap, not fixed here), which is exactly the right
  // behavior for a script with no request-scoped caller identity — one call
  // naturally promotes every campus's eligible students.
  // ==========================================
  console.log('\n=== Promoting historical session → current session (real PromotionsService) ===');
  const promotionsService = new PromotionsService(prisma as any);
  const promotionResult = await promotionsService.commit({
    fromSessionId: historicalSession.id,
    toSessionId: currentSession.id,
    passThreshold: 35,
  } as any);
  console.log('Promotion result:', JSON.stringify(promotionResult).slice(0, 300));

  // ==========================================
  // CURRENT SESSION — partial seed, session start through today, per campus,
  // for the newly-promoted enrollments.
  // ==========================================
  for (const def of CAMPUS_DEFS) {
    console.log(`\n=== Seeding current-session partial data: ${def.name} ===`);
    faker.seed(BASE_FAKER_SEED + def.fakerSeedOffset + 99);
    const ctx = campusContext[def.slug];

    const currentEnrollments = await prisma.studentEnrollment.findMany({
      where: { sessionId: currentSession.id, campusId: ctx.campusId, status: 'Enrolled' },
      include: { section: { include: { class: true } } },
    });
    if (!currentEnrollments.length) {
      console.log(`  No promoted enrollments found for ${def.name} — skipping current-session data.`);
      continue;
    }

    const currentStaff = await prisma.staff.findMany({ where: { campusId: ctx.campusId }, select: { id: true } });

    console.log(`  Attendance (${currentSessionDays.length} days)...`);
    const currentStudentAttendance: any[] = [];
    for (const enrollment of currentEnrollments) {
      for (const date of currentSessionDays) {
        const status = weightedPick([
          { value: 'Present', weight: 92 }, { value: 'Absent', weight: 5 }, { value: 'Late', weight: 3 },
        ]);
        const currentStudentCheckIn = status === 'Late' ? '09:12' : '08:55';
        currentStudentAttendance.push({
          id: randomUUID(), enrollmentId: enrollment.id, date, status,
          checkInTime: status === 'Absent' ? null : currentStudentCheckIn,
          checkOutTime: status === 'Absent' ? null : addHoursToTime(currentStudentCheckIn, 6.5),
          faceVerified: status !== 'Absent' && faker.number.int({ min: 1, max: 100 }) <= 90,
          campusId: ctx.campusId, sessionId: currentSession.id, createdAt: new Date(), updatedAt: new Date(),
        });
      }
    }
    await batchInsert('attendance_records (current session, students)', prisma.attendanceRecord, currentStudentAttendance, 5000);

    const currentStaffAttendance: any[] = [];
    for (const staff of currentStaff) {
      for (const date of currentSessionDays) {
        const status = weightedPick([
          { value: 'Present', weight: 93 }, { value: 'Leave', weight: 4 }, { value: 'Absent', weight: 2 }, { value: 'Late', weight: 1 },
        ]);
        const currentStaffCheckIn = status === 'Late' ? '09:10' : '08:50';
        const currentStaffOnSite = status === 'Absent' || status === 'Leave';
        currentStaffAttendance.push({
          id: randomUUID(), staffId: staff.id, date, status,
          checkInTime: currentStaffOnSite ? null : currentStaffCheckIn,
          checkOutTime: currentStaffOnSite ? null : addHoursToTime(currentStaffCheckIn, 7),
          faceVerified: !currentStaffOnSite && faker.number.int({ min: 1, max: 100 }) <= 90,
          campusId: ctx.campusId, sessionId: currentSession.id, createdAt: new Date(), updatedAt: new Date(),
        });
      }
    }
    await batchInsert('attendance_records (current session, staff)', prisma.attendanceRecord, currentStaffAttendance, 5000);

    // Recent transport trips — the mobile Driver flow (pre-trip check,
    // boarding, "today's trip") reads TransportVehicleStaff + TransportTrip
    // for *today*, and every trip seeded by the historical-session pass
    // above is dated 2025-04-01–2025-05-07 (a 30-day sample deep in the
    // past). Without this, every driver — named or bulk — shows "could not
    // load your vehicle assignment" / "could not load today's trip" no
    // matter who logs in. Scoped to the last 14 current-session school days
    // (through today) rather than the full ~114-day range, to keep this
    // bounded — attendance already covers the full range; trips only need
    // to be recent enough for the driver-facing "today/this week" screens.
    console.log('  Recent transport trips (last 14 days through today)...');
    const recentTripDays = currentSessionDays.slice(-14);
    if (ctx.routeRows.length && ctx.driverIds.length && recentTripDays.length) {
      const currentTransportAssignments: any[] = [];
      const studentsForCurrentTransport = faker.helpers.arrayElements(
        currentEnrollments,
        Math.floor(currentEnrollments.length * 0.58),
      );
      for (const enrollment of studentsForCurrentTransport) {
        const route = randomItem(ctx.routeRows);
        const stopsForRoute = await prisma.transportRouteStop.findMany({ where: { routeId: route.id } });
        if (!stopsForRoute.length) continue;
        const stop = randomItem(stopsForRoute);
        currentTransportAssignments.push({
          id: randomUUID(), enrollmentId: enrollment.id, routeId: route.id, stopId: stop.id,
          morningPickup: true, afternoonDrop: true, seatNumber: `${faker.number.int({ min: 1, max: 40 })}`,
          feePeriod: 'Annual', guardianAuth: 'Verified', status: 'Active',
        });
      }
      await batchInsert('transport_student_assignments (current session)', prisma.transportStudentAssignment, currentTransportAssignments, 2000);

      const currentTripRows: any[] = [];
      const currentTripLogRows: any[] = [];
      const currentTransportAttendanceRows: any[] = [];
      const allStopsByRoute = new Map<string, any[]>();
      for (const route of ctx.routeRows) {
        allStopsByRoute.set(route.id, await prisma.transportRouteStop.findMany({ where: { routeId: route.id } }));
      }
      for (const date of recentTripDays) {
        for (const route of ctx.routeRows) {
          ['Morning', 'Afternoon'].forEach((travelType) => {
            const tripId = randomUUID();
            const isPast = date < fmt(TODAY);
            currentTripRows.push({
              id: tripId, vehicleId: route.vehicleId, routeId: route.id, tripType: travelType,
              driverId: ctx.driverIds[ctx.routeRows.indexOf(route) % ctx.driverIds.length],
              date, status: isPast ? 'Completed' : 'Scheduled', createdAt: new Date(), updatedAt: new Date(),
            });
            (allStopsByRoute.get(route.id) || []).forEach((stop) => {
              if (isPast) {
                currentTripLogRows.push({ id: randomUUID(), tripId, stopId: stop.id, status: 'Reached Stop', timestamp: new Date(), remarks: 'On time' });
              }
            });
            currentTransportAssignments.filter((a) => a.routeId === route.id).forEach((assignment) => {
              if (isPast) {
                currentTransportAttendanceRows.push({ id: randomUUID(), tripId, enrollmentId: assignment.enrollmentId, status: faker.helpers.arrayElement(['Boarded', 'Dropped', 'Absent']), timestamp: new Date(), markedBy: 'Manual', stopId: assignment.stopId });
              }
            });
          });
        }
      }
      await batchInsert('transport_trips (current session)', prisma.transportTrip, currentTripRows, 2000);
      await batchInsert('transport_trip_logs (current session)', prisma.transportTripLog, currentTripLogRows, 4000);
      await batchInsert('transport_attendance (current session)', prisma.transportAttendance, currentTransportAttendanceRows, 4000);
    }

    console.log('  Fee invoices for Term 1 (already due within the partial window)...');
    const currentInvoiceRows: any[] = [];
    const currentPaymentRows: any[] = [];
    for (const enrollment of currentEnrollments) {
      const grade = enrollment.section.class.grade;
      const amount = 14500 + CLASS_NAMES.indexOf(grade) * 950;
      const invoiceId = randomUUID();
      const statusProb = faker.number.int({ min: 1, max: 100 });
      const status = statusProb <= 55 ? 'Paid' : 'Unpaid'; // early in the session, fewer paid yet
      currentInvoiceRows.push({
        id: invoiceId, enrollmentId: enrollment.id, amount: amount.toString(), lateFeeAmount: '0',
        totalAmount: amount.toString(), dueDate: '2026-06-30', status, campusId: ctx.campusId,
        createdAt: new Date(), updatedAt: new Date(),
      });
      if (status === 'Paid') {
        currentPaymentRows.push({
          id: randomUUID(), invoiceId, amountPaid: amount.toString(),
          paymentMode: randomItem(['Cash', 'UPI', 'NetBanking', 'Cheque']), paymentDate: '2026-06-20',
          transactionRef: `TXN${faker.number.int({ min: 1000000, max: 9999999 })}`, createdAt: new Date(), updatedAt: new Date(),
        });
      }
    }
    await batchInsert('fee_invoices (current session)', prisma.feeInvoice, currentInvoiceRows, 3000);
    await batchInsert('fee_payments (current session)', prisma.feePayment, currentPaymentRows, 3000);

    console.log('  Unit Test 1 (the only exam that would realistically have happened by today)...');
    const currentExam = await prisma.exam.create({ data: { name: `Unit Test 1 (${def.name.replace('Central Academy ', '')})`, term: 'Term 1', sessionId: currentSession.id, status: 'Completed' } });
    const currentExamSlots: any[] = [];
    const classIdsCurrentByEnrollment = new Map(currentEnrollments.map((e) => [e.id, e.section.classId]));
    const uniqueCurrentClassIds = Array.from(new Set(currentEnrollments.map((e) => e.section.classId)));
    for (const classId of uniqueCurrentClassIds) {
      const grade = currentEnrollments.find((e) => e.section.classId === classId)!.section.class.grade;
      let slotOffset = 0;
      for (const subjectName of (CLUSTER_SUBJECTS[grade] || ['English', 'Mathematics'])) {
        currentExamSlots.push({
          id: randomUUID(), examId: currentExam.id, classId, subjectId: subjectMap[subjectName],
          date: fmt(new Date(new Date('2026-06-10').setDate(10 + slotOffset))),
          startTime: '09:00', endTime: '11:00', room: randomItem(['Main Hall', 'Room 501', 'Room 502']),
          createdAt: new Date(), updatedAt: new Date(),
        });
        slotOffset++;
      }
    }
    await batchInsert('exam_slots (current session)', prisma.examSlot, currentExamSlots, 3000);

    const currentMarks: any[] = [];
    const currentReportCards: any[] = [];
    for (const enrollment of currentEnrollments) {
      const grade = enrollment.section.class.grade;
      const subjectsForGrade = CLUSTER_SUBJECTS[grade] || ['English', 'Mathematics'];
      let totalMarks = 0;
      let subjectCount = 0;
      for (const subjectName of subjectsForGrade) {
        const slot = currentExamSlots.find((s) => s.classId === enrollment.section.classId && s.subjectId === subjectMap[subjectName]);
        const isAbsent = faker.number.int({ min: 1, max: 100 }) <= 4;
        const marksObtained = isAbsent ? null : faker.number.int({ min: 28, max: 98 });
        currentMarks.push({ id: randomUUID(), examSlotId: slot?.id ?? randomUUID(), enrollmentId: enrollment.id, marksObtained, isAbsent, remarks: isAbsent ? 'Absent' : 'Completed' });
        if (!isAbsent && marksObtained !== null) { totalMarks += marksObtained; subjectCount++; }
      }
      const percentage = subjectCount ? Math.round((totalMarks / (subjectCount * 100)) * 100) : 0;
      currentReportCards.push({
        id: randomUUID(), enrollmentId: enrollment.id, examId: currentExam.id,
        attendanceRate: '95.0%', gpa: ((percentage / 100) * 10).toFixed(2),
        computedData: { percentage, performance: percentage >= 75 ? 'Strong' : percentage >= 50 ? 'Satisfactory' : 'Needs Improvement' },
        remarks: percentage >= 75 ? 'Excellent performance' : percentage >= 50 ? 'Good effort' : 'Requires attention',
        isApproved: true, status: 'Active',
      });
    }
    await batchInsert('exam_marks (current session)', prisma.examMarks, currentMarks, 5000);
    await batchInsert('report_cards (current session)', prisma.reportCard, currentReportCards, 3000);

    console.log('  LMS quiz attempts and assignment submissions (current session, through today)...');
    const currentLmsCourses: any[] = [];
    const currentUniqueSections = Array.from(new Set(currentEnrollments.map((e) => e.sectionId)))
      .slice(0, 20)
      .map((sectionId) => currentEnrollments.find((e) => e.sectionId === sectionId)!);
    currentUniqueSections.forEach((sample) => {
      const grade = sample.section.class.grade;
      const subjectsForGrade = CLUSTER_SUBJECTS[grade] || ['English', 'Mathematics'];
      currentLmsCourses.push({
        id: randomUUID(), title: `${subjectsForGrade[0]} - ${grade} (${SESSION_DEFS[1].name})`,
        description: `Interactive ${subjectsForGrade[0]} learning resources.`, subjectId: subjectMap[subjectsForGrade[0]],
        classId: sample.section.classId, status: 'Published', sectionId: sample.sectionId, createdAt: new Date(), updatedAt: new Date(),
      });
    });
    await batchInsert('lms_courses (current session)', prisma.lMSCourse, currentLmsCourses.map(({ sectionId, ...c }) => c), 500);

    const currentQuizRows: any[] = [];
    const currentQuizAttemptRows: any[] = [];
    const currentLmsAssignmentRows: any[] = [];
    const currentLmsSubmissionRows: any[] = [];
    currentLmsCourses.forEach((course) => {
      const quizId = randomUUID();
      currentQuizRows.push({ id: quizId, title: `${course.title} Practice Quiz`, description: `Practice quiz for ${course.title}`, durationMin: 30, maxScore: 50, createdAt: new Date() });
      const sectionEnrollments = currentEnrollments.filter((e) => e.sectionId === course.sectionId);
      faker.helpers.arrayElements(sectionEnrollments, Math.round(sectionEnrollments.length * 0.4)).forEach((enrollment) => {
        currentQuizAttemptRows.push({ id: randomUUID(), quizId, studentId: enrollment.studentId, score: faker.number.int({ min: 25, max: 50 }), startedAt: new Date(), endedAt: new Date() });
      });

      const assignmentId = randomUUID();
      currentLmsAssignmentRows.push({ id: assignmentId, title: `${course.title} Assignment 1`, description: `Complete assignment 1 for ${course.title}`, dueDate: TODAY, maxScore: 100, createdAt: new Date() });
      faker.helpers.arrayElements(sectionEnrollments, Math.round(sectionEnrollments.length * 0.3)).forEach((enrollment) => {
        const graded = faker.datatype.boolean();
        currentLmsSubmissionRows.push({
          id: randomUUID(), assignmentId, studentId: enrollment.studentId, content: 'Submitted through LMS mobile app',
          score: graded ? faker.number.int({ min: 55, max: 98 }) : null, feedback: graded ? randomItem(['Well done', 'Good structure', 'Revise final answer']) : null,
          submittedAt: new Date(), gradedAt: graded ? new Date() : null,
        });
      });
    });
    await batchInsert('lms_quizzes (current session)', prisma.lMSQuiz, currentQuizRows, 500);
    await batchInsert('lms_quiz_attempts (current session)', prisma.lMSQuizAttempt, currentQuizAttemptRows, 2000);
    await batchInsert('lms_assignments (current session)', prisma.lMSAssignment, currentLmsAssignmentRows, 500);
    await batchInsert('lms_submissions (current session)', prisma.lMSSubmission, currentLmsSubmissionRows, 2000);

    if (ctx.ems) {
      console.log('  EMS current-session cycle (in progress, not yet fully graded)...');
      const emsCurrentEnrollments = currentEnrollments.filter((e) => ctx.ems!.emsTargetClasses.some((c) => c.id === ctx.ems!.sectionToClassMap[e.sectionId]?.classId));
      if (emsCurrentEnrollments.length) {
        await seedEmsCycle({
          campusId: ctx.campusId, subjectMap, ...ctx.ems,
          sessionName: `EMS Unit Assessment ${SESSION_DEFS[1].name}`, sessionStart: SESSION_DEFS[1].start, sessionEnd: TODAY, sessionIsActive: true,
          examTypeIdx: 1, examDate: new Date('2026-07-20'), mode: 'ONLINE', fullyGraded: false,
          targetEnrollments: emsCurrentEnrollments,
        });
      }
    }

    console.log('  Notifications, messages, consent, LMS activity, ACMS alerts, and audit trail (current session, through today)...');
    const currentStudentIds = currentEnrollments.map((e) => e.studentId);
    const currentParentLinks = await prisma.parentStudent.findMany({ where: { studentId: { in: currentStudentIds } } });
    const currentParentIds = Array.from(new Set(currentParentLinks.map((p) => p.parentId)));
    const parentByCurrentStudent = new Map(currentParentLinks.map((p) => [p.studentId, p.parentId]));

    // recipientId must be the student's PortalAccount id, not Student.id
    // itself — communication.service.ts's getNotifications resolves a portal
    // account by referenceId first, then looks up notifications by that
    // account's own id. Staff notifications are intentionally not seeded
    // here — staff have no PortalAccount in this schema (see the historical
    // block's comment above), so they'd be unreachable dead rows.
    const currentStudentPortalAccounts = await prisma.portalAccount.findMany({
      where: { referenceId: { in: currentStudentIds }, userType: 'STUDENT' },
      select: { id: true, referenceId: true },
    });
    const portalAccountIdByCurrentStudent = new Map(currentStudentPortalAccounts.map((p) => [p.referenceId, p.id]));

    const currentNotificationTemplates = [
      { type: 'PUSH', title: 'New Session Update', content: `Welcome to ${SESSION_DEFS[1].name}. Your class and section details have been updated.`, route: '/modules/shared/notifications' },
      { type: 'EMAIL', title: 'Fee Due Reminder', content: 'Term fee payment for the new session is due soon.', route: '/modules/student/fees' },
      { type: 'PUSH', title: 'Timetable Published', content: 'The updated timetable for this session is now available on the portal.', route: '/modules/student/dashboard' },
    ];
    const currentNotificationRows: any[] = [];
    for (const enrollment of currentEnrollments) {
      const recipientId = portalAccountIdByCurrentStudent.get(enrollment.studentId);
      if (!recipientId) continue;
      const count = faker.number.int({ min: 1, max: 3 });
      for (let i = 0; i < count; i++) {
        const template = randomItem(currentNotificationTemplates);
        currentNotificationRows.push({
          id: randomUUID(), recipientId, type: template.type, title: template.title, content: template.content,
          priority: 'NORMAL', readStatus: faker.datatype.boolean(), data: { route: template.route },
        });
      }
    }
    await batchInsert('notifications (current session)', prisma.notification, currentNotificationRows, 3000);

    const relevantConversations = await prisma.conversation.findMany({ where: { parentId: { in: currentParentIds } } });
    const currentMessageTemplates = [
      { sender: 'PARENT', content: 'Checking in on how the new session is going so far.' },
      { sender: 'STAFF', content: 'Off to a good start — settling into the new grade well.' },
      { sender: 'PARENT', content: 'Please share the updated timetable for this session.' },
      { sender: 'STAFF', content: 'The timetable has been shared on the portal.' },
    ];
    const currentMessageRows: any[] = [];
    for (const conversation of relevantConversations) {
      const count = faker.number.int({ min: 1, max: 3 });
      for (let i = 0; i < count; i++) {
        const template = currentMessageTemplates[i % currentMessageTemplates.length];
        currentMessageRows.push({
          id: randomUUID(), conversationId: conversation.id,
          senderId: template.sender === 'PARENT' ? conversation.parentId : conversation.staffId,
          senderType: template.sender, content: template.content, readStatus: faker.datatype.boolean(),
        });
      }
    }
    await batchInsert('messages (current session)', prisma.message, currentMessageRows, 3000);

    const currentConsentRequestId = randomUUID();
    await batchInsert('consent_requests (current session)', prisma.consentRequest, [{
      id: currentConsentRequestId, title: 'Annual Sports Day Participation',
      description: `Consent for your ward to participate in the Annual Sports Day for ${SESSION_DEFS[1].name}.`,
      targetType: 'ALL', targetSectionId: null,
      dueDate: new Date(TODAY.getTime() + 20 * 24 * 60 * 60 * 1000),
      createdById: randomItem(currentStaff).id,
    }], 500);
    const currentConsentResponseRows = currentEnrollments.map((enrollment) => {
      const status = weightedPick([{ value: 'Pending', weight: 55 }, { value: 'Signed', weight: 35 }, { value: 'Declined', weight: 10 }]);
      return {
        id: randomUUID(), consentRequestId: currentConsentRequestId, studentId: enrollment.studentId, status,
        respondedAt: status === 'Pending' ? null : faker.date.recent({ days: 10 }),
        respondedById: status === 'Pending' ? null : (parentByCurrentStudent.get(enrollment.studentId) ?? null),
      };
    });
    await batchInsert('consent_responses (current session)', prisma.consentResponse, currentConsentResponseRows, 3000);

    const currentGradebookRows: any[] = [];
    const currentGradeRows: any[] = [];
    const currentLiveClassRows: any[] = [];
    const currentDiscussionThreadRows: any[] = [];
    const currentDiscussionPostRows: any[] = [];
    const currentDiscussionPostTemplates = ['Can someone explain this concept in simpler terms?', 'Great explanation, thanks!', 'Does this apply to the upcoming exam too?'];
    for (const course of currentLmsCourses) {
      const gradebookId = randomUUID();
      currentGradebookRows.push({ id: gradebookId, courseId: course.id, createdAt: new Date() });
      const sectionEnrollments = currentEnrollments.filter((e) => e.sectionId === course.sectionId);
      for (const enrollment of sectionEnrollments) {
        const totalScore = faker.number.int({ min: 50, max: 95 });
        currentGradeRows.push({
          id: randomUUID(), gradebookId, studentId: enrollment.studentId, totalScore,
          letterGrade: totalScore >= 90 ? 'A+' : totalScore >= 80 ? 'A' : totalScore >= 70 ? 'B+' : totalScore >= 60 ? 'B' : 'C',
          createdAt: new Date(), updatedAt: new Date(),
        });
      }
      currentLiveClassRows.push({
        id: randomUUID(), courseId: course.id, title: `${course.title} — Live Session 1`,
        meetingUrl: `https://meet.centralacademy.edu/${course.id}/session-1`,
        scheduledAt: faker.date.between({ from: SESSION_DEFS[1].start, to: TODAY }),
        durationMin: randomItem([45, 60]), hostId: randomItem(currentStaff).id, createdAt: new Date(),
      });
      const threadId = randomUUID();
      currentDiscussionThreadRows.push({ id: threadId, courseId: course.id, title: 'Discussion: Doubts & Questions', authorId: randomItem(currentStaff).id, createdAt: new Date() });
      const postCount = faker.number.int({ min: 2, max: 4 });
      for (let p = 0; p < postCount; p++) {
        currentDiscussionPostRows.push({
          id: randomUUID(), threadId, content: randomItem(currentDiscussionPostTemplates),
          authorId: p % 2 === 0 && sectionEnrollments.length ? randomItem(sectionEnrollments).studentId : randomItem(currentStaff).id,
          createdAt: new Date(),
        });
      }
    }
    await batchInsert('lms_gradebooks (current session)', prisma.lMSGradebook, currentGradebookRows, 500);
    await batchInsert('lms_grades (current session)', prisma.lMSGrade, currentGradeRows, 2000);
    await batchInsert('lms_live_classes (current session)', prisma.lMSLiveClass, currentLiveClassRows, 500);
    await batchInsert('lms_discussion_threads (current session)', prisma.lMSDiscussionThread, currentDiscussionThreadRows, 500);
    await batchInsert('lms_discussion_posts (current session)', prisma.lMSDiscussionPost, currentDiscussionPostRows, 2000);

    const currentPortfolios = await prisma.lMSStudentPortfolio.findMany({ where: { studentId: { in: currentStudentIds } } });
    const currentBadgeRows: any[] = [];
    for (const portfolio of sampleItems(currentPortfolios, Math.round(currentPortfolios.length * 0.15))) {
      currentBadgeRows.push({
        id: randomUUID(), portfolioId: portfolio.id, name: randomItem(['Perfect Attendance', 'Top Scorer', 'Quiz Champion']),
        iconUrl: null, earnedAt: faker.date.between({ from: SESSION_DEFS[1].start, to: TODAY }),
      });
    }
    await batchInsert('lms_badges (current session)', prisma.lMSBadge, currentBadgeRows, 2000);

    const currentAiGenTemplates = [
      { type: 'LESSON_PLAN', prompt: 'Generate a lesson plan for the first week of the new session.', result: 'A structured lesson plan for orientation week.' },
      { type: 'QUIZ_GEN', prompt: 'Create a diagnostic quiz for the start of the new session.', result: 'A 10-question diagnostic quiz covering prior-grade fundamentals.' },
    ];
    const currentAiGenerationRows: any[] = [];
    for (const staff of sampleItems(currentStaff, Math.min(currentStaff.length, 25))) {
      const count = faker.number.int({ min: 1, max: 2 });
      for (let i = 0; i < count; i++) {
        const template = randomItem(currentAiGenTemplates);
        currentAiGenerationRows.push({ id: randomUUID(), userId: staff.id, prompt: template.prompt, result: template.result, type: template.type, createdAt: new Date() });
      }
    }
    await batchInsert('lms_ai_generations (current session)', prisma.lMSAIGeneration, currentAiGenerationRows, 2000);

    const currentAcmsNotificationTemplates = [
      { title: 'New Session Welcome', message: `Welcome to ${SESSION_DEFS[1].name}! Check the portal for the updated calendar.` },
      { title: 'Upcoming Event', message: 'A school event is scheduled soon this session — check the calendar for details.' },
    ];
    const currentAcmsNotificationRows: any[] = [];
    for (const targetId of [...currentStaff.map((s) => s.id), ...currentStudentIds]) {
      const count = faker.number.int({ min: 1, max: 2 });
      for (let i = 0; i < count; i++) {
        const template = randomItem(currentAcmsNotificationTemplates);
        currentAcmsNotificationRows.push({
          id: randomUUID(), userId: targetId, title: template.title, message: template.message,
          type: randomItem(['EMAIL', 'SMS', 'PUSH']), status: weightedPick([{ value: 'UNREAD', weight: 55 }, { value: 'READ', weight: 45 }]),
        });
      }
    }
    await batchInsert('acms_notifications (current session)', prisma.aCMSNotification, currentAcmsNotificationRows, 3000);

    const currentTransportBreakdownRows: any[] = [];
    if (ctx.vehicles.length) {
      for (const vehicle of sampleItems(ctx.vehicles, Math.min(ctx.vehicles.length, 3))) {
        const breakdownDate = faker.date.between({ from: SESSION_DEFS[1].start, to: TODAY });
        currentTransportBreakdownRows.push({
          id: randomUUID(), vehicleId: vehicle.id, driverId: ctx.driverIds.length ? randomItem(ctx.driverIds) : null,
          date: fmt(breakdownDate), time: `${faker.number.int({ min: 7, max: 17 })}:${faker.number.int({ min: 0, max: 59 }).toString().padStart(2, '0')}`,
          location: randomItem(ROUTE_STOPS), description: randomItem(['Flat tyre', 'Engine overheating', 'Battery discharge']),
          actionTaken: 'Roadside repair completed', towingRequired: false,
          costIncurred: faker.number.float({ min: 500, max: 5000, fractionDigits: 2 }),
          status: 'Resolved', acknowledgedBy: randomItem(currentStaff).id, acknowledgedAt: breakdownDate,
        });
      }
    }
    await batchInsert('transport_breakdowns (current session)', prisma.transportBreakdown, currentTransportBreakdownRows, 500);

    const currentTransportAccidentRows: any[] = [];
    if (ctx.vehicles.length && weightedPick([{ value: true, weight: 15 }, { value: false, weight: 85 }])) {
      const vehicle = randomItem(ctx.vehicles);
      const accidentDate = faker.date.between({ from: SESSION_DEFS[1].start, to: TODAY });
      currentTransportAccidentRows.push({
        id: randomUUID(), vehicleId: vehicle.id, driverId: ctx.driverIds.length ? randomItem(ctx.driverIds) : null,
        date: fmt(accidentDate), time: `${faker.number.int({ min: 7, max: 17 })}:${faker.number.int({ min: 0, max: 59 }).toString().padStart(2, '0')}`,
        location: randomItem(ROUTE_STOPS), severity: 'Minor',
        description: 'Minor collision while merging into traffic; no injuries reported.',
        policeReport: false, firNumber: null, insuranceClaimed: faker.datatype.boolean(),
        claimAmount: faker.number.float({ min: 2000, max: 15000, fractionDigits: 2 }),
        status: 'Under Investigation', acknowledgedBy: randomItem(currentStaff).id, acknowledgedAt: accidentDate,
      });
    }
    await batchInsert('transport_accidents (current session)', prisma.transportAccident, currentTransportAccidentRows, 500);

    const currentAppointmentRows: any[] = [];
    for (let i = 0; i < 6; i++) {
      const scheduledFor = faker.date.between({ from: SESSION_DEFS[1].start, to: new Date(TODAY.getTime() + 14 * 24 * 60 * 60 * 1000) });
      currentAppointmentRows.push({
        id: randomUUID(), visitorName: faker.person.fullName(), purpose: randomItem(['Admission Inquiry', 'Parent Meeting', 'Vendor Meeting']),
        scheduledFor, hostId: randomItem(currentStaff).id,
        status: scheduledFor < TODAY ? 'Completed' : 'Scheduled',
      });
    }
    await batchInsert('appointments (current session)', prisma.appointment, currentAppointmentRows, 500);

    const currentCommentRows: any[] = [];
    const currentAttachmentRows: any[] = [];
    const currentCommentableSources: { entityType: string; rows: any[] }[] = [
      { entityType: 'FeeInvoice', rows: currentInvoiceRows.filter((r) => r.status === 'Unpaid') },
      { entityType: 'ReportCard', rows: currentReportCards },
      { entityType: 'TransportBreakdown', rows: currentTransportBreakdownRows },
    ];
    for (const source of currentCommentableSources) {
      if (!source.rows.length) continue;
      const sampled = sampleItems(source.rows, Math.max(1, Math.round(source.rows.length * 0.1)));
      for (const record of sampled) {
        currentCommentRows.push({
          id: randomUUID(), entityType: source.entityType, entityId: record.id, authorId: randomItem(currentStaff).id,
          body: 'Reviewed for the current session.', createdAt: new Date(),
        });
      }
    }
    await batchInsert('comments (current session)', prisma.comment, currentCommentRows, 2000);

    if (currentReportCards.length) {
      for (const rc of sampleItems(currentReportCards, Math.max(1, Math.round(currentReportCards.length * 0.05)))) {
        currentAttachmentRows.push({
          id: randomUUID(), entityType: 'ReportCard', entityId: rc.id, fileName: `report-card-${String(rc.id).slice(0, 8)}.pdf`,
          sizeBytes: faker.number.int({ min: 50000, max: 500000 }), uploadedById: randomItem(currentStaff).id,
          url: `https://documents.centralacademy.edu/reportcard/${rc.id}/attachment.pdf`, uploadedAt: new Date(),
        });
      }
    }
    await batchInsert('attachments (current session)', prisma.attachment, currentAttachmentRows, 2000);

    const currentAuditActionTemplates: { action: string; tableName: string; pick: () => string | null }[] = [
      { action: 'LOGIN', tableName: 'staff', pick: () => (currentStaff.length ? randomItem(currentStaff).id : null) },
      { action: 'MARK_ATTENDANCE', tableName: 'attendance_records', pick: () => (currentEnrollments.length ? randomItem(currentEnrollments).id : null) },
      { action: 'UPDATE_FEE_INVOICE', tableName: 'fee_invoices', pick: () => (currentInvoiceRows.length ? randomItem(currentInvoiceRows).id : null) },
      { action: 'PUBLISH_RESULT', tableName: 'report_cards', pick: () => (currentReportCards.length ? randomItem(currentReportCards).id : null) },
    ];
    const currentAuditLogRows: any[] = [];
    for (const staff of currentStaff) {
      const count = faker.number.int({ min: 2, max: 5 });
      for (let i = 0; i < count; i++) {
        const template = randomItem(currentAuditActionTemplates);
        const recordId = template.pick();
        if (!recordId) continue;
        currentAuditLogRows.push({
          id: randomUUID(), userId: staff.id, userEmail: null, action: template.action, tableName: template.tableName, recordId,
          oldValue: null, newValue: { action: template.action }, ipAddress: faker.internet.ipv4(),
          userAgent: 'Mozilla/5.0 (SchoolERP Portal)', timestamp: faker.date.between({ from: SESSION_DEFS[1].start, to: TODAY }),
        });
      }
    }
    await batchInsert('audit_logs (current session)', prisma.auditLog, currentAuditLogRows, 5000);

    const currentAcmsAuditLogRows: any[] = [];
    for (let i = 0; i < 6; i++) {
      currentAcmsAuditLogRows.push({
        id: randomUUID(), action: randomItem(['EVENT_CREATED', 'WORKING_DAY_UPDATED']), entityType: 'ACMSEvent', entityId: randomUUID(),
        performedBy: randomItem(currentStaff).id, timestamp: faker.date.between({ from: SESSION_DEFS[1].start, to: TODAY }),
        details: `Calendar activity logged for ${SESSION_DEFS[1].name}.`,
      });
    }
    await batchInsert('acms_audit_logs (current session)', prisma.aCMSAuditLog, currentAcmsAuditLogRows, 2000);

    const currentSystemAuditActions = [
      { action: 'MOBILE_LOGIN', module: 'AUTH', role: 'TEACHER' },
      { action: 'ATTENDANCE_MARKED', module: 'ATTENDANCE', role: 'TEACHER' },
      { action: 'BUS_LOCATION_PING', module: 'TRANSPORT', role: 'DRIVER' },
      { action: 'FEE_STATUS_VIEWED', module: 'FEES', role: 'PARENT' },
    ];
    const currentSystemAuditActors = [...currentStaff.map((s) => s.id), ...ctx.driverIds, ...currentParentIds];
    const currentSystemAuditLogRows: any[] = [];
    for (const actorId of sampleItems(currentSystemAuditActors, Math.min(currentSystemAuditActors.length, 80))) {
      const count = faker.number.int({ min: 1, max: 3 });
      for (let i = 0; i < count; i++) {
        const template = randomItem(currentSystemAuditActions);
        currentSystemAuditLogRows.push({
          id: randomUUID(), action: template.action, module: template.module, entityType: null, entityId: null,
          performedBy: actorId, role: template.role, details: { source: 'mobile-app', appVersion: '2.4.0' },
          ipAddress: faker.internet.ipv4(), deviceInfo: randomItem(['Android 14 / Pixel 7', 'iOS 17 / iPhone 13']),
          timestamp: faker.date.between({ from: SESSION_DEFS[1].start, to: TODAY }),
        });
      }
    }
    await batchInsert('system_audit_logs (current session)', prisma.systemAuditLog, currentSystemAuditLogRows, 5000);
  }

  console.log('\n=== Final validation summary ===');
  const studentCount = await prisma.student.count();
  const staffCount = await prisma.staff.count();
  const sectionCount = await prisma.section.count();
  const invoiceCount = await prisma.feeInvoice.count();
  const examCount = await prisma.exam.count();
  const libraryCount = await prisma.libraryBook.count();
  const routeCount = await prisma.transportRoute.count();
  const eventCount = await prisma.aCMSEvent.count();
  const campusCount = await prisma.campus.count();

  console.log(`Campuses: ${campusCount}`);
  console.log(`Students: ${studentCount}`);
  console.log(`Staff: ${staffCount}`);
  console.log(`Sections: ${sectionCount}`);
  console.log(`Fee invoices: ${invoiceCount}`);
  console.log(`Exams: ${examCount}`);
  console.log(`Library books: ${libraryCount}`);
  console.log(`Transport routes: ${routeCount}`);
  console.log(`Events: ${eventCount}`);

  console.log('\nDemo dataset ready. Test credentials:');
  console.log('\n--- Named accounts (deterministic, memorable) ---');
  for (const acc of namedAccounts) {
    console.log(`  ${acc.role.padEnd(20)} [${acc.campus}]  ${acc.email} / ${acc.password}`);
  }
  console.log('\n--- Sample portal accounts (per campus, randomly generated) ---');
  for (const s of sampleAccounts) {
    console.log(`  ${s.campus}: Parent ${s.parentEmail} / ${PARENT_PASSWORD}  |  Student ${s.studentAdmissionNumber} / ${PARENT_PASSWORD}`);
  }

  // Write the same roster to a durable file so it doesn't need to be
  // re-extracted from console output.
  const fs = await import('fs');
  const path = await import('path');
  const lines: string[] = [];
  lines.push('# Test Credentials — Multi-Campus Demo Data');
  lines.push('');
  lines.push(`Generated by \`prisma/seed.ts\`. Two campuses: ${CAMPUS_DEFS.map((c) => c.name).join(', ')}.`);
  lines.push('');
  lines.push('## Named staff accounts');
  lines.push('');
  lines.push('| Role | Campus | Email | Password |');
  lines.push('|---|---|---|---|');
  for (const acc of namedAccounts) {
    lines.push(`| ${acc.role} | ${acc.campus} | ${acc.email} | ${acc.password} |`);
  }
  lines.push('');
  lines.push('## Sample portal accounts (parent / student, randomly generated per campus)');
  lines.push('');
  lines.push('| Campus | Parent email | Student admission number | Password |');
  lines.push('|---|---|---|---|');
  for (const s of sampleAccounts) {
    lines.push(`| ${s.campus} | ${s.parentEmail} | ${s.studentAdmissionNumber} | ${PARENT_PASSWORD} |`);
  }
  fs.writeFileSync(path.join(__dirname, '..', '..', 'TEST_CREDENTIALS.md'), lines.join('\n') + '\n', 'utf8');
  console.log('\nWritten to TEST_CREDENTIALS.md at the repo root.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
