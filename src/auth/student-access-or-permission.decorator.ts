import { SetMetadata } from '@nestjs/common';

export interface StudentAccessOrPermissionOptions {
  /** Which OwnershipService check resolves the id to a student. Defaults to
   * 'student' (id IS the studentId) — matches every pre-existing usage. */
  idType?:
    | 'student'
    | 'enrollment'
    | 'hostelOutpass'
    | 'diaryEntry'
    | 'consentResponse';
  /** Where to read paramName from on the request. Defaults to 'params'
   * (existing usages are all URL params like /students/:studentId/...). */
  source?: 'params' | 'body' | 'query';
}

export interface StudentAccessOrPermissionConfig
  extends StudentAccessOrPermissionOptions {
  paramName: string;
  permissions: string[];
}

export const STUDENT_ACCESS_OR_PERMISSION_KEY =
  'studentAccessOrPermissionConfig';

/** Allow the route when the caller holds one of the given permissions (staff
 * managing any student's record), OR is the student themself / their parent
 * (ownership via OwnershipService) — for routes shared by staff and portal
 * users. Defaults to reading a studentId URL param, matching every existing
 * caller; pass `options` to key ownership off an enrollment id or a
 * HostelOutpass id instead, and/or read it from the body or query string. */
export const RequireStudentAccessOrPermission = (
  paramName: string,
  permissions: string[],
  options: StudentAccessOrPermissionOptions = {},
) =>
  SetMetadata(STUDENT_ACCESS_OR_PERMISSION_KEY, {
    paramName,
    permissions,
    ...options,
  });
