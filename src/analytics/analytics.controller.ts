import { Controller, Get, UseInterceptors } from "@nestjs/common";
import { CacheInterceptor, CacheKey, CacheTTL } from "@nestjs/cache-manager";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { AnalyticsService } from "./analytics.service";
import { RequirePermissions } from "../auth/permissions.decorator";

@ApiTags("Analytics")
@Controller("analytics")
@UseInterceptors(CacheInterceptor)
@RequirePermissions("VIEW_REPORTS")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("dashboard/summary")
  @CacheKey('dashboard_summary')
  @CacheTTL(60000) // 1 minute
  @ApiOperation({ summary: "Get unified dashboard summary metrics" })
  async getDashboardSummary() {
    return this.analyticsService.getDashboardSummary();
  }

  @Get("dashboard/trends")
  @ApiOperation({ summary: "Get trend data for charts" })
  async getTrends() {
    return this.analyticsService.getTrends();
  }
}
