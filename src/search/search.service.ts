import { Injectable } from '@nestjs/common';
import {
  SearchRepository,
  SearchResult,
} from './repositories/search.repository';
import { ENTITY_VIEW_PERMISSION } from '../common/entity-permissions';
import type { AuthenticatedUser } from '../auth/current-user.decorator';

const SEARCHERS: Record<
  string,
  (repo: SearchRepository, q: string, limit: number) => Promise<SearchResult[]>
> = {
  student: (repo, q, limit) => repo.searchStudents(q, limit),
  staff: (repo, q, limit) => repo.searchStaff(q, limit),
  vehicle: (repo, q, limit) => repo.searchVehicles(q, limit),
  route: (repo, q, limit) => repo.searchRoutes(q, limit),
  invoice: (repo, q, limit) => repo.searchInvoices(q, limit),
  applicant: (repo, q, limit) => repo.searchApplicants(q, limit),
  'discipline-case': (repo, q, limit) => repo.searchDisciplineCases(q, limit),
  'class-section': (repo, q, limit) => repo.searchClassSections(q, limit),
  parent: (repo, q, limit) => repo.searchParents(q, limit),
};

/**
 * Federated global search (IA §6) — one endpoint across the primary entities,
 * role-scoped at the query layer (an entity type is skipped entirely if the
 * caller lacks its view permission, not filtered out after the fact),
 * recency-sorted. Command Palette (IA §7) is this same endpoint consumed by
 * the Omnibox alongside its existing client-side navigation results.
 */
@Injectable()
export class SearchService {
  constructor(private readonly repository: SearchRepository) {}

  async search(
    q: string,
    user: AuthenticatedUser,
    limit = 20,
  ): Promise<SearchResult[]> {
    if (!q || q.trim().length < 2) return [];

    const isSuperAdmin = user.permissions.includes('*');
    const allowedTypes = Object.keys(SEARCHERS).filter(
      (type) =>
        isSuperAdmin || user.permissions.includes(ENTITY_VIEW_PERMISSION[type]),
    );

    const perTypeLimit = Math.max(
      3,
      Math.ceil(limit / Math.max(allowedTypes.length, 1)),
    );
    const results = await Promise.all(
      allowedTypes.map((type) =>
        SEARCHERS[type](this.repository, q, perTypeLimit).catch(() => []),
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
