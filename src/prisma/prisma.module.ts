import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { TenantContextBuilder } from './tenant-context';

@Global()
@Module({
  providers: [PrismaService, TenantContextBuilder],
  exports: [PrismaService, TenantContextBuilder],
})
export class PrismaModule {}
