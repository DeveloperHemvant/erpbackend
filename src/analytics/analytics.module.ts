import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { FinanceAnalyticsService } from './finance-analytics.service';
import { AcademicAnalyticsService } from './academic-analytics.service';
import { OperationsAnalyticsService } from './operations-analytics.service';
import { AnalyticsRepository } from './repositories/analytics.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { StudentsModule } from '../students/students.module';
import { PromotionsModule } from '../promotions/promotions.module';

@Module({
  imports: [PrismaModule, StudentsModule, PromotionsModule],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    FinanceAnalyticsService,
    AcademicAnalyticsService,
    OperationsAnalyticsService,
    AnalyticsRepository,
  ],
  exports: [
    AnalyticsService,
    FinanceAnalyticsService,
    AcademicAnalyticsService,
    OperationsAnalyticsService,
  ],
})
export class AnalyticsModule {}
