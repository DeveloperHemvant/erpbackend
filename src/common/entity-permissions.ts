/**
 * Maps each primary entity type (IA §3, the 9 Entity 360 pages) to the
 * permission that already grants read access to that record via its own
 * controller. Shared by Comments, Attachments, and Search — services that are
 * generic across entity types and so need a runtime lookup instead of a
 * static per-route @RequirePermissions() decorator.
 */
export const ENTITY_VIEW_PERMISSION: Record<string, string | string[]> = {
  student: 'VIEW_STUDENTS',
  staff: 'MANAGE_USERS',
  vehicle: 'VIEW_TRANSPORT',
  route: 'VIEW_TRANSPORT',
  invoice: 'MANAGE_FEES',
  applicant: 'MANAGE_ADMISSIONS_PIPELINE',
  'discipline-case': 'MANAGE_DISCIPLINE',
  'class-section': 'MANAGE_ACADEMICS',
  parent: 'MANAGE_USERS',
  announcement: 'MANAGE_COMMUNICATION',
  event: 'VIEW_STUDENTS',
  house: 'VIEW_STUDENTS',
  'library-book': 'MANAGE_ACADEMICS',
  // Either permission grants access here on purpose: a student attaching
  // their own submitted work only ever holds VIEW_LMS, a teacher grading it
  // only ever holds MANAGE_LMS. Matches the existing accepted security
  // posture of POST /lms/assignments/:id/submit (@RequireAnyPermission
  // VIEW_LMS/MANAGE_LMS, no per-submission ownership check) — not a new gap.
  'homework-submission': ['VIEW_LMS', 'MANAGE_LMS'],
};

export function canAccessEntityType(
  permissions: string[],
  entityType: string,
): boolean {
  if (permissions.includes('*')) return true;
  const required = ENTITY_VIEW_PERMISSION[entityType];
  if (!required) return false;
  const requiredList = Array.isArray(required) ? required : [required];
  return requiredList.some((r) => permissions.includes(r));
}
