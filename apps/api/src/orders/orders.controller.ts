import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { Public } from "../auth/decorators/public.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { AdvanceOrderDto, CreateOrderDto } from "./dto/order.dto";

@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  // Public so guests can check out (PRD Req. 5). Optional bearer attaches the customer.
  @Public()
  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.orders.create(dto, undefined, "system");
  }

  // Authenticated order tracking (PRD Req. 8) — customer sees own, staff any.
  @Get(":reference")
  track(@Param("reference") reference: string, @CurrentUser() user: AuthUser) {
    return this.orders.getByReference(reference, user);
  }

  // Staff-driven fulfilment steps (PRD Req. 41).
  @Roles("ADMIN", "STORE_MANAGER")
  @Post(":id/advance")
  advance(@Param("id") id: string, @Body() dto: AdvanceOrderDto, @CurrentUser() user: AuthUser) {
    return this.orders.advance(id, dto.to, user.id);
  }
}
