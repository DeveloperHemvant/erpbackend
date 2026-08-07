import { ForbiddenException, Injectable } from '@nestjs/common';
import { CommentRepository } from './repositories/comment.repository';
import { CreateCommentDto } from './dto/comment.dto';
import { canAccessEntityType } from '../common/entity-permissions';
import type { AuthenticatedUser } from '../auth/current-user.decorator';

/**
 * Generic {entityType, entityId}-keyed comment thread (IA §16 #6) — one
 * shared table/service mounted on every Entity 360 page, gated by the same
 * permission that grants read access to the parent record (ENTITY_VIEW_PERMISSION).
 */
@Injectable()
export class CommentsService {
  constructor(private readonly repository: CommentRepository) {}

  async getComments(
    entityType: string,
    entityId: string,
    user: AuthenticatedUser,
  ) {
    if (!canAccessEntityType(user.permissions, entityType)) {
      throw new ForbiddenException(
        "You do not have permission to view this record's comments.",
      );
    }
    return this.repository.findByEntity(entityType, entityId);
  }

  async createComment(dto: CreateCommentDto, user: AuthenticatedUser) {
    if (!canAccessEntityType(user.permissions, dto.entityType)) {
      throw new ForbiddenException(
        'You do not have permission to comment on this record.',
      );
    }
    return this.repository.create({
      entityType: dto.entityType,
      entityId: dto.entityId,
      body: dto.body,
      authorId: user.userId,
    });
  }
}
