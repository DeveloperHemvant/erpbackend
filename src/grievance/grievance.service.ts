import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GrievanceRepository } from './repositories/grievance.repository';
import { CommunicationService } from '../communication/communication.service';
import {
  CreateGrievanceDto,
  EscalateGrievanceDto,
  ResolveGrievanceDto,
} from './dto/grievance.dto';
import type { AuthenticatedUser } from '../auth/current-user.decorator';

@Injectable()
export class GrievanceService {
  constructor(
    private readonly repository: GrievanceRepository,
    private readonly commService: CommunicationService,
  ) {}

  // GrievanceRecord.userType buckets the three account universes this ERP
  // has (Staff / Student / Parent) rather than a specific role name, since
  // a grievance filed by a Teacher and one filed by a Warden are both just
  // "STAFF" for contact-resolution purposes (CommunicationService).
  private deriveUserType(role: string): 'STUDENT' | 'PARENT' | 'STAFF' {
    const normalized = (role || '').toLowerCase();
    if (normalized === 'student') return 'STUDENT';
    if (normalized === 'parent') return 'PARENT';
    return 'STAFF';
  }

  private hasManagePermission(user: AuthenticatedUser): boolean {
    return (
      user.permissions.includes('*') ||
      user.permissions.includes('MANAGE_GRIEVANCES')
    );
  }

  /** Reporter identity always comes from the authenticated caller, never
   * from the request body — a grievance is "raise a concern about my own
   * situation," not a report-on-behalf-of-someone-else action. */
  async createGrievance(dto: CreateGrievanceDto, user: AuthenticatedUser) {
    return this.repository.create({
      userType: this.deriveUserType(user.role),
      reporterId: user.userId,
      title: dto.title,
      description: dto.description,
    });
  }

  async getMyGrievances(user: AuthenticatedUser) {
    return this.repository.findByReporter(
      this.deriveUserType(user.role),
      user.userId,
    );
  }

  async getAssignedToMe(user: AuthenticatedUser) {
    return this.repository.findByAssignee(user.userId);
  }

  async getAllGrievances() {
    return this.repository.findAll();
  }

  async getGrievance(id: string, user: AuthenticatedUser) {
    const grievance = await this.repository.findById(id);
    if (!grievance) throw new NotFoundException('Grievance not found.');
    if (this.hasManagePermission(user)) return grievance;

    const isReporter =
      grievance.userType === this.deriveUserType(user.role) &&
      grievance.reporterId === user.userId;
    const isAssignee = grievance.assignedToId === user.userId;
    if (!isReporter && !isAssignee) {
      throw new ForbiddenException(
        'You do not have access to this grievance.',
      );
    }
    return grievance;
  }

  async assignGrievance(id: string, assignedToId: string) {
    const grievance = await this.repository.findById(id);
    if (!grievance) throw new NotFoundException('Grievance not found.');

    const updated = await this.repository.update(id, { assignedToId });
    this.commService
      .notifyGrievanceAssigned(assignedToId, grievance.title)
      .catch((err) => console.error('notifyGrievanceAssigned failed', err));
    return updated;
  }

  /** Escalation is allowed to the currently assigned staff member (they hit
   * a wall and need to hand it up) as well as anyone holding
   * MANAGE_GRIEVANCES — mirrors the outpass/consent precedent of not
   * requiring the broad manage permission for the one actor who's actually
   * working the ticket. */
  async escalateGrievance(
    id: string,
    dto: EscalateGrievanceDto,
    user: AuthenticatedUser,
  ) {
    const grievance = await this.repository.findById(id);
    if (!grievance) throw new NotFoundException('Grievance not found.');
    this.assertCanAct(grievance, user);

    const updated = await this.repository.update(id, {
      escalationLevel: grievance.escalationLevel + 1,
      status: 'Escalated',
      ...(dto.reassignToId && { assignedToId: dto.reassignToId }),
    });

    if (dto.reassignToId) {
      this.commService
        .notifyGrievanceAssigned(dto.reassignToId, grievance.title)
        .catch((err) => console.error('notifyGrievanceAssigned failed', err));
    }
    return updated;
  }

  async resolveGrievance(
    id: string,
    dto: ResolveGrievanceDto,
    user: AuthenticatedUser,
  ) {
    const grievance = await this.repository.findById(id);
    if (!grievance) throw new NotFoundException('Grievance not found.');
    this.assertCanAct(grievance, user);

    const updated = await this.repository.update(id, {
      status: dto.status,
      resolutionRemarks: dto.resolutionRemarks || null,
      resolvedAt: new Date(),
    });

    this.commService
      .notifyGrievanceResolved(
        grievance.userType,
        grievance.reporterId,
        grievance.title,
        dto.resolutionRemarks,
      )
      .catch((err) => console.error('notifyGrievanceResolved failed', err));
    return updated;
  }

  private assertCanAct(
    grievance: { assignedToId: string | null },
    user: AuthenticatedUser,
  ) {
    if (this.hasManagePermission(user)) return;
    if (grievance.assignedToId !== user.userId) {
      throw new ForbiddenException(
        'Only the assigned staff member or a grievance manager can perform this action.',
      );
    }
  }
}
