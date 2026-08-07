import { Module } from '@nestjs/common';
import { ReceptionController } from './reception.controller';
import { ReceptionService } from './reception.service';
import { ReceptionRepository } from './repositories/reception.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ReceptionController],
  providers: [ReceptionService, ReceptionRepository],
  exports: [ReceptionService],
})
export class ReceptionModule {}
