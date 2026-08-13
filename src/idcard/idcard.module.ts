import { Module } from '@nestjs/common';
import { IdCardController } from './idcard.controller';
import { IdCardService } from './idcard.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [PrismaModule, AuthModule, DocumentsModule],
  controllers: [IdCardController],
  providers: [IdCardService],
  exports: [IdCardService],
})
export class IdCardModule {}
