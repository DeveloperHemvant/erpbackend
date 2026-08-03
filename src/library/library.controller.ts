import { Controller, Get, Post, Body, Param, ParseUUIDPipe, Patch } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { LibraryService } from "./library.service";
import { CreateLibraryBookDto, IssueBookDto } from "./dto/library.dto";
import { RequirePermissions } from "../auth/permissions.decorator";

@ApiTags("Library")
@Controller("library")
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Post("books")
  @ApiOperation({ summary: "Add Book" })
  async addBook(@Body() data: CreateLibraryBookDto) {
    return this.libraryService.addBook(data);
  }

  @Get("books")
  @RequirePermissions("MANAGE_ACADEMICS")
  @ApiOperation({ summary: "Get Books" })
  async getBooks() {
    return this.libraryService.getBooks();
  }

  @Post("issues")
  @ApiOperation({ summary: "Issue Book" })
  async issueBook(@Body() data: IssueBookDto) {
    return this.libraryService.issueBook(data.bookId, data.enrollmentId, data.dueDate);
  }

  @Patch("issues/:id/return")
  @ApiOperation({ summary: "Return Book" })
  async returnBook(@Param("id", ParseUUIDPipe) id: string) {
    return this.libraryService.returnBook(id);
  }

  @Get("student/:enrollmentId")
  @ApiOperation({ summary: "Get Student Book Issues" })
  async getStudentIssues(@Param("enrollmentId", ParseUUIDPipe) enrollmentId: string) {
    return this.libraryService.getStudentIssues(enrollmentId);
  }
}
