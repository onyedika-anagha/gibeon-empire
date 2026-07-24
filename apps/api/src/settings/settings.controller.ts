import { Body, Controller, Get, Patch } from "@nestjs/common";
import { IsInt, Max, Min } from "class-validator";
import { SettingsService } from "./settings.service";
import { Public } from "../auth/decorators/public.decorator";
import { Roles } from "../auth/decorators/roles.decorator";

export class SetVatRateDto {
  @IsInt()
  @Min(0)
  @Max(10_000) // 100% — a sane upper bound, not a real rate
  vatRateBps!: number;
}

@Controller("settings")
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  /** Public so the storefront and till can show VAT before an order exists. */
  @Public()
  @Get("tax")
  async tax() {
    return { vatRateBps: await this.settings.getVatRateBps() };
  }

  @Roles("ADMIN")
  @Patch("tax")
  async setTax(@Body() dto: SetVatRateDto) {
    await this.settings.setVatRateBps(dto.vatRateBps);
    return { vatRateBps: dto.vatRateBps };
  }
}
