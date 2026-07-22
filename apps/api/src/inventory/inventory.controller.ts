import { Body, Controller, Get, HttpCode, Post, Query } from "@nestjs/common";
import { InventoryService } from "./inventory.service";
import { Public } from "../auth/decorators/public.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { AdjustStockDto, DeductStockDto } from "./dto/inventory.dto";

@Controller("inventory")
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  /** Storefront reads stock state for the variants on a page (PRD Req. 4). */
  @Public()
  @Get("stock")
  stock(@Query("ids") ids?: string) {
    const list = (ids ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    return this.inventory.getStockStates(list);
  }

  @Roles("ADMIN", "STORE_MANAGER")
  @Get("low-stock")
  lowStock() {
    return this.inventory.listLowStock();
  }

  @Roles("ADMIN", "STORE_MANAGER")
  @Post("adjust")
  adjust(@Body() dto: AdjustStockDto, @CurrentUser() user: AuthUser) {
    return this.inventory.adjust(dto.variantId, dto.mode, dto.value, dto.reason, user.id, dto.locationId);
  }

  /** Guarded deduct for POS sales / offline sync replay (PRD Req. 26, 34). */
  @Roles("ADMIN", "STORE_MANAGER", "CASHIER")
  @HttpCode(200)
  @Post("deduct")
  deduct(@Body() dto: DeductStockDto, @CurrentUser() user: AuthUser) {
    return this.inventory.deduct(dto.variantId, dto.quantity, user.id, dto.locationId);
  }
}
