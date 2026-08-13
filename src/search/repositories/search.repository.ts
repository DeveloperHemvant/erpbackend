import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { requireCampusId, type TenantContext } from '../../prisma/tenant-context';

export interface SearchResult {
  id: string;
  entityType: string;
  title: string;
  subtitle?: string;
  href: string;
  updatedAt: Date;
}

/**
 * One query per entity type (IA §6) — the federated search backend. Each
 * method is intentionally simple `contains` matching on that entity's
 * obvious name/number field; ranking is recency (updatedAt/createdAt desc)
 * per §6, since no Event Bus exists yet to do this "properly" (Appendix A.2).
 *
 * Campus Isolation Phase 3, Milestone 1 (CAMPUS_AUDIT.md §3's confirmed live
 * leak, closed here). The one rule every method below follows:
 *   if (!tenantContext.canAccessAllCampuses) filter by tenantContext.campusId
 * — never applied when unrestricted (D3), and never a naive `?? undefined`
 * fallback, since a portal-shaped caller with campusId: null and
 * canAccessAllCampuses: false must never resolve to "no filter" (that would
 * read null as unrestricted, the exact thing D3 forbids). Methods for
 * entity types with no derivable campus path yet (vehicle/route/applicant/
 * announcement/house/library-book — CAMPUS_AUDIT.md §2/§6) return []
 * instead of guessing; searchParents takes no tenantContext at all, per D2's
 * multi-child-campus ambiguity (see search.service.ts's SEARCHERS map).
 */
