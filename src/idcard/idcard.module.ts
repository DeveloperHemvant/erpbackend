import { Module } from '@nestjs/common';
import { IdCardController } from './idcard.controller';
import { IdCardService } from './idcard.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [IdCardController],
  providers: [IdCardService],
  exports: [IdCardService],
})
export class IdCardModule {}
