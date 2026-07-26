import { Body, Controller, Get, HttpCode, Param, Post } from "@nestjs/common";
import { TerminalsService } from "./terminals.service";
import { TerminalPushDto } from "./dto/terminals.dto";
import { Roles } from "../auth/decorators/roles.decorator";

// Push-to-terminal card payments. Staff-only, same as offline sync.
@Roles("ADMIN", "STORE_MANAGER", "CASHIER")
@Controller("terminals")
export class TerminalsController {
  constructor(private readonly terminals: TerminalsService) {}

  // 202: the amount was queued to the device; the card hasn't been paid yet.
  @HttpCode(202)
  @Post("push")
  push(@Body() dto: TerminalPushDto) {
    return this.terminals.push(dto);
  }

  // POS polls this until status is processed/cancelled.
  @Get(":reference/status")
  status(@Param("reference") reference: string) {
    return this.terminals.status(reference);
  }
}
