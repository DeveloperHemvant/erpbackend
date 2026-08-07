import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Temporary shim for the pre-Phase-1 window (before TenantContext exists —
 * see CAMPUS_ISOLATION_PLAN.md). Resolves a campusId for a new Staff row
 * when the caller didn't supply one. Safe today (exactly one campus
 * seeded) and fails loudly — not silently — the instant a second campus
 * exists, forcing real campusId sourcing via TenantContext once Phase 1/3
 * land, instead of quietly guessing wrong for a real person's record.
 */
export async function resolveSingleCampusIdOrThrow(
  prisma: PrismaService,
): Promise<string> {
  const campuses = await prisma.campus.findMany({ select: { id: true } });
  if (campuses.length === 1) return campuses[0].id;
  if (campuses.length === 0) {
    throw new BadRequestException(
      'No campus exists — create a Campus before creating staff.',
    );
  }
  throw new BadRequestException(
    'Multiple campuses exist — campusId must be provided explicitly and can no longer be inferred.',
  );
}

/**
 * System/bot staff identities (auto-grader, simulator bootstrap admin) don't
 * represent a real person with a real campus assignment — their campusId is
 * a required FK to satisfy, not a meaningful business fact. Deterministically
 * picks the earliest-created campus rather than throwing once multi-campus
 * exists, since these accounts must keep working regardless of campus count.
 * Revisit if system accounts get a proper cross-campus concept later.
 */
export async function resolveSystemAccountCampusId(
  prisma: PrismaService,
): Promise<string> {
  const campus = await prisma.campus.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  if (!campus) {
    throw new BadRequestException(
      'No campus exists — cannot bootstrap system account.',
    );
  }
  return campus.id;
}
