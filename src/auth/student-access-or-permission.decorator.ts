import { SetMetadata } from "@nestjs/common";

export interface StudentAccessOrPermissionConfig {
  paramName: string;
  permissions: string[];
}

export const STUDENT_ACCESS_OR_PERMISSION_KEY = "studentAccessOrPermissionConfig";

/** Allow the route when the caller holds one of the given permissions (staff
 * managing any student's record), OR is the student themself / their parent
 * (ownership via OwnershipService) — for routes shared by staff and portal
 * users, keyed by a studentId URL param rather than the caller's own id. */
export const RequireStudentAccessOrPermission = (paramName: string, ...permissions: string[]) =>
  SetMetadata(STUDENT_ACCESS_OR_PERMISSION_KEY, { paramName, permissions });
