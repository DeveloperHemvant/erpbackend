import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

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
 */
@Injectable()
export class SearchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async searchStudents(q: string, limit: number): Promise<SearchResult[]> {
    const rows = await this.prisma.student.findMany({
      where: { OR: [{ fullName: { contains: q, mode: "insensitive" } }, { admissionNumber: { contains: q, mode: "insensitive" } }] },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
    return rows.map((s) => ({ id: s.id, entityType: "student", title: s.fullName, subtitle: s.admissionNumber, href: `/students/${s.id}`, updatedAt: s.updatedAt }));
  }

  async searchStaff(q: string, limit: number): Promise<SearchResult[]> {
    const rows = await this.prisma.staff.findMany({
      where: { OR: [{ fullName: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
    return rows.map((s) => ({ id: s.id, entityType: "staff", title: s.fullName, subtitle: s.email, href: `/staff/${s.id}`, updatedAt: s.updatedAt }));
  }

  async searchVehicles(q: string, limit: number): Promise<SearchResult[]> {
    const rows = await this.prisma.transportVehicle.findMany({
      where: { OR: [{ vehicleNumber: { contains: q, mode: "insensitive" } }, { busName: { contains: q, mode: "insensitive" } }] },
      take: limit,
    });
    return rows.map((v) => ({ id: v.id, entityType: "vehicle", title: v.vehicleNumber, subtitle: v.vehicleType, href: `/vehicles/${v.id}`, updatedAt: (v as any).updatedAt ?? new Date() }));
  }

  async searchRoutes(q: string, limit: number): Promise<SearchResult[]> {
    const rows = await this.prisma.transportRoute.findMany({
      where: { routeName: { contains: q, mode: "insensitive" } },
      take: limit,
    });
    return rows.map((r) => ({ id: r.id, entityType: "route", title: r.routeName, href: `/routes/${r.id}`, updatedAt: (r as any).updatedAt ?? new Date() }));
  }

  async searchInvoices(q: string, limit: number): Promise<SearchResult[]> {
    const rows = await this.prisma.feeInvoice.findMany({
      where: { enrollment: { student: { fullName: { contains: q, mode: "insensitive" } } } },
      include: { enrollment: { include: { student: true } } },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
    return rows.map((inv) => ({
      id: inv.id,
      entityType: "invoice",
      title: `Invoice — ${inv.enrollment.student.fullName}`,
      subtitle: inv.status,
      href: `/invoices/${inv.id}`,
      updatedAt: inv.updatedAt,
    }));
  }

  async searchApplicants(q: string, limit: number): Promise<SearchResult[]> {
    const rows = await this.prisma.admissionInquiry.findMany({
      where: { childName: { contains: q, mode: "insensitive" } },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
    return rows.map((a) => ({ id: a.id, entityType: "applicant", title: a.childName, subtitle: a.status, href: `/applicants/${a.id}`, updatedAt: a.updatedAt }));
  }

  async searchDisciplineCases(q: string, limit: number): Promise<SearchResult[]> {
    const rows = await this.prisma.disciplineIncident.findMany({
      where: { OR: [{ category: { contains: q, mode: "insensitive" } }, { student: { fullName: { contains: q, mode: "insensitive" } } }] },
      include: { student: true },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
    return rows.map((i) => ({
      id: i.id,
      entityType: "discipline-case",
      title: `${i.category} — ${i.student.fullName}`,
      subtitle: i.status,
      href: `/discipline-cases/${i.id}`,
      updatedAt: i.updatedAt,
    }));
  }

  async searchClassSections(q: string, limit: number): Promise<SearchResult[]> {
    const rows = await this.prisma.section.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      include: { class: true },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
    return rows.map((s) => ({ id: s.id, entityType: "class-section", title: `${s.class.grade} ${s.name}`, href: `/class-sections/${s.id}`, updatedAt: s.updatedAt }));
  }

  async searchParents(q: string, limit: number): Promise<SearchResult[]> {
    const rows = await this.prisma.parent.findMany({
      where: { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
    return rows.map((p) => ({ id: p.id, entityType: "parent", title: p.name, subtitle: p.email ?? undefined, href: `/parents/${p.id}`, updatedAt: p.updatedAt }));
  }
}
