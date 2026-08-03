import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { RolesModule } from "./roles/roles.module";
import { StaffModule } from "./staff/staff.module";
import { AuthModule } from "./auth/auth.module";
import { MasterDataModule } from "./master-data/master-data.module";
import { StudentsModule } from "./students/students.module";
import { AttendanceModule } from "./attendance/attendance.module";
import { AcademicsModule } from "./academics/academics.module";
import { ExamsModule } from "./exams/exams.module";
import { ReportCardsModule } from "./report-cards/report-cards.module";
import { TimetableModule } from "./timetable/timetable.module";
import { FeesModule } from "./fees/fees.module";
import { PortalModule } from "./portal/portal.module";
import { CommunicationModule } from "./communication/communication.module";
import { LmsModule } from "./lms/lms.module";
import { EmsModule } from "./ems/ems.module";
import { IdCardModule } from './idcard/idcard.module';
import { AcmsModule } from "./acms/acms.module";
import { TransportModule } from "./transport/transport.module";
import { HostelModule } from "./hostel/hostel.module";
import { LibraryModule } from "./library/library.module";
import { InventoryModule } from "./inventory/inventory.module";
import { HrModule } from "./hr/hr.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { ImportModule } from "./import/import.module";
import { MonitoringModule } from "./monitoring/monitoring.module";
import { JobsModule } from "./jobs/jobs.module";
import { HealthRecordsModule } from "./health-records/health-records.module";
import { DisciplineModule } from "./discipline/discipline.module";
import { AdmissionInquiryModule } from "./admission-inquiry/admission-inquiry.module";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { JwtAuthGuard } from "./auth/jwt-auth.guard";
import { PermissionsGuard } from "./auth/permissions.guard";
import { SelfAccessGuard } from "./auth/self-access.guard";
import { ConfigModule } from "@nestjs/config";
import { CacheModule } from "@nestjs/cache-manager";
import { BullModule } from '@nestjs/bullmq';
import { MiddlewareConsumer, NestModule } from "@nestjs/common";
import { TenantMiddleware } from "./common/middleware/tenant.middleware";
import { TemplateModule } from './template/template.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PromotionsModule } from './promotions/promotions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.register({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    PrismaModule,
    RolesModule,
    StaffModule,
    AuthModule,
    MasterDataModule,
    StudentsModule,
    AttendanceModule,
    AcademicsModule,
    ExamsModule,
    ReportCardsModule,
    TimetableModule,
    FeesModule,
    PortalModule,
    CommunicationModule,
    LmsModule,
    EmsModule,
    IdCardModule,
    AcmsModule,
    TransportModule,
    HostelModule,
    LibraryModule,
    InventoryModule,
    HrModule,
    AnalyticsModule,
    ImportModule,
    MonitoringModule,
    JobsModule,
    TemplateModule,
    AuditLogModule,
    NotificationsModule,
    PromotionsModule,
    HealthRecordsModule,
    DisciplineModule,
    AdmissionInquiryModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SelfAccessGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
