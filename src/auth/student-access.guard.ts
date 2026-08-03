import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { STUDENT_ACCESS_PARAM_KEY } from "./student-access.decorator";
import { OwnershipService } from "./ownership.service";

@Injectable()
export class StudentAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly ownershipService: OwnershipService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const paramName = this.reflector.getAllAndOverride<string>(STUDENT_ACCESS_PARAM_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!paramName) return true;

    const request = context.switchToHttp().getRequest();
    const studentId = request.params?.[paramName];
    await this.ownershipService.assertOwnsStudent(request.user, studentId);
    return true;
  }
}
