import { Controller, Post, Body } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { PreviewPromotionDto, CommitPromotionDto } from './dto/promotion.dto';
import { RequirePermissions } from '../auth/permissions.decorator';

// Class-level MANAGE_ACADEMICS default -- bulk grade promotion is a
// structural academic-year operation, same tier as Master Data/Timetable.
// Was undecorated (2 routes), therefore blocked for every non-'*' role.
@RequirePermissions('MANAGE_ACADEMICS')
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post('preview')
  preview(@Body() dto: PreviewPromotionDto) {
    return this.promotionsService.preview(dto);
  }

  @Post('commit')
  commit(@Body() dto: CommitPromotionDto) {
    return this.promotionsService.commit(dto);
  }
}
