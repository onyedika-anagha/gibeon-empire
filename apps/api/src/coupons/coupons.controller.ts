import { Body, Controller, Get, HttpCode, Param, Patch, Post } from "@nestjs/common";
import { CouponsService } from "./coupons.service";
import { CreateCouponDto, UpdateCouponDto, ValidateCouponDto } from "./dto/coupons.dto";
import { Public } from "../auth/decorators/public.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";

@Controller("coupons")
export class CouponsController {
  constructor(private readonly coupons: CouponsService) {}

  // Preview a code against a cart. Public so guests can apply codes at checkout;
  // a bearer token, when present, enforces the per-customer limit.
  @Public()
  @HttpCode(200)
  @Post("validate")
  validate(@Body() dto: ValidateCouponDto, @CurrentUser() user?: AuthUser) {
    const customerId = user?.type === "customer" ? user.id : undefined;
    return this.coupons.previewForCart(dto.code, dto.items, customerId);
  }

  @Roles("ADMIN", "STORE_MANAGER")
  @Get()
  list() {
    return this.coupons.list();
  }

  @Roles("ADMIN", "STORE_MANAGER")
  @Post()
  create(@Body() dto: CreateCouponDto) {
    return this.coupons.create(dto);
  }

  @Roles("ADMIN", "STORE_MANAGER")
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateCouponDto) {
    return this.coupons.update(id, dto);
  }
}
