import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

interface RequestUser {
  userId: string;
  role: string;
}

@Injectable()
export class OwnershipService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Every caller of this — StudentAccessGuard, StudentAccessOrPermissionGuard,
   * and EmsService's own-attempt check — uses it on routes meant ONLY for the
   * student themself or their parent (staff have separate, permission-gated
   * routes for the same data). So a non-portal role must be rejected here,
   * not waved through: there is no legitimate staff caller of this method.
   */
  async assertOwnsStudent(user: RequestUser, studentId: string): Promise<void> {
    const role = (user.role || "").toLowerCase();

    if (role === "student") {
      if (user.userId === studentId) return;
      throw new ForbiddenException("You do not have access to this student.");
    }

    if (role === "parent") {
      const link = await this.prisma.parentStudent.findUnique({
        where: { parentId_studentId: { parentId: user.userId, studentId } },
      });
      if (link) return;
      throw new ForbiddenException("You do not have access to this student.");
    }

    throw new ForbiddenException("You do not have access to this student.");
  }
}
