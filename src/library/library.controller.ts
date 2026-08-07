import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LibraryService } from './library.service';
import {
  CreateLibraryBookDto,
  CreateLibraryReservationDto,
  IssueBookDto,
  UpdateFineStatusDto,
} from './dto/library.dto';
import { RequirePermissions } from '../auth/permissions.decorator';

// Class-level MANAGE_ACADEMICS default. Every method except getBooks/
// getLibraryReport was previously undecorated, which under the global
// PermissionsGuard's fallback (no requirement -> implicit literal "read"/
// "write" permission) meant issueBook/returnBook/reservations/fines were
// unreachable by Librarian (permissions: ['MANAGE_ACADEMICS', 'VIEW_REPORTS'])
// despite already holding the permission the two decorated routes require.
// Same bug class as hostel.controller.ts (see that file's comment); fixed
// here because it directly undermined this session's Phase 1 item 1.7
// (Library search-picker) and Phase 2 item 2.10 (library reports) work.
@RequirePermissions('MANAGE_ACADEMICS')
@ApiTags('Library')
@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Post('books')
  @ApiOperation({ summary: 'Add Book' })
  async addBook(@Body() data: CreateLibraryBookDto) {
    return this.libraryService.addBook(data);
  }

  @Get('books')
  @RequirePermissions('MANAGE_ACADEMICS')
  @ApiOperation({ summary: 'Get Books' })
  async getBooks() {
    return this.libraryService.getBooks();
  }

  @Get('reports')
  @RequirePermissions('MANAGE_ACADEMICS')
  @ApiOperation({ summary: 'Get library usage/inventory report' })
  async getLibraryReport() {
    return this.libraryService.getLibraryReport();
  }

  @Post('issues')
  @ApiOperation({ summary: 'Issue Book' })
  async issueBook(@Body() data: IssueBookDto) {
    return this.libraryService.issueBook(
      data.bookId,
      data.enrollmentId,
      data.dueDate,
    );
  }

  @Patch('issues/:id/return')
  @ApiOperation({ summary: 'Return Book' })
  async returnBook(@Param('id', ParseUUIDPipe) id: string) {
    return this.libraryService.returnBook(id);
  }

  @Get('student/:enrollmentId')
  @ApiOperation({ summary: 'Get Student Book Issues' })
  async getStudentIssues(
    @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
  ) {
    return this.libraryService.getStudentIssues(enrollmentId);
  }

  @Post('reservations')
  @ApiOperation({ summary: 'Create Book Reservation' })
  async createReservation(@Body() data: CreateLibraryReservationDto) {
    return this.libraryService.createReservation(
      data.bookId,
      data.enrollmentId,
      data.expiresAt,
    );
  }

  @Get('reservations')
  @ApiOperation({ summary: 'List Book Reservations' })
  async listReservations(
    @Query('bookId') bookId?: string,
    @Query('enrollmentId') enrollmentId?: string,
    @Query('status') status?: string,
  ) {
    return this.libraryService.listReservations(bookId, enrollmentId, status);
  }

  @Patch('reservations/:id/cancel')
  @ApiOperation({ summary: 'Cancel Reservation' })
  async cancelReservation(@Param('id', ParseUUIDPipe) id: string) {
    return this.libraryService.cancelReservation(id);
  }

  @Get('fines')
  @ApiOperation({ summary: 'List Library Fines' })
  async listFines(@Query('status') status?: string) {
    return this.libraryService.listFines(status);
  }

  @Patch('fines/:id')
  @ApiOperation({ summary: 'Update Fine Status (Paid/Waived)' })
  async updateFineStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateFineStatusDto,
  ) {
    return this.libraryService.updateFineStatus(id, data.status);
  }
}
