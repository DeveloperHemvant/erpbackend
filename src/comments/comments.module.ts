import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { CommentRepository } from './repositories/comment.repository';

@Module({
  controllers: [CommentsController],
  providers: [CommentsService, CommentRepository],
  exports: [CommentsService],
})
export class CommentsModule {}
