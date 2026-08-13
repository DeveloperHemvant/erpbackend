import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedUser {
  userId: string;
  identifier: string;
  role: string;
  permissions: string[];
  /** Staff's primary campus; always null for Student/Parent portal logins
   * (a parent's children can span campuses — see CAMPUS_ISOLATION_PLAN.md D2)
   * and for canAccessAllCampuses holders (D3: null here always means
   * "unrestricted", never "unresolved"). */
  campusId: string | null;
  /** Derived from permissions.includes('*') at login — the same wildcard
   * PermissionsGuard already treats as unrestricted, named for the campus
   * dimension too rather than inventing a second concept. */
  canAccessAllCampuses: boolean;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
