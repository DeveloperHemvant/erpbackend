import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateLibraryBookDto } from "./dto/library.dto";

@Injectable()
export class LibraryService {
  constructor(private prisma: PrismaService) {}

  async addBook(data: CreateLibraryBookDto) {
    return this.prisma.libraryBook.create({ data });
  }

  async getBooks() {
    return this.prisma.libraryBook.findMany();
  }

  async issueBook(bookId: string, enrollmentId: string, dueDate: string) {
    const book = await this.prisma.libraryBook.findUnique({ where: { id: bookId } });
    if (!book || book.available <= 0) throw new BadRequestException("Book not available");

    await this.prisma.libraryBook.update({
      where: { id: bookId },
      data: { available: book.available - 1 }
    });

    return this.prisma.bookIssue.create({
      data: {
        bookId,
        enrollmentId,
        dueDate: new Date(dueDate)
      }
    });
  }

  async returnBook(issueId: string) {
    const issue = await this.prisma.bookIssue.findUnique({ where: { id: issueId } });
    if (!issue) throw new BadRequestException("Issue record not found");

    await this.prisma.bookIssue.update({
      where: { id: issueId },
      data: {
        returnDate: new Date(),
        status: "Returned"
      }
    });

    const book = await this.prisma.libraryBook.findUnique({ where: { id: issue.bookId } });
    if (book) {
      await this.prisma.libraryBook.update({
        where: { id: book.id },
        data: { available: book.available + 1 }
      });
    }

    return { success: true };
  }

  async getStudentIssues(enrollmentId: string) {
    return this.prisma.bookIssue.findMany({
      where: { enrollmentId },
      include: { book: true, fines: true },
      orderBy: { issueDate: "desc" }
    });
  }
}
