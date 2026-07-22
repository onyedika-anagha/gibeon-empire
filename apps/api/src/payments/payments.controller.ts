import { Body, Controller, Get, HttpCode, Param, Patch, Post, Req } from "@nestjs/common";
import type { RawBodyRequest } from "@nestjs/common";
import type { Request } from "express";
import { PaymentsService } from "./payments.service";
import { SettingsService } from "../settings/settings.service";
import { Public } from "../auth/decorators/public.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { InitializePaymentDto, SetProviderDto } from "./dto/payments.dto";
import type { PaymentProvider } from "../db/schema";

@Controller("payments")
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly settings: SettingsService,
  ) {}

  @Public()
  @HttpCode(200)
  @Post("initialize")
  initialize(@Body() dto: InitializePaymentDto) {
    return this.payments.initialize(dto.orderId);
  }

  // Signature is verified against the raw body — hence rawBody, not parsed JSON.
  @Public()
  @HttpCode(200)
  @Post("webhook/:provider")
  webhook(@Param("provider") provider: PaymentProvider, @Req() req: RawBodyRequest<Request>) {
    const raw = req.rawBody?.toString() ?? "";
    const signature =
      (req.headers["x-paystack-signature"] as string) ??
      (req.headers["verif-hash"] as string);
    return this.payments.handleWebhook(provider, raw, signature);
  }

  @Roles("ADMIN")
  @HttpCode(200)
  @Post(":reference/simulate-success")
  simulate(@Param("reference") reference: string) {
    return this.payments.simulateSuccess(reference);
  }

  // Payment-provider toggle (PRD Req. 29) — admin reads/sets the active provider.
  @Roles("ADMIN", "STORE_MANAGER")
  @Get("provider")
  async getProvider() {
    return { provider: await this.settings.getActiveProvider() };
  }

  @Roles("ADMIN")
  @Patch("provider")
  async setProvider(@Body() dto: SetProviderDto) {
    await this.settings.setActiveProvider(dto.provider);
    return { provider: dto.provider };
  }
}
