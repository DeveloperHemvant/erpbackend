import { Module } from '@nestjs/common';
import { RulesEngineController } from './rules-engine.controller';
import { RulesEngineService } from './rules-engine.service';
import { RuleRepository } from './repositories/rule.repository';

@Module({
  controllers: [RulesEngineController],
  providers: [RulesEngineService, RuleRepository],
  exports: [RulesEngineService],
})
export class RulesEngineModule {}
