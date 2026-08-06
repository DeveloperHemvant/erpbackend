import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { RequirePermissions } from '../auth/permissions.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @RequirePermissions()
  search(
    @Query('q') q: string,
    @Query('limit') limit: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.searchService.search(
      q ?? '',
      user,
      limit ? parseInt(limit, 10) : undefined,
    );
  }
}