@Injectable()
export class SearchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async searchStudents(
    q: string,
    limit: number,
    tenantContext: TenantContext,
  ): Promise<SearchResult[]> {
    const rows = await this.prisma.student.findMany({
      where: {
        OR: [
          { fullName: { contains: q, mode: 'insensitive' } },
          { admissionNumber: { contains: q, mode: 'insensitive' } },
        ],
        ...(tenantContext.canAccessAllCampuses
          ? {}
          : { enrollments: { some: { campusId: tenantContext.campusId } } }),
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
    return rows.map((s) => ({
      id: s.id,
      entityType: 'student',
      title: s.fullName,
      subtitle: s.admissionNumber,
      href: `/students/${s.id}`,
      updatedAt: s.updatedAt,
    }));
  }

  async searchStaff(
    q: string,
    limit: number,
    tenantContext: TenantContext,
  ): Promise<SearchResult[]> {
    const rows = await this.prisma.staff.findMany({
      where: {
        OR: [
          { fullName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
        ...(tenantContext.canAccessAllCampuses
          ? {}
          : { campusId: requireCampusId(tenantContext) }),
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
    return rows.map((s) => ({
      id: s.id,
      entityType: 'staff',
      title: s.fullName,
      subtitle: s.email,
      href: `/staff/${s.id}`,
      updatedAt: s.updatedAt,
    }));
  }

  // TransportVehicle has no relation to Campus at all (CAMPUS_AUDIT.md §2) —
  // hidden from campus-restricted staff until that gets a schema decision,
  // rather than guessing or leaving it unfiltered.
  async searchVehicles(
    q: string,
    limit: number,
    tenantContext: TenantContext,
  ): Promise<SearchResult[]> {
    if (!tenantContext.canAccessAllCampuses) return [];
    const rows = await this.prisma.transportVehicle.findMany({
      where: {
        OR: [
          { vehicleNumber: { contains: q, mode: 'insensitive' } },
          { busName: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: limit,
    });
    return rows.map((v) => ({
      id: v.id,
      entityType: 'vehicle',
      title: v.vehicleNumber,
      subtitle: v.vehicleType,
      href: `/vehicles/${v.id}`,
      updatedAt: (v as any).updatedAt ?? new Date(),
    }));
  }

  // TransportRoute — same no-path gap as searchVehicles, see comment above.
  async searchRoutes(
    q: string,
    limit: number,
    tenantContext: TenantContext,
  ): Promise<SearchResult[]> {
    if (!tenantContext.canAccessAllCampuses) return [];
    const rows = await this.prisma.transportRoute.findMany({
      where: { routeName: { contains: q, mode: 'insensitive' } },
      take: limit,
    });
    return rows.map((r) => ({
      id: r.id,
      entityType: 'route',
      title: r.routeName,
      href: `/routes/${r.id}`,
      updatedAt: (r as any).updatedAt ?? new Date(),
    }));
  }

  async searchInvoices(
    q: string,
    limit: number,
    tenantContext: TenantContext,
  ): Promise<SearchResult[]> {
    const rows = await this.prisma.feeInvoice.findMany({
      where: {
        enrollment: {
          student: { fullName: { contains: q, mode: 'insensitive' } },
        },
        ...(tenantContext.canAccessAllCampuses
          ? {}
          : { campusId: tenantContext.campusId }),
      },
      include: { enrollment: { include: { student: true } } },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
    return rows.map((inv) => ({
      id: inv.id,
      entityType: 'invoice',
      title: `Invoice — ${inv.enrollment.student.fullName}`,
      subtitle: inv.status,
      href: `/invoices/${inv.id}`,
      updatedAt: inv.updatedAt,
    }));
  }

  // AdmissionInquiry has no derivable campus path (CAMPUS_AUDIT.md §2) —
  // hidden from campus-restricted staff, same treatment as Vehicle/Route.
  async searchApplicants(
    q: string,
    limit: number,
    tenantContext: TenantContext,
  ): Promise<SearchResult[]> {
    if (!tenantContext.canAccessAllCampuses) return [];
    const rows = await this.prisma.admissionInquiry.findMany({
      where: { childName: { contains: q, mode: 'insensitive' } },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
    return rows.map((a) => ({
      id: a.id,
      entityType: 'applicant',
      title: a.childName,
      subtitle: a.status,
      href: `/applicants/${a.id}`,
      updatedAt: a.updatedAt,
    }));
  }

  async searchDisciplineCases(
    q: string,
    limit: number,
    tenantContext: TenantContext,
  ): Promise<SearchResult[]> {
    const rows = await this.prisma.disciplineIncident.findMany({
      where: {
        OR: [
          { category: { contains: q, mode: 'insensitive' } },
          { student: { fullName: { contains: q, mode: 'insensitive' } } },
        ],
        ...(tenantContext.canAccessAllCampuses
          ? {}
          : {
              student: {
                enrollments: { some: { campusId: tenantContext.campusId } },
              },
            }),
      },
      include: { student: true },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
    return rows.map((i) => ({
      id: i.id,
      entityType: 'discipline-case',
      title: `${i.category} — ${i.student.fullName}`,
      subtitle: i.status,
      href: `/discipline-cases/${i.id}`,
      updatedAt: i.updatedAt,
    }));
  }

  async searchClassSections(
    q: string,
    limit: number,
    tenantContext: TenantContext,
  ): Promise<SearchResult[]> {
    const rows = await this.prisma.section.findMany({
      where: {
        name: { contains: q, mode: 'insensitive' },
        ...(tenantContext.canAccessAllCampuses
          ? {}
          : { class: { campusId: requireCampusId(tenantContext) } }),
      },
      include: { class: true },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
    return rows.map((s) => ({
      id: s.id,
      entityType: 'class-section',
      title: `${s.class.grade} ${s.name}`,
      href: `/class-sections/${s.id}`,
      updatedAt: s.updatedAt,
    }));
  }

  // Deliberately takes no tenantContext — a parent's children can be at
  // different campuses, so there is no single campusId to filter by (D2;
  // CAMPUS_AUDIT.md §5 names the same ambiguity for communication/
  // notifications). Not an oversight — see search.service.ts's SEARCHERS map.
  async searchParents(q: string, limit: number): Promise<SearchResult[]> {
    const rows = await this.prisma.parent.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
    return rows.map((p) => ({
      id: p.id,
      entityType: 'parent',
      title: p.name,
      subtitle: p.email ?? undefined,
      href: `/parents/${p.id}`,
      updatedAt: p.updatedAt,
    }));
  }

  // Announcement has no campusId column at all — is it intentionally
  // school-wide, or should some announcements be campus-specific?
  // (CAMPUS_AUDIT.md §6, a product decision, not answered here.) Hidden
  // from campus-restricted staff until that's decided.
  async searchAnnouncements(
    q: string,
    limit: number,
    tenantContext: TenantContext,
  ): Promise<SearchResult[]> {
    if (!tenantContext.canAccessAllCampuses) return [];
    const rows = await this.prisma.announcement.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { body: { contains: q, mode: 'insensitive' } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
    return rows.map((a) => ({
      id: a.id,
      entityType: 'announcement',
      title: a.title,
      subtitle: a.body,
      href: `/announcements/${a.id}`,
      updatedAt: a.updatedAt,
    }));
  }

  async searchEvents(
    q: string,
    limit: number,
    tenantContext: TenantContext,
  ): Promise<SearchResult[]> {
    const rows = await this.prisma.aCMSEvent.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
        ...(tenantContext.canAccessAllCampuses
          ? {}
          : { campusId: tenantContext.campusId }),
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
    return rows.map((e) => ({
      id: e.id,
      entityType: 'event',
      title: e.title,
      subtitle: e.description ?? undefined,
      href: `/events/${e.id}`,
      updatedAt: e.updatedAt,
    }));
  }

  // SchoolHouse has no campusId column, and no natural single-campus home
  // (captain/vice-captain are individuals; the House concept itself isn't
  // obviously per-campus) — product decision needed (CAMPUS_AUDIT.md §6).
  // Hidden from campus-restricted staff until that's decided.
  async searchHouses(
    q: string,
    limit: number,
    tenantContext: TenantContext,
  ): Promise<SearchResult[]> {
    if (!tenantContext.canAccessAllCampuses) return [];
    const rows = await this.prisma.schoolHouse.findMany({
      where: { name: { contains: q, mode: 'insensitive' } },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
    return rows.map((h) => ({
      id: h.id,
      entityType: 'house',
      title: h.name,
      subtitle: `${h.points} Points`,
      href: `/houses/${h.id}`,
      updatedAt: h.updatedAt,
    }));
  }

  // LibraryBook (the catalog entry) has no campusId — is the catalog shared
  // across campuses, or per-campus? (CAMPUS_AUDIT.md §2/§6, a product
  // decision.) Hidden from campus-restricted staff until that's decided.
  async searchLibraryBooks(
    q: string,
    limit: number,
    tenantContext: TenantContext,
  ): Promise<SearchResult[]> {
    if (!tenantContext.canAccessAllCampuses) return [];
    const rows = await this.prisma.libraryBook.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { author: { contains: q, mode: 'insensitive' } },
          { isbn: { contains: q, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map((b) => ({
      id: b.id,
      entityType: 'library-book',
      title: b.title,
      subtitle: b.author ?? undefined,
      href: `/dashboard/admin/library?bookId=${b.id}`,
      // LibraryBook has no updatedAt column -- createdAt is the closest
      // recency signal this model tracks (catalog entries rarely change).
      updatedAt: b.createdAt,
    }));
  }
}
