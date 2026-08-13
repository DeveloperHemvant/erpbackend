import { Injectable } from '@nestjs/common';
import {
  SearchRepository,
  SearchResult,
} from './repositories/search.repository';
import { canAccessEntityType } from '../common/entity-permissions';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import type { TenantContext } from '../prisma/tenant-context';

const SEARCHERS: Record<
  string,
  (
    repo: SearchRepository,
    q: string,
    limit: number,
    tenantContext: TenantContext,
  ) => Promise<SearchResult[]>
> = {
  student: (repo, q, limit, tc) => repo.searchStudents(q, limit, tc),
  staff: (repo, q, limit, tc) => repo.searchStaff(q, limit, tc),
  vehicle: (repo, q, limit, tc) => repo.searchVehicles(q, limit, tc),
  route: (repo, q, limit, tc) => repo.searchRoutes(q, limit, tc),
  invoice: (repo, q, limit, tc) => repo.searchInvoices(q, limit, tc),
  applicant: (repo, q, limit, tc) => repo.searchApplicants(q, limit, tc),
  'discipline-case': (repo, q, limit, tc) =>
    repo.searchDisciplineCases(q, limit, tc),
  'class-section': (repo, q, limit, tc) =>
    repo.searchClassSections(q, limit, tc),
  // Never campus-filtered — a parent's children can be at different
  // campuses, so there is no single campusId to filter by (same ambiguity
  // D2 already named for JWTs; CAMPUS_AUDIT.md §5 names it for
  // communication/notifications too). Not an oversight.
  parent: (repo, q, limit) => repo.searchParents(q, limit),
  announcement: (repo, q, limit, tc) => repo.searchAnnouncements(q, limit, tc),
  event: (repo, q, limit, tc) => repo.searchEvents(q, limit, tc),
  house: (repo, q, limit, tc) => repo.searchHouses(q, limit, tc),
  'library-book': (repo, q, limit, tc) =>
    repo.searchLibraryBooks(q, limit, tc),
};

/**
 * Federated global search (IA §6) — one endpoint across the primary entities,
 * role-scoped at the query layer (an entity type is skipped entirely if the
 * caller lacks its view permission, not filtered out after the fact),
 * recency-sorted. Command Palette (IA §7) is this same endpoint consumed by
 * the Omnibox alongside its existing client-side navigation results.
 *
 * Campus Isolation Phase 3, Milestone 1 — tenantContext now threads through
 * to every searcher; each repository method decides for itself how (or
 * whether, per CAMPUS_AUDIT.md §2/§6) to apply it. See search.repository.ts.
 */
@Injectable()
export class SearchService {
  constructor(private readonly repository: SearchRepository) {}

  async search(
    q: string,
    user: AuthenticatedUser,
    tenantContext: TenantContext,
    limit = 20,
  ): Promise<SearchResult[]> {
    if (!q || q.trim().length < 2) return [];

    const allowedTypes = Object.keys(SEARCHERS).filter((type) =>
      canAccessEntityType(user.permissions, type),
    );

    const perTypeLimit = Math.max(
      3,
      Math.ceil(limit / Math.max(allowedTypes.length, 1)),
    );
    const results = await Promise.all(
      allowedTypes.map((type) =>
        SEARCHERS[type](this.repository, q, perTypeLimit, tenantContext).catch(
          () => [],
        ),
      ),
    );

    return results
      .flat()
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .slice(0, limit);
  }
}
