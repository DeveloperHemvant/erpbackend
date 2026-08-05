import { Controller, Post, Body, Param } from "@nestjs/common";
import { RulesEngineService } from "./rules-engine.service";
import { EvaluateRuleDto } from "./dto/rules.dto";
import { RequirePermissions } from "../auth/permissions.decorator";

@Controller("rules-engine")
export class RulesEngineController {
  constructor(private readonly rulesEngineService: RulesEngineService) {}

  @Post("evaluate/:key")
  @RequirePermissions()
  evaluate(@Param("key") key: string, @Body() dto: EvaluateRuleDto) {
    return this.rulesEngineService.evaluate(key, dto.context);
  }
}
