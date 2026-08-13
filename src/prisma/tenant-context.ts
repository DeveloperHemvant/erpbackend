import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import type { AuthenticatedUser } from '../auth/current-user.decorator';

/**
 * Campus Isolation Phase 1 (D4) — the shape every tenant-aware repository
 * method will eventually take as a parameter (Phase 3, not yet wired up
 * here). An object instead of a raw campusId scalar so future tenant-shaped
 * concerns (this milestone adds academicSessionId; a later one might add
 * campus-group/district scoping) land as a new field here instead of a
 * second breaking change to every repository signature.
 */
export interface TenantContext {
  userId: string;
  role: string;
  permissions: string[];
  /** null only when canAccessAllCampuses is true (D3) — never an
   * unresolved/default state. No caller may read null as "unrestricted"
   * except by checking canAccessAllCampuses explicitly. */
  campusId: string | null;
  canAccessAllCampuses: boolean;
  /** Populated from the currently-active AcademicSession, same lookup
   * already used elsewhere (StudentRepository.findActiveAcademicSession()).
   * Not enforced by anything yet — session-level filtering is a later
   * milestone: this only fixes where the value comes from now, so Phase 3
   * doesn't have to touch every repository signature a second time. */
  academicSessionId: string | null;
}

/**
 * Narrows TenantContext.campusId from `string | null` to `string` for the
 * (canAccessAllCampuses === false) branch, where D3 guarantees it's always
 * populated. Also the enforcement point for that guarantee at runtime, not
 * just a type-level convenience: if it's ever violated (a bug, not an
 * expected state), this fails loudly with a 500 instead of the caller
 * silently treating a coincidental null as "no filter" / unrestricted.
 * Call only inside a caller-confirmed !canAccessAllCampuses branch.
 */
export function requireCampusId(tenantContext: TenantContext): string {
  if (!tenantContext.campusId) {
    throw new InternalServerErrorException(
      'TenantContext.campusId is null for a caller without canAccessAllCampuses — invariant violated (see D3, CAMPUS_ISOLATION_PLAN.md).',
    );
  }
  return tenantContext.campusId;
}

@Injectable()
export class TenantContextBuilder {
  constructor(private readonly prisma: PrismaService) {}

  async build(user: AuthenticatedUser): Promise<TenantContext> {
    const activeSession = await this.prisma.academicSession.findFirst({
      where: { isActive: true },
      select: { id: true },
    });

    return {
      userId: user.userId,
      role: user.role,
      permissions: user.permissions,
      campusId: user.campusId,
      canAccessAllCampuses: user.canAccessAllCampuses,
      academicSessionId: activeSession?.id ?? null,
    };
  }
}
