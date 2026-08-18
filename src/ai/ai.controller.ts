import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';
import { RequirePermissions } from '../auth/permissions.decorator';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('infer')
  @RequirePermissions('USE_AI_ASSISTANT')
  infer(@Body() body: { task: string; payload?: unknown }) {
    return this.aiService.infer(body.task, body.payload);
  }
}
