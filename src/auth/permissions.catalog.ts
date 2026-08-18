// Canonical registry of every permission string enforced anywhere in the
// backend (via @RequirePermissions / @RequireAnyPermission), plus a small
// number of documented UI-visibility-only strings (see notes below). This is
// the single source of truth the Roles & Permissions web page renders from —
// previously that page hardcoded its own 7-module CRUD list
// (`students:create` etc.) that shared no vocabulary with these strings, so
// permissions granted through the UI were silently never enforced.
//
// Do not rename existing keys here without also updating every
// @RequirePermissions(...) call site and every seeded Role.permissions
// entry — these strings are persisted in the database (Role.permissions)
// and in issued JWTs.

export interface PermissionDef {
  key: string;
  label: string;
  description?: string;
}

export interface PermissionModule {
  module: string;
  label: string;
  permissions: PermissionDef[];
}

export const PERMISSION_CATALOG: PermissionModule[] = [
  {
    module: 'academics',
    label: 'Academic Structure & Setup',
    permissions: [
      { key: 'MANAGE_ACADEMICS', label: 'Manage academic structure', description: 'Sessions, classes, sections, subjects, timetable, promotions, master data, library, ID cards, templates, substitutions, bulk import.' },
    ],
  },
  {
    module: 'admissions',
    label: 'Admissions',
    permissions: [
      { key: 'MANAGE_ADMISSIONS_PIPELINE', label: 'Manage admissions pipeline', description: 'Inquiries, follow-ups, admission documents, conversion to enrolled students.' },
    ],
  },
  {
    module: 'attendance',
    label: 'Attendance',
    permissions: [
      { key: 'MARK_ATTENDANCE', label: 'Mark & view attendance' },
    ],
  },
  {
    module: 'exams',
    label: 'Examinations (core + EMS)',
    permissions: [
      { key: 'MANAGE_EXAMS', label: 'Manage exams, marks & report cards', description: 'Covers both the core Exam/ExamMarks flow and the full EMS engine.' },
      { key: 'MANAGE_GRADES', label: 'Manage grades (teacher grading tools)' },
      { key: 'VIEW_OWN_GRADES', label: "View own grades/report cards", description: 'Student self-view. Mobile-only visibility gate; actual PDF access is enforced by ownership check, not this string.' },
      { key: 'VIEW_CHILD_GRADES', label: "View child's grades/report cards", description: "Parent view of a linked child's results. Mobile-only visibility gate; actual PDF access is enforced by family-ownership check." },
    ],
  },
  {
    module: 'lms',
    label: 'Learning Management (LMS)',
    permissions: [
      { key: 'VIEW_LMS', label: 'View LMS content' },
      { key: 'MANAGE_LMS', label: 'Manage LMS content, assignments & grading' },
    ],
  },
  {
    module: 'fees',
    label: 'Fees & Finance',
    permissions: [
      { key: 'MANAGE_FEES', label: 'Manage fee structures, invoices & payments' },
      { key: 'PAY_FEES', label: 'Pay fees (parent/student self-service)' },
    ],
  },
  {
    module: 'hr',
    label: 'HR & Payroll',
    permissions: [
      { key: 'MANAGE_HR', label: 'Manage leave, payroll & performance reviews' },
    ],
  },
  {
    module: 'staff',
    label: 'Staff & User Management',
    permissions: [
      { key: 'MANAGE_USERS', label: 'Manage staff directory, onboarding & admission documents' },
    ],
  },
  {
    module: 'roles',
    label: 'Roles, Permissions & Audit',
    permissions: [
      { key: 'MANAGE_ROLES', label: 'Manage roles/permissions, audit logs & system monitoring' },
    ],
  },
  {
    module: 'hostel',
    label: 'Hostel & Boarding',
    permissions: [
      { key: 'MANAGE_HOSTEL', label: 'Manage hostel rooms, allocation, attendance, grievances & mess menu' },
    ],
  },
  {
    module: 'transport',
    label: 'Transport / Fleet',
    permissions: [
      { key: 'MANAGE_TRANSPORT', label: 'Manage routes, trips, boarding & driver operations' },
      { key: 'MANAGE_TRANSPORT_FLEET', label: 'Manage vehicles, documents, maintenance & fleet records' },
    ],
  },
  {
    module: 'health',
    label: 'Health Records',
    permissions: [
      { key: 'MANAGE_HEALTH_RECORDS', label: 'Manage student health profiles, visits & vaccinations' },
    ],
  },
  {
    module: 'discipline',
    label: 'Discipline',
    permissions: [
      { key: 'MANAGE_DISCIPLINE', label: 'Manage discipline incidents & counseling notes' },
    ],
  },
  {
    module: 'communication',
    label: 'Communication & Announcements',
    permissions: [
      { key: 'MANAGE_COMMUNICATION', label: 'Manage announcements, notifications & consent requests' },
      { key: 'MANAGE_NEWS', label: 'Manage school news/notice board posts' },
    ],
  },
  {
    module: 'diary',
    label: 'Diary',
    permissions: [
      { key: 'MANAGE_DIARY', label: 'Manage class diary entries' },
    ],
  },
  {
    module: 'lost-found',
    label: 'Lost & Found',
    permissions: [
      { key: 'MANAGE_LOST_FOUND', label: 'Manage lost & found reports' },
    ],
  },
  {
    module: 'documents',
    label: 'Documents',
    permissions: [
      { key: 'MANAGE_DOCUMENTS', label: 'Manage shared/uploaded documents' },
    ],
  },
  {
    module: 'visitors',
    label: 'Visitors & Reception',
    permissions: [
      { key: 'MANAGE_VISITORS', label: 'Manage visitor log, reception & gate passes' },
    ],
  },
  {
    module: 'activities',
    label: 'Co-Curricular Activities',
    permissions: [
      { key: 'MANAGE_ACTIVITIES', label: 'Manage assemblies, houses, duty roster & activities' },
    ],
  },
  {
    module: 'grievances',
    label: 'Grievances',
    permissions: [
      { key: 'MANAGE_GRIEVANCES', label: 'Manage & resolve grievances' },
    ],
  },
  {
    module: 'students',
    label: 'Student Records',
    permissions: [
      { key: 'VIEW_STUDENTS', label: 'View student directory & profiles' },
    ],
  },
  {
    module: 'reports',
    label: 'Reports & Analytics',
    permissions: [
      { key: 'VIEW_REPORTS', label: 'View cross-module analytics dashboards' },
    ],
  },
  {
    module: 'ai',
    label: 'AI Assistant',
    permissions: [
      { key: 'USE_AI_ASSISTANT', label: 'Use AI-assisted generation tools (LMS content, question banks, etc.)' },
    ],
  },
  {
    module: 'workflow',
    label: 'Workflow Rules',
    permissions: [
      { key: 'MANAGE_WORKFLOWS', label: 'Manage workflow stage/transition definitions', description: 'Advanced configuration screen - not granted to any seeded role by default, same treatment as MANAGE_ROLES.' },
    ],
  },
  {
    module: 'self-service',
    label: 'Self-Service (own record access)',
    permissions: [
      { key: 'VIEW_OWN_PROFILE', label: 'View own profile/dashboard' },
      { key: 'VIEW_CHILD_PROFILE', label: "View linked child's profile/dashboard" },
      { key: 'VIEW_OWN_SCHEDULE', label: 'View own schedule/timetable' },
    ],
  },
];

export const ALL_PERMISSION_KEYS: string[] = PERMISSION_CATALOG.flatMap((m) =>
  m.permissions.map((p) => p.key),
);
