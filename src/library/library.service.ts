import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLibraryBookDto } from './dto/library.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class LibraryService {
  constructor(private prisma: PrismaService) {}

  private readonly DEFAULT_FINE_RATE_PER_DAY = 10;
  private readonly DEFAULT_BORROW_DAYS = 14;
  private readonly DEFAULT_RESERVATION_EXPIRE_DAYS = 7;

  async addBook(data: CreateLibraryBookDto) {
    return this.prisma.libraryBook.create({ data });
  }

  async getBooks() {
    return this.prisma.libraryBook.findMany();
  }

  async getLibraryReport() {
    const [totalTitles, copiesAgg, currentlyIssued, overdueCount, unpaidFines, topBorrowedRaw] =
      await Promise.all([
        this.prisma.libraryBook.count(),
        this.prisma.libraryBook.aggregate({
          _sum: { totalCopies: true, available: true },
        }),
        this.prisma.bookIssue.count({ where: { status: 'Issued' } }),
        this.prisma.bookIssue.count({
          where: { status: 'Issued', dueDate: { lt: new Date() } },
        }),
        this.prisma.libraryFine.aggregate({
          where: { status: 'Unpaid' },
          _sum: { amount: true },
          _count: true,
        }),
        this.prisma.bookIssue.groupBy({
          by: ['bookId'],
          _count: { bookId: true },
          orderBy: { _count: { bookId: 'desc' } },
          take: 5,
        }),
      ]);

    const topBorrowedBooks = await Promise.all(
      topBorrowedRaw.map(async (row) => ({
        book: await this.prisma.libraryBook.findUnique({ where: { id: row.bookId } }),
        issueCount: row._count.bookId,
      })),
    );

    return {
      totalTitles,
      totalCopies: copiesAgg._sum.totalCopies || 0,
      availableCopies: copiesAgg._sum.available || 0,
      currentlyIssued,
      overdueCount,
      unpaidFinesTotal: unpaidFines._sum.amount || 0,
      unpaidFinesCount: unpaidFines._count,
      topBorrowedBooks,
    };
  }

  async issueBook(bookId: string, enrollmentId: string, dueDate: string) {
    const book = await this.prisma.libraryBook.findUnique({
      where: { id: bookId },
    });
    if (!book || book.available <= 0)
      throw new BadRequestException('Book not available');

    await this.prisma.libraryBook.update({
      where: { id: bookId },
      data: { available: book.available - 1 },
    });

    return this.prisma.bookIssue.create({
      data: {
        bookId,
        enrollmentId,
        dueDate: new Date(dueDate),
      },
    });
  }

  async returnBook(issueId: string) {
    const issue = await this.prisma.bookIssue.findUnique({
      where: { id: issueId },
    });
    if (!issue) throw new BadRequestException('Issue record not found');

    const now = new Date();
    const due = issue.dueDate ? new Date(issue.dueDate) : null;

    // 1) Mark issue as returned
    await this.prisma.bookIssue.update({
      where: { id: issueId },
      data: {
        returnDate: now,
        status: 'Returned',
      },
    });

    // 2) Update book availability
    await this.prisma.libraryBook.update({
      where: { id: issue.bookId },
      data: { available: { increment: 1 } },
    });

    // 3) Create fine if overdue and fine doesn't already exist
    let fine = null as any;
    if (due && due.getTime() < now.getTime()) {
      const diffDays = Math.floor((now.getTime() - due.getTime()) / 86400000);
      if (diffDays > 0) {
        const existingFine = await this.prisma.libraryFine.findFirst({
          where: { issueId: issueId },
        });
        if (!existingFine) {
          const amount = diffDays * this.DEFAULT_FINE_RATE_PER_DAY;
          fine = await this.prisma.libraryFine.create({
            data: { issueId, amount, status: 'Unpaid' },
          });
        } else {
          fine = existingFine;
        }
      }
    }

    // 4) Auto-fulfill the earliest active reservation for this book (if any)
    const reservationRows = await this.prisma.$queryRaw<any[]>`
      SELECT
        r."id",
        r."enrollmentId"
      FROM "library_reservations" r
      WHERE
        r."bookId" = ${issue.bookId}
        AND r."status" = 'Reserved'
        AND r."expiresAt" >= ${now}
      ORDER BY r."reservedAt" ASC
      LIMIT 1
    `;

    const reservation = reservationRows?.[0];
    let fulfilledReservationId: string | null = null;

    if (reservation) {
      const book = await this.prisma.libraryBook.findUnique({
        where: { id: issue.bookId },
      });
      if (book && book.available > 0) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + this.DEFAULT_BORROW_DAYS);

        await this.prisma.bookIssue.create({
          data: {
            bookId: issue.bookId,
            enrollmentId: reservation.enrollmentId,
            issueDate: now,
            dueDate,
            status: 'Issued',
          },
        });

        await this.prisma.libraryBook.update({
          where: { id: issue.bookId },
          data: { available: { decrement: 1 } },
        });

        await this.prisma.$executeRaw`
          UPDATE "library_reservations"
          SET
            "status" = 'Fulfilled',
            "fulfilledAt" = ${now}
          WHERE
            "id" = ${reservation.id}
        `;

        fulfilledReservationId = reservation.id;
      }
    }

    return { success: true, fine, fulfilledReservationId };
  }

  async getStudentIssues(enrollmentId: string) {
    return this.prisma.bookIssue.findMany({
      where: { enrollmentId },
      include: { book: true, fines: true },
      orderBy: { issueDate: 'desc' },
    });
  }

  async createReservation(
    bookId: string,
    enrollmentId: string,
    expiresAt?: string,
  ) {
    const book = await this.prisma.libraryBook.findUnique({
      where: { id: bookId },
    });
    if (!book) throw new NotFoundException('Book not found');

    // Allow reservation even if available; admin may choose to fulfill later.
    // We still store it so the next return can auto-fulfill.
    const now = new Date();
    const parsedExpiresAt = expiresAt ? new Date(expiresAt) : null;
    const finalExpiresAt =
      parsedExpiresAt && !Number.isNaN(parsedExpiresAt.getTime())
        ? parsedExpiresAt
        : (() => {
            const d = new Date(now);
            d.setDate(d.getDate() + this.DEFAULT_RESERVATION_EXPIRE_DAYS);
            return d;
          })();

    const id = randomUUID();
    const reservationRows = await this.prisma.$queryRaw<any[]>`
      INSERT INTO "library_reservations" (
        "id",
        "bookId",
        "enrollmentId",
        "status",
        "expiresAt"
      )
      VALUES (
        ${id},
        ${bookId},
        ${enrollmentId},
        'Reserved',
        ${finalExpiresAt}
      )
      RETURNING
        "id",
        "bookId",
        "enrollmentId",
        "status",
        "reservedAt",
        "expiresAt",
        "fulfilledAt"
    `;

    return reservationRows?.[0];
  }

  async listReservations(
    bookId?: string,
    enrollmentId?: string,
    status?: string,
  ) {
    // Raw SQL to avoid requiring a regenerated Prisma client for LibraryReservation
    // (useful when Prisma generation isn't available yet).
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT
        r."id",
        r."bookId",
        r."enrollmentId",
        r."status",
        r."reservedAt",
        r."expiresAt",
        r."fulfilledAt",
        b."title" AS "bookTitle",
        s."fullName" AS "studentName"
      FROM "library_reservations" r
      INNER JOIN "library_books" b ON b."id" = r."bookId"
      INNER JOIN "student_enrollments" se ON se."id" = r."enrollmentId"
      INNER JOIN "students" s ON s."id" = se."studentId"
      ORDER BY r."reservedAt" DESC
    `;

    // The above WHERE trick isn't supported in $queryRaw template syntax.
    // Filter in JS instead for now.
    return (rows || []).filter((r) => {
      if (bookId && r.bookId !== bookId) return false;
      if (enrollmentId && r.enrollmentId !== enrollmentId) return false;
      if (status && r.status !== status) return false;
      return true;
    });
  }

  async cancelReservation(id: string) {
    // Mark reservation cancelled (idempotent)
    await this.prisma.$executeRaw`
      UPDATE "library_reservations"
      SET "status" = 'Cancelled'
      WHERE "id" = ${id}
    `;

    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT
        "id",
        "bookId",
        "enrollmentId",
        "status",
        "reservedAt",
        "expiresAt",
        "fulfilledAt"
      FROM "library_reservations"
      WHERE "id" = ${id}
      LIMIT 1
    `;

    const updated = rows?.[0];
    if (!updated) throw new NotFoundException('Reservation not found');
    return updated;
  }

  async updateFineStatus(id: string, status: string) {
    // status: Paid | Waived
    return this.prisma.libraryFine.update({
      where: { id },
      data: { status },
    });
  }

  async listFines(status?: string) {
    const where: any = {};
    if (status) where.status = status;
    return this.prisma.libraryFine.findMany({
      where,
      include: {
        issue: {
          include: {
            book: true,
            enrollment: { include: { student: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
