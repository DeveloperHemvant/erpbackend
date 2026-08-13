import { Module } from '@nestjs/common';
import { PTMController } from './ptm.controller';
import { PTMService } from './ptm.service';
import { PTMRepository } from './repositories/ptm.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CommunicationModule } from '../communication/communication.module';

@Module({
  imports: [PrismaModule, AuthModule, CommunicationModule],
  controllers: [PTMController],
  providers: [PTMService, PTMRepository],
  exports: [PTMService],
})
export class PTMModule {}
