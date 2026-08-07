import { Module } from '@nestjs/common';
import { VisitorController } from './visitor.controller';
import { VisitorService } from './visitor.service';
import { VisitorRepository } from './repositories/visitor.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [VisitorController],
  providers: [VisitorService, VisitorRepository],
  exports: [VisitorService],
})
export class VisitorModule {}
