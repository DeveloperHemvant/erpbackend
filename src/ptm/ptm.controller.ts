import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { PTMService } from './ptm.service';
import { CreatePTMSlotDto, BookPTMSlotDto } from './dto/ptm.dto';
import { RequirePermissions } from '../auth/permissions.decorator';
import { OwnershipService } from '../auth/ownership.service';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';

// No MANAGE_* permission gate anywhere here on purpose — publishing a PTM
// slot is "my own availability" (self-service, same shape as staff
// self-attendance), and booking one is "my own child's meeting" (ownership-
// checked via OwnershipService, same shape as consent responses / diary
// sign-off). Every route just needs the caller to be the right kind of
// person for that action, not a specific admin permission.
@ApiTags('Parent-Teacher Meetings')
@Controller('ptm')
export class PTMController {
  constructor(
    private readonly ptmService: PTMService,
    private readonly ownershipService: OwnershipService,
  ) {}

  private assertStaff(user: AuthenticatedUser) {
    const role = (user.role || '').toLowerCase();
    if (role === 'student' || role === 'parent') {
      throw new ForbiddenException('Only staff can publish PTM slots.');
    }
  }

  private assertParent(user: AuthenticatedUser) {
    if ((user.role || '').toLowerCase() !== 'parent') {
      throw new ForbiddenException('Only a parent can do this.');
    }
  }

  @Post('slots')
  @RequirePermissions()
  @ApiOperation({ summary: 'Publish an available PTM slot for yourself' })
  createSlot(
    @Body() dto: CreatePTMSlotDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.assertStaff(user);
    return this.ptmService.createSlot(user.userId, dto);
  }

  @Get('slots/mine')
  @RequirePermissions()
  @ApiOperation({ summary: 'List my own published PTM slots' })
  getMySlots(@CurrentUser() user: AuthenticatedUser) {
    this.assertStaff(user);
    return this.ptmService.getMySlots(user.userId);
  }

  @Get('slots/teacher/:teacherId/open')
  @RequirePermissions()
  @ApiOperation({ summary: "List a teacher's open PTM slots" })
  @ApiParam({ name: 'teacherId', format: 'uuid' })
  getOpenSlots(@Param('teacherId', ParseUUIDPipe) teacherId: string) {
    return this.ptmService.getOpenSlotsForTeacher(teacherId);
  }

  @Get('bookings/mine')
  @RequirePermissions()
  @ApiOperation({ summary: 'List PTM slots I (as a parent) have booked' })
  getMyBookings(@CurrentUser() user: AuthenticatedUser) {
    this.assertParent(user);
    return this.ptmService.getMyBookings(user.userId);
  }

  @Patch('slots/:id/book')
  @RequirePermissions()
  @ApiOperation({ summary: 'Book an open PTM slot for one of your children' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async bookSlot(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BookPTMSlotDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.assertParent(user);
    await this.ownershipService.assertOwnsStudent(user, dto.studentId);
    return this.ptmService.bookSlot(id, user.userId, dto.studentId);
  }

  @Patch('slots/:id/cancel')
  @RequirePermissions()
  @ApiOperation({ summary: 'Cancel your own PTM booking' })
  @ApiParam({ name: 'id', format: 'uuid' })
  cancelBooking(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.assertParent(user);
    return this.ptmService.cancelBooking(id, user.userId);
  }

  @Delete('slots/:id')
  @RequirePermissions()
  @ApiOperation({ summary: 'Delete an unbooked PTM slot you published' })
  @ApiParam({ name: 'id', format: 'uuid' })
  deleteSlot(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.assertStaff(user);
    return this.ptmService.deleteSlot(id, user.userId);
  }
}
